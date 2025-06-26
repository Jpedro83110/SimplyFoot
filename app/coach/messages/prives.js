import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import useCacheData from '../../../lib/cache';

export default function MessagesPrivesCoach() {
  const [coachId, setCoachId] = useState(null);
  const [equipes, setEquipes] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [selectedJoueur, setSelectedJoueur] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // ** Purge automatique supprimée **

  useEffect(() => {
    (async () => {
      const session = await supabase.auth.getSession();
      const userId = session.data.session.user.id;
      setCoachId(userId);

      const { data: eqs } = await supabase.from('equipes').select('*').eq('coach_id', userId);
      setEquipes(eqs || []);
    })();
  }, []);

  useEffect(() => {
    if (selectedEquipe) {
      supabase
        .from('joueurs')
        .select('id, prenom, nom')
        .eq('equipe_id', selectedEquipe)
        .then(({ data }) => setJoueurs(data || []));
    }
  }, [selectedEquipe]);

  // --- CACHE / FILTRAGE DES MESSAGES ---
  const cacheKey = selectedJoueur && coachId ? `messages_prives_${coachId}_${selectedJoueur}` : null;
  const [filMessages, refreshMessages, cacheLoading] = useCacheData(
    cacheKey,
    async () => {
      if (!coachId || !selectedJoueur) return [];
      const septJours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('messages_prives')
        .select('*')
        .or(`emetteur_id.eq.${coachId},recepteur_id.eq.${coachId}`)
        .order('created_at', { ascending: true });
      const messages = (data || []).filter(
        (msg) =>
          ((msg.emetteur_id === coachId && msg.recepteur_id === selectedJoueur) ||
            (msg.recepteur_id === coachId && msg.emetteur_id === selectedJoueur)) &&
          new Date(msg.created_at) >= new Date(septJours)
      );
      return messages || [];
    },
    30 // cache TTL 30 secondes
  );

  useEffect(() => {
    if (coachId && selectedJoueur) {
      setLoading(true);
      refreshMessages().then(() => setLoading(false));
    }
  }, [coachId, selectedJoueur]);

  const handleEnvoyer = async () => {
    if (!message.trim() || !selectedJoueur) return;

    await supabase.from('messages_prives').insert({
      emetteur_id: coachId,
      recepteur_id: selectedJoueur,
      auteur: 'coach',
      texte: message,
    });

    setMessage('');
    refreshMessages();
  };

  return (
    <ImageBackground
      source={require('../../../assets/messagerie-fond.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>📩 Message privé à un joueur</Text>

          <Text style={styles.label}>Sélectionne une équipe :</Text>
          <View style={styles.selectWrap}>
            {equipes.map((eq) => (
              <Pressable
                key={eq.id}
                onPress={() => {
                  setSelectedEquipe(eq.id);
                  setSelectedJoueur(null);
                }}
                style={[
                  styles.equipeButton,
                  selectedEquipe === eq.id && styles.equipeButtonSelected,
                ]}
              >
                <Text style={styles.equipeText}>{eq.nom}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Sélectionne un joueur :</Text>
          <View style={styles.selectWrap}>
            {joueurs.map((j) => (
              <Pressable
                key={j.id}
                onPress={() => setSelectedJoueur(j.id)}
                style={[
                  styles.equipeButton,
                  selectedJoueur === j.id && styles.equipeButtonSelected,
                ]}
              >
                <Text style={styles.equipeText}>{j.prenom} {j.nom}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.filContainer}>
            {(filMessages || []).map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bulle,
                  msg.auteur === 'coach' ? styles.coachMsg : styles.joueurMsg,
                ]}
              >
                <Text style={styles.texte}>{msg.texte}</Text>
                <Text style={styles.meta}>{new Date(msg.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Ton message..."
            placeholderTextColor="#777"
            multiline
            value={message}
            onChangeText={setMessage}
          />
          <Pressable onPress={handleEnvoyer} style={styles.bouton}>
            <Ionicons name="send" size={18} color="#111" />
            <Text style={styles.boutonText}>Envoyer</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: { fontSize: 22, color: '#00ff88', textAlign: 'center', marginBottom: 20 },
  label: { color: '#aaa', marginBottom: 6 },
  selectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  equipeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ff88',
    backgroundColor: '#1e1e1ecc',
  },
  equipeButtonSelected: { backgroundColor: '#00ff88' },
  equipeText: { color: '#fff', fontWeight: 'bold' },
  input: {
    backgroundColor: '#1e1e1ecc',
    borderColor: '#00ff88',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 10,
    height: 80,
  },
  bouton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  boutonText: { color: '#111', fontWeight: 'bold' },
  filContainer: { marginVertical: 20 },
  bulle: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  coachMsg: {
    backgroundColor: '#00ff8877',
    alignSelf: 'flex-end',
  },
  joueurMsg: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  texte: { color: '#fff' },
  meta: { color: '#aaa', fontSize: 11, marginTop: 4 },
});
