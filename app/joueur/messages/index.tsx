import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { calculateAge } from '@/utils/date.util';
import { DARK_GRADIENT, COLOR_GREEN_300 } from '@/utils/styleContants.util';
import { getJoueurByUtilisateurId } from '@/helpers/joueurs.helper';

export default function MessagesIndex() {
    const router = useRouter();
    const [canAskTransport, setCanAskTransport] = useState(false);

    const checkCanAskTransport = useCallback(async () => {
        // 1. Récupère l'utilisateur courant (parent ou joueur)
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        console.log('userId', userId); // <--- LOG 1

        if (!userId) {
            setCanAskTransport(false);
            return;
        }

        const utilisateur = await getJoueurByUtilisateurId(userId, ['id', 'date_naissance']);

        if (!utilisateur || !utilisateur.joueurs.date_naissance) {
            setCanAskTransport(false);
            return;
        }

        // 4. Vérifie l'âge du joueur (mineur < 18 ans)
        const age = calculateAge(utilisateur.joueurs.date_naissance);
        console.log('age', age); // <--- LOG 4
        if (age >= 18) return setCanAskTransport(false);

        // 5. Vérifie la présence d'une décharge générale signée (table fournie)
        const { data: decharge, error: dechargeError } = await supabase
            .from('decharges_generales')
            .select('accepte_transport')
            .eq('joueur_id', utilisateur.joueurs.id)
            .eq('accepte_transport', true)
            .maybeSingle();
        console.log('decharge', decharge, 'dechargeError', dechargeError); // <--- LOG 5

        setCanAskTransport(!!decharge);
    }, []);

    useEffect(() => {
        checkCanAskTransport();
    }, [checkCanAskTransport]);

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
                {canAskTransport && (
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
                            J&apos;ai besoin de transport
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
