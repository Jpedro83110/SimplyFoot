import { FC, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDateForDisplay } from '@/utils/date.utils';
import { GetEvenementInfosById, getEvenementInfosById } from '@/helpers/evenements.helpers';
import { ParticipationsEvenementReponse } from '@/types/participationsEvenement.types';

type ConvocationDetailParams = {
    id: string;
};

export default function ConvocationDetail() {
    const { id } = useLocalSearchParams<ConvocationDetailParams>();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<GetEvenementInfosById | null>(null);

    const presents = useMemo(
        () =>
            event?.participations_evenement.filter(
                (participation) => participation.reponse === ParticipationsEvenementReponse.PRESENT,
            ) || [],
        [event],
    );

    const absents = useMemo(
        () =>
            event?.participations_evenement.filter(
                (participation) => participation.reponse === ParticipationsEvenementReponse.ABSENT,
            ) || [],
        [event],
    );

    const sansReponse = useMemo(
        () =>
            event?.participations_evenement.filter((participation) => !participation.reponse) || [],
        [event],
    );

    const nbBesoinTransport = useMemo(
        () =>
            event?.participations_evenement.filter(
                (participation) => participation.besoin_transport,
            ).length,
        [event],
    );

    const nbPrisEnCharge = useMemo(
        () =>
            event?.participations_evenement.filter(
                (participation) =>
                    participation.besoin_transport && participation.transport_valide_par,
            ).length,
        [event],
    );

    useEffect(() => {
        async function fetchData() {
            if (loading) {
                return;
            }

            setLoading(true);

            try {
                const fetchedEvenements = await getEvenementInfosById({
                    evenementId: id,
                });

                setEvent(fetchedEvenements);
            } catch (error) {
                console.error('🏆 COACH: Erreur lors du chargement des données:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, loading]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center' }}>
                <ActivityIndicator color="#00ff88" style={{ marginTop: 40 }} />
                <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
                    Chargement des réponses...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#121212' }}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Convocation : {event?.titre || ''}</Text>
                {event && (
                    <Text style={styles.info}>
                        📅 {formatDateForDisplay({ date: event.date })}{' '}
                        {event.heure ? 'à ' + event.heure : ''} - 📍 {event.lieu}
                    </Text>
                )}

                <View style={styles.statsRecap}>
                    <View style={styles.statItem}>
                        <Text style={styles.statsPresent}>
                            ✅ Présents : {presents?.length || 0}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statsAbsent}>❌ Absents : {absents?.length || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statsSansReponse}>
                            ❔ Sans réponse : {sansReponse?.length || 0}
                        </Text>
                    </View>
                </View>
                <View style={styles.statsTransport}>
                    <Text style={styles.statsTransportText}>
                        🚗 Besoin transport : {nbBesoinTransport} | Pris en charge :{' '}
                        {nbPrisEnCharge}
                    </Text>
                </View>

                {/* Présents */}
                <Section title="✅ Présents" participations={presents} showTransport />
                {/* Absents */}
                <Section title="❌ Absents" participations={absents} />
                {/* Sans réponse */}
                <Section title="❔ Sans réponse" participations={sansReponse} />
            </ScrollView>
        </View>
    );
}

interface SectionProps {
    title: string;
    participations: GetEvenementInfosById['participations_evenement'];
    showTransport?: boolean;
}

// Section d'affichage de chaque liste
const Section: FC<SectionProps> = ({ title, participations, showTransport = false }) => {
    const router = useRouter();

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!participations || participations.length === 0 ? (
                <Text style={styles.empty}>Aucun joueur</Text>
            ) : (
                participations.map((participation) => (
                    <View key={participation.id} style={styles.card}>
                        <Text style={styles.cardName}>
                            {participation.utilisateurs?.prenom} {participation.utilisateurs?.nom}
                        </Text>
                        <Text style={styles.cardPoste}>
                            Poste : {participation.utilisateurs?.joueurs?.poste || 'NC'}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 12 }}>
                            Email : {participation.utilisateurs?.email || '-'}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 12 }}>
                            Tél : {participation.utilisateurs?.telephone || '-'}
                        </Text>
                        {showTransport &&
                            participation.besoin_transport &&
                            !participation.transport_valide_par && (
                                <View style={styles.transportInfo}>
                                    <Text>🚗 Besoin de transport</Text>
                                    <TouchableOpacity
                                        style={styles.transportButton}
                                        onPress={() =>
                                            router.push('/coach/messages/besoin-transport')
                                        }
                                    >
                                        <Text style={styles.transportButtonText}>Gérer</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        {showTransport &&
                            participation.besoin_transport &&
                            participation.transport_valide_par && (
                                <View style={styles.transportSuccess}>
                                    <Text style={styles.transportSuccessText}>
                                        ✅ Pris en charge
                                        {participation.lieu_rdv
                                            ? ` — ${participation.lieu_rdv} à ${participation.heure_rdv}`
                                            : ''}
                                    </Text>
                                </View>
                            )}
                    </View>
                ))
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: Platform.OS === 'web' ? 24 : 20,
        ...(Platform.OS === 'web' && {
            maxWidth: 800,
            alignSelf: 'center',
            width: '100%',
        }),
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 10,
    },
    info: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 5 },
    section: { marginBottom: 30 },
    sectionTitle: { color: '#00ff88', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: Platform.OS === 'web' ? 16 : 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        ...(Platform.OS === 'web' && {
            maxWidth: '100%',
            minWidth: 300,
        }),
    },
    cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cardPoste: { color: '#aaa', marginBottom: 8 },
    transportInfo: {
        backgroundColor: '#ffa500',
        padding: 10,
        borderRadius: 6,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ff8c00',
    },
    transportButton: {
        backgroundColor: '#ff8c00',
        padding: 6,
        borderRadius: 4,
        marginTop: 4,
        alignItems: 'center',
    },
    transportButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    transportSuccess: {
        backgroundColor: '#00ff88',
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    transportSuccessText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    empty: { color: '#888', fontStyle: 'italic' },
    statsRecap: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: Platform.OS === 'web' ? 'space-around' : 'center',
        marginVertical: 14,
        backgroundColor: '#191e1c',
        borderRadius: 10,
        padding: Platform.OS === 'web' ? 10 : 12,
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    statItem: {
        alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
        marginBottom: Platform.OS === 'web' ? 0 : 8,
    },
    statsPresent: {
        color: '#00ff88',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'web' ? 15 : 16,
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    statsAbsent: {
        color: '#ff3e60',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'web' ? 15 : 16,
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    statsSansReponse: {
        color: '#ffe44d',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'web' ? 15 : 16,
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
    },
    statsTransport: { alignItems: 'center', marginBottom: 14 },
    statsTransportText: { color: '#0ff', fontSize: 14, fontWeight: 'bold' },
});
