// app/coach/transport.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function TransportManquant() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        Alert.alert("Erreur", "Impossible de récupérer l'utilisateur.");
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId && !email) return;

    async function fetchParticipants() {
      const { data, error } = await supabase
        .from('participations_evenement')
        .select('id, besoin_transport, joueur_id, evenement_id, transport_valide_par')
        .eq('besoin_transport', true)
        .is('transport_valide_par', null);

      if (error) {
        Alert.alert('Erreur', error.message);
        return;
      }

      const enriched = await Promise.all(
        data.map(async (p) => {
          const { data: joueurData } = await supabase
            .from('utilisateurs')
            .select('prenom, nom')
            .eq('id', p.joueur_id)
            .single();

          const { data: evt } = await supabase
            .from('evenements')
            .select('titre, date, heure, coach_id')
            .eq('id', p.evenement_id)
            .single();

          // Affiche tout pour admin, sinon filtre coach_id
          if (!evt || (email !== 'demo@simplyfoot.fr' && evt.coach_id !== userId)) return null;

          return {
            id: p.id,
            joueur: joueurData ? `${joueurData.prenom} ${joueurData.nom}` : 'Inconnu',
            evenement: evt ? `${evt.titre} - ${evt.date} à ${evt.heure}` : 'Evénement inconnu',
            besoin_transport: true,
          };
        })
      );

      setParticipants(enriched.filter(Boolean));
      setLoading(false);
    }
    fetchParticipants();
  }, [userId, email]);

  const prendreCharge = async (participation_id) => {
    const confirm = await supabase
      .from('participations_evenement')
      .update({ transport_valide_par: userId })
      .eq('id', participation_id);

    if (confirm.error) Alert.alert('Erreur', confirm.error.message);
    else {
      Alert.alert('✅ Confirmé', 'Transport pris en charge.');
      setParticipants((prev) => prev.filter((p) => p.id !== participation_id));
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚗 Enfants sans transport</Text>

      {participants.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.cardTitle}>{p.joueur}</Text>
          <Text style={styles.cardDetail}>📅 {p.evenement}</Text>

          <TouchableOpacity style={styles.button} onPress={() => prendreCharge(p.id)}>
            <Text style={styles.buttonText}>Je le prends en charge</Text>
          </TouchableOpacity>
        </View>
      ))}

      {participants.length === 0 && (
        <Text style={styles.empty}>Aucun joueur en attente de transport.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  cardDetail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});