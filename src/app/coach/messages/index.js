import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK_GRADIENT } from '@/utils/styleContants.util';

const GREEN = '#00ff88';

export default function MessagesIndex() {
    const router = useRouter();
    // À remplacer par appel Supabase pour compter les besoins de transport en attente !
    const [hasTransportRequest] = useState(false); // FIXME

    // --- Ici tu feras l'appel Supabase pour checker s'il existe des demandes en attente
    useEffect(() => {
        // TODO : remplacer par la requête supabase réelle pour détecter les demandes en attente
        // Exemple :
        /*
    supabase
      .from('messages_besoin_transport')
      .select('id', { count: 'exact', head: true })
      .eq('etat', 'en_attente')
      .then(({ count }) => setHasTransportRequest(count > 0));
    */
    }, []);

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <LinearGradient colors={DARK_GRADIENT} style={styles.container}>
                <Text style={styles.title}>💬 Messagerie Coach</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/coach/messages/prives')}
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
                    onPress={() => router.push('/coach/messages/groupes')}
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
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/coach/messages/besoin-transport')}
                >
                    <MaterialCommunityIcons
                        name="van-utility"
                        size={30}
                        color={GREEN}
                        style={{ marginRight: 12 }}
                    />
                    <Text style={styles.buttonText}>Besoin de transport</Text>
                    {hasTransportRequest && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>!</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
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
        position: 'relative',
    },
    buttonText: {
        color: GREEN,
        fontSize: 18,
        fontWeight: '600',
    },
    badge: {
        marginLeft: 10,
        backgroundColor: '#ff3e60',
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 6,
        right: 6,
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: -1,
    },
});
