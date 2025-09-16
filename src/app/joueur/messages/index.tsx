import { useEffect, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK_GRADIENT, COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { getAccepteTransportByUtilisateurId } from '@/helpers/joueurs.helpers';
import { useSession } from '@/hooks/useSession';

export default function MessagesIndex() {
    const router = useRouter();
    const [canAnswerTransportRequest, setCanAnswerTransportRequest] = useState<boolean | null>(
        null,
    );

    const { utilisateur } = useSession();

    const checkCanAskTransport = async (utilisateurId: string) => {
        const accepteTransport = await getAccepteTransportByUtilisateurId({
            utilisateurId,
        });

        setCanAnswerTransportRequest(accepteTransport);
    };

    useEffect(() => {
        if (!utilisateur?.id || canAnswerTransportRequest !== null) {
            return;
        }

        checkCanAskTransport(utilisateur.id);
    }, [canAnswerTransportRequest, utilisateur?.id]);

    function handleAskTransport() {
        router.push('/joueur/messages/besoin-transport');
    }

    return (
        <LinearGradient colors={DARK_GRADIENT} style={styles.container}>
            <Text style={styles.title}>💬 Messagerie Joueur</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/joueur/messages/prives')}
            >
                <MaterialCommunityIcons
                    name="account-box-multiple-outline"
                    size={30}
                    color={COLOR_GREEN_300}
                    style={{ marginRight: 12 }}
                />
                <Text style={styles.buttonText}>Messagerie privée</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/joueur/messages/groupes')}
            >
                <MaterialCommunityIcons
                    name="account-group-outline"
                    size={30}
                    color={COLOR_GREEN_300}
                    style={{ marginRight: 12 }}
                />
                <Text style={styles.buttonText}>Messagerie de groupe</Text>
            </TouchableOpacity>

            {/* BOUTON BESOIN DE TRANSPORT */}
            {canAnswerTransportRequest && (
                <TouchableOpacity
                    style={[styles.button, { borderColor: '#ffd700' }]}
                    onPress={handleAskTransport}
                >
                    <MaterialCommunityIcons
                        name="van-utility"
                        size={30}
                        color="#ffd700"
                        style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.buttonText, { color: '#ffd700' }]}>
                        Demande de transport
                    </Text>
                </TouchableOpacity>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        marginBottom: 40,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 24,
        width: '100%',
        justifyContent: 'center',
        backgroundColor: '#00000088',
        maxWidth: 300,
    },
    buttonText: {
        color: COLOR_GREEN_300,
        fontSize: 18,
        fontWeight: '600',
    },
});
