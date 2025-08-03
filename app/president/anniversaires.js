import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CalendrierAnniversaires from '../../components/business/CalendrierAnniversaires';
import { ActivityIndicator, View, ScrollView, Alert } from 'react-native';

export default function PresidentAnniversaires() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Président connecté (utilisateur)
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error("Non authentifié.");

        // 2. On récupère le club_id du président connecté
        const { data: user } = await supabase
          .from('utilisateurs')
          .select('id, club_id')
          .eq('id', userId)
          .single();
        if (!user) throw new Error("Président introuvable.");

        // 3. Toutes les équipes du club
        const { data: equipes } = await supabase
          .from('equipes')
          .select('id')
          .eq('club_id', user.club_id);
        const equipeIds = equipes?.map(e => e.id) || [];

        // 4. Tous les joueurs du club (via leurs équipes)
        let joueurs = [];
        if (equipeIds.length) {
          const { data: jrs } = await supabase
            .from('joueurs')
            .select('id, nom, prenom, date_naissance, photo_url, equipe_id')
            .in('equipe_id', equipeIds);
          if (jrs) joueurs = jrs.map(j => ({ ...j, role: 'joueur' }));
        }

        // 5. Tous les coachs du club depuis STAFF
        const { data: coachs } = await supabase
          .from('staff')
          .select('id, nom, prenom, date_naissance, role, actif, club_id')
          .eq('role', 'coach')
          .eq('club_id', user.club_id)
          .eq('actif', true);

        // 6. (Optionnel) Tu peux récupérer d'autres rôles du staff ici

        // 7. Fusionne joueurs + coachs, filtre ceux qui ont une date_naissance
        let membres = [];
        if (joueurs.length) membres = membres.concat(joueurs);
        if (coachs) membres = membres.concat(coachs.map(c => ({
          ...c,
          photo_url: null, // Mets ici photo_url si tu l'ajoutes à staff
          role: 'coach',
        })));

        membres = membres.filter(m => !!m.date_naissance);

        setMembres(membres);
      } catch (e) {
        Alert.alert("Erreur", e.message || "Impossible de charger les anniversaires.");
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#14181b' }}>
        <ActivityIndicator color="#00ff88" size="large" />
      </View>
    );
  }

  // Scroll global pour page complète
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#111417' }}>
      <CalendrierAnniversaires membres={membres} zoneInitiale="B" />
    </ScrollView>
  );
}
