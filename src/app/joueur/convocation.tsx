import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import {
    GetEvenementsInfosByUtilisateurId,
    getEvenementsInfosByUtilisateurId,
} from '@/helpers/evenements.helpers';
import { useSession } from '@/hooks/useSession';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';

dayjs.locale('fr'); // FIXME: mmmh ???

export default function ConvocationsJoueur() {
    const [loading, setLoading] = useState(false);
    const [evenementsInfos, setEvenementsInfos] =
        useState<GetEvenementsInfosByUtilisateurId | null>(null);

    const { utilisateur } = useSession();
    const router = useRouter();

    async function fetchConvocations(utilisateurId: string, clubId: string) {
        setLoading(true);

        try {
            const fetchedEvenementsInfos = await getEvenementsInfosByUtilisateurId({
                utilisateurId,
                clubId,
                since: new Date(),
            });

            setEvenementsInfos(fetchedEvenementsInfos);
        } catch (e) {
            console.error('💥 Erreur fetchConvocations:', e);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (!utilisateur?.club_id || loading || evenementsInfos) {
            return;
        }

        fetchConvocations(utilisateur.id, utilisateur.club_id);
    }, [evenementsInfos, loading, utilisateur?.id, utilisateur?.club_id]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
                <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
                    Chargement des convocations...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>📋 Mes Convocations</Text>

            {/* Debug info */}
            <Text style={styles.debugText}>
                {evenementsInfos?.length} convocation(s) trouvée(s)
            </Text>

            {evenementsInfos?.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucune convocation à venir.</Text>
                    <Text style={styles.emptySubtext}>
                        Vérifiez que votre coach a créé des événements et vous a convoqué.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={evenementsInfos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push(`/joueur/convocation/${item.id}`)}
                        >
                            <Text style={styles.cardTitle}>{item.titre}</Text>
                            <Text style={styles.cardText}>
                                📅 {dayjs(item.date).format('dddd D MMMM YYYY')} à {item.heure}
                            </Text>
                            <Text style={styles.cardText}>📍 {item.lieu}</Text>
                            {item.lieu_complement && (
                                <Text style={styles.cardComplement}>🏟️ {item.lieu_complement}</Text>
                            )}
                            <Text style={styles.cardType}>🏷️ {item.type}</Text>
                            {item.adversaires && (
                                <Text style={styles.cardAdversaires}>⚔️ vs {item.adversaires}</Text>
                            )}
                            {item.participations_evenement.length > 0 && (
                                <Text
                                    style={[
                                        styles.cardReponse,
                                        item.participations_evenement[0].reponse === 'present' && {
                                            color: COLOR_GREEN_300,
                                        },
                                        item.participations_evenement[0].reponse === 'absent' && {
                                            color: '#ff4444',
                                        },
                                        !item.participations_evenement[0].reponse && {
                                            color: '#ffaa00',
                                        },
                                    ]}
                                >
                                    {item.participations_evenement[0].reponse === 'present' &&
                                        '✅ Présent'}
                                    {item.participations_evenement[0].reponse === 'absent' &&
                                        '❌ Absent'}
                                    {!item.participations_evenement[0].reponse &&
                                        '❔ Pas encore répondu'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    debugText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        color: '#ccc',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#00ff88',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 4,
    },
    cardComplement: {
        color: '#8fd6ff',
        fontStyle: 'italic',
        fontSize: 14,
        marginBottom: 4,
    },
    cardType: {
        color: '#ffaa00',
        fontSize: 14,
        marginBottom: 4,
        fontWeight: '500',
    },
    cardAdversaires: {
        color: '#ff6b6b',
        fontSize: 14,
        marginBottom: 4,
        fontWeight: '500',
    },
    cardReponse: {
        marginTop: 8,
        fontWeight: 'bold',
        fontSize: 15,
    },
});
