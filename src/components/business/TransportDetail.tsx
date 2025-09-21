import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_BLACK_600, COLOR_GREEN_300, RED, YELLOW } from '@/utils/styleContants.utils';
import {
    getMessagesBesoinTransportById,
    GetMessagesBesoinTransportById,
    updateMessageBesoinTransport,
} from '@/helpers/messagesBesoinTransport.helpers';
import { getAccepteTransportByUtilisateurId } from '@/helpers/joueurs.helpers';
import { useSession } from '@/hooks/useSession';
import {
    acceptPropositionTransport,
    deletePropositionTransportById,
    upsertPropositionTransport,
} from '@/helpers/propositionsTransport.helpers';
import { upsertSignatureTransport } from '@/helpers/signaturesTransport.helpers';

type PropositionTransportRole = 'demandeur' | 'conducteur';

interface TransportDetailProps {
    demandeId: string;
}

export const TransportDetail: FC<TransportDetailProps> = ({ demandeId }) => {
    const [loading, setLoading] = useState(false);
    const [messageBesoinTransport, setMessageBesoinTransport] =
        useState<GetMessagesBesoinTransportById | null>(null);
    const [showPropModal, setShowPropModal] = useState(false);
    const [lieu, setLieu] = useState('');
    const [heure, setHeure] = useState('');
    const [editPropId, setEditPropId] = useState<string | null>(null);
    const [autorise, setAutorise] = useState(false);

    const { utilisateur } = useSession();

    const utitlisateurPropositionTransport = useMemo(
        () =>
            messageBesoinTransport?.propositions_transport?.find(
                (proposition) => proposition.parent_proposeur_id === utilisateur?.id,
            ),
        [messageBesoinTransport, utilisateur?.id],
    );

    const isMyDemandeTransport = useMemo(
        () => messageBesoinTransport?.utilisateur_id === utilisateur?.id,
        [messageBesoinTransport?.utilisateur_id, utilisateur?.id],
    );

    const fetchAll = async (
        messagesBesoinTransportId: string,
        utilisateurId: string,
        isCoach: boolean,
    ) => {
        setLoading(true);

        const fetchedMessageBesoinTransport = await getMessagesBesoinTransportById({
            messagesBesoinTransportId,
        });

        if (
            isCoach &&
            fetchedMessageBesoinTransport?.evenements?.equipes?.coach_id === utilisateurId
        ) {
            setAutorise(true);
        } else {
            const acceptTransport = await getAccepteTransportByUtilisateurId({ utilisateurId });
            setAutorise(acceptTransport);
        }

        setMessageBesoinTransport(fetchedMessageBesoinTransport);

        setLoading(false);
    };

    useEffect(() => {
        if (utilisateur?.id && !loading && !messageBesoinTransport) {
            fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');
        }
    }, [demandeId, utilisateur?.id, utilisateur?.role, loading, messageBesoinTransport]);

    const proposerOuModifierTransport = useCallback(
        async (autopick = false) => {
            if (
                !autorise ||
                !utilisateur?.id ||
                !messageBesoinTransport?.adresse_demande ||
                !messageBesoinTransport?.heure_demande
            ) {
                Alert.alert('Non autorisé');
                return;
            }

            const finalLieu = autopick ? messageBesoinTransport.adresse_demande : lieu;
            const finalHeure = autopick ? messageBesoinTransport.heure_demande : heure;

            if (!finalLieu || !finalHeure) {
                Alert.alert('Remplis bien tous les champs.');
                return;
            }

            const propisitionsTransportId =
                utitlisateurPropositionTransport?.parent_proposeur_id === utilisateur.id
                    ? utitlisateurPropositionTransport?.id
                    : null;

            if (isMyDemandeTransport) {
                await updateMessageBesoinTransport({
                    messagesBesoinTransportId: messageBesoinTransport.id,
                    messageBesoinTransport: {
                        adresse_demande: finalLieu,
                        heure_demande: finalHeure,
                        etat: 'proposition_faite',
                    },
                });
            } else {
                await updateMessageBesoinTransport({
                    messagesBesoinTransportId: messageBesoinTransport.id,
                    messageBesoinTransport: {
                        etat: 'proposition_faite',
                    },
                });
                await upsertPropositionTransport({
                    propisitionsTransportId,
                    dataToUpdate: {
                        demande_id: demandeId,
                        parent_proposeur_id: utilisateur.id,
                        lieu_rdv: finalLieu,
                        heure_rdv: finalHeure,
                        date_proposition: new Date().toISOString(),
                        accepte: false,
                    },
                });
            }

            setShowPropModal(false);
            setLieu('');
            setHeure('');
            fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');

            Alert.alert('Proposition envoyée !');
        },
        [
            autorise,
            utilisateur?.id,
            utilisateur?.role,
            messageBesoinTransport?.adresse_demande,
            messageBesoinTransport?.heure_demande,
            messageBesoinTransport?.id,
            lieu,
            heure,
            utitlisateurPropositionTransport?.parent_proposeur_id,
            utitlisateurPropositionTransport?.id,
            isMyDemandeTransport,
            demandeId,
        ],
    );

    const deletePropositionTransport = useCallback(
        async (propositionsTransportId: string) => {
            if (!utilisateur?.role || !messageBesoinTransport?.id) {
                return;
            }

            await deletePropositionTransportById({
                propositionsTransportId,
            });
            if (messageBesoinTransport.propositions_transport.length <= 1) {
                await updateMessageBesoinTransport({
                    messagesBesoinTransportId: messageBesoinTransport.id,
                    messageBesoinTransport: {
                        etat: 'en_attente',
                    },
                });
            }
            fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');
        },
        [
            demandeId,
            messageBesoinTransport?.id,
            utilisateur?.id,
            utilisateur?.role,
            messageBesoinTransport?.propositions_transport,
        ],
    );

    const handleDeleteProposition = useCallback(
        async (propositionsTransportId: string) => {
            // FIXME: revoir la confirmation pour uniformiser web et mobile
            if (Platform.OS === 'web') {
                if (confirm(`Supprimer la proposition ? Cette action est irréversible.`)) {
                    await deletePropositionTransport(propositionsTransportId);
                }
            } else {
                Alert.alert(
                    'Supprimer la proposition',
                    'Tu es sûr ? Cette action est irréversible.',
                    [
                        { text: 'Annuler', style: 'cancel' },
                        {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                                await deletePropositionTransport(propositionsTransportId);
                            },
                        },
                    ],
                );
            }
        },
        [deletePropositionTransport],
    );

    const signer = useCallback(
        async (
            propositionTransport: GetMessagesBesoinTransportById['propositions_transport'][number],
            role: PropositionTransportRole,
        ) => {
            if (!utilisateur?.id) {
                return;
            }

            const alreadySigned = propositionTransport.signatures_transport?.find((signature) =>
                role === 'demandeur'
                    ? signature.parent1_id === utilisateur.id
                    : signature.parent2_id === utilisateur.id,
            );

            if (alreadySigned) {
                Alert.alert('Déjà signé.');
                return;
            }

            await upsertSignatureTransport({
                messagesBesoinTransportId: demandeId,
                dataToUpdate: {
                    proposition_id: propositionTransport.id,
                    date_signature: new Date().toISOString(),
                    status: 'signed', // FIXME: etrange, une seule signature et on met le status signed ?
                    parent1_id: role === 'demandeur' ? utilisateur.id : null,
                    parent2_id: role === 'conducteur' ? utilisateur.id : null,
                },
            });

            fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');
        },
        [demandeId, utilisateur?.id, utilisateur?.role],
    );

    const accepterProposition = useCallback(
        async (proposition: GetMessagesBesoinTransportById['propositions_transport'][number]) => {
            if (!utilisateur?.id) {
                return;
            }

            await acceptPropositionTransport({
                propositionsTransportId: proposition.id,
                messagesBesoinTransportId: demandeId,
            });

            fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');
        },
        [demandeId, utilisateur?.id, utilisateur?.role],
    );

    return (
        <ScrollView style={styles.container}>
            {loading && <ActivityIndicator color={COLOR_GREEN_300} style={{ marginTop: 30 }} />}
            {!loading && !messageBesoinTransport && (
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>
                    Demande introuvable ou inaccessible !{'\n'}(ID: {demandeId})
                </Text>
            )}
            {!loading && messageBesoinTransport && (
                <View style={styles.card}>
                    <Text style={styles.title}>
                        <Ionicons name="football" color={YELLOW} size={18} />{' '}
                        {messageBesoinTransport.evenements?.titre}
                    </Text>
                    <Text style={styles.info}>
                        <Ionicons name="calendar" color={COLOR_GREEN_300} size={13} />{' '}
                        {messageBesoinTransport.evenements?.date}{' '}
                        {messageBesoinTransport.evenements?.heure &&
                            `- ${messageBesoinTransport.evenements.heure}`}
                    </Text>
                    <Text style={styles.info}>
                        <Ionicons name="person-circle" color={COLOR_GREEN_300} size={15} />{' '}
                        {messageBesoinTransport.utilisateurs?.prenom}{' '}
                        {messageBesoinTransport.utilisateurs?.nom}
                    </Text>
                    {messageBesoinTransport.utilisateurs?.joueurs?.decharges_generales &&
                        messageBesoinTransport.utilisateurs?.joueurs?.decharges_generales.length >
                            0 && (
                            <Text style={styles.info}>
                                <Ionicons name="people-circle" color={YELLOW} size={13} /> Parent :{' '}
                                {
                                    messageBesoinTransport.utilisateurs?.joueurs
                                        ?.decharges_generales[0].parent_prenom
                                }{' '}
                                {
                                    messageBesoinTransport.utilisateurs?.joueurs
                                        ?.decharges_generales[0].parent_nom
                                }
                                {messageBesoinTransport.utilisateurs?.joueurs
                                    ?.decharges_generales[0].accepte_transport
                                    ? ' (décharge acceptée)'
                                    : ' (décharge non signée)'}
                            </Text>
                        )}
                    <Text style={styles.info}>
                        <Ionicons name="location" color={YELLOW} size={13} /> Adresse demandée :{' '}
                        {messageBesoinTransport.adresse_demande}
                    </Text>
                    <Text style={styles.info}>
                        <Ionicons name="time" color={YELLOW} size={13} /> Heure demandée :{' '}
                        {messageBesoinTransport.heure_demande}
                    </Text>
                    <Text style={styles.statut}>
                        <Ionicons name="alert-circle" color={YELLOW} size={15} /> Statut :{' '}
                        <Text style={{ color: YELLOW }}>{messageBesoinTransport.etat}</Text>
                    </Text>
                </View>
            )}

            {!loading && messageBesoinTransport && autorise && (
                <>
                    {!isMyDemandeTransport && !utitlisateurPropositionTransport && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => {
                                setEditPropId(null);
                                proposerOuModifierTransport(true);
                            }}
                        >
                            <Ionicons name="checkmark-circle" size={15} color="#111" />
                            <Text style={styles.actionText}>
                                Je le prends (lieu/heure demandés)
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: YELLOW }]}
                        onPress={() => {
                            setEditPropId(utitlisateurPropositionTransport?.id ?? null);
                            setShowPropModal(true);
                        }}
                    >
                        <Ionicons name="car-sport" size={15} color="#111" />
                        <Text style={styles.actionText}>Proposer un autre lieu/heure</Text>
                    </TouchableOpacity>
                </>
            )}

            {!loading && messageBesoinTransport && !autorise && (
                <Text style={{ color: '#ffe44d', margin: 18, fontStyle: 'italic' }}>
                    <Ionicons name="lock-closed" size={16} color="#ffe44d" /> Vous n&apos;êtes pas
                    autorisé à proposer ou valider un transport pour cette demande.
                </Text>
            )}

            {!loading && messageBesoinTransport && (
                <>
                    <Text style={styles.subtitle}>
                        <Ionicons name="git-branch" size={16} color={COLOR_GREEN_300} />{' '}
                        Propositions reçues :
                    </Text>
                    {messageBesoinTransport.propositions_transport.length === 0 && (
                        <Text style={{ color: '#aaa', marginBottom: 8 }}>
                            Aucune proposition reçue pour le moment.
                        </Text>
                    )}
                    {messageBesoinTransport.propositions_transport.map((proposition) => {
                        const estAuteur = proposition.parent_proposeur_id === utilisateur?.id;

                        const hasDemandeurSigned =
                            proposition.signatures_transport?.find(
                                (signature) => signature.parent1_id,
                            ) !== undefined;

                        const hasConducteurSigned =
                            proposition.signatures_transport?.find(
                                (signature) => signature.parent2_id,
                            ) !== undefined;

                        const signatureOk = hasDemandeurSigned && hasConducteurSigned;

                        return (
                            <View key={proposition.id} style={styles.propositionCard}>
                                <Text style={{ color: COLOR_GREEN_300 }}>
                                    <Ionicons name="car-sport" size={13} color={COLOR_GREEN_300} />{' '}
                                    Par {proposition.parent_proposeur?.prenom}{' '}
                                    {proposition.parent_proposeur?.nom}
                                </Text>
                                <Text style={{ color: '#fff' }}>
                                    <Ionicons name="location" size={11} color={YELLOW} /> Lieu :{' '}
                                    {proposition.lieu_rdv}
                                </Text>
                                <Text style={{ color: '#fff' }}>
                                    <Ionicons name="time" size={11} color={YELLOW} /> Heure :{' '}
                                    {proposition.heure_rdv}
                                </Text>

                                {/* Boutons édition auteur */}
                                {estAuteur && !signatureOk && (
                                    <View
                                        style={{ flexDirection: 'row', gap: 10, marginVertical: 7 }}
                                    >
                                        <TouchableOpacity
                                            style={[styles.acceptBtn, { backgroundColor: RED }]}
                                            onPress={() => handleDeleteProposition(proposition.id)}
                                        >
                                            <Text style={{ color: '#fff' }}>Supprimer</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Validation demandeur (joueur) */}
                                {isMyDemandeTransport && !proposition.accepte && (
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => accepterProposition(proposition)}
                                    >
                                        <Text style={styles.acceptText}>
                                            Valider ce transporteur
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Signatures */}
                                {proposition?.accepte && (
                                    <>
                                        {!hasDemandeurSigned && isMyDemandeTransport && (
                                            <TouchableOpacity
                                                style={styles.acceptBtn}
                                                onPress={() => signer(proposition, 'demandeur')}
                                            >
                                                <Text style={styles.acceptText}>
                                                    Je signe en tant que demandeur
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {!hasConducteurSigned &&
                                            proposition.accepte &&
                                            proposition.parent_proposeur_id === utilisateur?.id && (
                                                <>
                                                    <Text
                                                        style={{
                                                            color: '#aaa',
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        “Je m&apos;engage à transporter le joueur
                                                        selon les modalités convenues, sous ma
                                                        responsabilité.”
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={styles.acceptBtn}
                                                        onPress={() =>
                                                            signer(proposition, 'conducteur')
                                                        }
                                                    >
                                                        <Text style={styles.acceptText}>
                                                            Je signe en tant que conducteur
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        <Text style={{ color: '#0f0', marginTop: 7 }}>
                                            {proposition.accepte &&
                                                (!hasDemandeurSigned || !hasConducteurSigned) &&
                                                ' ✔️ Proposition acceptée'}
                                            {hasDemandeurSigned && '\n ✔️ Parent joueur signé'}
                                            {hasConducteurSigned && '\n ✔️ Conducteur signé'}
                                            {hasDemandeurSigned &&
                                                hasConducteurSigned &&
                                                '\n Demande validée ✅'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        );
                    })}
                </>
            )}

            {/* MODAL PROPOSER / MODIFIER */}
            <Modal visible={showPropModal} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {editPropId
                                ? 'Modifier la proposition'
                                : 'Proposer un autre lieu/heure'}
                        </Text>
                        <TextInput
                            placeholder="Lieu de RDV"
                            placeholderTextColor="#aaa"
                            style={styles.input}
                            value={lieu}
                            onChangeText={setLieu}
                        />
                        <TextInput
                            placeholder="Heure de RDV"
                            placeholderTextColor="#aaa"
                            style={styles.input}
                            value={heure}
                            onChangeText={setHeure}
                        />
                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => {
                                proposerOuModifierTransport(false);
                            }}
                        >
                            <Text style={styles.modalBtnText}>
                                {editPropId ? 'Modifier' : 'Envoyer'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: COLOR_BLACK_600 }]}
                            onPress={() => {
                                setShowPropModal(false);
                                setEditPropId(null);
                                setLieu('');
                                setHeure('');
                            }}
                        >
                            <Text style={styles.modalBtnText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#181f22' },
    card: { backgroundColor: '#232b2d', borderRadius: 10, margin: 18, padding: 18 },
    title: { fontSize: 20, color: COLOR_GREEN_300, fontWeight: 'bold', marginBottom: 4 },
    info: { color: '#fff', marginBottom: 3 },
    statut: { color: '#ffe44d', fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
    actionBtn: {
        backgroundColor: COLOR_GREEN_300,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9,
        padding: 13,
        marginTop: 8,
        justifyContent: 'center',
    },
    actionText: { color: '#111', fontWeight: 'bold', marginLeft: 8 },
    acceptBtn: {
        backgroundColor: COLOR_GREEN_300,
        borderRadius: 9,
        marginTop: 8,
        padding: 10,
        alignItems: 'center',
    },
    acceptText: { color: '#181f22', fontWeight: 'bold' },
    subtitle: { color: COLOR_GREEN_300, fontSize: 15, fontWeight: 'bold', marginTop: 14 },
    propositionCard: { backgroundColor: '#222', borderRadius: 10, marginBottom: 12, padding: 13 },
    modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalBox: { backgroundColor: '#232b2d', borderRadius: 12, padding: 22, margin: 25 },
    modalTitle: { color: COLOR_GREEN_300, fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
    input: {
        backgroundColor: '#292929',
        color: '#fff',
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
        borderColor: COLOR_GREEN_300,
        borderWidth: 1,
    },
    modalBtn: {
        backgroundColor: COLOR_GREEN_300,
        borderRadius: 7,
        marginTop: 8,
        padding: 12,
        alignItems: 'center',
    },
    modalBtnText: { color: '#111', fontWeight: 'bold' },
});
