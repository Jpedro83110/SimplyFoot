import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as SharingWeb from 'expo-sharing';
import { PieChart } from 'react-native-chart-kit';
import useCacheData from '../../lib/cache'; // <-- AJOUT

export default function GestionBudget() {
  const router = useRouter();
  const [filtreMois, setFiltreMois] = useState('');
  const [clubId, setClubId] = useState(null);
  const [nouvelleLigne, setNouvelleLigne] = useState({
    date: '',
    type: 'Recette',
    intitule: '',
    montant: '',
    categorie: '',
    commentaire: '',
  });

  // --- On charge clubId (pas en cache car session/user change peu)
  useEffect(() => {
    const fetchClubId = async () => {
      const session = await supabase.auth.getSession();
      const userId = session.data.session.user.id;
      const { data, error } = await supabase
        .from('clubs')
        .select('id')
        .eq('created_by', userId)
        .single();
      if (!error && data) setClubId(data.id);
    };
    fetchClubId();
  }, []);

  // --- FONCTION DE FETCH AVEC FILTRE MOIS (pour le cache)
  const fetchLignesBudget = async () => {
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('club_id', clubId)
      .order('date', { ascending: false });
    if (filtreMois) query = query.filter('date', 'like', `${filtreMois}-%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  };

  // --- USECACHE (la clé dépend du filtre mois ET club, donc unique pour chaque vue)
  const cacheKey = clubId ? `budget_${clubId}_${filtreMois || 'all'}` : null;
  const [lignes, refreshLignes, chargement] = useCacheData(
    cacheKey,
    fetchLignesBudget,
    1800 // 30 minutes
  );

  // --- AJOUT / SUPPRIME / ARCHIVE = On refresh le cache
  const ajouterLigne = async () => {
    const { date, type, intitule, montant, categorie, commentaire } = nouvelleLigne;
    if (!clubId) {
      Alert.alert('Erreur', 'Le club n’a pas encore été chargé.');
      return;
    }
    if (!date || !intitule || !montant || isNaN(parseFloat(montant))) {
      Alert.alert('Erreur', 'Tous les champs obligatoires doivent être remplis correctement.');
      return;
    }
    const { error } = await supabase.from('budgets').insert([{
      date,
      type,
      intitule,
      montant: parseFloat(montant),
      categorie,
      commentaire,
      club_id: clubId
    }]);
    if (error) {
      Alert.alert('Erreur lors de l’ajout', error.message);
    } else {
      setNouvelleLigne({ date: '', type: 'Recette', intitule: '', montant: '', categorie: '', commentaire: '' });
      refreshLignes(); // REFRESH ICI !
    }
  };

  const exporterCSV = async () => {
    const header = 'Date,Type,Intitulé,Montant,Catégorie,Commentaire\n';
    const rows = (lignes || []).map(l => `${l.date},${l.type},${l.intitule},${l.montant},${l.categorie},${l.commentaire}`).join('\n');
    const csv = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'budget.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const path = FileSystem.documentDirectory + 'budget.csv';
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path);
    }
  };

  const exporterPDF = async () => {
    const html = `
      <html><body><h1>Budget Club</h1><table border='1' style='width:100%; border-collapse:collapse;'>
      <tr><th>Date</th><th>Type</th><th>Intitulé</th><th>Montant</th><th>Catégorie</th><th>Commentaire</th></tr>
      ${(lignes || []).map(l => `<tr><td>${l.date}</td><td>${l.type}</td><td>${l.intitule}</td><td>${l.montant} €</td><td>${l.categorie}</td><td>${l.commentaire}</td></tr>`).join('')}
      </table></body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await SharingWeb.shareAsync(uri);
  };

  const archiverEtVider = async () => {
    await exporterCSV();
    const { error } = await supabase.from('budgets').delete().eq('club_id', clubId);
    if (error) Alert.alert('Erreur lors de la suppression', error.message);
    else {
      Alert.alert('Archivé', 'Les données ont été exportées et supprimées.');
      refreshLignes(); // REFRESH ICI !
    }
  };

  const totalRecettes = (lignes || []).filter(l => l.type === 'Recette').reduce((sum, l) => sum + l.montant, 0);
  const totalDepenses = (lignes || []).filter(l => l.type === 'Dépense').reduce((sum, l) => sum + l.montant, 0);

  // --- Data pour PieChart ---
  const pieData = [
    totalRecettes > 0 && {
      name: 'Recettes',
      population: totalRecettes,
      color: '#00ff88',
      legendFontColor: '#fff',
      legendFontSize: 15,
    },
    totalDepenses > 0 && {
      name: 'Dépenses',
      population: totalDepenses,
      color: '#ff4444',
      legendFontColor: '#fff',
      legendFontSize: 15,
    },
  ].filter(Boolean);

  const renderItem = ({ item }) => (
    <View style={styles.ligne}>
      <Text style={styles.texte}>{item.date} • {item.type} • {item.intitule} • {item.montant} €</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <Text style={styles.titre}>💰 Gestion du budget</Text>

      <View style={styles.graphiqueContainer}>
        {(pieData.length > 0) && (
          <PieChart
            data={pieData}
            width={Dimensions.get('window').width - 40}
            height={210}
            chartConfig={{
              backgroundColor: "#121212",
              backgroundGradientFrom: "#121212",
              backgroundGradientTo: "#121212",
              color: (opacity = 1) => `rgba(0,255,136,${opacity})`,
              labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
              strokeWidth: 2,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="12"
            absolute
            hasLegend={true}
            avoidFalseZero
          />
        )}

        <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8 }}>
          💶 Solde actuel : {totalRecettes - totalDepenses} €
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Filtrer par mois (ex: 2025-05)"
        placeholderTextColor="#bbb"
        value={filtreMois}
        onChangeText={setFiltreMois}
      />

      <View style={styles.formulaire}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity
            style={[styles.bouton, { backgroundColor: nouvelleLigne.type === 'Recette' ? '#00ff88' : '#333', flex: 1, marginRight: 5 }]}
            onPress={() => setNouvelleLigne({ ...nouvelleLigne, type: 'Recette' })}
          >
            <Text style={styles.boutonTexte}>Recette</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bouton, { backgroundColor: nouvelleLigne.type === 'Dépense' ? '#ff4444' : '#333', flex: 1, marginLeft: 5 }]}
            onPress={() => setNouvelleLigne({ ...nouvelleLigne, type: 'Dépense' })}
          >
            <Text style={styles.boutonTexte}>Dépense</Text>
          </TouchableOpacity>
        </View>

        {['date', 'intitule', 'montant', 'categorie', 'commentaire'].map((key, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
            placeholderTextColor="#888"
            keyboardType={key === 'montant' ? 'numeric' : 'default'}
            value={nouvelleLigne[key]}
            onChangeText={text => setNouvelleLigne({ ...nouvelleLigne, [key]: text })}
          />
        ))}

        <TouchableOpacity style={[styles.bouton, { backgroundColor: nouvelleLigne.type === 'Recette' ? '#00ff88' : '#ff4444' }]} onPress={ajouterLigne}>
          <Text style={[styles.boutonTexte, { color: '#111' }]}>Ajouter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.export} onPress={exporterCSV}>
          <Text style={styles.boutonTexte}>📤 Exporter CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.export} onPress={exporterPDF}>
          <Text style={styles.boutonTexte}>🧾 Exporter PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.danger} onPress={archiverEtVider}>
          <Text style={styles.boutonTexte}>🗑️ Archiver et Vider</Text>
        </TouchableOpacity>
      </View>

      {chargement
        ? <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>Chargement…</Text>
        : (lignes?.length === 0)
          ? <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>Aucune ligne de budget trouvée.</Text>
          : <FlatList
              data={lignes}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
              style={{ marginBottom: 40 }}
            />
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: 20, backgroundColor: '#121212' },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#00ff88', marginBottom: 10, textAlign: 'center' },
  formulaire: { marginBottom: 20 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 15 },
  bouton: { padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  export: { backgroundColor: '#448aff', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  danger: { backgroundColor: '#ff4444', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  boutonTexte: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ligne: { padding: 10, borderBottomColor: '#444', borderBottomWidth: 1 },
  texte: { color: '#fff' },
  graphiqueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 250,
  },
});
