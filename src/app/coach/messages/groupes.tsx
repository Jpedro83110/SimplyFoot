import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
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

export default function MessagesGroupesCoach() {
    const [equipes, setEquipes] = useState<GetCoachEquipes | undefined>(undefined);
    const [selectedEquipeId, setSelectedEquipeId] = useState<string | undefined>(undefined);
    const [messagesGroupeCoach, setMessagesGroupeCoach] = useState<
        GetMessagesGroupeCoach | undefined
    >(undefined);
    const [titre, setTitre] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    useEffectOnce(() => {
        deleteMessagesGroupeCoachOneWeekOld();
    });

    const fetchEquipes = async (coachId: string, clubId: string) => {
        const fetchedEquipes = await getCoachEquipes({
            coachId,
            clubId,
        });

        setEquipes(fetchedEquipes);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || equipes) {
            return;
        }

        fetchEquipes(utilisateur.id, utilisateur.club_id);
    }, [equipes, utilisateur?.club_id, utilisateur?.id]);

    const fetchMessagesGroupeCoach = async (equipeId: string) => {
        setLoading(true);

        const fetchedMessagesGroupeCoach = await getMessagesGroupeCoach({ equipeId });

        setMessagesGroupeCoach(fetchedMessagesGroupeCoach);
        setLoading(false);
    };

    useEffect(() => {
        if (!selectedEquipeId || loading || messagesGroupeCoach) {
            return;
        }

        fetchMessagesGroupeCoach(selectedEquipeId);
    }, [selectedEquipeId, loading, messagesGroupeCoach]);

    const envoyerMessage = useCallback(async () => {
        if (!message || !selectedEquipeId || !utilisateur?.id) {
            return;
        }

        await insertMessageGroupeCoach({
            messageGroupeCoach: {
                equipe_id: selectedEquipeId,
                coach_id: utilisateur.id,
                titre,
                contenu: message,
            },
        });

        setTitre('');
        setMessage('');
        setMessagesGroupeCoach(undefined);
        fetchMessagesGroupeCoach(selectedEquipeId);
    }, [titre, message, selectedEquipeId, utilisateur?.id]);

    return (
        <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>💬 Messagerie de groupe</Text>
                <View style={styles.selectWrap}>
                    {equipes?.map((eq) => (
                        <Pressable
                            key={eq.id}
                            onPress={() => {
                                setSelectedEquipeId(eq.id);
                                setMessagesGroupeCoach(undefined);
                            }}
                            style={[
                                styles.equipeButton,
                                selectedEquipeId === eq.id && styles.equipeButtonSelected,
                            ]}
                        >
                            <Text style={styles.equipeText}>{eq.nom}</Text>
                        </Pressable>
                    ))}
                </View>
                <TextInput
                    placeholder="Titre du message"
                    placeholderTextColor="#777"
                    style={styles.input}
                    value={titre}
                    onChangeText={setTitre}
                />
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
                    {messagesGroupeCoach?.map((message) => (
                        <View key={message.id} style={styles.card}>
                            <Text style={styles.messageTitle}>{message.titre}</Text>
                            <Text style={styles.messageContent}>{message.contenu}</Text>
                            <Text style={styles.messageMeta}>
                                📅{' '}
                                {message.created_at &&
                                    new Date(message.created_at).toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
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
