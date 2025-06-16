import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { getFromCache, saveToCache } from '../../../lib/cache';

export default function ListeCompositions() {
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const CACHE_KEY = 'compo_evenements';

  // Fonction pour charger depuis cache OU Supabase
  async function fetchEvenements(forceRefresh = false) {
    setLoading(true);
    let data = null;

    // 1. Essaie cache sauf si refresh forcé
    if (!forceRefresh) {
      data = await getFromCache(CACHE_KEY);
    }

    // 2. Si rien en cache (ou refresh), charge Supabase
    if (!data) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      const { data: freshData, error } = await supabase
        .from('evenements')
        .select('*')
        .eq('coach_id', userId)
        .order('date', { ascending: true });

      if (!error) {
        data = freshData;
        await saveToCache(CACHE_KEY, freshData); // MAJ le cache
      } else {
        data = [];
      }
    }

    setEvenements(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchEvenements();
  }, []);

  // Pull to refresh (pour forcer MAJ si besoin)
  const onRefresh = () => {
    setRefreshing(true);
    fetchEvenements(true);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>📋 Sélectionne un événement</Text>
      {evenements.map(evt => (
        <TouchableOpacity
          key={evt.id}
          style={styles.card}
          onPress={() => router.push(`/coach/composition/${evt.id}`)}
        >
          <Text style={styles.titre}>{evt.titre}</Text>
          <Text style={styles.info}>📅 {evt.date} à {evt.heure}</Text>
          <Text style={styles.info}>📍 {evt.lieu}</Text>
        </TouchableOpacity>
      ))}
      {loading && <Text style={{ color: '#00ff88', textAlign: 'center', marginTop: 30 }}>Chargement…</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { color: '#00ff88', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderLeftColor: '#00ff88',
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  titre: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  info: { color: '#ccc', fontSize: 14, marginTop: 2 },
});
