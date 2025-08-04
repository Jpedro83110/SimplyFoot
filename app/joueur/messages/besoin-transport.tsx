import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getUtilisateurById } from '@/helpers/utilisateurs.helper';
import { Utilisateur } from '@/types/utilisateur';
import { COLOR_GREEN_300 } from '@/utils/styleContants.util';

export default function BesoinTransportJoueur() {
    const [loading, setLoading] = useState(true);
    const [demandes, setDemandes] = useState<any[]>([]); // FIXME
    const [joueur, setJoueur] = useState<Pick<Utilisateur, 'nom' | 'prenom'>>();
    const [monEquipeId, setMonEquipeId] = useState(null);
    const router = useRouter();

    async function fetchDemandes() {
        setLoading(true);
        console.log('🔥🔥🔥 JOUEUR: Début fetchDemandes 🔥🔥🔥');

        try {
            // 1. Session user connecté
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.log('🔥🔥🔥 JOUEUR: ERREUR session:', sessionError, '🔥🔥🔥');
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

            // 2. Récupérer les infos utilisateur
            const utilisateur = await getUtilisateurById(userId, [
                'id',
                'joueur_id',
                'prenom',
                'nom',
                'role',
            ]);

            console.log('🔥🔥🔥 JOUEUR: Utilisateur récupéré:', utilisateur, '🔥🔥🔥');

            if (utilisateur.role !== 'joueur') {
                console.log('🔥🔥🔥 JOUEUR: Utilisateur non joueur ou non trouvé 🔥🔥🔥');
                setLoading(false);
                return;
            }

            setJoueur(utilisateur);

            // 3. Récupérer l'équipe du joueur (si joueur_id existe)
            let equipeId = null;
            if (utilisateur.joueur_id) {
                const { data: joueurData } = await supabase
                    .from('joueurs')
                    .select('equipe_id')
                    .eq('id', utilisateur.joueur_id)
                    .single();

                console.log('🔥🔥🔥 JOUEUR: Joueur récupéré:', joueurData, '🔥🔥🔥');

                if (joueurData) {
                    equipeId = joueurData.equipe_id;
                    setMonEquipeId(equipeId);
                }
            }

            if (!equipeId) {
                console.log('🔥🔥🔥 JOUEUR: Joueur pas associé à une équipe 🔥🔥🔥');
                setDemandes([]);
                setLoading(false);
                return;
            }
            console.log('🔥🔥🔥 JOUEUR: Mon équipe ID:', equipeId, '🔥🔥🔥');

            // 4. Vérifier la décharge transport (utilise joueur_id de la table joueurs)
            if (utilisateur.joueur_id) {
                const { data: decharge } = await supabase
                    .from('decharges_generales')
                    .select('accepte_transport')
                    .eq('joueur_id', utilisateur.joueur_id)
                    .eq('accepte_transport', true)
                    .single();

                console.log('🔥🔥🔥 JOUEUR: Décharge trouvée:', decharge, '🔥🔥🔥');

                if (!decharge) {
                    console.log(
                        "🔥🔥🔥 JOUEUR: Parent n'a pas signé la décharge pour accepter le transport 🔥🔥🔥",
                    );
                    setDemandes([]);
                    setLoading(false);
                    return;
                }
            }

            // 5. Récupérer TOUTES les demandes de transport avec les événements
            console.log('🔥🔥🔥 JOUEUR: Récupération de toutes les demandes 🔥🔥🔥');
            const { data: besoins, error: besoinErr } = await supabase
                .from('messages_besoin_transport')
                .select(
                    `
          *,
          evenement:evenement_id (
            id,
            titre, 
            date, 
            heure, 
            lieu,
            equipe_id
          )
        `,
                )
                .order('created_at', { ascending: false });

            console.log('🔥🔥🔥 JOUEUR: Demandes récupérées:', besoins?.length || 0, '🔥🔥🔥');

            if (besoinErr) {
                console.log('🔥🔥🔥 JOUEUR: ERREUR besoins:', besoinErr, '🔥🔥🔥');
                setLoading(false);
                return;
            }

            if (besoins && besoins.length > 0) {
                console.log('🔥🔥🔥 JOUEUR: Première demande:', besoins[0], '🔥🔥🔥');
            }

            // 6. Pour chaque demande, récupérer les infos du joueur demandeur
            const demandesAvecJoueurs = await Promise.all(
                (besoins || []).map(async (demande) => {
                    console.log(
                        `🔥🔥🔥 JOUEUR: Traitement demande ${demande.id}, utilisateur_id: ${demande.utilisateur_id} 🔥🔥🔥`,
                    );

                    // 🎯 CORRECTION : demande.utilisateur_id = ID UTILISATEUR
                    const { data: utilisateur, error: userErr } = await supabase
                        .from('utilisateurs')
                        .select('id, nom, prenom, joueur_id')
                        .eq('id', demande.utilisateur_id) // Chercher par ID utilisateur
                        .single();

                    console.log(
                        `🔥🔥🔥 JOUEUR: Utilisateur trouvé:`,
                        utilisateur,
                        'erreur:',
                        userErr,
                        '🔥🔥🔥',
                    );

                    // Récupérer l'équipe via l'utilisateur
                    let joueurEquipe = null;
                    if (utilisateur?.joueur_id) {
                        const { data: joueurData } = await supabase
                            .from('joueurs')
                            .select('equipe_id')
                            .eq('id', utilisateur.joueur_id)
                            .single();
                        joueurEquipe = joueurData;
                    }

                    console.log(`🔥🔥🔥 JOUEUR: Équipe du demandeur:`, joueurEquipe, '🔥🔥🔥');

                    return {
                        ...demande,
                        utilisateur,
                        joueur: joueurEquipe,
                    };
                }),
            );

            console.log(
                '🔥🔥🔥 JOUEUR: Demandes avec joueurs:',
                demandesAvecJoueurs.length,
                '🔥🔥🔥',
            );

            // 7. Filtrer pour ne garder que les demandes de la même équipe
            const demandesEquipe = demandesAvecJoueurs.filter((demande) => {
                // Filtrer par équipe de l'événement OU par équipe du joueur demandeur
                const eventEquipeId = demande.evenement?.equipe_id;
                const joueurEquipeId = demande.joueur?.equipe_id;

                const isMyTeamEvent = eventEquipeId === equipeId;
                const isMyTeamPlayer = joueurEquipeId === equipeId;
                const isMyTeam = isMyTeamEvent || isMyTeamPlayer;

                console.log(
                    `🔥🔥🔥 JOUEUR: Demande ${demande.id}:`,
                    {
                        eventEquipeId,
                        joueurEquipeId,
                        monEquipeId: equipeId,
                        isMyTeamEvent,
                        isMyTeamPlayer,
                        isMyTeam,
                    },
                    '🔥🔥🔥',
                );

                return isMyTeam;
            });

            console.log('🔥🔥🔥 JOUEUR: Demandes de mon équipe:', demandesEquipe.length, '🔥🔥🔥');

            // 8. Filtrer pour ne garder que les demandes d'aujourd'hui et futures
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            console.log("🔥🔥🔥 JOUEUR: Date aujourd'hui:", todayStr, '🔥🔥🔥');

            const demandesFiltrees = demandesEquipe.filter((demande) => {
                if (!demande.evenement || !demande.evenement.date) {
                    console.log(
                        '🔥🔥🔥 JOUEUR: Demande sans événement ou date:',
                        demande.id,
                        '🔥🔥🔥',
                    );
                    return false;
                }

                const eventDateStr = demande.evenement.date.slice(0, 10);
                const isFuture = eventDateStr >= todayStr;
                console.log(
                    '🔥🔥🔥 JOUEUR: Événement',
                    demande.evenement.titre,
                    'date:',
                    eventDateStr,
                    "vs aujourd'hui:",
                    todayStr,
                    'futur:',
                    isFuture,
                    '🔥🔥🔥',
                );
                return isFuture;
            });

            console.log(
                '🔥🔥🔥 JOUEUR: Demandes finales filtrées:',
                demandesFiltrees.length,
                '🔥🔥🔥',
            );
            setDemandes(demandesFiltrees);
        } catch (error) {
            console.error('🔥🔥🔥 JOUEUR: Erreur générale:', error, '🔥🔥🔥');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDemandes();
    }, []);

    return (
        <View style={styles.bg}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>🚘 Demandes de transport - Équipe</Text>

                {/* Debug info */}
                {joueur && (
                    <Text style={styles.debug}>
                        👤 {joueur.prenom} {joueur.nom} | Équipe: {monEquipeId || 'Aucune'}
                    </Text>
                )}

                {loading && <ActivityIndicator color={COLOR_GREEN_300} style={{ marginTop: 40 }} />}

                {!loading && demandes.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.empty}>
                            Aucune demande de transport à venir dans votre équipe.
                        </Text>
                        <Text style={styles.emptyInfo}>
                            Les demandes apparaissent quand :{'\n'}• Vous êtes dans la même équipe
                            que le demandeur
                            {'\n'}• L&apos;événement est dans le futur
                            {'\n'}• Vous avez signé la décharge transport
                        </Text>
                    </View>
                )}

                {demandes.map((demande) => (
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
                            📍 Adresse : {demande.adresse_demande || 'Non précisée'} | ⏰ Heure :{' '}
                            {demande.heure_demande || 'Non précisée'}
                        </Text>
                        <Text style={styles.statut}>
                            📊 Statut :{' '}
                            <Text
                                style={{
                                    color:
                                        demande.etat === 'en_attente'
                                            ? '#ffe44d'
                                            : demande.etat === 'proposition_faite'
                                              ? COLOR_GREEN_300
                                              : demande.etat === 'signe'
                                                ? COLOR_GREEN_300
                                                : '#ffe44d',
                                }}
                            >
                                {demande.etat || demande.statut}
                            </Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.detailBtn}
                            onPress={() => router.push(`/transport/demande/${demande.id}`)}
                        >
                            <Text style={{ color: '#111', fontWeight: 'bold' }}>
                                Voir détails & Signer
                            </Text>
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
    title: { fontSize: 20, color: '#fff', marginBottom: 10, textAlign: 'center' },
    debug: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 20,
    },
    empty: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 10,
    },
    emptyInfo: {
        color: '#666',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#222',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
    },
    joueur: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        marginBottom: 8,
    },
    evenement: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    info: {
        color: '#ccc',
        fontSize: 13,
        marginBottom: 4,
    },
    statut: {
        marginTop: 2,
        fontWeight: 'bold',
        color: '#fff',
    },
    detailBtn: {
        marginTop: 10,
        backgroundColor: COLOR_GREEN_300,
        padding: 9,
        borderRadius: 8,
        alignItems: 'center',
    },
});
