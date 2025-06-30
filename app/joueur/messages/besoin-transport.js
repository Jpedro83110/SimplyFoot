import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
const GREEN = '#00ff88';

export default function BesoinTransportJoueur() {
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const [joueur, setJoueur] = useState(null);
  const router = useRouter();

  useEffect(() => { fetchDemandes(); }, []);

  async function fetchDemandes() {
    setLoading(true);

    // 1. Session user connecté
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log("ERREUR session:", sessionError);
      setLoading(false);
      return;
    }
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.log("Pas d'utilisateur connecté.");
      setLoading(false);
      return;
    }
    console.log("USER ID:", userId);

    // 2. On récupère son joueur_id dans utilisateurs
    const { data: user, error: userErr } = await supabase
      .from('utilisateurs')
      .select('joueur_id, prenom, nom')
      .eq('id', userId)
      .single();
    if (userErr || !user?.joueur_id) {
      console.log("UTILISATEUR TROUVÉ", user, userErr);
      setLoading(false);
      return;
    }
    setJoueur({ prenom: user.prenom, nom: user.nom });
    console.log("UTILISATEUR TROUVÉ:", user);

    // 3. Récupère toutes les demandes de transport liées à ce joueur
    const { data: besoins, error: besoinErr } = await supabase
      .from('messages_besoin_transport')
      .select('*')
      .eq('joueur_id', user.joueur_id)
      .order('created_at', { ascending: false });
    if (besoinErr) {
      console.log("ERREUR besoins:", besoinErr);
    }
    console.log('JOUEUR demandes:', besoins, besoinErr);
    setDemandes(besoins || []);
    setLoading(false);
  }

  return (
    <View style={styles.bg}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🚘 Mes besoins de transport</Text>
        {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />}
        {!loading && demandes.length === 0 && (
          <Text style={styles.empty}>Aucune demande de transport actuellement.</Text>
        )}

        {demandes.map(demande => (
          <View key={demande.id} style={styles.card}>
            <Text style={styles.joueur}>
              👤 {joueur?.prenom} {joueur?.nom}
            </Text>
            <Text style={styles.info}>
              Adresse : {demande.adresse_demande || 'Non précisée'} | Heure : {demande.heure_demande || 'Non précisée'}
            </Text>
            <Text style={styles.statut}>
              Statut : <Text style={{ color: '#ffe44d' }}>{demande.etat || demande.statut}</Text>
            </Text>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => router.push(`/transport/demande/${demande.id}`)}
            >
              <Text style={{ color: '#111', fontWeight: 'bold' }}>Détail / Proposer / Signer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#111' },
  container: { padding: 20 },
  title: { fontSize: 20, color: '#fff', marginBottom: 20, textAlign: 'center' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#222', padding: 16, borderRadius: 12, marginBottom: 16 },
  joueur: { fontSize: 16, fontWeight: 'bold', color: '#00ff88', marginBottom: 8 },
  info: { color: '#ccc', fontSize: 13 },
  statut: { marginTop: 2, fontWeight: 'bold' },
  detailBtn: { marginTop: 10, backgroundColor: GREEN, padding: 9, borderRadius: 8, alignItems: 'center' }
});
