import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

const GREEN = '#00ff88';
const YELLOW = '#ffe44d';

export default function BesoinTransportCoach() {
    const [loading, setLoading] = useState(true);
    const [equipes, setEquipes] = useState([]);
    const [selectedEquipe, setSelectedEquipe] = useState(null);
    const [evenements, setEvenements] = useState([]);
    const [demandesParEvenement, setDemandesParEvenement] = useState({});
    const router = useRouter();

    // 1. Liste des équipes coachées
    useEffect(() => {
        (async () => {
            setLoading(true);
            const session = await supabase.auth.getSession();
            const userId = session.data.session.user.id;

            const { data: eqs, error } = await supabase
                .from('equipes')
                .select('*')
                .eq('coach_id', userId);

            setEquipes(eqs || []);
            setLoading(false);
        })();
    }, []);

    // 2. Quand une équipe est sélectionnée, charge les événements + demandes de transport
    useEffect(() => {
        if (!selectedEquipe) return;

        (async () => {
            setLoading(true);

            // Obtenir la date d'aujourd'hui
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD

            // Récupérer TOUS les événements de l'équipe d'abord
            const { data: allEvents, error: eventsError } = await supabase
                .from('evenements')
                .select('*')
                .eq('equipe_id', selectedEquipe.id)
                .order('date', { ascending: true });

            if (allEvents && allEvents.length > 0) {
                // Filtrer côté client pour plus de contrôle
                const filteredEvents = allEvents.filter((evt) => {
                    const eventDateStr = evt.date.slice(0, 10);
                    return eventDateStr >= todayStr;
                });

                setEvenements(filteredEvents);

                // Pour chaque événement, on récupère les demandes associées
                let demandesMap = {};
                for (let evt of filteredEvents) {
                    const { data: demandes, error: demandesError } = await supabase
                        .from('messages_besoin_transport')
                        .select('*')
                        .eq('evenement_id', evt.id);

                    demandesMap[evt.id] = await Promise.all(
                        (demandes || []).map(async (d) => {
                            // Joueur
                            const { data: user } = await supabase
                                .from('utilisateurs')
                                .select('prenom, nom')
                                .eq('id', d.joueur_id)
                                .single();
                            // Parent demandeur (via décharge)
                            const { data: decharge } = await supabase
                                .from('decharges_generales')
                                .select('parent_prenom, parent_nom, accepte_transport')
                                .eq('joueur_id', d.joueur_id)
                                .eq('accepte_transport', true)
                                .single();

                            return {
                                ...d,
                                joueur_prenom: user?.prenom || '',
                                joueur_nom: user?.nom || '',
                                parent_prenom: decharge?.parent_prenom || '',
                                parent_nom: decharge?.parent_nom || '',
                                hasParent: !!decharge,
                            };
                        }),
                    );
                }

                setDemandesParEvenement(demandesMap);
            } else {
                setEvenements([]);
                setDemandesParEvenement({});
            }

            setLoading(false);
        })();
    }, [selectedEquipe]);

    if (loading)
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={GREEN} />
            </View>
        );

    // --- Écran 1 : Choix équipe ---
    if (!selectedEquipe) {
        return (
            <ScrollView contentContainerStyle={styles.choixContainer}>
                <Text style={styles.title}>Sélectionne une équipe :</Text>
                {equipes.length === 0 ? (
                    <Text style={styles.emptyTitle}>Aucune équipe trouvée pour ce coach</Text>
                ) : (
                    equipes.map((eq) => (
                        <TouchableOpacity
                            key={eq.id}
                            style={styles.equipeBtn}
                            onPress={() => setSelectedEquipe(eq)}
                        >
                            <FontAwesome5
                                name="users"
                                color={GREEN}
                                size={18}
                                style={{ marginRight: 7 }}
                            />
                            <Text style={styles.equipeText}>
                                {eq.categorie} — {eq.nom}
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={19}
                                color={YELLOW}
                                style={{ marginLeft: 7 }}
                            />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        );
    }

    // --- Écran 2 : Liste par événement ---
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedEquipe(null)}>
                <Text style={{ color: GREEN, fontWeight: 'bold' }}>
                    <Ionicons name="arrow-back" size={16} /> Revenir aux équipes
                </Text>
            </TouchableOpacity>
            <Text style={styles.title}>Demandes de transport — {selectedEquipe.categorie}</Text>
            <Text style={styles.subtitle}>Événements à venir nécessitant un transport</Text>

            {evenements.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Aucun événement à venir</Text>
                    <Text style={styles.emptySubtitle}>
                        Il n'y a pas d'événements futurs pour cette équipe
                    </Text>
                </View>
            ) : (
                evenements.map((evt) => (
                    <View key={evt.id} style={styles.eventBlock}>
                        <Text style={styles.eventTitle}>
                            <Ionicons name="calendar" size={15} color={YELLOW} />{' '}
                            {evt.titre || 'Événement'} — {evt.date} — {evt.lieu || ''}
                        </Text>
                        {(demandesParEvenement[evt.id] || []).length === 0 ? (
                            <Text style={styles.empty}>Aucune demande de transport</Text>
                        ) : (
                            (demandesParEvenement[evt.id] || []).map((d) => (
                                <View key={d.id} style={styles.card}>
                                    <Text style={styles.info}>
                                        <Ionicons
                                            name="person-circle-outline"
                                            size={16}
                                            color={GREEN}
                                        />{' '}
                                        {d.joueur_prenom} {d.joueur_nom}
                                    </Text>
                                    {d.hasParent ? (
                                        <Text style={styles.info}>
                                            <Ionicons
                                                name="people-circle"
                                                size={13}
                                                color={YELLOW}
                                            />{' '}
                                            Parent : {d.parent_prenom} {d.parent_nom}
                                        </Text>
                                    ) : (
                                        <Text style={[styles.info, { color: '#aaa' }]}>
                                            <Ionicons name="warning" size={13} color="#ff3e3e" />{' '}
                                            Pas de parent validé
                                        </Text>
                                    )}
                                    <Text style={styles.info}>
                                        <Ionicons name="home" size={13} color="#44d" />{' '}
                                        {d.adresse_demande}
                                        {'   '}
                                        <Ionicons name="time" size={13} color="#44d" />{' '}
                                        {d.heure_demande}
                                    </Text>
                                    <Text style={[styles.info, { marginTop: 2 }]}>
                                        <Ionicons
                                            name="information-circle"
                                            size={13}
                                            color="#ffe44d"
                                        />{' '}
                                        Statut : <Text style={{ color: YELLOW }}>{d.etat}</Text>
                                    </Text>
                                    {/* **Le coach peut cliquer pour interagir/proposer** */}
                                    <TouchableOpacity
                                        style={styles.detailBtn}
                                        onPress={() => router.push(`/transport/demande/${d.id}`)}
                                    >
                                        <Text style={{ color: '#111', fontWeight: 'bold' }}>
                                            Détail / Proposer / Signer
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    choixContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#101417',
        minHeight: '100%',
    },
    container: { padding: 16, backgroundColor: '#101417', minHeight: '100%' },
    title: {
        fontSize: 22,
        color: '#00ff88',
        fontWeight: 'bold',
        marginVertical: 16,
        textAlign: 'center',
    },
    subtitle: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    equipeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderColor: '#00ff88',
        borderWidth: 2,
        padding: 18,
        borderRadius: 16,
        marginVertical: 10,
        width: 220,
        justifyContent: 'center',
    },
    equipeText: { color: '#00ff88', fontWeight: 'bold', fontSize: 20 },
    backBtn: {
        marginBottom: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    eventBlock: { marginTop: 22, marginBottom: 10 },
    eventTitle: { color: '#ffe44d', fontWeight: 'bold', fontSize: 17, marginBottom: 10 },
    empty: { color: '#aaa', fontStyle: 'italic', marginBottom: 10 },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        padding: 20,
    },
    emptyTitle: {
        color: '#888',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#181f22',
        borderRadius: 10,
        marginBottom: 10,
        padding: 12,
        borderColor: '#00ff88',
        borderWidth: 1,
    },
    info: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailBtn: {
        marginTop: 8,
        backgroundColor: '#00ff88',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
});
