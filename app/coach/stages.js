import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ImageBackground,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache';

export default function LectureStage() {
    // Hook cache : clé unique "dernier_stage" (pas besoin d'un cache par user vu la structure)
    const [stage, refresh, loading] = useCacheData(
        'dernier_stage',
        async () => {
            const { data: session } = await supabase.auth.getSession();
            const userId = session?.session?.user?.id;
            if (!userId) {
                return null;
            }
            const { data: user } = await supabase
                .from('utilisateurs')
                .select('club_id')
                .eq('id', userId)
                .single();
            if (!user?.club_id) {
                return null;
            }
            const { data, error } = await supabase
                .from('stages')
                .select('*')
                .eq('club_id', user.club_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            return !error ? data : null;
        },
        1800, // TTL : 30 min
    );

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;
    }

    if (!stage) {
        return (
            <View style={{ marginTop: 50 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Aucun stage enregistré.</Text>
                <TouchableOpacity onPress={refresh} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#00ff88', textAlign: 'center' }}>🔄 Rafraîchir</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>📘 {stage.titre}</Text>
                <Text style={styles.detail}>📍 {stage.lieu}</Text>
                <Text style={styles.detail}>
                    🗓️ Du {stage.date_debut} au {stage.date_fin}
                </Text>
                <TouchableOpacity onPress={refresh} style={{ marginVertical: 8 }}>
                    <Text style={{ color: '#00ff88', textAlign: 'center' }}>
                        🔄 Rafraîchir le stage
                    </Text>
                </TouchableOpacity>
                <ImageBackground
                    source={require('../../assets/terrain.png')}
                    resizeMode="cover"
                    style={styles.background}
                >
                    {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((day) => {
                        // Essaie de parser le JSON du programme du jour pour l'affichage
                        let progTxt = '';
                        try {
                            const p = stage[`programme_${day}`]
                                ? JSON.parse(stage[`programme_${day}`])
                                : null;
                            if (p) {
                                progTxt = [
                                    p.lieu ? `Lieu : ${p.lieu}` : null,
                                    p.matin ? `Matin : ${p.matin}` : null,
                                    p.apresMidi ? `Après-midi : ${p.apresMidi}` : null,
                                ]
                                    .filter(Boolean)
                                    .join('\n');
                            } else {
                                progTxt = '';
                            }
                        } catch {
                            progTxt = stage[`programme_${day}`] || '';
                        }
                        return (
                            <View key={day} style={styles.dayBlock}>
                                <Text style={styles.dayTitle}>
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                </Text>
                                <Text style={styles.programText}>{progTxt || '—'}</Text>
                            </View>
                        );
                    })}
                </ImageBackground>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 10,
    },
    detail: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 6,
    },
    background: {
        width: '100%',
        padding: 10,
        borderRadius: 10,
        marginTop: 20,
    },
    dayBlock: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    dayTitle: {
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    programText: {
        color: '#fff',
        fontSize: 14,
        whiteSpace: 'pre-line',
    },
});
