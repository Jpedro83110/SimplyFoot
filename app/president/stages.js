import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache'; // <- AJOUT ICI

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
const jours = ['lundi','mardi','mercredi','jeudi','vendredi'];

function downloadCSVWeb(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function Stages() {
  const { width } = useWindowDimensions();

  const [openedStageId, setOpenedStageId] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Form fields
  const [titre, setTitre] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [programme, setProgramme] = useState(
    Object.fromEntries(jours.map(j => [j, { lieu: '', matin: '', apresMidi: '' }]))
  );

  const [clubId, setClubId] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const timerRef = useRef();

  // --- Confirmation UI reset
  useEffect(() => {
    if (confirmation) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setConfirmation(''), 5000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [confirmation]);

  // --- Récupère clubId et charge stages via cache
  useEffect(() => {
    async function loadData() {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;
      const { data: user } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', userId)
        .single();

      if (!user?.club_id) return;
      setClubId(user.club_id);
    }
    loadData();
  }, []);

  // --- Fonction fetch pour le cache
  const fetchStages = async () => {
    if (!clubId) return [];
    const { data: stagesList } = await supabase
      .from('stages')
      .select('*')
      .eq('club_id', clubId)
      .order('date_debut', { ascending: false });
    return stagesList || [];
  };

  // --- useCacheData
  const cacheKey = clubId ? `stages_club_${clubId}` : null;
  const [stages, refreshStages, loading] = useCacheData(
    cacheKey,
    fetchStages,
    3600 // 1h TTL
  );

  // --- Reset form
  const resetForm = () => {
    setTitre('');
    setDateDebut('');
    setDateFin('');
    setAgeMin('');
    setAgeMax('');
    setProgramme(Object.fromEntries(jours.map(j => [j, { lieu: '', matin: '', apresMidi: '' }])));
    setEditMode(false);
    setOpenedStageId(null);
  };

  const handleSelectStage = (stage) => {
    if (openedStageId === stage.id) {
      resetForm();
      return;
    }
    setOpenedStageId(stage.id);
    setEditMode(false);
    setTitre(stage.titre || '');
    setDateDebut(stage.date_debut || '');
    setDateFin(stage.date_fin || '');
    setAgeMin(stage.age_min ? String(stage.age_min) : '');
    setAgeMax(stage.age_max ? String(stage.age_max) : '');
    setProgramme({
      lundi:    stage.programme_lundi    ? JSON.parse(stage.programme_lundi)    : { lieu: '', matin: '', apresMidi: '' },
      mardi:    stage.programme_mardi    ? JSON.parse(stage.programme_mardi)    : { lieu: '', matin: '', apresMidi: '' },
      mercredi: stage.programme_mercredi ? JSON.parse(stage.programme_mercredi) : { lieu: '', matin: '', apresMidi: '' },
      jeudi:    stage.programme_jeudi    ? JSON.parse(stage.programme_jeudi)    : { lieu: '', matin: '', apresMidi: '' },
      vendredi: stage.programme_vendredi ? JSON.parse(stage.programme_vendredi) : { lieu: '', matin: '', apresMidi: '' },
    });
    setConfirmation('');
  };

  const handleNewStage = () => {
    resetForm();
    setEditMode(true);
  };

  const handleChangeProgramme = (day, field, value) => {
    setProgramme((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
    setConfirmation('');
  };

  const enregistrerStage = async () => {
    if (!clubId) return Alert.alert('Erreur', 'Club non identifié');
    if (!titre || !dateDebut || !dateFin) return Alert.alert('Erreur', 'Champs obligatoires manquants');
    const dataObj = {
      club_id: clubId,
      titre,
      date_debut: dateDebut,
      date_fin: dateFin,
      age_min: parseInt(ageMin) || null,
      age_max: parseInt(ageMax) || null,
      programme_lundi: JSON.stringify(programme.lundi),
      programme_mardi: JSON.stringify(programme.mardi),
      programme_mercredi: JSON.stringify(programme.mercredi),
      programme_jeudi: JSON.stringify(programme.jeudi),
      programme_vendredi: JSON.stringify(programme.vendredi),
    };
    const { error } = await supabase.from('stages').insert(dataObj);
    if (error) {
      setConfirmation('❌ Erreur lors de l’enregistrement');
    } else {
      await refreshStages(); // <--- On refresh le cache
      setConfirmation('✅ Stage enregistré !');
      resetForm();
    }
  };

  const modifierStage = async () => {
    if (!openedStageId) return;
    if (!titre || !dateDebut || !dateFin) return Alert.alert('Erreur', 'Champs obligatoires manquants');
    const dataObj = {
      club_id: clubId,
      titre,
      date_debut: dateDebut,
      date_fin: dateFin,
      age_min: parseInt(ageMin) || null,
      age_max: parseInt(ageMax) || null,
      programme_lundi: JSON.stringify(programme.lundi),
      programme_mardi: JSON.stringify(programme.mardi),
      programme_mercredi: JSON.stringify(programme.mercredi),
      programme_jeudi: JSON.stringify(programme.jeudi),
      programme_vendredi: JSON.stringify(programme.vendredi),
    };
    const { error } = await supabase.from('stages').update(dataObj).eq('id', openedStageId);
    if (error) {
      setConfirmation('❌ Erreur lors de la modification');
    } else {
      await refreshStages(); // <--- On refresh le cache
      setConfirmation('✅ Stage modifié !');
      setEditMode(false);
    }
  };

  const supprimerStage = async () => {
    if (!openedStageId) return;
    Alert.alert('Suppression', 'Confirmer la suppression de ce stage ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('stages').delete().eq('id', openedStageId);
          if (error) setConfirmation('❌ Erreur suppression');
          else {
            await refreshStages(); // <--- On refresh le cache
            setConfirmation('🗑️ Stage supprimé');
            resetForm();
          }
        }
      }
    ]);
  };

  // --- Toutes les autres fonctions inchangées ---
  const imprimerStage = async () => {
    try {
      const html = `
        <html><head>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { color: #00ff88; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px;}
          th, td { border: 1px solid #222; padding: 10px; text-align: center; }
          th { background: #e0ffe8; }
        </style>
        </head><body>
        <h2>${titre}</h2>
        <p><strong>Dates :</strong> du ${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}</p>
        ${ageMin && ageMax ? `<p><strong>Âge :</strong> ${ageMin} à ${ageMax} ans</p>` : ''}
        <table>
          <thead><tr><th>Jour</th><th>Lieu</th><th>Matin</th><th>Après-midi</th></tr></thead>
          <tbody>
            ${jours.map(jour => {
              const prog = programme[jour];
              return `<tr>
                <td>${jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                <td>${prog?.lieu || ''}</td>
                <td>${prog?.matin || ''}</td>
                <td>${prog?.apresMidi || ''}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      setConfirmation('📄 PDF généré');
    } catch (err) {
      setConfirmation('❌ Erreur impression PDF');
    }
  };

  const exporterStageCSV = async () => {
    try {
      let csv = `Titre;Date début;Date fin;Âge min;Âge max;Jour;Lieu;Matin;Après-midi\n`;
      jours.forEach(jour => {
        const prog = programme[jour];
        csv += `${titre};${dateDebut};${dateFin};${ageMin || ''};${ageMax || ''};${jour};${prog?.lieu || ''};${prog?.matin || ''};${prog?.apresMidi || ''}\n`;
      });

      if (Platform.OS === 'web') {
        downloadCSVWeb(`stage-${titre}.csv`, csv);
        setConfirmation('📤 Export web OK');
      } else {
        const fileUri = FileSystem.documentDirectory + `stage-${titre}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        await shareAsync(fileUri, { mimeType: 'text/csv' });
        setConfirmation('📤 Export CSV mobile OK');
      }
    } catch (err) {
      setConfirmation('❌ Erreur export');
    }
  };

  // --- AFFICHAGE (inchangé) ---
  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>📘 Gestion des Stages</Text>

        <TouchableOpacity style={styles.button} onPress={handleNewStage}>
          <Text style={styles.buttonText}>+ Nouveau Stage</Text>
        </TouchableOpacity>

        {/* LISTE DES STAGES */}
        <FlatList
          data={stages}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.stageCard,
                  openedStageId === item.id && { borderColor: '#00ff88', borderWidth: 2 }
                ]}
                onPress={() => handleSelectStage(item)}
              >
                <Text style={styles.stageTitle}>{item.titre}</Text>
                <Text style={styles.stageDate}>
                  Du {formatDateFR(item.date_debut)} au {formatDateFR(item.date_fin)}
                </Text>
                {item.age_min && item.age_max &&
                  <Text style={styles.stageAge}>Âge : {item.age_min} à {item.age_max} ans</Text>
                }
                <Text style={styles.openCloseBtn}>{openedStageId === item.id ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* DÉROULEMENT ACCORDÉON */}
              {openedStageId === item.id && (
                <View style={[styles.formBlock, { width: '100%', maxWidth: 600, alignSelf: 'center' }]}>
                  <TextInput style={styles.input} placeholder="Titre du stage" value={titre} onChangeText={setTitre} placeholderTextColor="#aaa" />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Date début (YYYY-MM-DD)" value={dateDebut} onChangeText={setDateDebut} placeholderTextColor="#aaa" />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Date fin (YYYY-MM-DD)" value={dateFin} onChangeText={setDateFin} placeholderTextColor="#aaa" />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Âge min" value={ageMin} onChangeText={setAgeMin} keyboardType="numeric" placeholderTextColor="#aaa" />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Âge max" value={ageMax} onChangeText={setAgeMax} keyboardType="numeric" placeholderTextColor="#aaa" />
                  </View>
                  <Text style={styles.subtitle}>Programme journalier</Text>
                  {jours.map(day => (
                    <View key={day} style={styles.dayBlock}>
                      <Text style={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Lieu (facultatif)"
                        value={programme[day].lieu}
                        onChangeText={text => handleChangeProgramme(day, 'lieu', text)}
                        placeholderTextColor="#bbb"
                      />
                      <Text style={styles.labelField}>{`${day.charAt(0).toUpperCase() + day.slice(1)} matin`}</Text>
                      <TextInput
                        multiline
                        style={styles.textarea}
                        placeholder="Programme matin"
                        value={programme[day].matin}
                        onChangeText={text => handleChangeProgramme(day, 'matin', text)}
                        placeholderTextColor="#bbb"
                      />
                      <Text style={styles.labelField}>{`${day.charAt(0).toUpperCase() + day.slice(1)} aprem`}</Text>
                      <TextInput
                        multiline
                        style={styles.textarea}
                        placeholder="Programme après-midi"
                        value={programme[day].apresMidi}
                        onChangeText={text => handleChangeProgramme(day, 'apresMidi', text)}
                        placeholderTextColor="#bbb"
                      />
                    </View>
                  ))}

                  {/* BOUTONS EN GRID ADAPTATIVE */}
                  <View
                    style={[
                      styles.rowActions,
                      width < 700
                        ? { flexDirection: 'column', gap: 10 }
                        : { flexDirection: 'row', gap: 20, justifyContent: 'space-between' }
                    ]}
                  >
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0080ff', flex: 1 }]} onPress={imprimerStage}>
                      <Text style={[styles.buttonText, { color: '#fff' }]}>📄 Imprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#facc15', flex: 1 }]} onPress={exporterStageCSV}>
                      <Text style={[styles.buttonText, { color: '#222' }]}>📤 Export</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ff4444', flex: 1 }]} onPress={supprimerStage}>
                      <Text style={[styles.buttonText, { color: '#fff' }]}>🗑️ Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00ff88', flex: 1 }]} onPress={() => setEditMode(true)}>
                      <Text style={[styles.buttonText, { color: '#000' }]}>✏️ Modifier</Text>
                    </TouchableOpacity>
                  </View>

                  {editMode && (
                    <TouchableOpacity
                      style={[styles.button, { marginTop: 16 }]}
                      onPress={modifierStage}
                    >
                      <Text style={styles.buttonText}>💾 Enregistrer la modification</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          style={{ marginBottom: 24, marginTop: 10, width: '100%' }}
        />

        {/* CRÉATION NOUVEAU STAGE */}
        {editMode && !openedStageId && (
          <View style={[styles.formBlock, { width: '100%', maxWidth: 600, alignSelf: 'center' }]}>
            <TextInput style={styles.input} placeholder="Titre du stage" value={titre} onChangeText={setTitre} placeholderTextColor="#aaa" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Date début (YYYY-MM-DD)" value={dateDebut} onChangeText={setDateDebut} placeholderTextColor="#aaa" />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Date fin (YYYY-MM-DD)" value={dateFin} onChangeText={setDateFin} placeholderTextColor="#aaa" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Âge min" value={ageMin} onChangeText={setAgeMin} keyboardType="numeric" placeholderTextColor="#aaa" />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Âge max" value={ageMax} onChangeText={setAgeMax} keyboardType="numeric" placeholderTextColor="#aaa" />
            </View>
            <Text style={styles.subtitle}>Programme journalier</Text>
            {jours.map(day => (
              <View key={day} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lieu (facultatif)"
                  value={programme[day].lieu}
                  onChangeText={text => handleChangeProgramme(day, 'lieu', text)}
                  placeholderTextColor="#bbb"
                />
                <Text style={styles.labelField}>{`${day.charAt(0).toUpperCase() + day.slice(1)} matin`}</Text>
                <TextInput
                  multiline
                  style={styles.textarea}
                  placeholder="Programme matin"
                  value={programme[day].matin}
                  onChangeText={text => handleChangeProgramme(day, 'matin', text)}
                  placeholderTextColor="#bbb"
                />
                <Text style={styles.labelField}>{`${day.charAt(0).toUpperCase() + day.slice(1)} aprem`}</Text>
                <TextInput
                  multiline
                  style={styles.textarea}
                  placeholder="Programme après-midi"
                  value={programme[day].apresMidi}
                  onChangeText={text => handleChangeProgramme(day, 'apresMidi', text)}
                  placeholderTextColor="#bbb"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={enregistrerStage}>
              <Text style={styles.buttonText}>💾 Enregistrer le stage</Text>
            </TouchableOpacity>
          </View>
        )}

        {confirmation !== '' && (
          <TouchableOpacity onPress={() => setConfirmation('')}>
            <Text style={styles.confirmationMsg}>
              {confirmation} (cliquer pour fermer)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ... styles (identiques)

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 18, alignItems: 'center', width: '100%' },
  title: { fontSize: 22, color: '#00ff88', fontWeight: 'bold', marginBottom: 18, marginTop: 6 },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 8,
    width: '90%',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#00ff88',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  formBlock: { marginBottom: 24, alignItems: 'center' },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
    width: '100%',
  },
  labelField: {
    color: '#bbb',
    marginBottom: 3,
    marginTop: 3,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 2,
  },
  textarea: {
    backgroundColor: '#262c2c',
    color: '#fff',
    borderRadius: 8,
    padding: 8,
    height: 50,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginVertical: 8,
    fontWeight: 'bold'
  },
  dayBlock: {
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#161a1a',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#252c2c',
  },
  dayTitle: { color: '#00ff88', fontWeight: 'bold', fontSize: 15, marginBottom: 3, textAlign: 'center' },
  stageCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderColor: 'transparent',
    minWidth: 180,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  stageTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  stageDate: { color: '#00ff88', fontSize: 13, marginTop: 4 },
  stageAge: { color: '#facc15', fontSize: 13, marginTop: 2 },
  openCloseBtn: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 2,
  },
  rowActions: {
    marginTop: 18,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 15,
    paddingHorizontal: 0,
    minWidth: 120,
    marginHorizontal: 0,
  },
  confirmationMsg: {
    color: '#00ff88',
    marginTop: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#181c1c',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
});
