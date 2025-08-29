import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLOR_GREEN_300, YELLOW } from '@/utils/styleContants.utils';
import { useSession } from '@/hooks/useSession';
import { GetCoachEquipes, getCoachEquipes } from '@/helpers/equipes.helpers';
import {
    GetEquipeEvenementBesoinsTransport,
    getEquipeEvenementBesoinsTransport,
} from '@/helpers/evenements.helpers';

export default function BesoinTransportCoach() {
    const [loading, setLoading] = useState(true);
    const [equipes, setEquipes] = useState<GetCoachEquipes>([]);
    const [selectedEquipe, setSelectedEquipe] = useState<GetCoachEquipes[number] | null>(null);
    const [besoinsTransport, setBesoinsTransport] = useState<GetEquipeEvenementBesoinsTransport>(
        [],
    );

    const router = useRouter();
    const { utilisateur } = useSession();

    const fetchEquipes = useCallback(async () => {
        if (!utilisateur?.club_id || loading) {
            return;
        }

        setLoading(true);

        const fetchedEquipes = await getCoachEquipes({
            coachId: utilisateur.id,
            clubId: utilisateur.club_id,
        });

        setEquipes(fetchedEquipes);
        setLoading(false);
    }, [loading, utilisateur?.club_id, utilisateur?.id]);

    useEffect(() => {
        fetchEquipes();
    }, [fetchEquipes]);

    const fetchBesoinTransport = useCallback(async () => {
        if (!selectedEquipe?.id || loading) {
            return;
        }

        setLoading(true);

        const fetchedBesoinsTransport = await getEquipeEvenementBesoinsTransport({
            equipeId: selectedEquipe.id,
            since: new Date(),
        });

        setBesoinsTransport(fetchedBesoinsTransport);

        setLoading(false);
    }, [loading, selectedEquipe?.id]);

    useEffect(() => {
        fetchBesoinTransport();
    }, [selectedEquipe, fetchBesoinTransport]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={COLOR_GREEN_300} />
            </View>
        );
    }

    if (!selectedEquipe) {
        return (
            <ScrollView contentContainerStyle={styles.choixContainer}>
                <Text style={styles.title}>Sélectionne une équipe :</Text>
                {equipes.length === 0 ? (
                    <Text style={styles.emptyTitle}>Aucune équipe trouvée pour ce coach</Text>
                ) : (
                    equipes.map((equipe) => (
                        <TouchableOpacity
                            key={equipe.id}
                            style={styles.equipeBtn}
                            onPress={() => setSelectedEquipe(equipe)}
                        >
                            <FontAwesome5
                                name="users"
                                color={COLOR_GREEN_300}
                                size={18}
                                style={{ marginRight: 7 }}
                            />
                            <Text style={styles.equipeText}>
                                {equipe.categorie} — {equipe.nom}
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
                <Text style={{ color: COLOR_GREEN_300, fontWeight: 'bold' }}>
                    <Ionicons name="arrow-back" size={16} /> Revenir aux équipes
                </Text>
            </TouchableOpacity>
            <Text style={styles.title}>Demandes de transport — {selectedEquipe.categorie}</Text>
            <Text style={styles.subtitle}>Événements à venir nécessitant un transport</Text>

            {besoinsTransport.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Aucun événement à venir</Text>
                    <Text style={styles.emptySubtitle}>
                        Il n&apos;y a pas d&apos;événements futurs pour cette équipe
                    </Text>
                </View>
            ) : (
                besoinsTransport.map((besoinTransport) => (
                    <View key={besoinTransport.id} style={styles.eventBlock}>
                        <Text style={styles.eventTitle}>
                            <Ionicons name="calendar" size={15} color={YELLOW} />{' '}
                            {besoinTransport.titre || 'Événement'} — {besoinTransport.date} —{' '}
                            {besoinTransport.lieu || ''}
                        </Text>
                        {besoinTransport.messages_besoin_transport.length === 0 ? (
                            <Text style={styles.empty}>Aucune demande de transport</Text>
                        ) : (
                            besoinTransport.messages_besoin_transport.map(
                                (messageBesoinTransport) => (
                                    <View key={messageBesoinTransport.id} style={styles.card}>
                                        <Text style={styles.info}>
                                            <Ionicons
                                                name="person-circle-outline"
                                                size={16}
                                                color={COLOR_GREEN_300}
                                            />{' '}
                                            {messageBesoinTransport.utilisateurs?.prenom}{' '}
                                            {messageBesoinTransport.utilisateurs?.nom}
                                        </Text>
                                        {messageBesoinTransport.utilisateurs?.joueurs
                                            ?.decharges_generales &&
                                        messageBesoinTransport.utilisateurs?.joueurs
                                            ?.decharges_generales?.length > 0 ? (
                                            <Text style={styles.info}>
                                                <Ionicons
                                                    name="people-circle"
                                                    size={13}
                                                    color={YELLOW}
                                                />{' '}
                                                Parent :{' '}
                                                {
                                                    messageBesoinTransport.utilisateurs?.joueurs
                                                        ?.decharges_generales[0]?.parent_prenom
                                                }{' '}
                                                {
                                                    messageBesoinTransport.utilisateurs?.joueurs
                                                        ?.decharges_generales[0]?.parent_nom
                                                }
                                            </Text>
                                        ) : (
                                            <Text style={[styles.info, { color: '#aaa' }]}>
                                                <Ionicons
                                                    name="warning"
                                                    size={13}
                                                    color="#ff3e3e"
                                                />{' '}
                                                Pas de parent validé
                                            </Text>
                                        )}
                                        <Text style={styles.info}>
                                            <Ionicons name="home" size={13} color="#44d" />{' '}
                                            {messageBesoinTransport.adresse_demande}
                                            {'   '}
                                            <Ionicons name="time" size={13} color="#44d" />{' '}
                                            {messageBesoinTransport.heure_demande}
                                        </Text>
                                        <Text style={[styles.info, { marginTop: 2 }]}>
                                            <Ionicons
                                                name="information-circle"
                                                size={13}
                                                color="#ffe44d"
                                            />{' '}
                                            Statut :{' '}
                                            <Text style={{ color: YELLOW }}>
                                                {messageBesoinTransport.etat}
                                            </Text>
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.detailBtn}
                                            onPress={() =>
                                                router.push(
                                                    `/transport/demande/${messageBesoinTransport.id}`,
                                                )
                                            }
                                        >
                                            <Text style={{ color: '#111', fontWeight: 'bold' }}>
                                                Détail / Proposer / Signer
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ),
                            )
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
