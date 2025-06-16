// app/coach/stages.js et app/joueur/stages.js (même fichier, adaptatif si besoin)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

export default function LectureStage() {
  const [stage, setStage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;

      const { data: user } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', userId)
        .single();

      if (!user?.club_id) return;

      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .eq('club_id', user.club_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error) setStage(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;
  }

  if (!stage) {
    return <Text style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Aucun stage enregistré.</Text>;
  }

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📘 {stage.titre}</Text>
        <Text style={styles.detail}>📍 {stage.lieu}</Text>
        <Text style={styles.detail}>🗓️ Du {stage.date_debut} au {stage.date_fin}</Text>

        <ImageBackground
          source={require('../../assets/terrain.png')}
          resizeMode="cover"
          style={styles.background}
        >
          {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((day) => (
            <View key={day} style={styles.dayBlock}>
              <Text style={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <Text style={styles.programText}>{stage[`programme_${day}`]}</Text>
            </View>
          ))}
        </ImageBackground>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 10,
  },
  detail: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },
  background: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  dayBlock: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  dayTitle: {
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  programText: {
    color: '#fff',
    fontSize: 14,
  },
});
