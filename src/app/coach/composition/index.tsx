import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { GetEvenementByCoachId, getEvenementsByClubId } from '@/helpers/evenements.helpers';
import { useSession } from '@/hooks/useSession';

export default function ListeCompositions() {
    const [evenements, setEvenements] = useState<GetEvenementByCoachId>([]);
    const [loading, setLoading] = useState(true);

    const { utilisateur } = useSession();

    const router = useRouter();

    const fetchEvenements = useCallback(async () => {
        if (!utilisateur?.club_id || loading) {
            return;
        }

        setLoading(true);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const evenementsList = await getEvenementsByClubId({
            clubId: utilisateur.club_id,
            since: yesterday,
        });

        if (!evenementsList) {
            console.error('Erreur lors de la récupération des événements');
            return;
        }

        setEvenements(evenementsList);
        setLoading(false);
    }, [loading, utilisateur]);

    useEffect(() => {
        fetchEvenements();
    }, [fetchEvenements]);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEvenements} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>📋 Sélectionne un événement</Text>
                <TouchableOpacity
                    style={[styles.refreshBtn, loading && { opacity: 0.5 }]}
                    onPress={fetchEvenements}
                    disabled={loading}
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
