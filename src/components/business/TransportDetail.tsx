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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_GREEN_300, YELLOW } from '@/utils/styleContants.utils';
import {
    getMessagesBesoinTransportById,
    GetMessagesBesoinTransportById,
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

interface SignatureModalState {
    open: boolean;
    proposition: GetMessagesBesoinTransportById['propositions_transport'][number] | null;
}

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
    const [signatureModal, setSignatureModal] = useState<SignatureModalState>({
        open: false,
        proposition: null,
    });
    const [autorise, setAutorise] = useState(false);

    const { utilisateur } = useSession();

    const utitlisateurPropositionTransport = useMemo(
        () =>
            messageBesoinTransport?.propositions_transport?.find(
                (proposition) => proposition.parent_proposeur_id,
            ),
        [messageBesoinTransport],
    );

    const hasDemandeurSigned = useMemo(
        () =>
            utitlisateurPropositionTransport?.signatures_transport?.find(
                (signature) =>
                    signature.parent1_id === messageBesoinTransport?.utilisateurs?.joueur_id,
            ),
        [
            utitlisateurPropositionTransport?.signatures_transport,
            messageBesoinTransport?.utilisateurs?.joueur_id,
        ],
    );

    const hasConducteurSigned = useMemo(
        () =>
            utitlisateurPropositionTransport?.accepte &&
            utitlisateurPropositionTransport?.signatures_transport?.find(
                (signature) =>
                    signature.parent2_id === utitlisateurPropositionTransport?.parent_proposeur_id,
            ),
        [
            utitlisateurPropositionTransport?.accepte,
            utitlisateurPropositionTransport?.parent_proposeur_id,
            utitlisateurPropositionTransport?.signatures_transport,
        ],
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
                !utitlisateurPropositionTransport?.id ||
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

            await upsertPropositionTransport({
                propisitionsTransportId: utitlisateurPropositionTransport.id,
                dataToUpdate: {
                    demande_id: demandeId,
                    parent_proposeur_id: utilisateur.id,
                    lieu_rdv: finalLieu,
                    heure_rdv: finalHeure,
                    date_proposition: new Date().toISOString(),
                    accepte: false,
                },
            });

            setShowPropModal(false);
            setLieu('');
            setHeure('');
            fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');

            Alert.alert('Proposition envoyée !');
        },
        [
            autorise,
            lieu,
            heure,
            utitlisateurPropositionTransport?.id,
            demandeId,
            utilisateur?.id,
            utilisateur?.role,
            messageBesoinTransport?.adresse_demande,
            messageBesoinTransport?.heure_demande,
        ],
    );

    async function supprimerProposition(propositionsTransportId: string) {
        Alert.alert('Supprimer la proposition', 'Tu es sûr ? Cette action est irréversible.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    if (utilisateur?.role) {
                        await deletePropositionTransportById({
                            propositionsTransportId,
                        });
                        fetchAll(demandeId, utilisateur.id, utilisateur.role === 'coach');
                    }
                },
            },
        ]);
    }

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
                    parent1_id: role === 'demandeur' ? utilisateur.id : undefined,
                    parent2_id: role === 'conducteur' ? utilisateur.id : undefined,
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

            setSignatureModal({ open: true, proposition });
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
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            if (utitlisateurPropositionTransport?.id && utilisateur?.id) {
                                setEditPropId(null);
                                proposerOuModifierTransport(true);
                            }
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={15} color="#111" />
                        <Text style={styles.actionText}>Je le prends (lieu/heure demandés)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#666' }]}
                        onPress={() => {
                            setEditPropId(null);
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
                                            style={[styles.acceptBtn, { backgroundColor: '#444' }]}
                                            onPress={() => {
                                                setLieu(proposition.lieu_rdv || '');
                                                setHeure(proposition.heure_rdv || '');
                                                setEditPropId(proposition.id);
                                                setShowPropModal(true);
                                            }}
                                        >
                                            <Text style={{ color: '#fff' }}>Modifier</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.acceptBtn, { backgroundColor: '#d00' }]}
                                            onPress={() => supprimerProposition(proposition.id)}
                                        >
                                            <Text style={{ color: '#fff' }}>Supprimer</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Validation demandeur (joueur) */}
                                {messageBesoinTransport.utilisateur_id === utilisateur?.id &&
                                    utitlisateurPropositionTransport &&
                                    !utitlisateurPropositionTransport?.accepte && (
                                        <TouchableOpacity
                                            style={styles.acceptBtn}
                                            onPress={() =>
                                                accepterProposition(
                                                    utitlisateurPropositionTransport,
                                                )
                                            }
                                        >
                                            <Text style={styles.acceptText}>
                                                Valider ce transporteur
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                {/* Signatures */}
                                {utitlisateurPropositionTransport?.accepte && (
                                    <>
                                        {!hasDemandeurSigned && (
                                            <TouchableOpacity
                                                style={styles.acceptBtn}
                                                onPress={() =>
                                                    signer(
                                                        utitlisateurPropositionTransport,
                                                        'demandeur',
                                                    )
                                                }
                                            >
                                                <Text style={styles.acceptText}>
                                                    Je suis le parent du joueur, je signe
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {!hasConducteurSigned && (
                                            <TouchableOpacity
                                                style={styles.acceptBtn}
                                                onPress={() =>
                                                    signer(
                                                        utitlisateurPropositionTransport,
                                                        'conducteur',
                                                    )
                                                }
                                            >
                                                <Text style={styles.acceptText}>
                                                    Je suis le conducteur, je signe
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        <Text style={{ color: '#0f0', marginTop: 7 }}>
                                            {hasDemandeurSigned && '✔️ Parent joueur signé  '}
                                            {hasConducteurSigned && '✔️ Conducteur signé  '}
                                            {hasDemandeurSigned &&
                                                hasConducteurSigned &&
                                                ' | Validé ✅'}
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
                                if (utitlisateurPropositionTransport?.id && utilisateur?.id) {
                                    proposerOuModifierTransport(false);
                                }
                            }}
                        >
                            <Text style={styles.modalBtnText}>
                                {editPropId ? 'Modifier' : 'Envoyer'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: '#444' }]}
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

            {/* MODAL SIGNATURE */}
            <Modal visible={signatureModal.open} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Décharge de transport</Text>
                        <Text style={{ color: '#fff', marginBottom: 10 }}>
                            Les deux parties doivent signer pour valider ce transport.{'\n'}
                            <Text style={{ color: '#aaa', fontStyle: 'italic' }}>
                                “Je m&apos;engage à transporter le joueur selon les modalités
                                convenues, sous ma responsabilité.”
                            </Text>
                        </Text>
                        {!hasDemandeurSigned && signatureModal.proposition && (
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => signer(signatureModal.proposition!, 'demandeur')}
                            >
                                <Text style={styles.modalBtnText}>
                                    Je suis le parent DEMANDEUR, je signe
                                </Text>
                            </TouchableOpacity>
                        )}
                        {!hasConducteurSigned && signatureModal.proposition && (
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => signer(signatureModal.proposition!, 'conducteur')}
                            >
                                <Text style={styles.modalBtnText}>
                                    Je suis le parent CONDUCTEUR, je signe
                                </Text>
                            </TouchableOpacity>
                        )}
                        {hasDemandeurSigned && hasConducteurSigned && (
                            <Text
                                style={{ color: '#00ff88', marginVertical: 10, fontWeight: 'bold' }}
                            >
                                ✔️ Double signature enregistrée, transport validé.
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: '#444' }]}
                            onPress={() => setSignatureModal({ open: false, proposition: null })}
                        >
                            <Text style={styles.modalBtnText}>Fermer</Text>
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
