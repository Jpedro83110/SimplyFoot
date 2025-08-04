import React, { useEffect, useState } from 'react';
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
import { supabase } from '../../../lib/supabase';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export default function ListeEquipesCoach() {
    const router = useRouter();
    const [equipes, setEquipes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Responsive :
    const screenWidth = Dimensions.get('window').width;
    const isMobile = screenWidth < 700 || Platform.OS !== 'web';

    // Chargement des équipes du coach connecté
    useEffect(() => {
        let mounted = true;
        async function fetchEquipes() {
            setLoading(true);
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const coachId = sessionData?.session?.user?.id;
                if (!coachId) return setEquipes([]);

                // Récupère toutes les équipes où le coach est owner
                const { data, error } = await supabase
                    .from('equipes')
                    .select('id, nom, categorie, code_equipe')
                    .eq('coach_id', coachId)
                    .order('categorie', { ascending: true });
                if (error) throw error;

                if (mounted) setEquipes(data || []);
            } catch (error) {
                console.error('Erreur lors du chargement des équipes:', error);
                if (mounted) setEquipes([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchEquipes();
        return () => {
            mounted = false;
        };
    }, []);

    // Copie du code équipe dans le presse-papier
    const copierCode = (code) => {
        if (!code) return;
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
                                            copierCode(item.code_equipe);
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
