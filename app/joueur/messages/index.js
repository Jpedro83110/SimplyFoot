import React, { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';

const GREEN = '#00ff88';

export default function MessagesIndex() {
    const router = useRouter();
    const [canAskTransport, setCanAskTransport] = useState(false);

    useEffect(() => {
        checkCanAskTransport();
    }, [checkCanAskTransport]);

    const checkCanAskTransport = useCallback(async () => {
        // 1. Récupère l'utilisateur courant (parent ou joueur)
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        console.log('userId', userId); // <--- LOG 1
        if (!userId) return setCanAskTransport(false);

        // 2. Récup info utilisateur (pour joueur_id)
        const { data: user, error: userError } = await supabase
            .from('utilisateurs')
            .select('id, joueur_id')
            .eq('id', userId)
            .maybeSingle();
        console.log('user', user, 'userError', userError); // <--- LOG 2
        if (!user || !user.joueur_id) return setCanAskTransport(false);

        // 3. Récup info joueur liée à cet utilisateur
        const { data: joueurData, error: joueurError } = await supabase
            .from('joueurs')
            .select('id, date_naissance')
            .eq('id', user.joueur_id)
            .maybeSingle();
        console.log('joueurData', joueurData, 'joueurError', joueurError); // <--- LOG 3
        if (!joueurData || !joueurData.date_naissance) return setCanAskTransport(false);

        // 4. Vérifie l'âge du joueur (mineur < 18 ans)
        const age = getAge(joueurData.date_naissance);
        console.log('age', age); // <--- LOG 4
        if (age >= 18) return setCanAskTransport(false);

        // 5. Vérifie la présence d'une décharge générale signée (table fournie)
        const { data: decharge, error: dechargeError } = await supabase
            .from('decharges_generales')
            .select('accepte_transport')
            .eq('joueur_id', joueurData.id)
            .eq('accepte_transport', true)
            .maybeSingle();
        console.log('decharge', decharge, 'dechargeError', dechargeError); // <--- LOG 5

        setCanAskTransport(!!decharge);
    }, []);

    // Petite fonction utilitaire pour calculer l'âge
    function getAge(dateNaissance) {
        if (!dateNaissance) return 99;
        const d = new Date(dateNaissance);
        const diff = Date.now() - d.getTime();
        const age = new Date(diff).getUTCFullYear() - 1970;
        return age;
    }

    function handleAskTransport() {
        router.push('/joueur/messages/besoin-transport');
    }

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <LinearGradient colors={['#121212cc', '#121212dd']} style={styles.container}>
                <Text style={styles.title}>💬 Messagerie Joueur</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/joueur/messages/prives')}
                >
                    <MaterialCommunityIcons
                        name="account-box-multiple-outline"
                        size={30}
                        color={GREEN}
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
                        color={GREEN}
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
        color: GREEN,
        marginBottom: 40,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: GREEN,
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
        color: GREEN,
        fontSize: 18,
        fontWeight: '600',
    },
});
