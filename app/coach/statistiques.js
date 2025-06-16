import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getBadge(note) {
  if (note >= 90) return require('../../assets/badges/platine.png');
  if (note >= 75) return require('../../assets/badges/or.png');
  if (note >= 60) return require('../../assets/badges/argent.png');
  return require('../../assets/badges/bronze.png');
}

export default function Statistiques() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats(forceRefresh = false) {
      setLoading(true);

      // Gestion du cache (clé par coach)
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const cacheKey = `stats-coach-${userId}`;
      if (!forceRefresh) {
        // Cherche cache valide (moins de 30min)
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { value, updated } = JSON.parse(cached);
          if (Date.now() - updated < 1000 * 60 * 30) {
            setStats(value);
            setLoading(false);
            return;
          }
        }
      }

      const { data: user } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', userId)
        .single();

      if (!user?.club_id) { setLoading(false); return; }

      const { data: equipes } = await supabase
        .from('equipes')
        .select('id, nom')
        .eq('club_id', user.club_id);

      let statsEquipes = [];

      for (let eq of equipes) {
        // 2. Récupère tous les joueurs de l’équipe
        const { data: joueurs } = await supabase
          .from('joueurs')
          .select('id')
          .eq('equipe_id', eq.id);

        if (!joueurs?.length) continue;
        let mentale = [];
        let technique = [];

        for (let joueur of joueurs) {
          // Note mentale
          const { data: mentaleEval } = await supabase
            .from('evaluations_mentales')
            .select('note_globale, moyenne')
            .eq('joueur_id', joueur.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          if (mentaleEval?.note_globale || mentaleEval?.moyenne)
            mentale.push(Number(mentaleEval.note_globale || mentaleEval.moyenne));

          // Note technique
          const { data: techniqueEval } = await supabase
            .from('evaluations_techniques')
            .select('moyenne')
            .eq('joueur_id', joueur.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          if (techniqueEval?.moyenne)
            technique.push(Number(techniqueEval.moyenne));
        }

        // Calcul des moyennes
        const moyenneMentale = mentale.length ? Math.round(mentale.reduce((a, b) => a + b, 0) / mentale.length) : 0;
        const moyenneTechnique = technique.length ? Math.round(technique.reduce((a, b) => a + b, 0) / technique.length) : 0;
        const moyenneGlobale = Math.round((moyenneMentale + moyenneTechnique) / 2);

        statsEquipes.push({
          equipe: eq.nom,
          mentale: moyenneMentale,
          technique: moyenneTechnique,
          globale: moyenneGlobale,
        });
      }
      setStats(statsEquipes);

      // Stocke dans le cache (avec timestamp)
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ value: statsEquipes, updated: Date.now() })
      );
      setLoading(false);
    }
    fetchStats();

    // Ajoute bouton refresh (optionnel)
    // return () => { /* rien */ };
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} color="#00ff88" />;
  }

  if (!stats.length) {
    return <Text style={{ color: '#fff', textAlign: 'center', marginTop: 60 }}>Aucune statistique disponible.</Text>;
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏆 Statistiques d’équipe</Text>

        {stats.map((stat, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.equipe}>{stat.equipe}</Text>
            <View style={styles.statsRow}>
              {/* Mentale */}
              <View style={styles.sideBlock}>
                <Text style={styles.label}>Mentale</Text>
                <Text style={styles.value}>{stat.mentale}</Text>
                <Image source={getBadge(stat.mentale)} style={styles.badgeSide} resizeMode="contain" />
              </View>
              {/* Globale */}
              <View style={styles.centerBlock}>
                <Text style={styles.labelGlobale}>Globale</Text>
                <Text style={styles.valueGlobale}>{stat.globale}</Text>
                <Image source={getBadge(stat.globale)} style={styles.badgeCenter} resizeMode="contain" />
              </View>
              {/* Technique */}
              <View style={styles.sideBlock}>
                <Text style={styles.label}>Technique</Text>
                <Text style={styles.value}>{stat.technique}</Text>
                <Image source={getBadge(stat.technique)} style={styles.badgeSide} resizeMode="contain" />
              </View>
            </View>
          </View>
        ))}

        {/* Photo unique en bas */}
        <Image
          source={require('../../assets/coach-joueur-highfive.png')}
          style={styles.highfive}
          resizeMode="cover"
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 80 },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    padding: 22,
    marginBottom: 34,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    alignItems: 'center',
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  equipe: {
    color: '#00ff88',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 18,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    width: '100%',
    gap: 18,
    maxWidth: 440,
    alignSelf: 'center',
  },
  sideBlock: {
    alignItems: 'center',
    flex: 1,
  },
  centerBlock: {
    alignItems: 'center',
    flex: 1.2,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  value: {
    color: '#00ff88',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  badgeSide: {
    width: 44,
    height: 44,
    marginTop: 4,
    marginBottom: 0,
  },
  labelGlobale: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  valueGlobale: {
    color: '#00ff88',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  badgeCenter: {
    width: 60,
    height: 60,
    marginTop: 4,
    marginBottom: 0,
  },
  highfive: {
    width: '100%',
    aspectRatio: 1, // carré, bien homogène partout
    borderRadius: 12,
    marginTop: 28,
    marginBottom: 8,
    maxWidth: 440,
    alignSelf: 'center',
  },
});
