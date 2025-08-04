import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CalendrierAnniversaires from '../../components/business/CalendrierAnniversaires';
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
                if (!userId) throw new Error('Utilisateur non authentifié');

                // 2. Son entrée dans utilisateurs
                const { data: user, error: errorUser } = await supabase
                    .from('utilisateurs')
                    .select('id, joueur_id, club_id')
                    .eq('id', userId)
                    .single();
                if (errorUser || !user) throw new Error('Utilisateur introuvable.');

                // 3. Son entrée dans joueurs (pour equipe_id)
                const { data: joueur, error: errorJoueur } = await supabase
                    .from('joueurs')
                    .select('id, equipe_id')
                    .eq('id', user.joueur_id)
                    .single();
                if (errorJoueur || !joueur) throw new Error('Profil joueur introuvable.');

                // 4. Tous les joueurs de l'équipe (avec photo)
                const { data: joueurs } = await supabase
                    .from('joueurs')
                    .select('id, nom, prenom, date_naissance, photo_profil_url')
                    .eq('equipe_id', joueur.equipe_id);

                // 5. Tous les coachs de l'équipe dans la table STAFF (avec photo_url)
                const { data: coachs } = await supabase
                    .from('staff')
                    .select('id, nom, prenom, date_naissance, role, actif, club_id, photo_url')
                    .eq('role', 'coach')
                    .eq('club_id', user.club_id)
                    .eq('actif', true);

                // 6. Président du club (pas de photo, juste initiales/avatars)
                const { data: presidents } = await supabase
                    .from('utilisateurs')
                    .select('id, nom, prenom, date_naissance, role')
                    .eq('role', 'president')
                    .eq('club_id', user.club_id);

                // 7. Fusionne la liste
                let membres = [];
                if (joueurs)
                    membres = membres.concat(
                        joueurs.map((j) => ({
                            ...j,
                            role: 'joueur',
                            photo_url: j.photo_profil_url || null,
                        })),
                    );
                if (coachs)
                    membres = membres.concat(
                        coachs.map((c) => ({
                            ...c,
                            role: 'coach',
                            photo_url: c.photo_url || null,
                        })),
                    );
                if (presidents)
                    membres = membres.concat(
                        presidents.map((p) => ({
                            ...p,
                            role: 'président',
                            photo_url: null, // On laisse null => affichera avatar initiales
                        })),
                    );

                // 8. Filtrer ceux qui ont une date de naissance
                membres = membres.filter((m) => !!m.date_naissance);

                setMembres(membres);
            } catch (e) {
                Alert.alert('Erreur', e.message || 'Impossible de charger les anniversaires.');
            }
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#14181b',
                }}
            >
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
