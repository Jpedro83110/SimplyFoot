import { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    Image,
    Platform,
    Dimensions,
    Modal,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TeamCard } from '@/components/business/TeamCard';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '@/hooks/useSession';
import { deleteEquipe } from '@/helpers/equipes.helpers';
import { calculateAgeFromString, formatDateForDisplay } from '@/utils/date.utils';
import { getImageUrlWithCacheBuster } from '@/utils/url.utils';
import { getCoachClubData, GetCoachClubData } from '@/helpers/clubs.helpers';
import { COLOR_BLACK_900, COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { removePhotosProfilsCoachs, uploadPhotoProfilCoach } from '@/helpers/storage.helpers';

const { width: screenWidth } = Dimensions.get('window');
const actionsData = [
    { label: 'Créer équipe', icon: 'people', route: '/coach/creation-equipe' },
    { label: 'Créer événement', icon: 'calendar', route: '/coach/creation-evenement' },
    { label: 'Anniversaires', icon: 'gift-outline', route: '/coach/anniversaires' },
    // { label: 'Feuille de match', icon: 'document-text', route: '/coach/feuille-match' },
    { label: 'Composition', icon: 'grid', route: '/coach/composition' },
    { label: 'Messagerie', icon: 'chatbox', route: '/coach/messages' },
    { label: 'Statistiques', icon: 'bar-chart', route: '/coach/statistiques' },
    {
        label: 'Programme de stage',
        icon: 'book',
        route: '/coach/programme-stage',
    },
];

interface EditUserData {
    telephone: string;
    email: string;
    niveau_diplome: string;
    experience: string;
}

export default function CoachDashboard() {
    const [loading, setLoading] = useState<boolean>(false);
    const [coachClubData, setCoachClubData] = useState<GetCoachClubData | null>(null);
    const [refreshKey, setRefreshKey] = useState<number>(Date.now());
    const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const router = useRouter();

    const { signOut, utilisateur, staff, updateUserData } = useSession();

    const age = useMemo(
        () =>
            utilisateur?.date_naissance
                ? calculateAgeFromString(utilisateur?.date_naissance)
                : null,
        [utilisateur?.date_naissance],
    );

    const [editData, setEditData] = useState<EditUserData>({
        telephone: '',
        email: '',
        niveau_diplome: '',
        experience: '',
    }); // FIXME: revoir le typage, il combine des champs staff et utilisateur en réalité

    const fetchCoachClubData = async (clubId: string) => {
        setLoading(true);

        const fetchedCoachClubData = await getCoachClubData({ clubId });
        setCoachClubData(fetchedCoachClubData);

        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || loading || coachClubData) {
            return;
        }

        fetchCoachClubData(utilisateur.club_id);
    }, [coachClubData, loading, utilisateur?.club_id]);

    const presences = useMemo(
        () =>
            coachClubData && coachClubData.evenements.length > 0
                ? {
                      present:
                          coachClubData.evenements[0].participations_evenement.filter(
                              (participation) => participation.reponse === 'present',
                          ).length ?? 0,
                      absent:
                          coachClubData.evenements[0].participations_evenement.filter(
                              (participation) => participation.reponse === 'absent',
                          ).length ?? 0,
                      transport: coachClubData.evenements[0].participations_evenement.filter(
                          (participation) => participation.besoin_transport === true,
                      ).length,
                  }
                : null,
        [coachClubData],
    );

    useEffect(() => {
        if (staff || utilisateur) {
            setEditData({
                telephone: utilisateur?.telephone || '',
                email: utilisateur?.email || '',
                niveau_diplome: staff?.niveau_diplome || '',
                experience: staff?.experience || '',
            });
        }
    }, [staff, utilisateur]);

    // Upload photo
    const handleUploadProfilePhoto = async () => {
        try {
            if (!utilisateur?.id) {
                return;
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission requise',
                    'Nous avons besoin de votre permission pour accéder à vos photos.',
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const image = result.assets[0];
                setUploadingPhoto(true);

                try {
                    if (staff?.photo_url) {
                        try {
                            const url = staff.photo_url.split('?')[0];
                            const pathParts = url.split('/');

                            const folderIndex = pathParts.findIndex(
                                (part) => part === 'photos_profils_coachs',
                            );

                            if (folderIndex !== -1 && pathParts[folderIndex + 1]) {
                                const fileName = pathParts[folderIndex + 1];
                                await removePhotosProfilsCoachs({ fileName });
                                console.log('✅ Ancienne photo supprimée');
                            }
                        } catch (deleteErr) {
                            console.warn('⚠️ Erreur lors de la suppression:', deleteErr);
                        }
                    }

                    const basePhotoUrl = await uploadPhotoProfilCoach({
                        image,
                        utilisateurId: utilisateur.id,
                    });

                    await updateUserData({
                        staffData: {
                            photo_url: basePhotoUrl,
                        },
                    });

                    const newRefreshKey = Date.now();
                    setRefreshKey(newRefreshKey);

                    Alert.alert(
                        'Succès ! 📸',
                        'Photo de profil mise à jour sur toutes les plateformes !',
                    );
                } catch (error) {
                    console.error('❌ Erreur complète:', error);
                    Alert.alert(
                        'Erreur',
                        `Impossible de mettre à jour la photo:\n${(error as Error).message}`,
                    );
                } finally {
                    setUploadingPhoto(false);
                }
            }
        } catch (error) {
            console.error('❌ Erreur sélection photo:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner la photo');
            setUploadingPhoto(false);
        }
    };

    // Sauvegarder modifications
    const handleSaveChanges = async () => {
        try {
            await updateUserData({
                utilisateurData: {
                    telephone: editData.telephone?.trim(),
                    email: editData.email?.trim(),
                },
                staffData: {
                    niveau_diplome: editData.niveau_diplome?.trim(),
                    experience: editData.experience?.trim(),
                },
            });

            setShowEditModal(false);
            Alert.alert('Succès', 'Informations mises à jour !');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
        }
    };

    const fetchDeleteEquipe = async (equipeId: string, nomEquipe: string) => {
        await deleteEquipe({ equipeId });
        setRefreshKey(Date.now()); // FIXME: a quoi ça sert ?
        // remove equipe with equipeId from the list without refetching
        setCoachClubData((prevData) => {
            const newData = prevData;
            if (newData?.equipes) {
                newData.equipes = newData.equipes.filter((equipe) => equipe.id !== equipeId);
            }
            return newData;
        });
    };

    const handleDeleteEquipe = (equipeId: string, nomEquipe: string) => {
        // FIXME: revoir la confirmation pour uniformiser web et mobile
        if (Platform.OS === 'web') {
            if (confirm(`Supprimer l'équipe "${nomEquipe}" ? Cette action est irréversible.`)) {
                fetchDeleteEquipe(equipeId, nomEquipe);
            }
        } else {
            Alert.alert(
                'Suppression',
                `Supprimer l'équipe "${nomEquipe}" ? Cette action est irréversible.`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () => {
                            fetchDeleteEquipe(equipeId, nomEquipe);
                        },
                    },
                ],
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#00ff88" size="large" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    const isMobile = screenWidth < 768;

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: COLOR_BLACK_900 }}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header avec photo + titre + logo */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    style={styles.profilePhotoWrapper}
                    onPress={handleUploadProfilePhoto}
                >
                    {uploadingPhoto ? (
                        <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                            <ActivityIndicator size="small" color={COLOR_GREEN_300} />
                        </View>
                    ) : staff?.photo_url ? (
                        <Image
                            source={{
                                uri: getImageUrlWithCacheBuster({
                                    url: staff.photo_url,
                                    refreshKey,
                                }),
                            }}
                            style={styles.profilePhoto}
                            key={`${staff.photo_url}_${refreshKey}`} // Clé qui change à chaque refresh
                            onError={(error) => {
                                console.log('❌ Erreur chargement image:', error);
                                console.log('📷 URL problématique:', staff.photo_url);
                            }}
                            onLoad={() => {
                                console.log(
                                    '✅ Image chargée avec succès:',
                                    staff.photo_url &&
                                        getImageUrlWithCacheBuster({
                                            url: staff.photo_url,
                                            refreshKey,
                                        }),
                                );
                            }}
                        />
                    ) : (
                        <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                            <Ionicons name="camera" size={20} color={COLOR_GREEN_300} />
                        </View>
                    )}
                    {!uploadingPhoto && (
                        <View style={styles.cameraOverlay}>
                            <Ionicons name="camera" size={12} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.welcomeTitle}>
                    Bienvenue Coach {utilisateur?.prenom} {utilisateur?.nom}
                </Text>

                <View style={styles.logoWrapper}>
                    {coachClubData?.logo_url ? (
                        <Image source={{ uri: coachClubData.logo_url }} style={styles.clubLogo} />
                    ) : (
                        <View style={[styles.clubLogo, styles.placeholderLogo]}>
                            <Ionicons name="shield-outline" size={20} color={COLOR_GREEN_300} />
                        </View>
                    )}
                </View>
            </View>

            {/* Encadré infos coach */}
            <View style={styles.headerCard}>
                <View style={styles.nameAndEditRow}>
                    <Text style={styles.headerName}>
                        {utilisateur?.prenom} {utilisateur?.nom}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowEditModal(true)}
                        style={styles.editButton}
                    >
                        <Ionicons name="create-outline" size={20} color={COLOR_GREEN_300} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.headerCat}>Coach · {coachClubData?.nom || 'Club'}</Text>

                <View style={isMobile ? styles.infoContainerMobile : styles.infoContainerDesktop}>
                    {utilisateur?.email && (
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="mail-outline"
                                size={isMobile ? 16 : 14}
                                color={COLOR_GREEN_300}
                                style={styles.infoIcon}
                            />
                            <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                                {utilisateur.email}
                            </Text>
                        </View>
                    )}

                    {utilisateur?.telephone && (
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="call-outline"
                                size={isMobile ? 16 : 14}
                                color={COLOR_GREEN_300}
                                style={styles.infoIcon}
                            />
                            <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                                {utilisateur.telephone}
                            </Text>
                        </View>
                    )}

                    {age && (
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={isMobile ? 16 : 14}
                                color={COLOR_GREEN_300}
                                style={styles.infoIcon}
                            />
                            <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                                {age}
                            </Text>
                        </View>
                    )}

                    {staff?.niveau_diplome && (
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="school-outline"
                                size={isMobile ? 16 : 14}
                                color={COLOR_GREEN_300}
                                style={styles.infoIcon}
                            />
                            <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                                Diplôme : {staff.niveau_diplome}
                            </Text>
                        </View>
                    )}

                    {staff?.experience && (
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="trophy-outline"
                                size={isMobile ? 16 : 14}
                                color={COLOR_GREEN_300}
                                style={styles.infoIcon}
                            />
                            <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                                Expérience : {staff.experience}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Équipes */}
            <Text style={styles.subtitle}>📌 Vos équipes</Text>
            {coachClubData?.equipes && coachClubData.equipes.length > 0 ? (
                coachClubData.equipes.map((equipe) => (
                    <View
                        key={equipe.id}
                        style={{
                            marginBottom: 12,
                            maxWidth: 790,
                            width: '92%',
                        }}
                    >
                        <TouchableOpacity onPress={() => router.push(`/coach/equipe/${equipe.id}`)}>
                            <TeamCard equipe={equipe} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteEquipe(equipe.id, equipe.nom)}
                        >
                            <Ionicons name="trash-outline" size={18} color="#ff4444" />
                            <Text
                                style={{
                                    color: '#ff4444',
                                    marginLeft: 6,
                                    fontSize: 13,
                                    padding: 4,
                                }}
                            >
                                Supprimer
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))
            ) : (
                <Text style={{ color: '#aaa', fontStyle: 'italic', marginBottom: 10 }}>
                    Aucune équipe pour le moment.
                </Text>
            )}

            {/* Bouton événements */}
            <TouchableOpacity
                style={styles.clubEventsButton}
                onPress={() => router.push('/coach/evenements-club')}
            >
                <Text style={styles.clubEventsButtonText}>📆 Événements du Club</Text>
            </TouchableOpacity>

            {/* Prochain événement */}
            <Text style={styles.subtitle}>📋 Prochain événement</Text>
            {coachClubData && coachClubData.evenements.length > 0 ? (
                <TouchableOpacity
                    style={styles.cardGreen}
                    onPress={() =>
                        router.push(`/coach/convocation/${coachClubData.evenements[0].id}`)
                    }
                >
                    <Text style={styles.eventTitle}>{coachClubData.evenements[0].titre}</Text>
                    <Text style={styles.eventInfo}>
                        📅 {formatDateForDisplay({ date: coachClubData.evenements[0].date })} à{' '}
                        {coachClubData.evenements[0].heure}
                    </Text>
                    <Text style={styles.eventInfo}>📍 {coachClubData.evenements[0].lieu}</Text>
                    {coachClubData.evenements[0].lieu_complement && (
                        <Text style={[styles.eventInfo, { fontStyle: 'italic', color: '#8fd6ff' }]}>
                            🏟️ {coachClubData.evenements[0].lieu_complement}
                        </Text>
                    )}
                    {coachClubData.evenements[0].meteo && (
                        <Text style={[styles.eventInfo, { color: '#00ff88' }]}>
                            {/* FIXME meteo est de type JSON, mais semble ne contenir qu'une string */}
                            🌦️ {coachClubData.evenements[0].meteo.toString()}
                        </Text>
                    )}
                    {coachClubData.evenements[0].latitude &&
                        coachClubData.evenements[0].longitude && (
                            <TouchableOpacity
                                onPress={() =>
                                    Linking.openURL(
                                        `https://www.google.com/maps/search/?api=1&query=${coachClubData.evenements[0].latitude},${coachClubData.evenements[0].longitude}`,
                                    )
                                }
                                style={{ marginTop: 4, alignSelf: 'flex-start' }}
                            >
                                <Text style={styles.mapLink}>🗺️ Voir sur Google Maps</Text>
                            </TouchableOpacity>
                        )}
                    <Text style={styles.eventInfo}>✅ Présents : {presences?.present}</Text>
                    <Text style={styles.eventInfo}>❌ Absents : {presences?.absent}</Text>
                    <Text style={styles.eventInfo}>
                        🚗 À prendre en charge : {presences?.transport}
                    </Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.eventInfo}>Aucun événement à venir.</Text>
            )}

            {/* Convocations */}
            <TouchableOpacity
                style={styles.allConvocationsButton}
                onPress={() => router.push('/coach/convocation')}
            >
                <Text style={styles.allConvocationsButtonText}>
                    📑 Voir toutes les convocations / événements
                </Text>
            </TouchableOpacity>

            {/* Actions rapides */}
            <Text style={styles.subtitle}>⚙️ Actions rapides</Text>
            <View style={styles.actionsContainer}>
                {actionsData
                    .filter(
                        (action) =>
                            (coachClubData && coachClubData?.stages.length > 0) ||
                            action.label !== 'Programme de stage',
                    )
                    .map((action, index) => (
                        <ActionButton
                            key={index}
                            label={action.label}
                            icon={action.icon}
                            onPress={() => router.push(action.route)}
                        />
                    ))}
            </View>

            {/* Réseaux sociaux */}
            {coachClubData && (
                <View style={styles.socialLinks}>
                    {coachClubData.facebook_url && (
                        <TouchableOpacity
                            onPress={async () => {
                                const url = coachClubData.facebook_url;
                                const app = `fb://facewebmodal/f?href=${url}`;
                                const supported = await Linking.canOpenURL(app);
                                const urlToOpen = supported ? app : url;
                                if (urlToOpen) {
                                    Linking.openURL(urlToOpen);
                                } else {
                                    Alert.alert('Erreur', "Impossible d'ouvrir le lien Facebook."); // FIXME: toast
                                }
                            }}
                        >
                            <Image
                                source={require('../../assets/minilogo/facebook.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    )}
                    {coachClubData.instagram_url && (
                        <TouchableOpacity
                            onPress={async () => {
                                if (coachClubData.instagram_url) {
                                    const username = coachClubData.instagram_url.split('/').pop();
                                    const app = `instagram://user?username=${username}`;
                                    const supported = await Linking.canOpenURL(app);
                                    Linking.openURL(supported ? app : coachClubData.instagram_url);
                                } else {
                                    Alert.alert('Erreur', "Impossible d'ouvrir le lien Instagram."); // FIXME: toast
                                }
                            }}
                        >
                            <Image
                                source={require('../../assets/minilogo/instagram.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    )}
                    {coachClubData.boutique_url && (
                        <TouchableOpacity
                            onPress={() => {
                                if (coachClubData.boutique_url) {
                                    Linking.openURL(coachClubData.boutique_url);
                                } else {
                                    Alert.alert(
                                        'Erreur',
                                        "Impossible d'ouvrir le lien de la boutique.",
                                    );
                                }
                            }}
                        >
                            <Image
                                source={require('../../assets/minilogo/boutique.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Déconnexion */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                    await signOut();
                }}
            >
                <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
            </TouchableOpacity>

            {/* Modal modification */}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Modifier mes informations</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editData.email}
                                onChangeText={(text) =>
                                    setEditData((prev) => ({ ...prev, email: text }))
                                }
                                placeholder="email@exemple.com"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Téléphone</Text>
                            <TextInput
                                style={styles.textInput}
                                // FIXME: est initialisé avec une valeur non null, d'où le !
                                value={editData.telephone!}
                                onChangeText={(text) =>
                                    setEditData((prev) => ({ ...prev, telephone: text }))
                                }
                                placeholder="06 12 34 56 78"
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Niveau diplôme</Text>
                            <TextInput
                                style={styles.textInput}
                                // FIXME: est initialisé avec une valeur non null, d'où le !
                                value={editData.niveau_diplome!}
                                onChangeText={(text) =>
                                    setEditData((prev) => ({ ...prev, niveau_diplome: text }))
                                }
                                placeholder="Brevet, CFF1, etc."
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Expérience</Text>
                            <TextInput
                                style={styles.textInput}
                                // FIXME: est initialisé avec une valeur non null, d'où le !
                                value={editData.experience!}
                                onChangeText={(text) =>
                                    setEditData((prev) => ({ ...prev, experience: text }))
                                }
                                placeholder="5 ans, débutant, etc."
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#333' }]}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: COLOR_GREEN_300 }]}
                                onPress={handleSaveChanges}
                            >
                                <Text style={[styles.modalButtonText, { color: '#000' }]}>
                                    Sauvegarder
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

interface ActionButtonProps {
    label: string;
    icon: any;
    onPress: () => void;
}

function ActionButton({ label, icon, onPress }: ActionButtonProps) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Ionicons name={icon} size={22} color="#00ff88" style={{ marginBottom: 6 }} />
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_BLACK_900,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_BLACK_900,
    },
    loadingText: {
        color: COLOR_BLACK_900,
        marginTop: 10,
        fontSize: 16,
    },

    // Header row
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
        width: '92%',
        maxWidth: 790,
    },
    welcomeTitle: {
        color: COLOR_GREEN_300,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    profilePhotoWrapper: {
        position: 'relative',
    },
    profilePhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
    },
    placeholderPhoto: {
        backgroundColor: COLOR_BLACK_900,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoWrapper: {
        alignItems: 'center',
    },
    clubLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
    },
    placeholderLogo: {
        backgroundColor: COLOR_BLACK_900,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLOR_GREEN_300,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLOR_BLACK_900,
    },

    // Encadré infos
    headerCard: {
        marginBottom: 16,
        backgroundColor: '#161b20',
        borderRadius: 22,
        padding: 20,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        shadowColor: COLOR_GREEN_300,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        width: '92%',
        alignSelf: 'center',
        maxWidth: 790,
    },
    nameAndEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.4,
        flex: 1,
        marginRight: 8,
    },
    headerCat: {
        color: COLOR_GREEN_300,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    editButton: {
        backgroundColor: '#232b28',
        borderRadius: 15,
        padding: 8,
        borderWidth: 1,
        borderColor: COLOR_GREEN_300,
    },

    // Infos
    infoContainerMobile: {
        gap: 12,
    },
    infoContainerDesktop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 5,
    },
    infoIcon: {
        marginRight: 0,
        marginLeft: 0,
        width: 20,
        color: COLOR_GREEN_300,
    },
    infoTextMobile: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    infoTextDesktop: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#161b20',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
    },
    modalTitle: {
        color: COLOR_GREEN_300,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#232b28',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Actions
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
        width: '92%',
        maxWidth: 790,
    },
    actionButton: {
        backgroundColor: '#161b20',
        borderColor: '#00ff88',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: Platform.OS === 'web' ? 12 : 10,
        paddingHorizontal: Platform.OS === 'web' ? 8 : 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        minHeight: Platform.OS === 'web' ? 100 : 85,
        width: Platform.OS === 'web' ? `${100 / 3 - 1}%` : `${100 / 2 - 1}%`,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        }),
    },

    // Autres styles
    subtitle: {
        color: '#aaa',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 10,
        maxWidth: 790,
        width: '92%',
    },
    cardGreen: {
        backgroundColor: '#161b20',
        borderRadius: 12,
        padding: 16,
        borderLeftColor: '#00ff88',
        borderLeftWidth: 4,
        marginBottom: 10,
    },
    eventTitle: { color: '#00ff88', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    eventInfo: { color: '#ccc', fontSize: 15, marginBottom: 20 },
    mapLink: { color: '#00ff88', textDecorationLine: 'underline', marginTop: 4 },
    buttonText: {
        color: '#fff',
        fontSize: Platform.OS === 'web' ? 13 : 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 5,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255,68,68,0.08)',
        borderRadius: 8,
    },
    clubEventsButton: {
        backgroundColor: '#00ff88',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 25,
        maxWidth: 790,
        width: '92%',
    },
    clubEventsButtonText: {
        color: '#000',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    allConvocationsButton: {
        backgroundColor: '#161b20',
        borderColor: '#00ff88',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 13,
        marginBottom: 14,
        alignItems: 'center',
        maxWidth: 790,
        width: '92%',
    },
    allConvocationsButtonText: {
        color: COLOR_GREEN_300,
        fontWeight: 'bold',
        fontSize: 15,
        textAlign: 'center',
    },
    socialLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
        marginTop: 30,
    },
    iconSocial: {
        width: 72,
        height: 72,
        borderRadius: 22,
        marginHorizontal: 5,
        backgroundColor: '#222',
    },
    logoutButton: {
        marginTop: 40,
        borderColor: '#00ff88',
        borderWidth: 2,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        width: '92%',
        maxWidth: 790,
        backgroundColor: '#161b20',
    },
    logoutButtonText: {
        color: '#00ff88',
        fontSize: 16,
        fontWeight: '700',
    },
});
