import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '@/hooks/useSession';
import { GetEvenementsByClubId, getEvenementsByClubId } from '@/helpers/evenements.helpers';

export default function EvenementsClub() {
    const [events, setEvents] = useState<GetEvenementsByClubId>([]);
    const [loading, setLoading] = useState(true);

    const { utilisateur } = useSession();

    const fetchClubEvents = useCallback(async () => {
        if (!utilisateur?.club_id) {
            return;
        }

        setLoading(true);

        const dataEvts = await getEvenementsByClubId({ clubId: utilisateur.club_id });
        setEvents(dataEvts);

        setLoading(false);
    }, [utilisateur?.club_id]);

    useEffect(() => {
        fetchClubEvents();
    }, [fetchClubEvents]);

    const getEmoji = (type: string | null) => {
        switch (type) {
            case 'repas':
                return '🍽️';
            case 'tournoi':
                return '🏆';
            case 'loisir':
                return '🎉';
            case 'reunion':
                return '📣';
            case 'autre':
                return '📌';
            default:
                return '📅';
        }
    };

    return (
        <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>📅 Événements du Club</Text>

                {loading ? (
                    <ActivityIndicator color="#00ff88" />
                ) : events.length === 0 ? (
                    <Text style={styles.noEvent}>Aucun événement prévu.</Text>
                ) : (
                    events.map((event) => (
                        <View key={event.id} style={styles.card}>
                            <Text style={styles.cardTitle}>
                                {getEmoji(event.type)} {event.titre}
                            </Text>
                            <Text style={styles.detailText}>📍 {event.lieu}</Text>
                            {event.date && (
                                <Text style={styles.detailText}>
                                    🕒 {event.date}
                                    {event.heure ? ` à ${event.heure}` : ''}
                                </Text>
                            )}
                            {event.description && (
                                <Text style={styles.detailText}>📝 {event.description}</Text>
                            )}
                            {event.utilisateurs && (
                                <Text style={styles.author}>
                                    👤 Ajouté par {event.utilisateurs.prenom}{' '}
                                    {event.utilisateurs.nom}
                                </Text>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20 },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#1e1e1e',
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    detailText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 4,
    },
    noEvent: {
        color: '#aaa',
        fontSize: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 36,
    },
    author: {
        color: '#8fd6ff',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 5,
    },
});
