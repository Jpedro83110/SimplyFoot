import { useCallback, useState } from 'react';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import { Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { DARK_GRADIENT, COLOR_GREEN_300 } from '@/utils/styleContants.util';
import { getAccepteTransportByUtilisateurId } from '@/helpers/joueurs.helper';

export default function MessagesIndex() {
    const router = useRouter();
    const [canAnswerTransportRequest, setCanAnswerTransportRequest] = useState(false);

    const checkCanAskTransport = useCallback(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const utilisateurId = sessionData?.session?.user?.id;

        if (!utilisateurId) {
            return;
        }

        const accepteTransport = await getAccepteTransportByUtilisateurId({
            utilisateurId,
        });

        setCanAnswerTransportRequest(accepteTransport);
    }, []);

    useEffectOnce(() => {
        checkCanAskTransport();
    });

    function handleAskTransport() {
        router.push('/joueur/messages/besoin-transport');
    }

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={styles.background}
            resizeMode="cover"
        >
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
        </ImageBackground>
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
