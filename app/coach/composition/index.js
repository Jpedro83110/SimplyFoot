import React, { useEffect, useState } from 'react';
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
import { getFromCache, saveToCache } from '../../../lib/cache';

export default function ListeCompositions() {
    const [evenements, setEvenements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(0);
    const router = useRouter();

    const CACHE_KEY = 'compo_evenements';
    const MIN_INTERVAL = 10000; // 10s de cooldown

    // Récupère les événements (avec cache)
    async function fetchEvenements(forceRefresh = false) {
        setLoading(true);
        let data = null;

        // 1. Essaye le cache sauf si refresh forcé
        if (!forceRefresh) {
            const cached = await getFromCache(CACHE_KEY);
            data = cached?.value;
        }

        // 2. Si rien en cache (ou refresh), charge Supabase
        if (!data) {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData?.session?.user?.id;

            // ✅ CORRECTION: Filtre à partir d'hier pour inclure les événements du jour
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const filterDate = yesterday.toISOString().split('T')[0]; // Format YYYY-MM-DD

            console.log("Date d'aujourd'hui:", today.toISOString().split('T')[0]);
            console.log('Filtrage des événements à partir du:', filterDate);

            const { data: freshData, error } = await supabase
                .from('evenements')
                .select('*')
                .eq('coach_id', userId)
                .gte('date', filterDate) // ← MODIFIÉ: Filtre >= hier (pour inclure aujourd'hui)
                .order('date', { ascending: true });

            console.log('Événements futurs reçus:', freshData?.length || 0, 'événements');

            if (!error) {
                data = freshData;
                await saveToCache(CACHE_KEY, freshData); // MAJ le cache
            } else {
                console.error('Erreur lors de la récupération des événements:', error);
                data = [];
            }
        }

        // Patch : accepte cache {value: [...]} ou tableau simple
        let evenementsList = [];
        if (data && Array.isArray(data.value)) {
            evenementsList = data.value;
        } else if (Array.isArray(data)) {
            evenementsList = data;
        }

        // Sécurité anti-événements fantômes
        if (evenementsList.length > 0) {
            const eventsIds = evenementsList.map((ev) => ev.id);
            const { data: existsList } = await supabase
                .from('evenements')
                .select('id')
                .in('id', eventsIds);
            const idsExistants = (existsList || []).map((ev) => ev.id);
            evenementsList = evenementsList.filter((ev) => idsExistants.includes(ev.id));
            await saveToCache(CACHE_KEY, evenementsList);
        }

        // ✅ SÉCURITÉ SUPPLÉMENTAIRE: Double filtrage côté client (à partir d'hier)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const filterDate = yesterday.toISOString().split('T')[0];

        evenementsList = evenementsList.filter((ev) => ev.date >= filterDate);

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
        if (loading || refreshing) return;
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
                evenements.map((evt) => (
                    <TouchableOpacity
                        key={evt.id}
                        style={styles.card}
                        onPress={() => router.push(`/coach/composition/${evt.id}`)}
                    >
                        <Text style={styles.titre}>{evt.titre}</Text>
                        <Text style={styles.info}>
                            📅 {evt.date} à {evt.heure}
                        </Text>
                        <Text style={styles.info}>📍 {evt.lieu}</Text>
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
