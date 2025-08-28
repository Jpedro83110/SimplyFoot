import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import {
    deleteEvenementById,
    GetCoachEvenements,
    getCoachEvenements,
} from '@/helpers/evenements.helpers';
import { useSession } from '@/hooks/useSession';

dayjs.locale('fr');

export default function ConvocationsList() {
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<GetCoachEvenements>([]);
    const router = useRouter();

    const { utilisateur } = useSession();

    const fetchEvents = useCallback(async () => {
        if (!utilisateur?.id || loading) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const fetchedEvenementsList = await getCoachEvenements({
            coachId: utilisateur.id,
            since: new Date(),
        });

        setEvents(fetchedEvenementsList);
        setLoading(false);
    }, [loading, utilisateur?.id]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // SUPPRESSION événement + participations
    const handleDelete = (evenementId: string) => {
        const confirmMsg = 'Supprimer définitivement cet événement et toutes ses participations ?';
        if (Platform.OS === 'web') {
            if (!window.confirm(confirmMsg)) {
                return;
            }

            doDelete(evenementId);
        } else {
            Alert.alert("Supprimer l'événement", confirmMsg, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => doDelete(evenementId) },
            ]);
        }
    };

    const doDelete = async (evenementId: string) => {
        setLoading(true);
        await deleteEvenementById({ evenementId });
        setEvents((prev) => prev.filter((e) => e.id !== evenementId));
        setLoading(false);
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Convocations à venir ({events.length})</Text>
            {events.length === 0 && <Text style={styles.noEvents}>Aucun événement à venir.</Text>}
            {events.map((event) => (
                <View key={event.id} style={styles.card}>
                    <TouchableOpacity
                        onPress={() => router.push(`/coach/convocation/${event.id}`)}
                        style={{ flex: 1 }}
                    >
                        <Text style={styles.eventTitle}>
                            {event.titre} — {dayjs(event.date).format('dddd D MMMM YYYY')}
                        </Text>
                        <Text style={styles.eventInfo}>
                            ⏰ {event.heure} - 📍 {event.lieu}
                        </Text>
                        {event.lieu_complement && (
                            <Text style={styles.eventComplement}>🏟️ {event.lieu_complement}</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(event.id)}
                    >
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 18 },
    title: {
        color: '#00ff88',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 22,
    },
    noEvents: { color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginTop: 32 },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        padding: 16,
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventTitle: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
    eventInfo: { color: '#aaa', fontSize: 14, marginTop: 5 },
    eventComplement: { color: '#8fd6ff', fontSize: 14, fontStyle: 'italic' },
    deleteBtn: {
        backgroundColor: '#ff3e60',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        alignSelf: 'flex-start',
    },
    deleteBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
});
