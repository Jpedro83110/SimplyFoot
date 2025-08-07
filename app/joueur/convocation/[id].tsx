import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Switch,
    Linking,
    Platform,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Ionicons } from '@expo/vector-icons';
import { getEvenementInfosByUtilisateurId } from '@/helpers/evenements.helper';
import { ParticipationsEvenementReponse } from '@/types/ParticipationsEvenement';
import { EvenementInfos } from '@/types/Evenement';

dayjs.locale('fr');

export default function ConvocationReponse() {
    const { id: evenementId }: { id: string } = useLocalSearchParams();
    const [evenementInfos, setEvenementInfos] = useState<EvenementInfos>();

    const [loading, setLoading] = useState(true);
    const [besoinTransport, setBesoinTransport] = useState(false);
    const [reponseLoading, setReponseLoading] = useState(false);
    const [showTransportModal, setShowTransportModal] = useState(false);

    // Pour la messagerie transport
    const [nouvelleAdresse, setNouvelleAdresse] = useState('');
    const [nouvelleHeure, setNouvelleHeure] = useState('');
    const [sendingProposition, setSendingProposition] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const session = await supabase.auth.getSession();
                const utilisateurId = session.data.session?.user?.id;

                if (!utilisateurId) {
                    throw new Error('Utilisateur non trouvé.');
                }

                const fetchedEvenementInfos = await getEvenementInfosByUtilisateurId({
                    evenementId,
                    utilisateurId,
                });

                console.log('Fetched Evenement Infos:', fetchedEvenementInfos);

                setEvenementInfos(fetchedEvenementInfos);
            } catch (error) {
                Alert.alert(
                    'Erreur',
                    `Impossible de charger la convocation: ${(error as Error).message}`,
                );
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [evenementId]);

    // Réponse à la convocation
    const envoyerReponse = async (valeur: ParticipationsEvenementReponse) => {
        try {
            setReponseLoading(true);

            const utilisateurId = evenementInfos?.participations_evenement[0]?.utilisateurs[0]?.id;
            const accepteTransport =
                evenementInfos?.participations_evenement[0]?.utilisateurs[0]?.joueurs[0]
                    ?.decharges_generales[0]?.accepte_transport;

            if (!utilisateurId || !evenementId || !valeur) {
                Alert.alert('Erreur', 'Données manquantes (utilisateur ou événement).');
                setReponseLoading(false);
                return;
            }

            const besoinTransportFinal =
                accepteTransport && besoinTransport && valeur === 'present';

            const { error } = await supabase.from('participations_evenement').upsert(
                [
                    {
                        utilisateur_id: utilisateurId,
                        evenement_id: evenementId,
                        reponse: valeur,
                        besoin_transport: besoinTransportFinal,
                    },
                ],
                { onConflict: 'utilisateur_id,evenement_id' },
            );

            if (error) {
                Alert.alert('Erreur', error.message || "Erreur lors de l'envoi.");
                setReponseLoading(false);
                return;
            }

            setBesoinTransport(besoinTransportFinal);
            setReponseLoading(false);
            // await fetchTransportMessages(); // FIXME
            Alert.alert('✅ Réponse enregistrée !');
        } catch (error) {
            setReponseLoading(false);
            Alert.alert('Erreur', `Erreur critique dans l'envoi: ${(error as Error).message}`);
        }
    };

    const envoyerDemandeTransport = async () => {
        if (!nouvelleAdresse || !nouvelleHeure) {
            Alert.alert("Merci de remplir le lieu et l'heure.");
            return;
        }
        try {
            setSendingProposition(true);

            const utilisateurId = evenementInfos?.participations_evenement[0]?.utilisateurs[0]?.id;
            const { error } = await supabase.from('messages_besoin_transport').insert({
                evenement_id: evenementId,
                utilisateur_id: utilisateurId,
                adresse_demande: nouvelleAdresse,
                heure_demande: nouvelleHeure,
                etat: 'en_attente',
                created_at: new Date(),
            });

            if (error) {
                Alert.alert('Erreur', 'Insertion échouée : ' + error.message);
            } else {
                setShowTransportModal(false);
                setNouvelleAdresse('');
                setNouvelleHeure('');
                Alert.alert('✅ Demande envoyée à la messagerie transport !');
                // await fetchTransportMessages(); // FIXME
            }
        } catch (error) {
            Alert.alert('Erreur', (error as Error).message);
        } finally {
            setSendingProposition(false);
        }
    };

    // Propositions et signatures
    const proposerLieuHeure = async (messageBesoinTransportId: string) => {
        try {
            setSendingProposition(true);
            const { error } = await supabase
                .from('messages_besoin_transport')
                .update({
                    adresse_demande: nouvelleAdresse,
                    heure_demande: nouvelleHeure,
                    etat: 'proposition_faite',
                })
                .eq('id', messageBesoinTransportId);
            if (error) throw error;
            setNouvelleAdresse('');
            setNouvelleHeure('');
            // await fetchTransportMessages(); // FIXME
        } catch (error) {
            Alert.alert('Erreur', (error as Error).message);
        } finally {
            setSendingProposition(false);
        }
    };

    const signerTransport = async (
        messageBesoinTransportId: string,
        qui: 'demandeur' | 'conducteur',
    ) => {
        try {
            let fields = {};
            if (qui === 'demandeur') {
                fields = {
                    signature_demandeur: true,
                    signature_demandeur_date: new Date(),
                    etat: 'proposition_faite',
                };
            }
            if (qui === 'conducteur') {
                fields = {
                    signature_conducteur: true,
                    signature_conducteur_date: new Date(),
                    etat: 'signe',
                };
            }
            const { error } = await supabase
                .from('messages_besoin_transport')
                .update(fields)
                .eq('id', messageBesoinTransportId);
            if (error) throw error;
            // await fetchTransportMessages(); // FIXME
        } catch (error) {
            Alert.alert('Erreur', (error as Error).message);
        }
    };

    if (loading || !event)
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
                <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
                    Chargement de l&apos;événement...
                </Text>
            </View>
        );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{evenementInfos?.titre}</Text>
            <Text style={styles.info}>
                📅 {dayjs(evenementInfos?.date).format('dddd D MMMM YYYY')} à{' '}
                {evenementInfos?.heure}
            </Text>
            <Text style={styles.info}>📍 {evenementInfos?.lieu}</Text>
            {evenementInfos?.lieu_complement && (
                <Text style={[styles.info, { fontStyle: 'italic', color: '#8fd6ff' }]}>
                    🏟️ {evenementInfos.lieu_complement}
                </Text>
            )}

            {evenementInfos?.meteo && (
                <Text style={[styles.info, { color: '#62d4ff', fontWeight: '700' }]}>
                    <Ionicons name="cloud-outline" size={16} color="#62d4ff" />{' '}
                    {evenementInfos.meteo}
                </Text>
            )}

            {/* Debug info */}
            <Text style={styles.debugText}>
                Réponse actuelle: {evenementInfos?.participations_evenement[0].reponse || 'Aucune'}{' '}
                | Transport: {besoinTransport ? 'Oui' : 'Non'}
            </Text>

            {evenementInfos?.latitude && evenementInfos?.longitude && (
                <TouchableOpacity
                    style={{
                        marginTop: 8,
                        alignSelf: 'center',
                        backgroundColor: '#181f22',
                        borderRadius: 8,
                        paddingHorizontal: 13,
                        paddingVertical: 6,
                    }}
                    onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${evenementInfos.latitude},${evenementInfos.longitude}`;
                        if (Platform.OS === 'web') window.open(url, '_blank');
                        else Linking.openURL(url);
                    }}
                >
                    <Text style={{ color: '#00ff88', fontSize: 14 }}>
                        <Ionicons name="navigate-outline" size={15} color="#00ff88" /> Voir sur
                        Google Maps
                    </Text>
                </TouchableOpacity>
            )}

            <Text style={styles.section}>Ta réponse :</Text>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        evenementInfos?.participations_evenement[0].reponse === 'present' &&
                            styles.selected,
                    ]}
                    onPress={() => {
                        setBesoinTransport(false);
                        envoyerReponse('present');
                    }}
                    disabled={reponseLoading}
                >
                    <Text
                        style={[
                            styles.buttonText,
                            evenementInfos?.participations_evenement[0].reponse === 'present' && {
                                color: '#111',
                            },
                        ]}
                    >
                        {reponseLoading ? '...' : '✅ Présent'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        evenementInfos?.participations_evenement[0].reponse === 'absent' &&
                            styles.selected,
                    ]}
                    onPress={() => {
                        setBesoinTransport(false);
                        envoyerReponse('absent');
                    }}
                    disabled={reponseLoading}
                >
                    <Text
                        style={[
                            styles.buttonText,
                            evenementInfos?.participations_evenement[0].reponse === 'absent' && {
                                color: '#111',
                            },
                        ]}
                    >
                        {reponseLoading ? '...' : '❌ Absent'}
                    </Text>
                </TouchableOpacity>
            </View>

            {evenementInfos?.participations_evenement[0]?.utilisateurs[0]?.joueurs[0]
                ?.decharges_generales[0]?.accepte_transport &&
                evenementInfos?.participations_evenement[0].reponse === 'present' && (
                    <View style={styles.switchBlock}>
                        <Text style={styles.label}>Je n&apos;ai pas de moyen de transport</Text>
                        <Switch
                            value={besoinTransport}
                            onValueChange={setBesoinTransport}
                            thumbColor={besoinTransport ? '#00ff88' : '#666'}
                            trackColor={{ false: '#333', true: '#00ff8860' }}
                            disabled={
                                evenementInfos?.participations_evenement[0].reponse !== 'present'
                            }
                        />
                    </View>
                )}

            {/* Affiche le bouton transport SEULEMENT si besoinTransport === true ET reponse === 'present' */}
            {evenementInfos?.participations_evenement[0].reponse === 'present' &&
                besoinTransport && (
                    <TouchableOpacity
                        style={styles.transportBtn}
                        onPress={() => setShowTransportModal(true)}
                    >
                        <Ionicons name="car-outline" size={18} color="#fff" />
                        <Text style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>
                            Messagerie Besoin de Transport
                        </Text>
                    </TouchableOpacity>
                )}

            {/* MODALE MESSAGERIE BESOIN DE TRANSPORT */}
            <Modal
                visible={showTransportModal}
                animationType="slide"
                onRequestClose={() => setShowTransportModal(false)}
                transparent={false}
            >
                <ScrollView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        🚗 Besoins de transport pour cet événement
                    </Text>
                    {evenementInfos?.messages_besoin_transport.length === 0 && (
                        <Text style={{ color: '#aaa', marginTop: 25, textAlign: 'center' }}>
                            Aucun besoin de transport déclaré.
                        </Text>
                    )}

                    {evenementInfos?.messages_besoin_transport.map((messageBesoinTransport) => (
                        <View key={messageBesoinTransport.id} style={styles.messageCard}>
                            <Text style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 16 }}>
                                {messageBesoinTransport.utilisateurs[0].prenom}{' '}
                                {messageBesoinTransport.utilisateurs[0].nom}{' '}
                                {/* {messageBesoinTransport.utilisateurs[0].age
                                    ? `(âge: ${messageBesoinTransport.utilisateurs[0].age})`
                                    : ''} FIXME */}
                            </Text>
                            <Text style={{ color: '#fff', marginBottom: 4 }}>
                                Statut :{' '}
                                <Text style={{ color: '#00ff88' }}>
                                    {messageBesoinTransport.etat}
                                </Text>
                            </Text>
                            {messageBesoinTransport.adresse_demande && (
                                <Text style={{ color: '#fff' }}>
                                    Lieu : {messageBesoinTransport.adresse_demande}
                                </Text>
                            )}
                            {messageBesoinTransport.heure_demande && (
                                <Text style={{ color: '#fff' }}>
                                    Heure : {messageBesoinTransport.heure_demande}
                                </Text>
                            )}
                            <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                <TouchableOpacity
                                    style={styles.proposeBtn}
                                    onPress={() => {
                                        setNouvelleAdresse('');
                                        setNouvelleHeure('');
                                        proposerLieuHeure(messageBesoinTransport.id);
                                    }}
                                    disabled={sendingProposition}
                                >
                                    <Ionicons name="navigate-outline" size={16} color="#111" />
                                    <Text style={{ color: '#111', marginLeft: 5 }}>
                                        Proposer lieu/heure
                                    </Text>
                                </TouchableOpacity>
                                {/* Si besoin, boutons signature */}
                                {!messageBesoinTransport.signature_demandeur && (
                                    <TouchableOpacity
                                        style={styles.signatureBtn}
                                        onPress={() =>
                                            signerTransport(messageBesoinTransport.id, 'demandeur')
                                        }
                                    >
                                        <Ionicons name="pencil-outline" size={16} color="#00ff88" />
                                        <Text style={{ color: '#00ff88', marginLeft: 5 }}>
                                            Signer demandeur
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {messageBesoinTransport.signature_demandeur &&
                                    !messageBesoinTransport.signature_conducteur && (
                                        <TouchableOpacity
                                            style={styles.signatureBtn}
                                            onPress={() =>
                                                signerTransport(
                                                    messageBesoinTransport.id,
                                                    'conducteur',
                                                )
                                            }
                                        >
                                            <Ionicons name="pencil" size={16} color="#00ff88" />
                                            <Text style={{ color: '#00ff88', marginLeft: 5 }}>
                                                Signer conducteur
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                {messageBesoinTransport.signature_demandeur &&
                                    messageBesoinTransport.signature_conducteur && (
                                        <Text
                                            style={{
                                                color: '#00ff88',
                                                fontWeight: 'bold',
                                                marginLeft: 10,
                                            }}
                                        >
                                            ✔️ Signé par les deux parties
                                        </Text>
                                    )}
                            </View>
                        </View>
                    ))}

                    {/* ==== Champs à remplir pour ENVOYER LA DEMANDE ==== */}
                    <View style={{ marginTop: 20 }}>
                        <TextInput
                            style={styles.input}
                            placeholder="Lieu de RDV"
                            placeholderTextColor="#aaa"
                            value={nouvelleAdresse}
                            onChangeText={setNouvelleAdresse}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Heure"
                            placeholderTextColor="#aaa"
                            value={nouvelleHeure}
                            onChangeText={setNouvelleHeure}
                        />
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: '#00ff88', marginTop: 10 }]}
                            onPress={envoyerDemandeTransport}
                            disabled={sendingProposition}
                        >
                            <Text style={{ color: '#111', fontWeight: 'bold' }}>
                                {sendingProposition ? 'Envoi...' : 'Envoyer la demande'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setShowTransportModal(false)}
                    >
                        <Text style={{ color: '#111', fontWeight: 'bold' }}>Fermer</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#121212', flex: 1, padding: 20 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        textAlign: 'center',
        marginBottom: 10,
    },
    info: { color: '#ccc', textAlign: 'center', marginBottom: 6 },
    debugText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginVertical: 10,
        fontStyle: 'italic',
    },
    section: {
        marginTop: 30,
        fontSize: 18,
        color: '#00ff88',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    buttons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    button: {
        backgroundColor: '#1e1e1e',
        borderColor: '#00ff88',
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    selected: { backgroundColor: '#00ff88' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    switchBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderColor: '#333',
    },
    label: { color: '#ccc', fontSize: 15 },
    transportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00ff88',
        padding: 10,
        borderRadius: 10,
        marginVertical: 15,
        alignSelf: 'center',
    },
    modalContainer: { backgroundColor: '#181f22', flex: 1, padding: 20 },
    modalTitle: {
        color: '#00ff88',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    messageCard: {
        backgroundColor: '#242c2e',
        borderRadius: 10,
        marginBottom: 18,
        padding: 15,
        shadowColor: '#000',
        shadowOpacity: 0.09,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    proposeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00ff88',
        borderRadius: 7,
        padding: 7,
        marginRight: 10,
    },
    signatureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181f22',
        borderRadius: 7,
        padding: 7,
        borderWidth: 1,
        borderColor: '#00ff88',
        marginRight: 10,
    },
    input: {
        backgroundColor: '#242c2e',
        color: '#fff',
        borderRadius: 8,
        padding: 9,
        marginTop: 8,
        borderColor: '#00ff88',
        borderWidth: 1,
        marginBottom: 6,
    },
    closeBtn: {
        backgroundColor: '#00ff88',
        borderRadius: 9,
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
    },
});
