import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TextInput, Pressable, Alert, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

export default function MessagesGroupesJoueur() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reponses, setReponses] = useState({});
  const [reponseText, setReponseText] = useState({});
  const [joueurId, setJoueurId] = useState(null);
  const [equipeId, setEquipeId] = useState(null);

  // Purge tous les messages de groupe de +7j à chaque ouverture
  useEffect(() => {
    const purgeOldMessagesGroupe = async () => {
      const septJours = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      await supabase
        .from('messages_groupe_coach')
        .delete()
        .lt('created_at', septJours);
    };
    purgeOldMessagesGroupe();
  }, []);

  useEffect(() => {
    async function fetchInfos() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session.user.id;
      setJoueurId(userId);

      const { data: user } = await supabase.from('utilisateurs').select('joueur_id').eq('id', userId).single();
      if (!user?.joueur_id) return;
      const { data: joueur } = await supabase.from('joueurs').select('equipe_id').eq('id', user.joueur_id).single();
      setEquipeId(joueur?.equipe_id);

      fetchMessages(joueur?.equipe_id);
    }
    fetchInfos();
  }, []);

  const fetchMessages = async (equipeId) => {
    const septJours = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const { data: msgs } = await supabase
      .from('messages_groupe_coach')
      .select('*')
      .eq('equipe_id', equipeId)
      .gte('created_at', septJours)
      .order('created_at', { ascending: true });
    setMessages(msgs || []);
    setLoading(false);

    if (msgs && msgs.length) {
      const { data: reps } = await supabase
        .from('reponses_messages_joueur')
        .select('*')
        .in('message_id', msgs.map(m => m.id))
        .order('created_at', { ascending: true });
      const regroupees = {};
      for (let rep of reps || []) {
        if (!regroupees[rep.message_id]) regroupees[rep.message_id] = [];
        regroupees[rep.message_id].push(rep);
      }
      setReponses(regroupees);
    }
  };

  const envoyerReponse = async (msgId) => {
    const contenu = reponseText[msgId];
    if (!contenu || !contenu.trim()) return;
    const session = await supabase.auth.getSession();
    const joueurId = session.data.session.user.id;

    const { error } = await supabase.from('reponses_messages_joueur').insert({
      message_id: msgId,
      joueur_id: joueurId,
      texte: contenu,
      auteur: 'joueur',
    });

    if (!error) {
      setReponseText((prev) => ({ ...prev, [msgId]: '' }));
      fetchMessages(equipeId);
    } else {
      Alert.alert("Erreur", error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00ff88" size="large" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../assets/messagerie-fond.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient colors={["#0a0a0acc", "#0f0f0fcc"]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>💬 Messages de groupe</Text>
          {messages.length === 0 && (
            <Text style={styles.noMessages}>Aucun message de groupe pour ton équipe.</Text>
          )}
          {messages.map((msg) => (
            <View key={msg.id} style={styles.card}>
              <Text style={styles.messageTitle}>{msg.titre}</Text>
              <Text style={styles.messageContent}>{msg.contenu}</Text>
              <Text style={styles.messageMeta}>
                📅 {new Date(msg.created_at).toLocaleString()}
              </Text>
              {reponses[msg.id]?.map((rep, i) => (
                <Text key={i} style={styles.reponse}>
                  {rep.auteur === 'joueur' ? '🧑‍🎓' : '🧑‍🏫'} {rep.texte}
                </Text>
              ))}
              <TextInput
                placeholder="Répondre à tous..."
                placeholderTextColor="#777"
                value={reponseText[msg.id] || ''}
                onChangeText={(txt) =>
                  setReponseText((prev) => ({ ...prev, [msg.id]: txt }))
                }
                style={styles.input}
              />
              <Pressable onPress={() => envoyerReponse(msg.id)} style={styles.bouton}>
                <Ionicons name="send" size={18} color="#111" />
                <Text style={styles.boutonText}>Répondre</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 20,
  },
  noMessages: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  messageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  messageContent: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 6,
  },
  messageMeta: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  reponse: { color: '#00ff88', fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: '#1e1e1e',
    borderColor: '#00ff88',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 10,
  },
  bouton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  boutonText: { color: '#111', fontWeight: 'bold' },
});
