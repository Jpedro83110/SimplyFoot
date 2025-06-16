import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Platform, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import Slider from '@react-native-community/slider';
import useCacheData, { saveToCache } from '../../../lib/cache';

export default function EvaluationTechnique() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const criteres = [
    'tir', 'passe', 'centre', 'tete', 'vitesse', 'defense', 'placement', 'jeu_sans_ballon'
  ];

  // --- CACHE ---
  const fetchEval = async () => {
    const { data } = await supabase
      .from('evaluations_techniques')
      .select('*')
      .eq('joueur_id', id)
      .single();
    return data;
  };
  // TTL 1h
  const [evalData, refresh, loading] = useCacheData(`eval-technique-${id}`, fetchEval, 3600);
  // valeur courante à modifier
  const [valeurs, setValeurs] = useState(Object.fromEntries(criteres.map(c => [c, 50])));
  const [moyenne, setMoyenne] = useState(0);

  // Synchro du cache dans state modifiable
  useEffect(() => {
    if (evalData) {
      // On complète les critères manquants
      setValeurs({
        ...Object.fromEntries(criteres.map(c => [c, 50])),
        ...evalData,
      });
    }
  }, [evalData]);

  useEffect(() => {
    const total = criteres.reduce((sum, crit) => sum + (Number(valeurs[crit]) || 0), 0);
    setMoyenne(Math.round(total / criteres.length));
  }, [valeurs]);

  const handleSave = async () => {
    setSaving(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (sessionError || !session?.user?.id) {
      Alert.alert('Erreur', 'Session coach invalide');
      setSaving(false);
      return;
    }
    const updates = {
      ...valeurs,
      joueur_id: id,
      coach_id: session.user.id,
      moyenne: moyenne,
      updated_at: new Date().toISOString(),
    };
    criteres.forEach(c => { updates[c] = Math.round(Number(updates[c]) || 0); });

    const { error } = await supabase
      .from('evaluations_techniques')
      .upsert(updates, { onConflict: ['joueur_id'] });

    setSaving(false);

    if (error) Alert.alert('Erreur sauvegarde', error.message);
    else {
      // Refresh cache après save
      await refresh();
      Alert.alert('Succès', 'Évaluation enregistrée avec succès', [
        { text: 'OK', onPress: () => router.replace(`/coach/joueur/${id}`) }
      ]);
    }
  };

  if (loading || !valeurs) {
    return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎯 Évaluation technique</Text>

      {criteres.map((critere) => (
        <View key={critere} style={styles.sliderBlock}>
          <Text style={styles.label}>
            {critere.replace(/_/g, ' ').toUpperCase()} : {valeurs[critere]}
          </Text>
          {Platform.OS === 'web' ? (
            <TextInput
              keyboardType="numeric"
              value={String(valeurs[critere])}
              onChangeText={(val) => {
                const num = Math.max(0, Math.min(100, parseInt(val) || 0));
                setValeurs((prev) => ({ ...prev, [critere]: num }));
              }}
              style={styles.inputWeb}
            />
          ) : (
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={Number(valeurs[critere])}
              onValueChange={(val) =>
                setValeurs((prev) => ({ ...prev, [critere]: Math.round(val) }))
              }
              minimumTrackTintColor="#00ff88"
              maximumTrackTintColor="#333"
              thumbTintColor="#00ff88"
            />
          )}
        </View>
      ))}

      <View style={styles.moyenneBlock}>
        <Text style={styles.moyenneText}>🧮 Moyenne : {moyenne} / 100</Text>
      </View>

      <Pressable onPress={handleSave} style={styles.button} disabled={saving}>
        <Text style={styles.buttonText}>
          {saving ? 'Enregistrement...' : '💾 Enregistrer'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sliderBlock: {
    marginBottom: 25,
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
  },
  label: {
    color: '#fff',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  inputWeb: {
    backgroundColor: '#222',
    color: '#00ff88',
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  moyenneBlock: {
    marginTop: 10,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#0e0e0e',
    borderRadius: 8,
    borderColor: '#00ff88',
    borderWidth: 1,
  },
  moyenneText: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00ff88',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
