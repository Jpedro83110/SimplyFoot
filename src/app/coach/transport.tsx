import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useSession } from '@/hooks/useSession';
import {
    getBesoinTransport,
    GetBesoinTransport,
    updateBesoinTransport,
} from '@/helpers/participationsEvenement.helpers';

export default function TransportManquant() {
    const [participants, setParticipants] = useState<GetBesoinTransport>([]);
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    const fetchParticipants = useCallback(async () => {
        if (!utilisateur?.club_id || loading) {
            return;
        }

        setLoading(true);

        const fetchedParticipants = await getBesoinTransport({
            clubId: utilisateur.club_id,
        });

        setParticipants(fetchedParticipants);
        setLoading(false);
    }, [loading, utilisateur?.club_id]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    const prendreCharge = async (participationId: string) => {
        try {
            await updateBesoinTransport({
                participationId,
                dataToUpdate: { transport_valide_par: utilisateur?.id },
            });

            Alert.alert('✅ Confirmé', 'Transport pris en charge.');
            setParticipants((prev) =>
                prev.filter((participant) => participant.id !== participationId),
            );
        } catch (error) {
            Alert.alert('Erreur', (error as Error).message);
        }
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🚗 Enfants sans transport</Text>

            {participants.map((participant) => (
                <View key={participant.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {participant.utilisateurs?.nom} {participant.utilisateurs?.prenom}
                    </Text>
                    <Text style={styles.cardDetail}>📅 {participant.evenements?.titre}</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => prendreCharge(participant.id)}
                    >
                        <Text style={styles.buttonText}>Je le prends en charge</Text>
                    </TouchableOpacity>
                </View>
            ))}

            {participants.length === 0 && (
                <Text style={styles.empty}>Aucun joueur en attente de transport.</Text>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#1e1e1e',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 10,
    },
    cardDetail: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    empty: {
        color: '#888',
        textAlign: 'center',
        marginTop: 40,
    },
});
