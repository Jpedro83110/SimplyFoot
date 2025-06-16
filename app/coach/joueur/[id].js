import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import useCacheData from '../../../lib/cache';

export default function JoueurDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // --- FETCH INFOS & SUIVI ---
  const fetchInfos = async () => {
    // Joueur
    const { data: j, error: e1 } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', id)
      .single();
    // Suivi personnalisé du coach connecté
    const { data: sessionData } = await supabase.auth.getSession();
    const coachId = sessionData?.session?.user?.id;
    let s = null;
    if (coachId) {
      const { data } = await supabase
        .from('suivis_personnalises')
        .select('*')
        .eq('joueur_id', id)
        .eq('coach_id', coachId)
        .single();
      s = data;
    }
    if (e1) throw new Error('Impossible de charger les données');
    return { joueur: j, suivi: s };
  };

  // --- HOOK CACHE ---
  const [data, refresh, loading] = useCacheData(`coach-joueur-${id}`, fetchInfos, 900);
  const joueur = data?.joueur;
  const suivi = data?.suivi;

  // --- Ajout / MAJ suivi personnalisé ---
  const [newSuivi, setNewSuivi] = useState({ point_fort: '', axe_travail: '' });
  const [saving, setSaving] = useState(false);

  const ajouterOuMajSuivi = async () => {
    if (!newSuivi.point_fort?.trim() && !newSuivi.axe_travail?.trim()) return;
    setSaving(true);

    // Récupérer l'id du coach connecté
    const { data: sessionData } = await supabase.auth.getSession();
    const coachId = sessionData?.session?.user?.id;

    if (!coachId) {
      Alert.alert('Erreur', 'Utilisateur non identifié.');
      setSaving(false);
      return;
    }

    // upsert
    const { error } = await supabase.from('suivis_personnalises').upsert({
      joueur_id: id,
      coach_id: coachId,
      point_fort: newSuivi.point_fort,
      axe_travail: newSuivi.axe_travail,
      updated_at: new Date().toISOString(),
    }, { onConflict: ['joueur_id', 'coach_id'] });

    setSaving(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setNewSuivi({ point_fort: '', axe_travail: '' });
      refresh(); // recharge infos et suivi à jour via Supabase
    }
  };

  // --- Rendu ---
  if (loading || !data || !joueur)
    return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../../assets/avatar.png')} style={styles.avatar} />

      <Text style={styles.title}>{joueur.prenom} {joueur.nom}</Text>
      <Text style={styles.subtitle}>Poste : {joueur.poste}</Text>

      <View style={styles.statsBlock}>
        <Text style={styles.statsTitle}>📊 Statistiques</Text>
        <Text style={styles.statLine}>Matchs joués : {joueur.matchs || 0}</Text>
        <Text style={styles.statLine}>Buts : {joueur.buts || 0}</Text>
        <Text style={styles.statLine}>Passes décisives : {joueur.passes || 0}</Text>
      </View>

      <View style={styles.followUpBlock}>
        <Text style={styles.statsTitle}>📘 Suivi personnalisé</Text>

        <Text style={styles.label}>🟢 Point fort</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Très bon positionnement défensif"
          placeholderTextColor="#888"
          value={newSuivi.point_fort}
          onChangeText={(text) => setNewSuivi((prev) => ({ ...prev, point_fort: text }))}
          multiline
        />

        <Text style={styles.label}>🔴 À travailler</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Doit améliorer sa réactivité défensive"
          placeholderTextColor="#888"
          value={newSuivi.axe_travail}
          onChangeText={(text) => setNewSuivi((prev) => ({ ...prev, axe_travail: text }))}
          multiline
        />

        <Pressable onPress={ajouterOuMajSuivi} style={styles.button} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Enregistrement...' : 'Ajouter / Mettre à jour'}</Text>
        </Pressable>

        {suivi && (
          <View style={styles.suiviCard}>
            <Text style={styles.suiviText}>
              📅 {suivi.updated_at?.split('T')[0] || suivi.created_at?.split('T')[0] || 'Date inconnue'}
            </Text>
            {suivi.point_fort ? (
              <Text style={[styles.suiviContenu, { color: '#00ff88' }]}>
                🟢 Point fort : {suivi.point_fort}
              </Text>
            ) : null}
            {suivi.axe_travail ? (
              <Text style={[styles.suiviContenu, { color: '#ff5555' }]}>
                🔴 À travailler : {suivi.axe_travail}
              </Text>
            ) : null}
          </View>
        )}

        <Pressable
          style={[styles.button, { backgroundColor: '#222', marginTop: 10 }]}
          onPress={refresh}
        >
          <Text style={[styles.buttonText, { color: '#00ff88' }]}>🔄 Actualiser</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: '#003322', alignSelf: 'stretch', marginBottom: 10 }]}
        onPress={() => router.push(`/coach/evaluation-mentale/${id}`)}
      >
        <Text style={[styles.buttonText, { color: '#00ff88', textAlign: 'center' }]}>
          🧠 Évaluer le mental
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: '#220033', alignSelf: 'stretch', marginBottom: 40 }]}
        onPress={() => router.push(`/coach/evaluation-technique/${id}`)}
      >
        <Text style={[styles.buttonText, { color: '#ff00ff', textAlign: 'center' }]}>
          🎯 Évaluer la technique
        </Text>
      </Pressable>

      <Text style={styles.idLine}>ID joueur : #{id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 30,
    alignItems: 'center',
    minHeight: '100%',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  title: {
    fontSize: 26,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 30,
  },
  statsBlock: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  followUpBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  statsTitle: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  statLine: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  idLine: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#444',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 14,
  },
  suiviCard: {
    backgroundColor: '#292929',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  suiviText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 5,
  },
  suiviContenu: {
    color: '#fff',
    fontSize: 15,
  },
});
