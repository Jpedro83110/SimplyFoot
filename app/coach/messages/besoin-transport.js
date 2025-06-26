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
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

const GREEN = '#00ff88';

export default function BesoinTransportCoach() {
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const router = useRouter();

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages_besoin_transport')
        .select(
          `id, message, joueur_id, etat,
           joueurs (nom, prenom, date_naissance)`
        )
        .eq('etat', 'en_attente');

      if (error) {
        console.error('[COACH] Erreur besoins', error);
        Alert.alert('Erreur', "Impossible de récupérer les demandes.");
        setLoading(false);
        return;
      }

      console.log('[COACH] Demandes récupérées :', data);
      setDemandes(data);
    } catch (err) {
      console.error('[COACH] Erreur inconnue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🚐 Besoins de transport</Text>

      {loading ? (
        <ActivityIndicator size="large" color={GREEN} />
      ) : demandes.length === 0 ? (
        <Text style={styles.emptyText}>Aucune demande en attente</Text>
      ) : (
        demandes.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.name}>
              {item.joueurs?.prenom} {item.joueurs?.nom}
            </Text>
            <Text style={styles.age}>
              Né(e) le {new Date(item.joueurs?.date_naissance).toLocaleDateString()}
            </Text>
            <Text style={styles.message}>{item.message}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                Alert.alert("Proposition", "Tu veux proposer un transport ?");
              }}
            >
              <Text style={styles.buttonText}>Proposer un transport</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#121212',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    color: GREEN,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GREEN,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  age: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    marginVertical: 8,
  },
  button: {
    backgroundColor: GREEN,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
