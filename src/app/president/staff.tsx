import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    TextInput,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/hooks/useSession';
import { COLOR_BLACK_900, COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { deleteStaff, getClubStaff, GetClubStaff } from '@/helpers/staff.helpers';

export default function Staff() {
    const [clubStaffs, setClubStaffs] = useState<GetClubStaff | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    const fetchStaff = async (clubId: string) => {
        setLoading(true);

        const fetchedClubStaff = await getClubStaff({ clubId });
        setClubStaffs(fetchedClubStaff);

        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || loading || clubStaffs) {
            return;
        }

        fetchStaff(utilisateur.club_id);
    }, [clubStaffs, loading, utilisateur?.club_id]);

    const fetchDeleteStaff = async (staffId: string, clubId: string) => {
        await deleteStaff({ staffId });
        await fetchStaff(clubId);
    };

    // --- Suppression coach
    const handleDeleteCoach = async (staffId: string, clubId: string) => {
        // FIXME: revoir la confirmation pour uniformiser web et mobile
        if (Platform.OS === 'web') {
            if (confirm('Es-tu sûr de vouloir supprimer ce coach ?')) {
                await fetchDeleteStaff(staffId, clubId);
            }
        } else {
            Alert.alert('Confirmer la suppression', 'Es-tu sûr de vouloir supprimer ce coach ?', [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        await fetchDeleteStaff(staffId, clubId);
                    },
                },
            ]);
        }
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
    }

    return (
        <ScrollView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>👥 Membres du Staff</Text>

                {!clubStaffs || clubStaffs.length === 0 ? (
                    <Text style={{ color: '#ccc', marginBottom: 20 }}>
                        Aucun coach encore créé.
                    </Text>
                ) : (
                    clubStaffs.map((staff) => (
                        <View key={staff.id} style={styles.card}>
                            <View style={styles.cardRow}>
                                <View style={styles.avatarRow}>
                                    <Image
                                        source={{
                                            uri:
                                                staff.photo_url && staff.photo_url.trim() !== ''
                                                    ? staff.photo_url
                                                    : 'https://ui-avatars.com/api/?name=' +
                                                      encodeURIComponent(
                                                          `${staff.prenom || ''} ${staff.nom || ''}`,
                                                      ) +
                                                      '&background=232b28&color=fff&rounded=true',
                                        }}
                                        style={styles.avatar}
                                    />
                                    <Text style={styles.cardName}>
                                        {staff.prenom} {staff.nom}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() =>
                                        utilisateur?.club_id &&
                                        handleDeleteCoach(staff.id, utilisateur.club_id)
                                    }
                                >
                                    <Ionicons name="trash" size={22} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.cardDetail}>
                                📧 {staff.email || 'Email non renseigné'}
                            </Text>
                            <Text style={styles.cardDetail}>
                                📞 {staff.telephone || 'Téléphone non renseigné'}
                            </Text>
                            <Text style={styles.cardDetail}>
                                🎂 {staff.date_naissance || 'Date non renseignée'}
                            </Text>
                            <Text style={styles.cardDetail}>
                                🎓 Diplôme : {staff.diplome ? '✅ Oui' : '❌ Non'}
                            </Text>
                            <Text style={styles.cardRole}>Rôle : {staff.role || 'Coach'}</Text>
                        </View>
                    ))
                )}

                {/* Formulaire d'ajout d'un coach */}
                <View style={styles.form}>
                    <Text style={styles.subtitle}>➕ Ajouter un coach</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Prénom"
                        placeholderTextColor="#aaa"
                        // value={prenom}
                        // onChangeText={setPrenom}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Nom"
                        placeholderTextColor="#aaa"
                        // value={nom}
                        // onChangeText={setNom}
                    />
                    <TouchableOpacity style={styles.button}>
                        <Ionicons name="add-circle" size={20} color="#111" />
                        <Text style={styles.buttonText}>Créer le coach</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLOR_BLACK_900,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: '#232b28',
    },
    cardName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    cardRole: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 6,
    },
    cardDetail: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 2,
    },
    form: {
        marginTop: 30,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
    },
    subtitle: {
        fontSize: 18,
        color: COLOR_GREEN_300,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#2a2a2a',
        color: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#444',
    },
    button: {
        backgroundColor: COLOR_GREEN_300,
        borderRadius: 10,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#111',
    },
});
