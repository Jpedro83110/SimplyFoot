import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    deleteMessagesPrivesOneWeekOld,
    getJoueurMessagesPrivesWithCoach,
    GetJoueurMessagesPrivesWithCoach,
    insertMessagePrive,
} from '@/helpers/messagesPrives.helpers';
import { COLOR_BLACK_900, COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { useSession } from '@/hooks/useSession';
import useEffectOnce from 'react-use/lib/useEffectOnce';

export default function MessagesPrivesJoueur() {
    const [messagesPrives, setMessagesPrives] = useState<
        GetJoueurMessagesPrivesWithCoach | undefined
    >(undefined);
    const [message, setMessage] = useState('');

    const { utilisateur, joueur } = useSession();

    useEffectOnce(() => {
        const purgeOldMessages = async () => {
            await deleteMessagesPrivesOneWeekOld();
        };
        purgeOldMessages();
    });

    const fetchMessagesPrives = async (joueurId: string, equipeId: string) => {
        const fetchedMessagesPrives = await getJoueurMessagesPrivesWithCoach({
            joueurId,
            equipeId,
        });

        setMessagesPrives(fetchedMessagesPrives);
    };

    useEffect(() => {
        if (!utilisateur?.id || !joueur?.equipe_id || messagesPrives) {
            return;
        }

        fetchMessagesPrives(utilisateur.id, joueur.equipe_id);
    }, [utilisateur?.id, messagesPrives, joueur?.equipe_id]);

    const handleEnvoyer = useCallback(async () => {
        if (!message.trim() || !utilisateur?.id || !joueur?.equipe_id) {
            return;
        }

        await insertMessagePrive({
            dataToInsert: {
                emetteur_id: utilisateur?.id,
                recepteur_id: messagesPrives?.coachId,
                auteur: 'joueur',
                texte: message,
            },
        });

        setMessage('');
        fetchMessagesPrives(utilisateur.id, joueur.equipe_id);
    }, [joueur?.equipe_id, message, messagesPrives?.coachId, utilisateur?.id]);

    return (
        <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>📩 Messages privés avec ton coach</Text>
                <View style={styles.filContainer}>
                    {messagesPrives?.messages.map((messagePrive) => (
                        <View
                            key={messagePrive.id}
                            style={[
                                styles.bulle,
                                messagePrive.auteur === 'coach'
                                    ? styles.coachMsg
                                    : styles.joueurMsg,
                            ]}
                        >
                            <Text style={styles.texte}>{messagePrive.texte}</Text>
                            <Text style={styles.meta}>
                                {messagePrive.created_at &&
                                    new Date(messagePrive.created_at).toLocaleString()}
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
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLOR_BLACK_900,
        flex: 1,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    title: { fontSize: 22, color: COLOR_GREEN_300, textAlign: 'center', marginBottom: 20 },
    filContainer: { marginVertical: 20 },
    bulle: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        maxWidth: '80%',
    },
    coachMsg: {
        backgroundColor: '#333',
        alignSelf: 'flex-start',
    },
    joueurMsg: {
        backgroundColor: '#00ff8877',
        alignSelf: 'flex-end',
    },
    texte: { color: '#fff' },
    meta: { color: '#aaa', fontSize: 11, marginTop: 4 },
    input: {
        backgroundColor: '#1e1e1ecc',
        borderColor: COLOR_GREEN_300,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        marginBottom: 10,
        height: 80,
    },
    bouton: {
        backgroundColor: COLOR_GREEN_300,
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    boutonText: { color: '#111', fontWeight: 'bold' },
});
