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
import { useSession } from '@/hooks/useSession';
import { useCallback, useEffect, useState } from 'react';
import {
    getLastClubStage,
    GetLastClubStage,
    getProgrammeFromStage,
} from '@/helpers/stages.helpers';
import { days } from '@/utils/date.utils';

export default function LectureStage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [stage, setStage] = useState<GetLastClubStage | null>(null);

    const { utilisateur } = useSession();

    const fetchStage = useCallback(async () => {
        if (!utilisateur?.club_id || loading) {
            return;
        }

        setLoading(true);

        const fetchedStage = await getLastClubStage({ clubId: utilisateur.club_id });
        setStage(fetchedStage);

        setLoading(false);
    }, [loading, utilisateur?.club_id]);

    useEffect(() => {
        fetchStage();
    }, [fetchStage]);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 50 }} color="#00ff88" />;
    }

    if (!stage) {
        return (
            <View style={{ marginTop: 50 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Aucun stage enregistré.</Text>
                <TouchableOpacity onPress={fetchStage} style={{ marginTop: 20 }}>
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
                <TouchableOpacity onPress={fetchStage} style={{ marginVertical: 8 }}>
                    <Text style={{ color: '#00ff88', textAlign: 'center' }}>
                        🔄 Rafraîchir le stage
                    </Text>
                </TouchableOpacity>
                <ImageBackground
                    source={require('../../assets/terrain.png')}
                    resizeMode="cover"
                    style={styles.background}
                >
                    {days.map((day) => {
                        // Essaie de parser le JSON du programme du jour pour l'affichage
                        let progTxt = '';
                        const programme = getProgrammeFromStage(stage)[day];

                        progTxt = [
                            programme.lieu ? `Lieu : ${programme.lieu}` : null,
                            programme.matin ? `Matin : ${programme.matin}` : null,
                            programme.apresMidi ? `Après-midi : ${programme.apresMidi}` : null,
                        ]
                            .filter(Boolean)
                            .join('\n');

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
    } as any, // FIXME: because of whiteSpace is unknown
});
