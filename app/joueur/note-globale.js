import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const screenWidth = Dimensions.get('window').width;

export default function NoteGlobaleEquipe() {
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState({ mentale: null, technique: null });

    useEffect(() => {
        async function fetchNotes() {
            try {
                const session = await supabase.auth.getSession();
                const userId = session.data.session.user.id;

                // Sécurité : SELECT bien la colonne "moyenne" (sinon data = null)
                const { data: mentaleRow } = await supabase
                    .from('evaluations_mentales')
                    .select('moyenne')
                    .eq('joueur_id', userId)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                const { data: techniqueRow } = await supabase
                    .from('evaluations_techniques')
                    .select('moyenne')
                    .eq('joueur_id', userId)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                setNotes({
                    mentale: mentaleRow?.moyenne ?? null,
                    technique: techniqueRow?.moyenne ?? null,
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchNotes();
    }, []);

    // Moyenne générale sur 100 (ignore les nulls)
    function calcMoyenneGen(m, t) {
        if (m !== null && t !== null) return Math.round((Number(m) + Number(t)) / 2);
        if (m !== null) return Math.round(Number(m));
        if (t !== null) return Math.round(Number(t));
        return null;
    }
    const moyenneGen = calcMoyenneGen(notes.mentale, notes.technique);

    // Choix du badge selon la moyenne générale
    function getBadge(n) {
        if (n === null) return null;
        if (n >= 95)
            return {
                icon: require('../../assets/badges/platine.png'),
                label: 'PLATINE',
                color: '#9eeaff',
            };
        if (n >= 80)
            return { icon: require('../../assets/badges/or.png'), label: 'OR', color: '#ffe773' };
        if (n >= 60)
            return {
                icon: require('../../assets/badges/argent.png'),
                label: 'ARGENT',
                color: '#bfcbd6',
            };
        return {
            icon: require('../../assets/badges/bronze.png'),
            label: 'BRONZE',
            color: '#d6964c',
        };
    }
    const badge = getBadge(moyenneGen);

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

    // Responsive design
    const isMobile = screenWidth < 600;

    // Helpers d'affichage note :
    const displayNote = (note) => (note !== null ? `${Math.round(note)}/100` : '—/100');

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🏆 Note globale du joueur</Text>

            {/* Ligne principale avec mental, coupe, technique */}
            <View style={[styles.row, isMobile && styles.rowMobile]}>
                {/* Bloc Mental */}
                <View style={[styles.noteCard, isMobile && styles.noteCardMobile]}>
                    <MaterialCommunityIcons
                        name="emoticon-happy-outline"
                        size={isMobile ? 32 : 40}
                        color="#00ff88"
                    />
                    <Text style={styles.label}>Mentale</Text>
                    <Text style={styles.note}>{displayNote(notes.mentale)}</Text>
                </View>

                {/* Coupe au centre */}
                <View style={styles.cupBlock}>
                    <Image
                        source={require('../../assets/coupe-simplyfoot.png')}
                        style={isMobile ? styles.cupImageMobile : styles.cupImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Bloc Technique */}
                <View style={[styles.noteCard, isMobile && styles.noteCardMobile]}>
                    <MaterialCommunityIcons
                        name="soccer"
                        size={isMobile ? 32 : 40}
                        color="#00ff88"
                    />
                    <Text style={styles.label}>Technique</Text>
                    <Text style={styles.note}>{displayNote(notes.technique)}</Text>
                </View>
            </View>

            {/* Badge centré en dessous */}
            <View style={styles.badgeBlock}>
                <Text style={styles.badgeTitle}>Badge du joueur</Text>
                {badge && (
                    <View style={styles.badgeVisual}>
                        <Image
                            source={badge.icon}
                            style={isMobile ? styles.badgeImageMobile : styles.badgeImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.badgeLabel, { color: badge.color }]}>
                            {badge.label}
                        </Text>
                        <Text style={styles.bigNote}>
                            {moyenneGen !== null ? `${moyenneGen}/100` : '—/100'}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        paddingVertical: 30,
        minHeight: 680,
        minWidth: '100%',
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 30,
        textAlign: 'center',
        marginTop: 8,
        zIndex: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 38,
        width: '100%',
        marginBottom: 38,
        zIndex: 2,
    },
    rowMobile: {
        flexDirection: 'column',
        gap: 0,
        marginBottom: 18,
    },
    noteCard: {
        backgroundColor: '#151a1e',
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#00ff88',
        padding: 24,
        alignItems: 'center',
        width: 140,
        minHeight: 110,
        justifyContent: 'center',
        shadowColor: '#00ff88',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
        marginHorizontal: 10,
        marginVertical: 0,
    },
    noteCardMobile: {
        width: 125,
        minHeight: 85,
        padding: 15,
        marginHorizontal: 0,
        marginVertical: 6,
    },
    label: {
        color: '#00ff88',
        fontSize: 16,
        marginTop: 8,
        marginBottom: 4,
        fontWeight: '600',
    },
    note: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 2,
        textShadowColor: '#00ff8850',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 7,
    },
    cupBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        marginHorizontal: 8,
    },
    cupImage: {
        width: 115,
        height: 120,
        opacity: 0.97,
    },
    cupImageMobile: {
        width: 70,
        height: 78,
        opacity: 0.97,
        marginVertical: 10,
    },
    badgeBlock: {
        marginTop: 24,
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
    },
    badgeTitle: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: '#0a6c3f',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
    badgeVisual: {
        alignItems: 'center',
        backgroundColor: '#141f1bcc',
        borderRadius: 26,
        padding: 28,
        marginTop: 8,
        shadowColor: '#00ff88',
        shadowOpacity: 0.17,
        shadowRadius: 18,
        elevation: 4,
        minWidth: 170,
        maxWidth: 300,
    },
    badgeImage: {
        width: 90,
        height: 90,
        marginBottom: 10,
        shadowColor: '#fff',
        shadowOpacity: Platform.OS === 'web' ? 0 : 0.25,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 0 },
    },
    badgeImageMobile: {
        width: 68,
        height: 68,
        marginBottom: 8,
        shadowColor: '#fff',
        shadowOpacity: 0,
    },
    badgeLabel: {
        fontSize: 27,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: '#222',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        letterSpacing: 1.5,
    },
    bigNote: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#00ff88',
        marginTop: 7,
        textShadowColor: '#0f0',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 7,
    },
});
