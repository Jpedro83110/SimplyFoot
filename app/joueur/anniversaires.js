import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CalendrierAnniversaires from '../../components/CalendrierAnniversaires';
import { ActivityIndicator, View, ScrollView, Alert } from 'react-native';

export default function JoueurAnniversaires() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Utilisateur connecté
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error("Utilisateur non authentifié");

        // 2. Son entrée dans utilisateurs
        const { data: user, error: errorUser } = await supabase
          .from('utilisateurs')
          .select('id, joueur_id, club_id')
          .eq('id', userId)
          .single();
        if (errorUser || !user) throw new Error("Utilisateur introuvable.");

        // 3. Son entrée dans joueurs (pour equipe_id)
        const { data: joueur, error: errorJoueur } = await supabase
          .from('joueurs')
          .select('id, equipe_id')
          .eq('id', user.joueur_id)
          .single();
        if (errorJoueur || !joueur) throw new Error("Profil joueur introuvable.");

        // 4. Tous les joueurs de l'équipe
        const { data: joueurs } = await supabase
          .from('joueurs')
          .select('id, nom, prenom, date_naissance, photo_url, equipe_id')
          .eq('equipe_id', joueur.equipe_id);

        // 5. Tous les coachs de l'équipe dans la table STAFF
        const { data: coachs } = await supabase
          .from('staff')
          .select('id, nom, prenom, date_naissance, role, actif, club_id')
          .eq('role', 'coach')
          .eq('club_id', user.club_id)
          .eq('actif', true);

        // 6. (Optionnel) Président du club, si tu veux l'ajouter dans la liste
        // const { data: presidents } = await supabase
        //   .from('utilisateurs')
        //   .select('id, nom, prenom, date_naissance, role')
        //   .eq('role', 'president')
        //   .eq('club_id', user.club_id);

        // 7. Fusionne la liste
        let membres = [];
        if (joueurs) membres = membres.concat(joueurs.map(j => ({
          ...j,
          role: 'joueur',
          photo_url: j.photo_url || null,
        })));
        if (coachs) membres = membres.concat(coachs.map(c => ({
          ...c,
          photo_url: null, // Mets ici si tu ajoutes un champ photo dans staff
          role: 'coach',
        })));
        // if (presidents?.length) membres = membres.concat(presidents.map(p => ({ ...p, role: 'président' })));

        // 8. Filtrer ceux qui ont une date de naissance
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

  // Scroll général de la page
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#111417' }}>
      <CalendrierAnniversaires membres={membres} zoneInitiale="B" />
    </ScrollView>
  );
}
