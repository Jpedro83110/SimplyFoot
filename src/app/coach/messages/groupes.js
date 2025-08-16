import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    StyleSheet,
    Pressable,
    Alert,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import useCacheData from '../../../lib/cache';

export default function MessagesGroupesCoach() {
    const [coachId, setCoachId] = useState(null);
    const [equipes, setEquipes] = useState([]);
    const [equipeId, setEquipeId] = useState('');
    const [message, setMessage] = useState('');
    const [reponses, setReponses] = useState({});
    const [reponseText, setReponseText] = useState({});
    const [, setLoading] = useState(false); // FIXME

    // Purge tous les messages de groupe de +7j à chaque ouverture
    useEffect(() => {
        const purgeOldMessagesGroupe = async () => {
            const septJours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            await supabase.from('messages_groupe_coach').delete().lt('created_at', septJours);
        };
        purgeOldMessagesGroupe();
    }, []);

    useEffect(() => {
        (async () => {
            const session = await supabase.auth.getSession();
            const id = session.data.session.user.id;
            setCoachId(id);
            const { data: eqs } = await supabase.from('equipes').select('*').eq('coach_id', id);
            setEquipes(eqs || []);
        })();
    }, []);

    // Gestion du cache pour messages d'équipe
    const cacheKey = equipeId ? `messages_groupes_${equipeId}` : null;
    const [cachedMsgs, refreshMsgs] = useCacheData(
        cacheKey,
        async () => {
            if (!equipeId) {
                return [];
            }
            const septJours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data: msgs } = await supabase
                .from('messages_groupe_coach')
                .select('*')
                .eq('equipe_id', equipeId)
                .gte('created_at', septJours)
                .order('created_at', { ascending: true });
            return msgs || [];
        },
        30, // TTL du cache en secondes
    );

    useEffect(() => {
        if (equipeId) {
            setLoading(true);
            refreshMsgs().then(() => setLoading(false));
        }
    }, [equipeId, refreshMsgs]);

    // Chargement des réponses liées aux messages
    useEffect(() => {
        async function fetchReponses() {
            if (cachedMsgs && cachedMsgs.length) {
                const { data: reps } = await supabase
                    .from('reponses_messages_joueur')
                    .select('*')
                    .in(
                        'message_id',
                        cachedMsgs.map((m) => m.id),
                    )
                    .order('created_at', { ascending: true });
                const regroupees = {};
                for (let rep of reps || []) {
                    if (!regroupees[rep.message_id]) {
                        regroupees[rep.message_id] = [];
                    }
                    regroupees[rep.message_id].push(rep);
                }
                setReponses(regroupees);
            } else {
                setReponses({});
            }
        }
        fetchReponses();
    }, [cachedMsgs]);

    const envoyerMessage = async () => {
        if (!message.trim() || !equipeId) {
            return;
        }
        await supabase.from('messages_groupe_coach').insert({
            equipe_id: equipeId,
            coach_id: coachId,
            titre: 'Message important',
            contenu: message,
        });
        setMessage('');
        refreshMsgs();
    };

    const envoyerReponse = async (msgId) => {
        const contenu = reponseText[msgId];
        if (!contenu || !contenu.trim()) {
            return;
        }

        const { error } = await supabase.from('reponses_messages_joueur').insert({
            message_id: msgId,
            coach_id: coachId,
            texte: contenu,
            auteur: 'coach',
        });

        if (!error) {
            setReponseText((prev) => ({ ...prev, [msgId]: '' }));
            refreshMsgs();
        } else {
            Alert.alert('Erreur', error.message);
        }
    };

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>💬 Messagerie de groupe</Text>
                    <View style={styles.selectWrap}>
                        {equipes.map((eq) => (
                            <Pressable
                                key={eq.id}
                                onPress={() => setEquipeId(eq.id)}
                                style={[
                                    styles.equipeButton,
                                    equipeId === eq.id && styles.equipeButtonSelected,
                                ]}
                            >
                                <Text style={styles.equipeText}>{eq.nom}</Text>
                            </Pressable>
                        ))}
                    </View>
                    <TextInput
                        placeholder="Ton message pour l'équipe..."
                        placeholderTextColor="#777"
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                    />
                    <Pressable onPress={envoyerMessage} style={styles.bouton}>
                        <Ionicons name="send" size={18} color="#111" />
                        <Text style={styles.boutonText}>Envoyer</Text>
                    </Pressable>
                    <View style={{ marginTop: 30 }}>
                        {(cachedMsgs || []).map((msg) => (
                            <View key={msg.id} style={styles.card}>
                                <Text style={styles.messageTitle}>{msg.titre}</Text>
                                <Text style={styles.messageContent}>{msg.contenu}</Text>
                                <Text style={styles.messageMeta}>
                                    📅 {new Date(msg.created_at).toLocaleString()}
                                </Text>
                                {reponses[msg.id]?.map((rep, i) => (
                                    <Text key={i} style={styles.reponse}>
                                        🧒 {rep.texte}
                                    </Text>
                                ))}
                                <TextInput
                                    placeholder="Répondre à tous..."
                                    placeholderTextColor="#777"
                                    value={reponseText[msg.id] || ''}
                                    onChangeText={(txt) =>
                                        setReponseText((prev) => ({ ...prev, [msg.id]: txt }))
                                    }
                                    style={styles.input}
                                />
                                <Pressable
                                    onPress={() => envoyerReponse(msg.id)}
                                    style={styles.bouton}
                                >
                                    <Ionicons name="send" size={18} color="#111" />
                                    <Text style={styles.boutonText}>Répondre</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20 },
    title: { fontSize: 22, color: '#00ff88', textAlign: 'center', marginBottom: 20 },
    selectWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    equipeButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00ff88',
        backgroundColor: '#1e1e1e',
    },
    equipeButtonSelected: {
        backgroundColor: '#00ff88',
    },
    equipeText: { color: '#fff', fontWeight: 'bold' },
    input: {
        backgroundColor: '#1e1e1e',
        borderColor: '#00ff88',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        marginBottom: 10,
    },
    bouton: {
        backgroundColor: '#00ff88',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    boutonText: { color: '#111', fontWeight: 'bold' },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    messageTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    messageContent: { color: '#ccc', fontSize: 14, marginBottom: 6 },
    messageMeta: { color: '#888', fontSize: 12, marginBottom: 10 },
    reponse: { color: '#00ff88', fontSize: 13, marginBottom: 4 },
});
