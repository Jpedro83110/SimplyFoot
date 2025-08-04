import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';

const GREEN = '#00ff88';
const DARK = '#101415';

export default function MessagesGroupesJoueur() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setReponses] = useState({}); // FIXME
    const [, setJoueurId] = useState(null); // FIXME
    const [, setEquipeId] = useState(null); // FIXME

    // Purge tous les messages de groupe de +7j à chaque ouverture
    useEffect(() => {
        const purgeOldMessagesGroupe = async () => {
            const septJours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            await supabase.from('messages_groupe_coach').delete().lt('created_at', septJours);
        };
        purgeOldMessagesGroupe();
    }, []);

    useEffect(() => {
        async function fetchInfos() {
            const session = await supabase.auth.getSession();
            const userId = session.data.session.user.id;
            setJoueurId(userId);

            const { data: user } = await supabase
                .from('utilisateurs')
                .select('joueur_id')
                .eq('id', userId)
                .single();
            if (!user?.joueur_id) return;
            const { data: joueur } = await supabase
                .from('joueurs')
                .select('equipe_id')
                .eq('id', user.joueur_id)
                .single();
            setEquipeId(joueur?.equipe_id);

            fetchMessages(joueur?.equipe_id);
        }
        fetchInfos();
    }, []);

    const fetchMessages = async (equipeId) => {
        const septJours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: msgs } = await supabase
            .from('messages_groupe_coach')
            .select('*')
            .eq('equipe_id', equipeId)
            .gte('created_at', septJours)
            .order('created_at', { ascending: true });
        setMessages(msgs || []);
        setLoading(false);

        if (msgs && msgs.length) {
            const { data: reps } = await supabase
                .from('reponses_messages_joueur')
                .select('*')
                .in(
                    'message_id',
                    msgs.map((m) => m.id),
                )
                .order('created_at', { ascending: true });
            const regroupees = {};
            for (let rep of reps || []) {
                if (!regroupees[rep.message_id]) regroupees[rep.message_id] = [];
                regroupees[rep.message_id].push(rep);
            }
            setReponses(regroupees);
        }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color="#00ff88" size="large" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../../../assets/messagerie-fond.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>💬 Messages de groupe</Text>
                    <Text style={styles.info}>
                        La messagerie de groupe permet au coach de communiquer des informations à
                        toute l&apos;équipe. Les joueurs ne peuvent pas répondre ici.
                    </Text>
                    {messages.length === 0 && (
                        <Text style={styles.noMessages}>
                            Aucun message de groupe pour ton équipe.
                        </Text>
                    )}
                    {messages.map((msg) => (
                        <View key={msg.id} style={styles.card}>
                            <Text style={styles.messageTitle}>{msg.titre}</Text>
                            <Text style={styles.messageContent}>{msg.contenu}</Text>
                            <Text style={styles.messageMeta}>
                                📅 {new Date(msg.created_at).toLocaleString()}
                            </Text>
                        </View>
                    ))}
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
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: GREEN,
        textAlign: 'center',
        marginBottom: 20,
    },
    info: {
        color: '#bbb',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 18,
        marginHorizontal: 8,
    },
    noMessages: {
        color: '#aaa',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    messageTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    messageContent: {
        color: '#ccc',
        fontSize: 15,
        marginBottom: 6,
    },
    messageMeta: {
        color: '#888',
        fontSize: 12,
        marginBottom: 2,
    },
});
