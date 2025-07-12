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
    console.log('🔥🔥🔥 JOUEUR: Début fetchDemandes 🔥🔥🔥');

    // 1. Session user connecté
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log("🔥🔥🔥 JOUEUR: ERREUR session:", sessionError, '🔥🔥🔥');
      setLoading(false);
      return;
    }
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.log("🔥🔥🔥 JOUEUR: Pas d'utilisateur connecté 🔥🔥🔥");
      setLoading(false);
      return;
    }
    console.log('🔥🔥🔥 JOUEUR: User ID:', userId, '🔥🔥🔥');

    // 2. On récupère son joueur_id et son équipe
    const { data: user, error: userErr } = await supabase
      .from('utilisateurs')
      .select('joueur_id, prenom, nom')
      .eq('id', userId)
      .single();
      
    console.log('🔥🔥🔥 JOUEUR: Utilisateur récupéré:', user, '🔥🔥🔥');
    console.log('🔥🔥🔥 JOUEUR: Erreur utilisateur:', userErr, '🔥🔥🔥');
      
    if (userErr || !user?.joueur_id) {
      console.log("🔥🔥🔥 JOUEUR: Pas de joueur_id trouvé 🔥🔥🔥");
      setLoading(false);
      return;
    }
    
    setJoueur({ prenom: user.prenom, nom: user.nom });

    // 2.5. Récupérer l'équipe du joueur séparément
    const { data: joueurData, error: joueurErr } = await supabase
      .from('joueurs')
      .select('equipe_id')
      .eq('id', user.joueur_id)
      .single();

    console.log('🔥🔥🔥 JOUEUR: Joueur récupéré:', joueurData, '🔥🔥🔥');
    console.log('🔥🔥🔥 JOUEUR: Erreur joueur:', joueurErr, '🔥🔥🔥');
    
    if (joueurErr || !joueurData?.equipe_id) {
      console.log("🔥🔥🔥 JOUEUR: Joueur pas associé à une équipe 🔥🔥🔥");
      setLoading(false);
      return;
    }
    console.log('🔥🔥🔥 JOUEUR: Équipe ID:', joueurData.equipe_id, '🔥🔥🔥');

    // 3. Vérifier si le parent a signé la décharge pour accepter le transport
    const { data: decharge, error: dechargeErr } = await supabase
      .from('decharges_generales')
      .select('accepte_transport')
      .eq('joueur_id', user.joueur_id)
      .eq('accepte_transport', true)
      .single();

    console.log('🔥🔥🔥 JOUEUR: Décharge trouvée:', decharge, '🔥🔥🔥');
    console.log('🔥🔥🔥 JOUEUR: Erreur décharge:', dechargeErr, '🔥🔥🔥');

    if (!decharge) {
      console.log("🔥🔥🔥 JOUEUR: Parent n'a pas signé la décharge pour accepter le transport 🔥🔥🔥");
      setDemandes([]);
      setLoading(false);
      return;
    }

    // 4. Récupérer TOUTES les demandes de transport
    console.log('🔥🔥🔥 JOUEUR: Récupération de toutes les demandes 🔥🔥🔥');
    const { data: besoins, error: besoinErr } = await supabase
      .from('messages_besoin_transport')
      .select(`
        *,
        evenement:evenement_id (titre, date, heure, lieu)
      `)
      .order('created_at', { ascending: false });
    
    console.log('🔥🔥🔥 JOUEUR: Demandes récupérées:', besoins?.length || 0, '🔥🔥🔥');
    console.log('🔥🔥🔥 JOUEUR: Erreur demandes:', besoinErr, '🔥🔥🔥');
    
    if (besoinErr) {
      console.log("🔥🔥🔥 JOUEUR: ERREUR besoins:", besoinErr, '🔥🔥🔥');
      setLoading(false);
      return;
    }

    if (besoins && besoins.length > 0) {
      console.log('🔥🔥🔥 JOUEUR: Première demande:', besoins[0], '🔥🔥🔥');
    }

    // 5. Pour chaque demande, récupérer les infos du joueur et filtrer par équipe
    const demandesAvecJoueurs = await Promise.all(
      (besoins || []).map(async (demande) => {
        // Récupérer l'utilisateur (nom/prenom) et l'équipe du joueur
        const { data: utilisateur } = await supabase
          .from('utilisateurs')
          .select('nom, prenom')
          .eq('joueur_id', demande.joueur_id)
          .single();

        const { data: joueur } = await supabase
          .from('joueurs')
          .select('equipe_id')
          .eq('id', demande.joueur_id)
          .single();

        return {
          ...demande,
          utilisateur,
          joueur
        };
      })
    );

    console.log('🔥🔥🔥 JOUEUR: Demandes avec joueurs:', demandesAvecJoueurs.length, '🔥🔥🔥');

    // 6. Filtrer pour ne garder que les demandes de la même équipe
    const demandesEquipe = demandesAvecJoueurs.filter(demande => {
      const isMyTeam = demande.joueur?.equipe_id === joueurData.equipe_id;
      console.log('🔥🔥🔥 JOUEUR: Demande', demande.id, 'équipe:', demande.joueur?.equipe_id, 'vs mon équipe:', joueurData.equipe_id, 'match:', isMyTeam, '🔥🔥🔥');
      return isMyTeam;
    });

    console.log('🔥🔥🔥 JOUEUR: Demandes de mon équipe:', demandesEquipe.length, '🔥🔥🔥');

    // 7. Filtrer pour ne garder que les demandes d'aujourd'hui et futures
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('🔥🔥🔥 JOUEUR: Date aujourd\'hui:', todayStr, '🔥🔥🔥');

    const demandesFiltrees = demandesEquipe.filter(demande => {
      if (!demande.evenement || !demande.evenement.date) {
        console.log('🔥🔥🔥 JOUEUR: Demande sans événement ou date:', demande.id, '🔥🔥🔥');
        return false;
      }
      
      const eventDateStr = demande.evenement.date.slice(0, 10);
      const isFuture = eventDateStr >= todayStr;
      console.log('🔥🔥🔥 JOUEUR: Événement', demande.evenement.titre, 'date:', eventDateStr, 'vs aujourd\'hui:', todayStr, 'futur:', isFuture, '🔥🔥🔥');
      return isFuture;
    });

    console.log('🔥🔥🔥 JOUEUR: Demandes finales filtrées:', demandesFiltrees.length, '🔥🔥🔥');
    setDemandes(demandesFiltrees);
    setLoading(false);
  }

  return (
    <View style={styles.bg}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🚘 Demandes de transport - Équipe</Text>
        {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />}
        {!loading && demandes.length === 0 && (
          <Text style={styles.empty}>Aucune demande de transport à venir dans votre équipe.</Text>
        )}

        {demandes.map(demande => (
          <View key={demande.id} style={styles.card}>
            <Text style={styles.joueur}>
              👤 {demande.utilisateur?.prenom} {demande.utilisateur?.nom}
            </Text>
            
            {/* Affichage de l'événement associé */}
            {demande.evenement && (
              <Text style={styles.evenement}>
                🏟️ {demande.evenement.titre} — {demande.evenement.date}
                {demande.evenement.heure && ` à ${demande.evenement.heure}`}
                {demande.evenement.lieu && ` (${demande.evenement.lieu})`}
              </Text>
            )}
            
            <Text style={styles.info}>
              📍 Adresse : {demande.adresse_demande || 'Non précisée'} | 
              ⏰ Heure : {demande.heure_demande || 'Non précisée'}
            </Text>
            <Text style={styles.statut}>
              📊 Statut : <Text style={{ color: '#ffe44d' }}>{demande.etat || demande.statut}</Text>
            </Text>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => router.push(`/transport/demande/${demande.id}`)}
            >
              <Text style={{ color: '#111', fontWeight: 'bold' }}>Voir détails</Text>
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
  evenement: { color: '#fff', fontSize: 14, marginBottom: 8, fontWeight: '500' },
  info: { color: '#ccc', fontSize: 13, marginBottom: 4 },
  statut: { marginTop: 2, fontWeight: 'bold', color: '#fff' },
  detailBtn: { marginTop: 10, backgroundColor: GREEN, padding: 9, borderRadius: 8, alignItems: 'center' }
});