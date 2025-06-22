import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useWindowDimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import { normalizeHour } from '../../lib/formatDate';

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

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

export default function ProgrammeStage() {
  const { width } = useWindowDimensions();
  const [stages, setStages] = useState([]);
  const [openedStageId, setOpenedStageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    const fetchStages = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;

      const { data: user } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', userId)
        .single();

      if (!user) return;

      const { data: stagesList } = await supabase
        .from('stages')
        .select('*')
        .eq('club_id', user.club_id)
        .order('date_debut', { ascending: false });

      setStages(stagesList || []);
      setLoading(false);
    };
    fetchStages();
  }, []);

  const imprimerStage = async (stage) => {
    try {
      const programme = {};
      jours.forEach(jour => {
        programme[jour] = stage[`programme_${jour}`]
          ? JSON.parse(stage[`programme_${jour}`])
          : { lieu: '', matin: '', apresMidi: '', heureDebut: '', heureFin: '' };
      });
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
        <h2>${stage.titre}</h2>
        <p><strong>Dates :</strong> du ${formatDateFR(stage.date_debut)} au ${formatDateFR(stage.date_fin)}</p>
        ${stage.age_min && stage.age_max ? `<p><strong>Âge :</strong> ${stage.age_min} à ${stage.age_max} ans</p>` : ''}
        <table>
          <thead><tr><th>Jour</th><th>Lieu</th><th>Horaires</th><th>Matin</th><th>Après-midi</th></tr></thead>
          <tbody>
            ${jours.map(jour => {
              const prog = programme[jour];
              let heureDebut = prog.heureDebut || stage.heure_debut || '09:00';
              let heureFin = prog.heureFin || stage.heure_fin || '17:00';
              return `<tr>
                <td>${jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                <td>${prog?.lieu || ''}</td>
                <td>${normalizeHour(heureDebut)} - ${normalizeHour(heureFin)}</td>
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

  const exporterStageCSV = async (stage) => {
    try {
      let csv = `Titre;Date début;Date fin;Âge min;Âge max;Jour;Lieu;Horaires;Matin;Après-midi\n`;
      jours.forEach(jour => {
        const prog = stage[`programme_${jour}`]
          ? JSON.parse(stage[`programme_${jour}`])
          : {};
        let heureDebut = prog.heureDebut || stage.heure_debut || '09:00';
        let heureFin = prog.heureFin || stage.heure_fin || '17:00';
        csv += `${stage.titre};${stage.date_debut};${stage.date_fin};${stage.age_min || ''};${stage.age_max || ''};${jour};${prog.lieu || ''};${normalizeHour(heureDebut)} - ${normalizeHour(heureFin)};${prog.matin || ''};${prog.apresMidi || ''}\n`;
      });
      if (Platform.OS === 'web') {
        downloadCSVWeb(`stage-${stage.titre}.csv`, csv);
        setConfirmation('📤 Export web OK');
      } else {
        const fileUri = FileSystem.documentDirectory + `stage-${stage.titre}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        await shareAsync(fileUri, { mimeType: 'text/csv' });
        setConfirmation('📤 Export CSV mobile OK');
      }
    } catch (err) {
      setConfirmation('❌ Erreur export');
    }
  };

  if (loading)
    return <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />;

  if (!stages.length)
    return <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 40 }}>Aucun stage trouvé.</Text>;

  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📘 Programmes des Stages</Text>

        {stages.map((stage) => (
          <View key={stage.id} style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>
            <TouchableOpacity
              style={[
                styles.stageCard,
                openedStageId === stage.id && { borderColor: '#00ff88', borderWidth: 2 }
              ]}
              onPress={() => setOpenedStageId(openedStageId === stage.id ? null : stage.id)}
            >
              <Text style={styles.stageTitle}>{stage.titre}</Text>
              <Text style={styles.stageDate}>
                Du {formatDateFR(stage.date_debut)} au {formatDateFR(stage.date_fin)}
              </Text>
              {stage.age_min && stage.age_max &&
                <Text style={styles.stageAge}>Âge : {stage.age_min} à {stage.age_max} ans</Text>
              }
              <Text style={styles.openCloseBtn}>{openedStageId === stage.id ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {openedStageId === stage.id && (
              <View style={[styles.formBlock, { width: '100%', maxWidth: 600, alignSelf: 'center' }]}>
                {jours.map(day => {
                  const prog = stage[`programme_${day}`]
                    ? JSON.parse(stage[`programme_${day}`])
                    : { lieu: '', matin: '', apresMidi: '', heureDebut: '', heureFin: '' };
                  let heureDebut = prog.heureDebut || stage.heure_debut || '09:00';
                  let heureFin = prog.heureFin || stage.heure_fin || '17:00';
                  return (
                    <View key={day} style={styles.dayBlock}>
                      <Text style={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                      <Text style={styles.labelField}>Lieu :</Text>
                      <Text style={styles.fieldValue}>{prog.lieu || '—'}</Text>
                      <Text style={styles.labelField}>Horaires :</Text>
                      <Text style={styles.fieldValue}>
                        {normalizeHour(heureDebut)} - {normalizeHour(heureFin)}
                      </Text>
                      <Text style={styles.labelField}>Matin :</Text>
                      <Text style={styles.fieldValue}>{prog.matin || '—'}</Text>
                      <Text style={styles.labelField}>Après-midi :</Text>
                      <Text style={styles.fieldValue}>{prog.apresMidi || '—'}</Text>
                    </View>
                  );
                })}

                <View
                  style={[
                    styles.rowActions,
                    width < 700
                      ? { flexDirection: 'column', gap: 10 }
                      : { flexDirection: 'row', gap: 20, justifyContent: 'space-between' }
                  ]}
                >
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0080ff', flex: 1 }]} onPress={() => imprimerStage(stage)}>
                    <Text style={[styles.buttonText, { color: '#fff' }]}>📄 Imprimer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#facc15', flex: 1 }]} onPress={() => exporterStageCSV(stage)}>
                    <Text style={[styles.buttonText, { color: '#222' }]}>📤 Export</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {confirmation !== '' && (
          <TouchableOpacity onPress={() => setConfirmation('')}>
            <Text style={styles.confirmationMsg}>
              {confirmation} (cliquer pour fermer)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 18, alignItems: 'center', width: '100%' },
  title: { fontSize: 22, color: '#00ff88', fontWeight: 'bold', marginBottom: 18, marginTop: 6 },
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
  formBlock: { marginBottom: 24, alignItems: 'center' },
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
  labelField: {
    color: '#bbb',
    marginBottom: 3,
    marginTop: 3,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 2,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 2,
    marginLeft: 6,
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
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
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
