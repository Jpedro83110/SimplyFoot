import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    GetSuiviPersonnalisesByUtilisateurId,
    getSuiviPersonnalisesByUtilisateurId,
} from '@/helpers/suivisPersonnalises.helpers';
import { useSession } from '@/hooks/useSession';
import { formatDateForDisplay } from '@/utils/date.utils';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';

export default function SuiviJoueur() {
    const [suivi, setSuivi] = useState<GetSuiviPersonnalisesByUtilisateurId | null>(null);
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();
    const { width } = useWindowDimensions();

    const maxBlockWidth = Platform.OS === 'web' ? 520 : Math.min(width - 32, 380);

    async function fetchSuivi(utilisateurId: string) {
        setLoading(true);

        const fetchedSuiviPersonnalises = await getSuiviPersonnalisesByUtilisateurId({
            utilisateurId,
        });
        setSuivi(fetchedSuiviPersonnalises);

        setLoading(false);
    }

    useEffect(() => {
        if (!utilisateur?.id) {
            return;
        }

        fetchSuivi(utilisateur.id);
    }, [utilisateur?.id]);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color={COLOR_GREEN_300} />;
    }

    return (
        <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>📋 Mon suivi personnalisé</Text>
                {suivi && suivi[0].updated_at && (
                    <Text style={styles.dateText}>
                        🕓 Suivi du {formatDateForDisplay({ date: suivi[0].updated_at })}
                    </Text>
                )}

                <View style={[styles.block, { width: maxBlockWidth }]}>
                    <Text style={styles.label}>🟢 Point fort</Text>
                    <Text style={styles.value}>{suivi ? suivi[0].point_fort || '—' : '—'}</Text>
                </View>

                <View style={[styles.block, { width: maxBlockWidth }]}>
                    <Text style={styles.label}>🔴 À travailler</Text>
                    <Text style={styles.value}>{suivi ? suivi[0].axe_travail || '—' : '—'}</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { alignItems: 'center', padding: 20, paddingTop: 32, paddingBottom: 40 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        textAlign: 'center',
        marginBottom: 12,
    },
    dateText: {
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    block: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 18,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
        minHeight: 62,
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: COLOR_GREEN_300,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 4,
    },
    label: {
        color: COLOR_GREEN_300,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    value: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
    },
    illustrationBlock: {
        backgroundColor: '#101a13',
        borderRadius: 18,
        marginBottom: 18,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        shadowColor: COLOR_GREEN_300,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 18,
        elevation: 8,
        alignSelf: 'center',
    },
    illustration: {
        width: '100%',
        height: '100%',
    },
});
