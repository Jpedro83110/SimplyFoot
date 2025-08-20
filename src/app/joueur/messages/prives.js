import React, { useEffect, useState } from 'react';
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
import { deleteMessagesPrivesOneWeekOld } from '@/helpers/messagesPrives.helpers';

const DARK = '#101415';

export default function MessagesPrivesJoueur() {
    const [joueurId, setJoueurId] = useState(null);
    const [coachId, setCoachId] = useState(null);
    const [filMessages, setFilMessages] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const purgeOldMessages = async () => {
            await deleteMessagesPrivesOneWeekOld();
        };
        purgeOldMessages();
    }, []);

    useEffect(() => {
        (async () => {
            const session = await supabase.auth.getSession();
            const userId = session.data.session.user.id;
            setJoueurId(userId);

            // Trouve le coach associé à l'équipe du joueur
            const { data: user } = await supabase
                .from('utilisateurs')
                .select('joueur_id')
                .eq('id', userId)
                .single();
            if (!user?.joueur_id) {
                return;
            }
            const { data: joueur } = await supabase
                .from('joueurs')
                .select('equipe_id')
                .eq('id', user.joueur_id)
                .single();
            if (!joueur?.equipe_id) {
                return;
            }
            const { data: equipe } = await supabase
                .from('equipes')
                .select('coach_id')
                .eq('id', joueur.equipe_id)
                .single();
            setCoachId(equipe?.coach_id);

            fetchMessages(userId, equipe?.coach_id);
        })();
    }, []);

    const fetchMessages = async (joueurId, coachId) => {
        const septJours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
            .from('messages_prives')
            .select('*')
            .or(`emetteur_id.eq.${joueurId},recepteur_id.eq.${joueurId}`)
            .order('created_at', { ascending: true });

        const messages = (data || []).filter(
            (msg) =>
                ((msg.emetteur_id === joueurId && msg.recepteur_id === coachId) ||
                    (msg.recepteur_id === joueurId && msg.emetteur_id === coachId)) &&
                new Date(msg.created_at) >= new Date(septJours),
        );
        setFilMessages(messages || []);
    };

    const handleEnvoyer = async () => {
        if (!message.trim() || !coachId) {
            return;
        }
        await supabase.from('messages_prives').insert({
            emetteur_id: joueurId,
            recepteur_id: coachId,
            auteur: 'joueur',
            texte: message,
        });
        setMessage('');
        fetchMessages(joueurId, coachId);
    };

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>📩 Messages privés avec ton coach</Text>
                    <View style={styles.filContainer}>
                        {filMessages.map((msg) => (
                            <View
                                key={msg.id}
                                style={[
                                    styles.bulle,
                                    msg.auteur === 'coach' ? styles.coachMsg : styles.joueurMsg,
                                ]}
                            >
                                <Text style={styles.texte}>{msg.texte}</Text>
                                <Text style={styles.meta}>
                                    {new Date(msg.created_at).toLocaleString()}
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
                    <Pressable onPress={handleEnvoyer} style={styles.bouton}>
                        <Ionicons name="send" size={18} color="#111" />
                        <Text style={styles.boutonText}>Envoyer</Text>
                    </Pressable>
                </ScrollView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: DARK,
        flex: 1,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    title: { fontSize: 22, color: '#00ff88', textAlign: 'center', marginBottom: 20 },
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
    boutonText: { color: '#111', fontWeight: 'bold' },
});
