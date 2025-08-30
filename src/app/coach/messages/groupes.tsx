import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    StyleSheet,
    Pressable,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    deleteMessagesGroupeCoachOneWeekOld,
    getMessagesGroupeCoach,
    GetMessagesGroupeCoach,
    insertMessageGroupeCoach,
} from '@/helpers/messagesGroupeCoach.helpers';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import { useSession } from '@/hooks/useSession';
import { GetCoachEquipes, getCoachEquipes } from '@/helpers/equipes.helpers';
import { insertReponsesMessagesJoueur } from '@/helpers/reponsesMessagesJoueur.helpers';
import { formatDateForDisplay } from '@/utils/date.utils';

export default function MessagesGroupesCoach() {
    const [equipes, setEquipes] = useState<GetCoachEquipes>([]);
    const [equipeId, setEquipeId] = useState('');
    const [messagesGroupeCoach, setMessagesGroupeCoach] = useState<GetMessagesGroupeCoach>([]);
    const [message, setMessage] = useState('');
    const [reponseText, setReponseText] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    useEffectOnce(() => {
        deleteMessagesGroupeCoachOneWeekOld();
    });

    const fetchEquipes = useCallback(async () => {
        if (!utilisateur?.club_id) {
            return;
        }

        const fetchedEquipes = await getCoachEquipes({
            coachId: utilisateur.id,
            clubId: utilisateur.club_id,
        });

        setEquipes(fetchedEquipes);
    }, [utilisateur?.club_id, utilisateur?.id]);

    useEffect(() => {
        fetchEquipes();
    }, [fetchEquipes]);

    const fetchMessagesGroupeCoach = useCallback(async () => {
        if (!equipeId || loading) {
            return;
        }

        setLoading(true);

        const fetchedMessagesGroupeCoach = await getMessagesGroupeCoach({ equipeId });

        setMessagesGroupeCoach(fetchedMessagesGroupeCoach);
        setLoading(false);
    }, [equipeId, loading]);

    useEffect(() => {
        fetchMessagesGroupeCoach();
    }, [fetchMessagesGroupeCoach]);

    const envoyerMessage = useCallback(async () => {
        if (!message || !equipeId || !utilisateur?.id) {
            return;
        }

        await insertMessageGroupeCoach({
            dataToInsert: {
                equipe_id: equipeId,
                coach_id: utilisateur.id,
                titre: 'Message important',
                contenu: message,
            },
        });

        setMessage('');
        fetchMessagesGroupeCoach();
    }, [message, equipeId, utilisateur?.id, fetchMessagesGroupeCoach]);

    const envoyerReponse = useCallback(
        async (msgId: string) => {
            const contenu = reponseText[msgId];

            if (!contenu || !utilisateur?.id) {
                return;
            }

            await insertReponsesMessagesJoueur({
                dataToInsert: {
                    message_id: msgId,
                    joueur_id: utilisateur.id,
                    texte: contenu,
                },
            });

            fetchMessagesGroupeCoach();
        },
        [reponseText, utilisateur?.id, fetchMessagesGroupeCoach],
    );

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
                        {messagesGroupeCoach.map((message) => (
                            <View key={message.id} style={styles.card}>
                                <Text style={styles.messageTitle}>{message.titre}</Text>
                                <Text style={styles.messageContent}>{message.contenu}</Text>
                                <Text style={styles.messageMeta}>
                                    📅 {formatDateForDisplay({ date: message.created_at })}
                                </Text>
                                {message.reponses_messages_joueur.map((reponse, i) => (
                                    <Text key={i} style={styles.reponse}>
                                        🧒 {reponse.texte}
                                    </Text>
                                ))}
                                <TextInput
                                    placeholder="Répondre à tous..."
                                    placeholderTextColor="#777"
                                    value={reponseText[message.id] || ''}
                                    onChangeText={(txt) =>
                                        setReponseText((prev) => ({ ...prev, [message.id]: txt }))
                                    }
                                    style={styles.input}
                                />
                                <Pressable
                                    onPress={() => envoyerReponse(message.id)}
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
