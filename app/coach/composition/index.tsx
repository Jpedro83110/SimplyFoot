import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { getEvenementByCoachId } from '@/helpers/evenements.helper';
import { CoachEvenements } from '@/types/Evenement';

export default function ListeCompositions() {
    const [evenements, setEvenements] = useState<CoachEvenements>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(0);
    const router = useRouter();

    // const CACHE_KEY = 'compo_evenements'; // FIXME useCachedApi
    const MIN_INTERVAL = 10000; // 10s de cooldown

    // Récupère les événements (avec cache)
    async function fetchEvenements(forceRefresh = false) {
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (!userId) {
            // FIXME manage error
            console.error('Utilisateur non connecté ou ID introuvable');
            return;
        }

        // ✅ CORRECTION: Filtre à partir d'hier pour inclure les événements du jour
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const filterDate = yesterday.toISOString().split('T')[0]; // Format YYYY-MM-DD

        console.log("Date d'aujourd'hui:", today.toISOString().split('T')[0]);
        console.log('Filtrage des événements à partir du:', filterDate);

        // FIXME: replace let by const
        const evenementsList = await getEvenementByCoachId({
            coachId: userId,
            filterDate,
        });

        console.log('Événements futurs reçus:', evenementsList?.length || 0, 'événements');

        if (!evenementsList) {
            console.error('Erreur lors de la récupération des événements');
            return;
        }

        console.log('Événements finaux après filtrage:', evenementsList.length);
        setEvenements(evenementsList);
        setLoading(false);
        setRefreshing(false);
    }

    useEffect(() => {
        fetchEvenements();
    }, []);

    // Rafraîchissement manuel avec cooldown anti-spam
    const handleManualRefresh = async () => {
        const now = Date.now();
        if (loading || refreshing) {
            return;
        }
        if (now - lastRefresh < MIN_INTERVAL) {
            Alert.alert('Trop rapide', 'Merci de patienter avant un nouveau rafraîchissement !');
            return;
        }
        setRefreshing(true);
        setLastRefresh(now);
        await fetchEvenements(true);
    };

    // Rafraîchissement classique (swipe down)
    const onRefresh = () => {
        setRefreshing(true);
        setLastRefresh(Date.now());
        fetchEvenements(true);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>📋 Sélectionne un événement</Text>
                <TouchableOpacity
                    style={[styles.refreshBtn, (loading || refreshing) && { opacity: 0.5 }]}
                    onPress={handleManualRefresh}
                    disabled={loading || refreshing}
                >
                    <Text style={{ color: '#00ff88', fontWeight: 'bold' }}>🔄 Rafraîchir</Text>
                </TouchableOpacity>
            </View>

            {Array.isArray(evenements) && evenements.length > 0 ? (
                evenements.map((evenement) => (
                    <TouchableOpacity
                        key={evenement.id}
                        style={styles.card}
                        onPress={() => router.push(`/coach/composition/${evenement.id}`)}
                    >
                        <Text style={styles.titre}>{evenement.titre}</Text>
                        <Text style={styles.info}>
                            📅 {evenement.date} à {evenement.heure}
                        </Text>
                        <Text style={styles.info}>📍 {evenement.lieu}</Text>
                    </TouchableOpacity>
                ))
            ) : !loading ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 30 }}>
                    Aucun événement à venir à afficher
                </Text>
            ) : null}

            {loading && (
                <Text style={{ color: '#00ff88', textAlign: 'center', marginTop: 30 }}>
                    Chargement…
                </Text>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: { color: '#00ff88', fontSize: 20, fontWeight: 'bold', marginBottom: 0 },
    refreshBtn: {
        paddingVertical: 7,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderColor: '#00ff88',
        borderWidth: 1,
        marginLeft: 8,
        backgroundColor: '#181c1f',
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 16,
        borderLeftColor: '#00ff88',
        borderLeftWidth: 4,
        marginBottom: 10,
    },
    titre: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    info: { color: '#ccc', fontSize: 14, marginTop: 2 },
});
