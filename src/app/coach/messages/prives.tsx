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
import {
    GetCoachMessagesPrivesWithJoueur,
    getCoachMessagesPrivesWithJoueur,
    insertMessagePrive,
} from '@/helpers/messagesPrives.helpers';
import { useSession } from '@/hooks/useSession';
import { getCoachEquipesWithJoueurs, GetCoachEquipesWithJoueurs } from '@/helpers/equipes.helpers';
import { v4 as uuidv4 } from 'uuid';

export default function MessagesPrivesCoach() {
    const [equipesWithJoueurs, setEquipesWithJoueurs] = useState<GetCoachEquipesWithJoueurs>([]);
    const [messagesPrives, setMessagesPrives] = useState<GetCoachMessagesPrivesWithJoueur>([]);
    const [selectedEquipe, setSelectedEquipe] = useState<GetCoachEquipesWithJoueurs[number]>();
    const [selectedJoueurId, setSelectedJoueurId] = useState<string>();
    const [message, setMessage] = useState('');

    const { utilisateur } = useSession();

    const fetchEquipesWithJoueurs = useCallback(async () => {
        if (!utilisateur?.club_id) {
            return;
        }

        const fetchedEquipesWithJoueurs = await getCoachEquipesWithJoueurs({
            coachId: utilisateur.id,
            clubId: utilisateur.club_id,
        });

        setEquipesWithJoueurs(fetchedEquipesWithJoueurs);
    }, [utilisateur?.club_id, utilisateur?.id]);

    useEffect(() => {
        fetchEquipesWithJoueurs();
    }, [fetchEquipesWithJoueurs]);

    const fetchMessagesPrives = useCallback(async () => {
        if (!utilisateur?.id || !selectedJoueurId) {
            return;
        }

        const fetchedMessagesPrives = await getCoachMessagesPrivesWithJoueur({
            coachId: utilisateur.id,
            joueurId: selectedJoueurId,
        });
        setMessagesPrives(fetchedMessagesPrives);
    }, [utilisateur?.id, selectedJoueurId]);

    useEffect(() => {
        fetchMessagesPrives();
    }, [fetchMessagesPrives]);

    const handleEnvoyer = async () => {
        if (!utilisateur?.id || !selectedJoueurId) {
            return;
        }

        await insertMessagePrive({
            dataToInsert: {
                emetteur_id: utilisateur.id,
                recepteur_id: selectedJoueurId,
                auteur: 'coach',
                texte: message,
            },
        });

        setMessage('');
        setMessagesPrives((prev) => [
            ...prev,
            {
                // generate random uuid, we don't need the real id here
                // we wan't to avoid send request to refresh conversation
                id: uuidv4(),
                emetteur_id: utilisateur.id,
                recepteur_id: selectedJoueurId,
                auteur: 'coach',
                texte: message,
                created_at: new Date().toISOString(),
            },
        ]);
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
                        {equipesWithJoueurs.map((equipe) => (
                            <Pressable
                                key={equipe.id}
                                onPress={() => {
                                    setSelectedEquipe(equipe);
                                    setSelectedJoueurId(undefined);
                                }}
                                style={[
                                    styles.equipeButton,
                                    selectedEquipe?.id === equipe.id && styles.equipeButtonSelected,
                                ]}
                            >
                                <Text style={styles.equipeText}>{equipe.nom}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {selectedEquipe && selectedEquipe.joueurs.length === 0 ? (
                        <>
                            <Text style={styles.label}>Sélectionne un joueur :</Text>
                            <View style={styles.selectWrap}>
                                {selectedEquipe.joueurs.map((joueur) => (
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
                                            {joueur.utilisateurs[0].prenom}{' '}
                                            {joueur.utilisateurs[0].nom}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    ) : (
                        <Text style={styles.label}>
                            Il n&apos;y a pas de joueurs dans cette équipe.
                        </Text>
                    )}

                    <View style={styles.filContainer}>
                        {messagesPrives.map((message) => (
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
