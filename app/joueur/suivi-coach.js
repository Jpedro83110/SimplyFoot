import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const demoMode = false;

export default function SuiviJoueur() {
  const [suivi, setSuivi] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  // Largeur maximum (responsive)
  const maxBlockWidth = Platform.OS === 'web' ? 520 : Math.min(width - 32, 380);

  useEffect(() => {
    async function fetchSuivi() {
      if (demoMode) {
        setSuivi({
          point_fort: "Très bon placement défensif",
          axe_travail: "Améliorer la réactivité dans les duels",
          date: "2025-06-07"
        });
        setLoading(false);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const joueurId = sessionData?.session?.user?.id;
        if (!joueurId) return;

        const { data, error } = await supabase
          .from('suivis_personnalises')
          .select('*')
          .eq('joueur_id', joueurId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) console.error(error);
        else setSuivi(data);

        setLoading(false);
      }
    }
    fetchSuivi();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📋 Mon suivi personnalisé</Text>
        {suivi?.date && (
          <Text style={styles.dateText}>
            🕓 Suivi du {suivi.date?.split('T')[0] || suivi.date}
          </Text>
        )}

        {/* Block Point fort */}
        <View style={[styles.block, { width: maxBlockWidth }]}>
          <Text style={styles.label}>🟢 Point fort</Text>
          <Text style={styles.value}>{suivi?.point_fort || '—'}</Text>
        </View>

        {/* Block Illustration */}
        <View style={[styles.illustrationBlock, { width: maxBlockWidth, aspectRatio: 1.7 }]}>
          <Image
            source={require('../../assets/coach-joueur-highfive.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Block A travailler */}
        <View style={[styles.block, { width: maxBlockWidth }]}>
          <Text style={styles.label}>🔴 À travailler</Text>
          <Text style={styles.value}>{suivi?.axe_travail || '—'}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', padding: 20, paddingTop: 32, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 12,
  },
  dateText: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  block: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    minHeight: 62,
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#00ff88',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  illustrationBlock: {
    backgroundColor: '#101a13',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOpacity: 0.20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 18,
    elevation: 8,
    alignSelf: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
});

