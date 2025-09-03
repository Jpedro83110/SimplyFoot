import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    Pressable,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { getEquipeWithJoueurById, GetEquipeWithJoueurById } from '@/helpers/equipes.helpers';
import useEffectOnce from 'react-use/lib/useEffectOnce';

type EquipeDetailParams = {
    id: string;
};

export default function EquipeDetail() {
    const { id } = useLocalSearchParams<EquipeDetailParams>();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [equipeWithJoueurs, setEquipeWithJoueurs] = useState<GetEquipeWithJoueurById | undefined>(
        undefined,
    );

    // Responsive params
    const screenWidth = Dimensions.get('window').width;
    const isMobile = screenWidth < 700 || Platform.OS !== 'web';

    const fetchEquipeWithJoueurs = async (equipeId: string) => {
        setLoading(true);

        const fetchedEquipeWithJoueur = await getEquipeWithJoueurById({ equipeId });
        setEquipeWithJoueurs(fetchedEquipeWithJoueur);

        setLoading(false);
    };

    useEffectOnce(() => {
        fetchEquipeWithJoueurs(id);
    });

    // Copier code équipe
    const copierCodeEquipe = async () => {
        await Clipboard.setStringAsync(equipeWithJoueurs?.code_equipe || '');
        Alert.alert('Copié !', 'Le code équipe a été copié.'); // FIXME: nécessaire ? Pas mieux avec un toast ?
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;
    }

    if (!equipeWithJoueurs) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Équipe introuvable.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity
                onPress={() => fetchEquipeWithJoueurs(id)}
                style={{ marginBottom: 18, alignSelf: 'flex-end' }}
            >
                <Text style={{ color: '#00ff88', fontSize: 14 }}>🔄 Rafraîchir</Text>
            </TouchableOpacity>
            <Text style={styles.title}>⚽ {equipeWithJoueurs.nom}</Text>

            <View style={styles.codeBlock}>
                <Ionicons name="key-outline" size={20} color="#00ff88" />
                <Text selectable style={styles.codeEquipe}>
                    {equipeWithJoueurs.code_equipe}
                </Text>
                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={copierCodeEquipe}
                    activeOpacity={0.7}
                >
                    <Ionicons name="copy-outline" size={18} color="#00ff88" />
                    <Text style={styles.copyButtonText}>Copier</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.block}>
                <Text style={styles.label}>Nom de l&apos;équipe :</Text>
                <Text style={styles.value}>{equipeWithJoueurs.nom}</Text>
            </View>

            <Text style={styles.sectionTitle}>👥 Liste des joueurs</Text>
            <FlatList
                data={equipeWithJoueurs.joueurs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item }) => (
                    <Pressable onPress={() => router.push(`/coach/joueur/${item.id}`)}>
                        <View
                            style={[
                                styles.playerCard,
                                isMobile ? styles.playerCardMobile : styles.playerCardWeb,
                            ]}
                        >
                            <Image
                                source={{
                                    uri:
                                        item.photo_profil_url && item.photo_profil_url.trim() !== ''
                                            ? item.photo_profil_url
                                            : 'https://ui-avatars.com/api/?name=' +
                                              encodeURIComponent(
                                                  `${item.utilisateurs[0].prenom || ''} ${item.utilisateurs[0].nom || ''}`,
                                              ) +
                                              '&background=222&color=fff&rounded=true',
                                }}
                                style={styles.avatar}
                            />
                            <View style={styles.playerInfoContainer}>
                                <Text style={styles.playerName}>
                                    {item.utilisateurs[0].prenom} {item.utilisateurs[0].nom}
                                </Text>
                                <Text style={styles.playerInfo}>
                                    Date naissance : {item.utilisateurs[0].date_naissance || '—'}
                                </Text>
                                <Text style={styles.playerInfo}>Poste : {item.poste || '—'}</Text>
                                <Text style={styles.playerInfo}>
                                    Licence : {item.numero_licence || '—'}
                                </Text>
                                <Text style={styles.playerInfo}>
                                    Visite médicale : {item.visite_medicale_valide ? '✅ OK' : '❌'}
                                </Text>
                                <Text style={styles.playerInfo}>
                                    Équipement : {item.equipement ? '✅ OK' : '❌'}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                )}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    codeBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#192c21',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 9,
        marginBottom: 18,
        gap: 10,
        alignSelf: 'flex-start',
    },
    codeEquipe: {
        color: '#00ff88',
        fontWeight: '700',
        fontSize: 17,
        letterSpacing: 2,
        marginHorizontal: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202b20',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginLeft: 8,
        gap: 2,
    },
    copyButtonText: {
        color: '#00ff88',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 2,
    },
    block: {
        marginBottom: 15,
    },
    label: {
        color: '#aaa',
        fontSize: 16,
    },
    value: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        color: '#00ff88',
        fontWeight: 'bold',
        marginVertical: 20,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        padding: 14,
        borderRadius: 13,
        marginBottom: 13,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
        width: '100%',
        minHeight: 82,
        shadowColor: '#00ff8844',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    playerCardMobile: {
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    playerCardWeb: {
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#00ff88',
        backgroundColor: '#222',
    },
    playerInfoContainer: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 120,
        marginRight: 8,
    },
    playerName: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    playerInfo: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 1,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 5,
        alignSelf: 'center',
        minWidth: 64,
    },
});
