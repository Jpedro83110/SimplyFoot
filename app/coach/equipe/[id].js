import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  Pressable, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import useCacheData from '../../../lib/cache';

export default function EquipeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [equipeNom, setEquipeNom] = useState('');
  const [joueurs, setJoueurs] = useState([]);

  // Utilise le cache, TTL 10 min
  const fetchEquipe = async () => {
    const { data: equipe, error: err1 } = await supabase
      .from('equipes')
      .select('nom')
      .eq('id', id)
      .single();

    const { data: joueursEquipe, error: err2 } = await supabase
      .from('joueurs')
      .select('*')
      .eq('equipe_id', id);

    if (err1 || err2) {
      return { equipeNom: 'Erreur de chargement', joueurs: [] };
    } else {
      return {
        equipeNom: equipe?.nom || 'Équipe',
        joueurs: joueursEquipe || [],
      };
    }
  };

  const [cacheData, refresh, loading] = useCacheData(
    `coach_equipe_${id}`,
    fetchEquipe,
    600 // 10 min
  );

  useEffect(() => {
    if (cacheData) {
      setEquipeNom(cacheData.equipeNom);
      setJoueurs(cacheData.joueurs);
    }
  }, [cacheData]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={refresh} style={{ marginBottom: 18, alignSelf: 'flex-end' }}>
        <Text style={{ color: '#00ff88', fontSize: 14 }}>🔄 Rafraîchir</Text>
      </TouchableOpacity>
      <Text style={styles.title}>⚽ {equipeNom}</Text>
      <View style={styles.block}>
        <Text style={styles.label}>Nom de l'équipe :</Text>
        <Text style={styles.value}>{equipeNom}</Text>
      </View>

      <Text style={styles.sectionTitle}>👥 Liste des joueurs</Text>
      <FlatList
        data={joueurs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{item.prenom} {item.nom}</Text>
              <Text style={styles.playerInfo}>Date naissance : {item.date_naissance || '—'}</Text>
              <Text style={styles.playerInfo}>Poste : {item.poste || '—'}</Text>
              <Text style={styles.playerInfo}>Licence : {item.numero_licence || '—'}</Text>
              <Text style={styles.playerInfo}>Visite médicale : {item.visite_medicale_valide ? '✅ OK' : '❌'}</Text>
              <Text style={styles.playerInfo}>Équipement : {item.equipement_ok ? '✅ OK' : '❌'}</Text>
            </View>
            <Pressable
              onPress={() => router.push(`/coach/joueur/${item.id}`)}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.buttonText}>Fiche</Text>
            </Pressable>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  block: {
    marginBottom: 15,
  },
  label: {
    color: '#aaa',
    fontSize: 16,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#00ff88',
    fontWeight: 'bold',
    marginVertical: 20,
  },
  playerCard: {
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
  },
});
