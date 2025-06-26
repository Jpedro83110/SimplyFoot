import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const GREEN = '#00ff88';

export default function BesoinTransportJoueur() {
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchDemandes();
  }, []);

  async function fetchDemandes() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return setLoading(false);

    // Trouver équipe du joueur connecté
    const { data: joueurData } = await supabase
      .from('joueurs')
      .select('id, equipe_id, prenom, nom')
      .eq('user_id', userId)
      .single();
    if (!joueurData) return setLoading(false);

    // Tous les joueurs de l'équipe
    const { data: equipeJoueurs } = await supabase
      .from('joueurs')
      .select('id, prenom, nom')
      .eq('equipe_id', joueurData.equipe_id);

    const joueursIds = (equipeJoueurs || []).map(j => j.id);

    // Seulement ceux qui ont la décharge transport
    const { data: decharges } = await supabase
      .from('decharges_generales')
      .select('joueur_id')
      .eq('accepte_transport', true)
      .in('joueur_id', joueursIds);

    const joueursAvecDecharge = (decharges || []).map(d => d.joueur_id);

    // Toutes les demandes (en attente ou en cours) des joueurs de l'équipe
    const { data: besoins } = await supabase
      .from('messages_besoin_transport')
      .select('*, joueur:joueur_id (prenom, nom), evenement:evenement_id (titre, date, heure)')
      .in('joueur_id', joueursAvecDecharge)
      .not('statut', 'eq', 'signe')
      .order('created_at', { ascending: false });

    // Pour chaque demande, on charge TOUTES les propositions liées
    let demandesAvecProps = [];
    for (let demande of (besoins || [])) {
      const { data: propositions } = await supabase
        .from('propositions_transport')
        .select('*, parent_proposeur:parent_proposeur_id(prenom, nom)')
        .eq('demande_id', demande.id);
      demandesAvecProps.push({ ...demande, propositions: propositions || [] });
    }

    setDemandes(demandesAvecProps);
    setLoading(false);
  }

  return (
    <View style={styles.bg}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🚘 Besoins de transport dans ton équipe</Text>
        {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />}
        {!loading && demandes.length === 0 && (
          <Text style={styles.empty}>Aucune demande de transport actuellement.</Text>
        )}

        {demandes.map(demande => (
          <View key={demande.id} style={styles.card}>
            <Text style={styles.joueur}>👤 {demande.joueur.prenom} {demande.joueur.nom}</Text>
            <Text style={styles.evenement}>🏟️ {demande.evenement.titre} — {demande.evenement.date} {demande.evenement.heure && `à ${demande.evenement.heure}`}</Text>
            <Text style={styles.info}>Adresse demandée : {demande.adresse_demande || 'Non précisée'}</Text>
            <Text style={styles.info}>Heure demandée : {demande.heure_demande || 'Non précisée'}</Text>

            {/* Affiche toutes les propositions reçues */}
            {demande.propositions.length > 0 && (
              <View style={styles.proposeBlock}>
                <Text style={{ color: '#ffe44d', fontWeight: 'bold' }}>Propositions :</Text>
                {demande.propositions.map(p => (
                  <View key={p.id} style={{ marginTop: 4 }}>
                    <Text style={styles.info}>🚗 Par {p.parent_proposeur?.prenom} {p.parent_proposeur?.nom} | Lieu : {p.lieu_rdv} | Heure : {p.heure_rdv}</Text>
                    {p.accepte && <Text style={{ color: '#0f0' }}>Acceptée ✅</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Bouton détail */}
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
  evenement: { color: '#fff', marginBottom: 4 },
  info: { color: '#ccc', fontSize: 13 },
  proposeBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#444' },
  detailBtn: { marginTop: 10, backgroundColor: GREEN, padding: 9, borderRadius: 8, alignItems: 'center' }
});
