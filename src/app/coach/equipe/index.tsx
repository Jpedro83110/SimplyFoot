import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Dimensions,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { GetCoachEquipes, getCoachEquipes } from '@/helpers/equipes.helpers';
import { useSession } from '@/hooks/useSession';

export default function ListeEquipesCoach() {
    const router = useRouter();
    const [equipes, setEquipes] = useState<GetCoachEquipes>([]);
    const [loading, setLoading] = useState(true);

    const { utilisateur } = useSession();

    const screenWidth = Dimensions.get('window').width;
    const isMobile = screenWidth < 700 || Platform.OS !== 'web';

    const fetchEquipes = useCallback(async () => {
        try {
            if (!utilisateur?.club_id || loading) {
                return;
            }

            setLoading(true);

            const fetchedEquipes = await getCoachEquipes({
                coachId: utilisateur.id,
                clubId: utilisateur.club_id,
            });

            setEquipes(fetchedEquipes);
            setLoading(false);
        } catch (error) {
            console.error('Erreur lors du chargement des équipes:', error);
            Alert.alert(
                'Erreur',
                'Une erreur est survenue lors du chargement des équipes. Veuillez réessayer plus tard.',
            );
        }
    }, [loading, utilisateur?.club_id, utilisateur?.id]);

    useEffect(() => {
        fetchEquipes();
    }, [fetchEquipes]);

    const copierCode = (code: string) => {
        if (!code) {
            return;
        }

        Clipboard.setStringAsync(code);
        Alert.alert('Copié !', 'Le code équipe a été copié.');
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>📋 Mes équipes</Text>
            <FlatList
                data={equipes}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucune équipe trouvée.</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, isMobile && styles.cardMobile]}
                        onPress={() => router.push(`/coach/equipe/${item.id}`)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardContent}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.nomEquipe}>{item.nom}</Text>
                                <Text style={styles.categorieEquipe}>{item.categorie}</Text>
                                <View style={styles.codeRow}>
                                    <Ionicons name="key-outline" size={18} color="#00ff88" />
                                    <Text selectable style={styles.codeEquipe}>
                                        {item.code_equipe}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={(e) => {
                                            e.stopPropagation && e.stopPropagation();
                                            copierCode(item.code_equipe || ''); // FIXME: should can't be null
                                        }}
                                    >
                                        <Ionicons name="copy-outline" size={18} color="#00ff88" />
                                        <Text style={styles.copyButtonText}>Copier</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={26} color="#aaa" />
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 28 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        color: '#00ff88',
        fontWeight: '700',
        marginBottom: 28,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#181818',
        borderRadius: 14,
        marginBottom: 18,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1.5,
        borderColor: '#222',
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardMobile: {
        padding: 12,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    nomEquipe: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 20,
        marginBottom: 4,
    },
    categorieEquipe: {
        color: '#aaa',
        fontSize: 16,
        marginBottom: 6,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        marginBottom: 2,
    },
    codeEquipe: {
        color: '#00ff88',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 2,
        marginHorizontal: 6,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202b20',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginLeft: 6,
        gap: 2,
    },
    copyButtonText: {
        color: '#00ff88',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 2,
    },
    emptyText: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});
