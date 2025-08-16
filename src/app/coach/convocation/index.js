import React, { useEffect, useState } from 'react';
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
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export default function ConvocationsList() {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const router = useRouter();

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        setLoading(true);
        // Session coach
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) {
            setEvents([]);
            setLoading(false);
            return;
        }
        // Récupère tous les événements à venir pour ce coach
        const today = dayjs().format('YYYY-MM-DD');
        const { data: eventsList, error } = await supabase
            .from('evenements')
            .select('*')
            .eq('coach_id', userId)
            .gte('date', today)
            .order('date', { ascending: true });
        if (error) {
            console.log('Erreur fetch events:', error);
            setEvents([]);
        } else {
            setEvents(eventsList || []);
        }
        setLoading(false);
    }

    // SUPPRESSION événement + participations
    const handleDelete = (eventId) => {
        const confirmMsg = 'Supprimer définitivement cet événement et toutes ses participations ?';
        if (Platform.OS === 'web') {
            if (!window.confirm(confirmMsg)) {
                return;
            }
            doDelete(eventId);
        } else {
            Alert.alert("Supprimer l'événement", confirmMsg, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => doDelete(eventId) },
            ]);
        }
    };

    const doDelete = async (eventId) => {
        setLoading(true);
        // 1. Supprimer les participations liées
        const { error: errorPart } = await supabase
            .from('participations_evenement')
            .delete()
            .eq('evenement_id', eventId);

        if (errorPart) {
            console.log('Erreur suppression participations:', errorPart);
            Alert.alert(
                'Erreur',
                'Suppression participations impossible : ' + (errorPart.message || ''),
            );
            setLoading(false);
            return;
        }

        // 2. Supprimer l'événement
        const { error: errorEvt } = await supabase.from('evenements').delete().eq('id', eventId);

        if (errorEvt) {
            console.log('Erreur suppression evenement:', errorEvt);
            Alert.alert('Erreur', 'Suppression événement impossible : ' + (errorEvt.message || ''));
            setLoading(false);
            return;
        }

        // 3. Rafraîchir la liste réelle depuis la base
        await fetchEvents();
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
