import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { getCoachMessagesPrives } from '@/helpers/messagesPrives.helper';
import { useCachedApi } from '@/hooks/useCachedApi';
import { Database } from '@/types/database.types';

export default function MessagesPrivesCoach() {
    const [coachId, setCoachId] = useState<string>();
    const [equipes, setEquipes] = useState<Database['public']['Tables']['equipes']['Row'][]>([]);
    const [joueurs, setJoueurs] = useState<
        // FIXME
        {
            prenom: any;
            nom: any;
            utilisateurs: {
                id: any;
            }[];
        }[]
    >([]);
    const [selectedEquipe, setSelectedEquipe] = useState<string>();
    const [selectedJoueurId, setSelectedJoueurId] = useState<string>();
    const [message, setMessage] = useState('');

    useEffect(() => {
        (async () => {
            const session = await supabase.auth.getSession();
            const userId = session.data.session?.user.id;
            setCoachId(userId);

            if (!userId) {
                return; // FIXME: gestion erreur
            }

            const { data: equipes } = await supabase
                .from('equipes')
                .select('*')
                .eq('coach_id', userId);
            setEquipes(equipes || []);
        })();
    }, []);

    useEffect(() => {
        if (selectedEquipe) {
            supabase
                .from('joueurs')
                .select('prenom, nom, utilisateurs(id)')
                .eq('equipe_id', selectedEquipe)
                .then(({ data }) => setJoueurs(data || []));
        }
    }, [selectedEquipe]);

    const [coachMessages, , fetchCoachMessages, refreshCoachMessages] = useCachedApi(
        `messages_prives_${coachId}_${selectedJoueurId}`,
        useCallback(async () => {
            if (!coachId || !selectedJoueurId) {
                return [];
            }
            const data = await getCoachMessagesPrives({ coachId });
            const messages = (data || []).filter(
                (message) =>
                    (message.emetteur_id === coachId &&
                        message.recepteur_id === selectedJoueurId) ||
                    (message.recepteur_id === coachId && message.emetteur_id === selectedJoueurId),
            );
            return messages || [];
        }, [coachId, selectedJoueurId]),
    );

    useEffect(() => {
        fetchCoachMessages();
    }, [fetchCoachMessages, selectedJoueurId]);

    const handleEnvoyer = async () => {
        if (!message.trim() || !selectedJoueurId) {
            return;
        }

        await supabase.from('messages_prives').insert({
            emetteur_id: coachId,
            recepteur_id: selectedJoueurId,
            auteur: 'coach',
            texte: message,
        });

        setMessage('');
        refreshCoachMessages();
    };

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>📩 Message privé à un joueur</Text>

                    <Text style={styles.label}>Sélectionne une équipe :</Text>
                    <View style={styles.selectWrap}>
                        {equipes.map((eq) => (
                            <Pressable
                                key={eq.id}
                                onPress={() => {
                                    setSelectedEquipe(eq.id);
                                    setSelectedJoueurId(undefined);
                                }}
                                style={[
                                    styles.equipeButton,
                                    selectedEquipe === eq.id && styles.equipeButtonSelected,
                                ]}
                            >
                                <Text style={styles.equipeText}>{eq.nom}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Sélectionne un joueur :</Text>
                    <View style={styles.selectWrap}>
                        {joueurs.map((joueur) => (
                            <Pressable
                                key={joueur.utilisateurs[0].id}
                                onPress={() => {
                                    setSelectedJoueurId(joueur.utilisateurs[0].id);
                                }}
                                style={[
                                    styles.equipeButton,
                                    selectedJoueurId === joueur.utilisateurs[0].id &&
                                        styles.equipeButtonSelected,
                                ]}
                            >
                                <Text style={styles.equipeText}>
                                    {joueur.prenom} {joueur.nom}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.filContainer}>
                        {(coachMessages || []).map((message) => (
                            <View
                                key={message.id}
                                style={[
                                    styles.bulle,
                                    message.auteur === 'coach' ? styles.coachMsg : styles.joueurMsg,
                                ]}
                            >
                                <Text style={styles.texte}>{message.texte}</Text>
                                <Text style={styles.meta}>
                                    {/* FIXME: ne devrait pas pouvoir être null */}
                                    {message.created_at &&
                                        new Date(message.created_at).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Ton message..."
                        placeholderTextColor="#777"
                        multiline
                        value={message}
                        onChangeText={setMessage}
                    />
                    <Pressable
                        onPress={handleEnvoyer}
                        disabled={selectedJoueurId === undefined || message.trim() === ''}
                        style={
                            selectedJoueurId === undefined || message.trim() === ''
                                ? styles.boutonDisabled
                                : styles.bouton
                        }
                    >
                        <Ionicons name="send" size={18} color="#111" />
                        <Text style={styles.boutonText}>Envoyer</Text>
                    </Pressable>
                </ScrollView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20 },
    title: { fontSize: 22, color: '#00ff88', textAlign: 'center', marginBottom: 20 },
    label: { color: '#aaa', marginBottom: 6 },
    selectWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    equipeButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00ff88',
        backgroundColor: '#1e1e1ecc',
    },
    equipeButtonSelected: { backgroundColor: '#00ff88' },
    equipeText: { color: '#fff', fontWeight: 'bold' },
    input: {
        backgroundColor: '#1e1e1ecc',
        borderColor: '#00ff88',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        marginBottom: 10,
        height: 80,
    },
    bouton: {
        backgroundColor: '#00ff88',
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    boutonDisabled: {
        backgroundColor: '#555',
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    boutonText: { color: '#111', fontWeight: 'bold' },
    filContainer: { marginVertical: 20 },
    bulle: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        maxWidth: '80%',
    },
    coachMsg: {
        backgroundColor: '#00ff8877',
        alignSelf: 'flex-end',
    },
    joueurMsg: {
        backgroundColor: '#333',
        alignSelf: 'flex-start',
    },
    texte: { color: '#fff' },
    meta: { color: '#aaa', fontSize: 11, marginTop: 4 },
});
