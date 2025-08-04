import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

export default function EvenementsClub() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Récupère tous les événements du club du joueur connecté
    const fetchClubEvents = async () => {
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        // Récupère le club_id depuis la table utilisateurs
        const { data: userData } = await supabase
            .from('utilisateurs')
            .select('club_id')
            .eq('id', userId)
            .single();

        if (!userData) {
            setEvents([]);
            setLoading(false);
            return;
        }

        // Récupère tous les événements du club (président, coach, club, etc)
        const { data, error } = await supabase
            .from('evenements')
            .select('*')
            .eq('club_id', userData.club_id)
            .order('date', { ascending: true });

        if (error) setEvents([]);
        else setEvents(data);

        setLoading(false);
    };

    useEffect(() => {
        fetchClubEvents();
    }, []);

    const getEmoji = (type) => {
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
                            <Text style={styles.detailText}>
                                🕒 {event.date}
                                {event.heure ? ` à ${event.heure}` : ''}
                            </Text>
                            {event.description && (
                                <Text style={styles.detailText}>📝 {event.description}</Text>
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
});
