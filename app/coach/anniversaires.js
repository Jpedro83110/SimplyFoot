import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CalendrierAnniversaires from '../../components/business/CalendrierAnniversaires';
import { ActivityIndicator, View, ScrollView, Alert } from 'react-native';

export default function CoachAnniversaires() {
    const [membres, setMembres] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Coach connecté (utilisateur)
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData?.user?.id;
                if (!userId) throw new Error('Utilisateur non authentifié');

                // 2. Son entrée dans utilisateurs (pour club_id)
                const { data: coachUser, error: errorCoachUser } = await supabase
                    .from('utilisateurs')
                    .select('id, nom, prenom, club_id')
                    .eq('id', userId)
                    .single();
                if (errorCoachUser || !coachUser) throw new Error('Coach introuvable.');

                // 3. Toutes les équipes où il est coach
                const { data: equipes, error: errorEquipes } = await supabase
                    .from('equipes')
                    .select('id')
                    .eq('coach_id', coachUser.id)
                    .eq('club_id', coachUser.club_id);

                if (errorEquipes || !equipes?.length) throw new Error('Aucune équipe trouvée.');

                const equipeIds = equipes.map((eq) => eq.id);

                // 4. Tous les joueurs de ces équipes
                const { data: joueurs } = await supabase
                    .from('joueurs')
                    .select('id, nom, prenom, date_naissance, photo_profil_url, equipe_id')
                    .in('equipe_id', equipeIds);

                // 5. Tous les coachs du club (table STAFF, avec photo_url)
                const { data: coachs } = await supabase
                    .from('staff')
                    .select('id, nom, prenom, date_naissance, role, actif, club_id, photo_url')
                    .eq('role', 'coach')
                    .eq('club_id', coachUser.club_id)
                    .eq('actif', true);

                // 6. Président du club (table utilisateurs, pas de photo)
                const { data: presidents } = await supabase
                    .from('utilisateurs')
                    .select('id, nom, prenom, date_naissance, role')
                    .eq('role', 'president')
                    .eq('club_id', coachUser.club_id);

                // 7. Fusionne tout
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
                            photo_url: null,
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

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#111417' }}>
            <CalendrierAnniversaires membres={membres} zoneInitiale="B" />
        </ScrollView>
    );
}
