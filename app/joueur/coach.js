import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const demoMode = true;

export default function CoachJoueur() {
  const router = useRouter();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoach() {
      if (demoMode) {
        setCoach({
          nom: 'Jean Durand',
          equipe: 'U17',
          role: 'Coach principal',
        });
        setLoading(false);
      } else {
        const { data: user, error: err1 } = await supabase
          .from('utilisateurs')
          .select('coach_id, equipe_id')
          .eq('id', supabase.auth.getUser().id)
          .single();

        if (err1 || !user) return setLoading(false);

        const { data: coachData } = await supabase
          .from('staff')
          .select('nom, role, equipe_id')
          .eq('id', user.coach_id)
          .single();

        const { data: equipeData } = await supabase
          .from('equipes')
          .select('nom')
          .eq('id', coachData.equipe_id || user.equipe_id)
          .single();

        setCoach({
          nom: coachData.nom,
          role: coachData.role,
          equipe: equipeData?.nom || 'Non définie',
        });
        setLoading(false);
      }
    }

    fetchCoach();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎓 Mon coach</Text>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>Nom :</Text>
          <Text style={styles.value}>{coach?.nom}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>Équipe :</Text>
          <Text style={styles.value}>{coach?.equipe}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>Rôle :</Text>
          <Text style={styles.value}>{coach?.role}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/joueur/messages')}
        >
          <Ionicons name="chatbox-ellipses" size={20} color="#111" />
          <Text style={styles.buttonText}>Voir ses messages</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 24,
    textAlign: 'center',
  },
  infoBlock: {
    marginBottom: 14,
  },
  label: {
    color: '#00ff88',
    fontSize: 15,
    fontWeight: 'bold',
  },
  value: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
