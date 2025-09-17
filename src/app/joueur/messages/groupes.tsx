import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_BLACK_900, COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import {
    deleteMessagesGroupeCoachOneWeekOld,
    getMessagesGroupeCoach,
    GetMessagesGroupeCoach,
} from '@/helpers/messagesGroupeCoach.helpers';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import { useSession } from '@/hooks/useSession';

export default function MessagesGroupesJoueur() {
    const [messagesGroupeCoach, setMessagesGroupeCoach] = useState<
        GetMessagesGroupeCoach | undefined
    >(undefined);
    const [loading, setLoading] = useState(false);

    const { joueur } = useSession();

    useEffectOnce(() => {
        deleteMessagesGroupeCoachOneWeekOld();
    });

    const fetchMessagesGroupeCoach = async (equipeId: string) => {
        setLoading(true);

        const fetchedMessagesGroupeCoach = await getMessagesGroupeCoach({ equipeId });

        setMessagesGroupeCoach(fetchedMessagesGroupeCoach);
        setLoading(false);
    };

    useEffect(() => {
        if (!joueur?.equipe_id || loading || messagesGroupeCoach) {
            return;
        }

        fetchMessagesGroupeCoach(joueur.equipe_id);
    }, [joueur?.equipe_id, loading, messagesGroupeCoach]);

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={COLOR_GREEN_300} size="large" />
            </View>
        );
    }

    return (
        <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>💬 Messages de groupe</Text>
                <Text style={styles.info}>
                    La messagerie de groupe permet au coach de communiquer des informations à toute
                    l&apos;équipe. Les joueurs ne peuvent pas répondre ici.
                </Text>
                {(!messagesGroupeCoach || messagesGroupeCoach.length === 0) && (
                    <Text style={styles.noMessages}>Aucun message de groupe pour ton équipe.</Text>
                )}
                {messagesGroupeCoach?.map((message) => (
                    <View key={message.id} style={styles.card}>
                        <Text style={styles.messageTitle}>{message.titre}</Text>
                        <Text style={styles.messageContent}>{message.contenu}</Text>
                        <Text style={styles.messageMeta}>
                            📅 {message.created_at && new Date(message.created_at).toLocaleString()}
                        </Text>
                    </View>
                ))}
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
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
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
        borderLeftColor: COLOR_GREEN_300,
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
