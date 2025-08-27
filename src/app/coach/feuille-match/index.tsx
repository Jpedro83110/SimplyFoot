import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import {
    GetCoachEvenementsHasComposition,
    getCoachEvenementsHasComposition,
} from '@/helpers/evenements.helpers';
import { formatDateForDisplay } from '@/utils/date.utils';

export default function ListeFeuillesMatch() {
    const [evenements, setEvenements] = useState<GetCoachEvenementsHasComposition>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const { utilisateur } = useSession();

    const fetch = useCallback(async () => {
        if (!utilisateur?.id || loading) {
            return;
        }

        setLoading(true);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const fetchedEvents = await getCoachEvenementsHasComposition({
            coachId: utilisateur.id,
            since: yesterday,
        });

        setEvenements(fetchedEvents);
        setLoading(false);
    }, [loading, utilisateur?.id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
    }

    if (!evenements.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.empty}>Aucun événement à venir trouvé.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📝 Feuilles de match</Text>
            <Text style={styles.subtitle}>Événements à venir nécessitant une feuille de match</Text>

            {evenements.map((evenement) => (
                <TouchableOpacity
                    key={evenement.id}
                    style={[styles.card, !evenement.hasCompo && { opacity: 0.5 }]}
                    onPress={() => router.push(`/coach/feuille-match/${evenement.id}`)}
                >
                    <Text style={styles.label}>{evenement.titre}</Text>
                    <Text style={styles.detail}>
                        📅 {formatDateForDisplay({ date: evenement.date })} {evenement.heure}
                    </Text>
                    <Text style={styles.detail}>📍 {evenement.lieu}</Text>
                    <Text style={[styles.detail, { fontWeight: 'bold', marginTop: 8 }]}>
                        {evenement.hasCompo
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
});
