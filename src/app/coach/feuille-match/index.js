import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function ListeFeuillesMatch() {
    const [evenements, setEvenements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);

            // 🔐 Récupère l'utilisateur connecté
            const { data: sessionData } = await supabase.auth.getSession();
            const uid = sessionData?.session?.user?.id || null;
            setUserId(uid);
            console.log('✅ Utilisateur connecté :', uid);

            if (!uid) {
                setLoading(false);
                return;
            }

            // ✅ CORRECTION: Filtre pour inclure les événements du jour même
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const filterDate = yesterday.toISOString().split('T')[0]; // Format YYYY-MM-DD

            console.log("Date d'aujourd'hui:", today.toISOString().split('T')[0]);
            console.log('Filtrage des événements à partir du:', filterDate);

            // 📡 Récupère les événements liés à ce coach (futurs + aujourd'hui)
            const { data: events, error: eventError } = await supabase
                .from('evenements')
                .select('*')
                .eq('created_by', uid)
                .gte('date', filterDate) // ← AJOUTÉ: Filtre >= hier (pour inclure aujourd'hui)
                .order('date', { ascending: true }); // ← MODIFIÉ: Ordre croissant pour voir les prochains en premier

            if (eventError || !events) {
                console.error('❌ Erreur chargement événements :', eventError?.message);
                setEvenements([]);
                setLoading(false);
                return;
            }

            console.log('✅ Événements futurs récupérés :', events.length);

            // 🔁 Vérifie les compos existantes
            const { data: compos, error: compoError } = await supabase
                .from('compositions')
                .select('evenement_id');

            if (compoError) {
                console.warn('⚠️ Erreur chargement compos :', compoError.message);
            }

            const eventsWithCompo = events.map((evt) => {
                const hasCompo = compos?.some((c) => c.evenement_id === evt.id);
                return { ...evt, hasCompo };
            });

            // ✅ SÉCURITÉ SUPPLÉMENTAIRE: Double filtrage côté client
            const filteredEvents = eventsWithCompo.filter((evt) => evt.date >= filterDate);

            console.log('Événements finaux après filtrage:', filteredEvents.length);
            setEvenements(filteredEvents);
            setLoading(false);
        };

        fetch();
    }, []);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
    }

    if (!evenements.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.empty}>Aucun événement à venir trouvé.</Text>
                <Text style={styles.debug}>Coach ID : {userId || 'non connecté'}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📝 Feuilles de match</Text>
            <Text style={styles.subtitle}>Événements à venir nécessitant une feuille de match</Text>

            {evenements.map((evt) => (
                <TouchableOpacity
                    key={evt.id}
                    style={[styles.card, !evt.hasCompo && { opacity: 0.5 }]}
                    onPress={() => router.push(`/coach/feuille-match/${evt.id}`)}
                >
                    <Text style={styles.label}>{evt.titre}</Text>
                    <Text style={styles.detail}>
                        📅 {evt.date} {evt.heure}
                    </Text>
                    <Text style={styles.detail}>📍 {evt.lieu}</Text>
                    <Text style={[styles.detail, { fontWeight: 'bold', marginTop: 8 }]}>
                        {evt.hasCompo
                            ? '✅ Composition validée'
                            : '⏳ En attente de validation de compo'}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#121212', flex: 1, padding: 20 },
    title: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 18,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    label: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    detail: { color: '#ccc', fontSize: 14, marginTop: 2 },
    empty: { color: '#888', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 15 },
    debug: { color: '#666', marginTop: 10, textAlign: 'center', fontSize: 12 },
});
