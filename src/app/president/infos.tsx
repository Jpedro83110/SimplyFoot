import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getClubById, GetClubById, updateClub } from '@/helpers/clubs.helpers';
import { useSession } from '@/hooks/useSession';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';

const labels: Record<string, string> = {
    nom: 'Nom du club',
    adresse: 'Adresse',
    site: 'Site Web',
    facebook_url: 'Lien Facebook',
    instagram_url: 'Lien Instagram',
    boutique_url: 'Boutique en ligne',
    telephone: 'Téléphone',
    email: 'Email',
};

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    nom: 'shield',
    adresse: 'location',
    site: 'globe',
    facebook_url: 'logo-facebook',
    instagram_url: 'logo-instagram',
    boutique_url: 'cart',
    telephone: 'call',
    email: 'mail',
};

export default function Infos() {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<GetClubById | undefined>(undefined);
    const [clubData, setClubData] = useState<GetClubById | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const { utilisateur } = useSession();

    async function fetchClubData(clubId: string) {
        setLoading(true);

        const fetchedClubData = await getClubById({ clubId });
        setClubData(fetchedClubData);

        setLoading(false);
    }

    useEffect(() => {
        if (!utilisateur?.club_id || loading || clubData) {
            return;
        }

        fetchClubData(utilisateur.club_id);
    }, [clubData, loading, utilisateur?.club_id]);

    useEffect(() => {
        if (clubData) {
            setForm(clubData);
        }
    }, [clubData]);

    const handleSave = async () => {
        if (!utilisateur?.club_id) {
            Alert.alert('Erreur', "Le club n'a pas encore été chargé.");
            return;
        }

        await updateClub({
            clubId: utilisateur.club_id,
            club: {
                nom: form?.nom,
                adresse: form?.adresse,
                site: form?.site,
                facebook_url: form?.facebook_url,
                instagram_url: form?.instagram_url,
                boutique_url: form?.boutique_url,
                telephone: form?.telephone,
                email: form?.email,
            },
        });

        setEditing(false);
        fetchClubData(utilisateur.club_id);
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 40 }} color={COLOR_GREEN_300} />;
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#101415' }}
            contentContainerStyle={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>🏟️ Informations du Club</Text>

                {(
                    [
                        'nom',
                        'adresse',
                        'site',
                        'facebook_url',
                        'instagram_url',
                        'boutique_url',
                        'telephone',
                        'email',
                    ] as (keyof Omit<GetClubById, 'id' | 'logo_url'>)[]
                ).map((field) => (
                    <View style={styles.block} key={field}>
                        <Ionicons
                            name={icons[field]}
                            size={20}
                            color={COLOR_GREEN_300}
                            style={styles.icon}
                        />
                        <Text style={styles.label}>{labels[field]}</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={form?.[field] ?? ''}
                                onChangeText={(text) =>
                                    setForm((prev) =>
                                        prev ? { ...prev, [field]: text } : undefined,
                                    )
                                }
                                placeholder={`Entrez ${labels[field].toLowerCase()}`}
                                placeholderTextColor="#888"
                            />
                        ) : (
                            <Text style={styles.value}>
                                {(clubData ? clubData[field] : '-') || '-'}
                            </Text>
                        )}
                    </View>
                ))}

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: editing ? '#00c4aa' : COLOR_GREEN_300 },
                    ]}
                    onPress={() => (editing ? handleSave() : setEditing(true))}
                >
                    <Text style={styles.buttonText}>
                        {editing ? '💾 Enregistrer' : '✏️ Modifier les infos'}
                    </Text>
                </TouchableOpacity>

                {editing && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#444' }]}
                        onPress={() => setEditing(false)}
                    >
                        <Text style={styles.buttonText}>❌ Annuler</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        maxWidth: 790,
        width: '92%',
    },
    scroll: { padding: 20 },
    title: {
        fontSize: 24,
        color: COLOR_GREEN_300,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    block: {
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
        maxWidth: 790,
    },
    icon: {
        marginBottom: 6,
    },
    label: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 4,
    },
    value: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    input: {
        color: '#fff',
        fontSize: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#666',
        paddingVertical: 6,
    },
    button: {
        marginBottom: 14,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        maxWidth: 790,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
    },
});
