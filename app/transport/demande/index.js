import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ListeDemandesTransport() {
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchDemandes();
  }, []);

  async function fetchDemandes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages_besoin_transport')
      .select(`
        *,
        utilisateur:joueur_id (prenom, nom),
        evenement:evenement_id (titre, date, heure),
        decharge:joueur_id (parent_prenom, parent_nom, accepte_transport)
      `)
      .not('etat', 'eq', 'signe')
      .order('created_at', { ascending: false });

    if (!error && data) setDemandes(data);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Demandes de transport</Text>
      {loading ? (
        <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />
      ) : demandes.length === 0 ? (
        <Text style={styles.empty}>Aucune demande de transport actuellement.</Text>
      ) : (
        <ScrollView>
          {demandes.map((demande) => (
            <TouchableOpacity
              key={demande.id}
              style={styles.card}
              onPress={() => router.push(`/transport/demande/${demande.id}`)}
            >
              <Ionicons name="person" size={22} color="#00ff88" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.joueur}>
                  {demande.utilisateur?.prenom} {demande.utilisateur?.nom}
                </Text>
                {/* Affichage du parent et décharge */}
                {demande.decharge && (
                  <Text style={styles.info}>
                    👪 Parent : {demande.decharge.parent_prenom} {demande.decharge.parent_nom}
                    {demande.decharge.accepte_transport
                      ? " (décharge acceptée)"
                      : " (décharge non signée)"}
                  </Text>
                )}
                <Text style={styles.evenement}>
                  🏟️ {demande.evenement?.titre} — {demande.evenement?.date} {demande.evenement?.heure && `à ${demande.evenement.heure}`}
                </Text>
                <Text style={styles.info}>
                  Adresse : {demande.adresse_demande || 'Non précisée'} | Heure : {demande.heure_demande || 'Non précisée'}
                </Text>
                <Text style={styles.statut}>
                  Statut : <Text style={{ color: '#ffe44d' }}>{demande.statut}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, color: '#00ff88', fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#222', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 14 },
  joueur: { fontSize: 16, fontWeight: 'bold', color: '#00ff88', marginBottom: 3 },
  evenement: { color: '#fff', marginBottom: 3 },
  info: { color: '#ccc', fontSize: 13 },
  statut: { marginTop: 2, fontWeight: 'bold' },
});
