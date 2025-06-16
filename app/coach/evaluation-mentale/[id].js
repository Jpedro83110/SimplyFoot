import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import Slider from '@react-native-community/slider';
import useCacheData, { saveToCache } from '../../../lib/cache';

export default function EvaluationMentale() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [valeurs, setValeurs] = useState({
    motivation: 50,
    rigueur: 50,
    ponctualite: 50,
    attitude: 50,
    respect: 50,
  });

  // ---- NOUVEAU : cache ----
  const fetchEval = async () => {
    const { data } = await supabase
      .from('evaluations_mentales')
      .select('*')
      .eq('joueur_id', id)
      .single();
    return data;
  };
  // 1h de TTL
  const [evalData, refresh, loading] = useCacheData(`eval-mentale-${id}`, fetchEval, 3600);

  useEffect(() => {
    if (evalData) {
      setValeurs({
        motivation: evalData.motivation ?? 50,
        rigueur: evalData.rigueur ?? 50,
        ponctualite: evalData.ponctualite ?? 50,
        attitude: evalData.attitude ?? 50,
        respect: evalData.respect ?? 50,
      });
    }
  }, [evalData]);

  const handleSliderChange = (key, value) => {
    setValeurs((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, parseInt(value) || 0)),
    }));
  };

  const calculerMoyenne = () => {
    const total = Object.values(valeurs).reduce((a, b) => a + b, 0);
    return Math.round(total / Object.values(valeurs).length);
  };

  const enregistrerEvaluation = async () => {
    const moyenne = calculerMoyenne();

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session?.user?.id) {
      Alert.alert('Erreur', 'Session invalide');
      return;
    }

    const updates = {
      joueur_id: id,
      coach_id: session.user.id,
      updated_at: new Date().toISOString(),
      ...valeurs,
      note_globale: moyenne,
    };

    const { error } = await supabase
      .from('evaluations_mentales')
      .upsert(updates, { onConflict: ['joueur_id'] });

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      // Refresh cache après modification
      await refresh();
      Alert.alert('Succès', 'Évaluation mentale enregistrée');
      router.replace(`/coach/joueur/${id}`);
    }
  };

  const moyenne = calculerMoyenne();

  if (loading) return <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 50 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧠 Évaluation mentale</Text>

      {Object.entries(valeurs).map(([key, val]) => (
        <View key={key} style={styles.sliderBlock}>
          <Text style={styles.label}>
            {key.charAt(0).toUpperCase() + key.slice(1)} : {val}/100
          </Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(val)}
              onChangeText={(text) => handleSliderChange(key, text)}
              placeholder="0 à 100"
              placeholderTextColor="#555"
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.label, { width: 40, textAlign: 'right', color: '#00ff88', fontWeight: 'bold' }]}>{val}</Text>
              <Slider
                style={{ flex: 1, marginHorizontal: 12 }}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={val}
                minimumTrackTintColor="#00ff88"
                maximumTrackTintColor="#555"
                thumbTintColor="#00ff88"
                onValueChange={(v) => handleSliderChange(key, v)}
              />
              <Text style={[styles.label, { width: 40, color: '#fff', textAlign: 'left', opacity: 0.6 }]}>/100</Text>
            </View>
          )}
        </View>
      ))}

      <View style={styles.moyenneBlock}>
        <Text style={styles.moyenneLabel}>🟢 Note globale : {moyenne}/100</Text>
      </View>

      <Pressable style={styles.button} onPress={enregistrerEvaluation} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Enregistrement...' : 'Valider l’évaluation'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 22,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sliderBlock: {
    marginBottom: 25,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#444',
    borderWidth: 1,
  },
  moyenneBlock: {
    marginVertical: 20,
    padding: 14,
    backgroundColor: '#0e0e0e',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00ff88',
    alignItems: 'center',
  },
  moyenneLabel: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#00ff88',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
