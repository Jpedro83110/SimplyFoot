import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    TextInput,
    Switch,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useSession } from '@/hooks/useSession';
import {
    COLOR_BLACK_900,
    COLOR_BLACK_LIGHT_900,
    COLOR_GREEN_300,
} from '@/utils/styleContants.util';
import { Database } from '@/types/database.types';
import { getImageUrlWithCacheBuster } from '@/utils/url.utils';
import { GetClubById, getClubById } from '@/helpers/clubs.helpers';
import { GetJoueurEquipeById, getJoueurEquipeById } from '@/helpers/equipes.helper';

const LAST_MESSAGES_VIEWED = 'last-messages-viewed';
const DEADLINE_LICENCE = new Date('2025-10-15T23:59:59');

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    expired?: boolean;
}

export default function JoueurDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({});
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const [equipe, setEquipe] = useState<GetJoueurEquipeById | null>(null);
    const [club, setClub] = useState<GetClubById | null>(null);
    const [evenement, setEvenement] = useState<
        Database['public']['Tables']['evenements']['Row'] | null
    >(null);
    const [participations, setParticipations] = useState<
        Database['public']['Tables']['participations_evenement']['Row'][]
    >([]);
    const [nouveauMessage, setNouveauMessage] = useState(false);

    const { signOut, utilisateur, joueur, updateUserData } = useSession();

    const [editData, setEditData] = useState<Database['public']['Tables']['joueurs']['Update']>({
        numero_licence: '',
        visite_medicale_valide: false,
        equipement: 'false',
        photo_profil_url: '',
    });

    const router = useRouter();

    const sendNotificationToStaff = useCallback(async () => {
        if (!utilisateur || !joueur || !equipe?.club_id) {
            return;
        }

        try {
            const { data: staffData } = await supabase
                .from('utilisateurs')
                .select('id, expo_push_token, prenom, nom, role')
                .in('role', ['president', 'coach'])
                .eq('club_id', equipe.club_id)
                .not('expo_push_token', 'is', null);

            if (staffData && staffData.length > 0) {
                const notificationsDB = staffData.map((staff) => ({
                    recepteur_id: staff.id,
                    titre: '⚠️ Licence manquante',
                    contenu: `Le joueur ${utilisateur.prenom} ${utilisateur.nom} n'a pas renseigné son numéro de licence avant la date limite du 15/10/2025.`,
                    type: 'alerte_licence',
                    created_at: new Date().toISOString(),
                }));

                await supabase.from('notifications').insert(notificationsDB);
                const pushNotifications = staffData
                    .filter((staff) => staff.expo_push_token && staff.expo_push_token.trim() !== '')
                    .map((staff) => ({
                        to: staff.expo_push_token,
                        sound: 'default',
                        title: '⚠️ Licence manquante',
                        body: `${utilisateur.prenom} ${utilisateur.nom} n'a pas sa licence !`,
                        data: {
                            type: 'licence_manquante',
                            joueur_id: joueur.id,
                            joueur_nom: `${utilisateur.prenom} ${utilisateur.nom}`,
                            equipe_id: equipe.id,
                            timestamp: new Date().toISOString(),
                        },
                        badge: 1,
                        priority: 'high',
                    }));
                if (pushNotifications.length > 0) {
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(pushNotifications),
                    });
                }
            }
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
        }
    }, [equipe?.club_id, equipe?.id, joueur, utilisateur]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = DEADLINE_LICENCE.getTime() - now;
            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                });
            } else {
                setTimeLeft({ expired: true });
                if (
                    joueur &&
                    (!joueur.numero_licence ||
                        joueur.numero_licence.trim() === '' ||
                        joueur.numero_licence === 'N/C' ||
                        joueur.numero_licence === 'NC')
                ) {
                    sendNotificationToStaff();
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [joueur, sendNotificationToStaff]);

    const fetchAll = useCallback(async () => {
        if (!joueur?.equipe_id || !utilisateur?.id || equipe) {
            return;
        }

        try {
            setEditData({
                numero_licence: joueur?.numero_licence,
                visite_medicale_valide: joueur?.visite_medicale_valide,
                equipement: joueur?.equipement,
                photo_profil_url: joueur?.photo_profil_url,
            });

            const equipeData = await getJoueurEquipeById(joueur.equipe_id);
            setEquipe(equipeData);

            if (!equipeData?.club_id) {
                return;
            }

            const clubData = await getClubById({ clubId: equipeData.club_id });
            setClub(clubData);

            const { data: eventData } = await supabase
                .from('evenements')
                .select('*')
                .eq('equipe_id', equipeData.id)
                .gte('date', new Date().toISOString())
                .order('date', { ascending: true })
                .limit(1)
                .single();
            setEvenement(eventData);

            const { data: participData } = await supabase
                .from('participations_evenement')
                .select('*')
                .eq('utilisateur_id', utilisateur.id);
            setParticipations(participData || []);

            const lastViewed = await AsyncStorage.getItem(LAST_MESSAGES_VIEWED);
            const lastDate = lastViewed ? new Date(lastViewed) : new Date(0);
            const { data: messagesPrives } = await supabase
                .from('messages_prives')
                .select('created_at')
                .eq('recepteur_id', utilisateur.id);
            const { data: messagesGroupes } = await supabase
                .from('messages_groupe_coach')
                .select('created_at')
                .eq('equipe_id', equipeData.id);
            const allDates = [
                ...(messagesPrives
                    ?.filter((message) => message.created_at)
                    .map((message) => new Date(message.created_at!)) || []),
                ...(messagesGroupes
                    ?.filter((message) => message.created_at)
                    .map((message) => new Date(message.created_at!)) || []),
            ];
            const nouveau = allDates.some((date) => date > lastDate);
            setNouveauMessage(nouveau);
            setLoading(false);
        } catch (error) {
            setError((error as Error).message);
            setLoading(false);
        }
    }, [
        equipe,
        joueur?.equipe_id,
        joueur?.equipement,
        joueur?.numero_licence,
        joueur?.photo_profil_url,
        joueur?.visite_medicale_valide,
        utilisateur?.id,
    ]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleImagePicker = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission requise',
                    'Nous avons besoin de votre permission pour accéder à vos photos.',
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const image = result.assets[0];
                setUploadingPhoto(true);

                try {
                    if (joueur?.photo_profil_url) {
                        try {
                            const url = joueur.photo_profil_url.split('?')[0];
                            const pathParts = url.split('/');
                            const folderIndex = pathParts.findIndex(
                                (part) => part === 'photos_profils_joueurs',
                            );

                            if (folderIndex !== -1 && pathParts[folderIndex + 1]) {
                                const fileName = pathParts[folderIndex + 1];
                                const oldFilePath = `photos_profils_joueurs/${fileName}`;
                                await supabase.storage.from('fichiers').remove([oldFilePath]);
                            }
                        } catch (deleteErr) {
                            console.error(
                                "Erreur lors de la suppression de l'ancienne photo:",
                                deleteErr,
                            );
                        }
                    }

                    let fileData,
                        fileExt = 'jpg';

                    if (Platform.OS === 'web') {
                        const response = await fetch(image.uri);
                        fileData = await response.blob();

                        if (image.uri.includes('.png')) {
                            fileExt = 'png';
                        } else if (image.uri.includes('.jpeg') || image.uri.includes('.jpg')) {
                            fileExt = 'jpg';
                        } else if (image.uri.includes('.gif')) {
                            fileExt = 'gif';
                        }
                    } else {
                        if (!image.base64) {
                            throw new Error('Pas de données base64 disponibles');
                        }

                        fileData = decode(image.base64);

                        if (image.uri.includes('png') || image.type?.includes('png')) {
                            fileExt = 'png';
                        } else if (
                            image.uri.includes('jpeg') ||
                            image.uri.includes('jpg') ||
                            image.type?.includes('jpeg')
                        ) {
                            fileExt = 'jpg';
                        } else if (image.uri.includes('gif') || image.type?.includes('gif')) {
                            fileExt = 'gif';
                        }
                    }

                    const fileName = `photos_profils_joueurs/${utilisateur?.id}_${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('fichiers')
                        .upload(fileName, fileData, {
                            contentType: `image/${fileExt}`,
                            upsert: true,
                        });

                    if (uploadError) {
                        throw new Error(`Upload échoué: ${uploadError.message}`);
                    }

                    const { data: urlData } = supabase.storage
                        .from('fichiers')
                        .getPublicUrl(fileName);
                    const basePhotoUrl = urlData.publicUrl;

                    await updateUserData({
                        joueurData: {
                            photo_profil_url: basePhotoUrl,
                        },
                    });

                    setEditData((prev) => ({ ...prev, photo_profil_url: basePhotoUrl }));
                    setRefreshKey(Date.now());

                    Alert.alert(
                        'Succès ! 📸',
                        'Photo de profil mise à jour sur toutes les plateformes !',
                    );
                } catch (error) {
                    Alert.alert(
                        'Erreur',
                        `Impossible de mettre à jour la photo:\n${(error as Error).message}`,
                    );
                } finally {
                    setUploadingPhoto(false);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la sélection de la photo:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner la photo');
            setUploadingPhoto(false);
        }
    };

    const handleSaveChanges = async () => {
        try {
            const updateData = {
                numero_licence: editData.numero_licence?.trim(),
                visite_medicale_valide: editData.visite_medicale_valide,
                equipement: editData.equipement ? 'Complet' : 'En attente',
            };

            await updateUserData({
                joueurData: {
                    ...updateData,
                },
            });

            setShowEditModal(false);
            Alert.alert('Succès', 'Informations mises à jour !');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des modifications:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
        }
    };

    const present = participations.filter((p) => p.reponse === 'present').length;
    const total = participations.length;
    const tauxPresence = total > 0 ? Math.round((present / total) * 100) : 0;

    const handleOpenMessages = async () => {
        await AsyncStorage.setItem(LAST_MESSAGES_VIEWED, new Date().toISOString());
        setNouveauMessage(false);
        router.push('/joueur/messages');
    };

    const shortcuts = [
        {
            icon: <Ionicons name="calendar" size={28} color={COLOR_GREEN_300} />,
            label: 'Convocations',
            go: () => router.push('/joueur/convocation'),
        },
        {
            icon: (
                <View style={{ position: 'relative' }}>
                    <MaterialCommunityIcons
                        name="message-text-outline"
                        size={28}
                        color={COLOR_GREEN_300}
                    />
                    {nouveauMessage && (
                        <View
                            style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: '#fc2b3a',
                            }}
                        />
                    )}
                </View>
            ),
            label: 'Messagerie',
            go: handleOpenMessages,
        },
        {
            icon: (
                <MaterialCommunityIcons
                    name="star-circle-outline"
                    size={28}
                    color={COLOR_GREEN_300}
                />
            ),
            label: 'Note globale',
            go: () => router.push('/joueur/note-globale'),
        },
        {
            icon: <MaterialCommunityIcons name="account-tie" size={28} color={COLOR_GREEN_300} />,
            label: 'Suivi coach',
            go: () => router.push('/joueur/suivi-coach'),
        },
        {
            icon: (
                <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={28}
                    color={COLOR_GREEN_300}
                />
            ),
            label: 'Programme',
            go: () => router.push('/joueur/programme-stage'),
        },
        {
            icon: <MaterialCommunityIcons name="cake-variant" size={28} color={COLOR_GREEN_300} />,
            label: 'Anniversaires',
            go: () => router.push('/joueur/anniversaires'),
        },
        {
            icon: <Ionicons name="people" size={28} color={COLOR_GREEN_300} />,
            label: 'Mon équipe',
            go: () => router.push('/joueur/equipe'),
        },
        {
            icon: <Ionicons name="nutrition" size={28} color={COLOR_GREEN_300} />,
            label: 'Conseils',
            go: () => router.push('/joueur/nutrition/scanner'),
        },
    ];

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLOR_BLACK_900,
                }}
            >
                <ActivityIndicator size="large" color={COLOR_GREEN_300} />
            </View>
        );
    }
    if (error) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLOR_BLACK_900,
                }}
            >
                <Text style={{ color: '#fc2b3a', marginBottom: 30, fontWeight: 'bold' }}>
                    {error}
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: COLOR_GREEN_300, padding: 14, borderRadius: 12 }}
                    onPress={() => router.replace('/auth/login-joueur')}
                >
                    <Text style={{ color: '#111', fontWeight: '700' }}>Reconnexion</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: COLOR_BLACK_900 }}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
        >
            <Text
                style={{
                    color: COLOR_GREEN_300,
                    fontSize: 22,
                    fontWeight: 'bold',
                    marginTop: 20,
                    marginBottom: 0,
                }}
            >
                Bienvenue {utilisateur?.prenom} {utilisateur?.nom} –{' '}
                <Text style={{ color: '#aaa', fontWeight: '400' }}>
                    {utilisateur?.role === 'parent' ? 'Parent' : 'Joueur'}
                </Text>
            </Text>
            {/* Header avec photo de profil */}
            <View style={styles.headerCard}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        marginBottom: 16,
                        position: 'relative',
                    }}
                >
                    {/* Photo de profil */}
                    <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
                        <View style={styles.avatarCircle}>
                            {uploadingPhoto ? (
                                <ActivityIndicator size="small" color={COLOR_GREEN_300} />
                            ) : joueur?.photo_profil_url ? (
                                <Image
                                    source={{
                                        uri: getImageUrlWithCacheBuster({
                                            url: joueur.photo_profil_url,
                                            refreshKey,
                                        }),
                                    }}
                                    style={styles.avatarImg}
                                    key={`${joueur.photo_profil_url}_${refreshKey}`}
                                />
                            ) : (
                                <Ionicons name="person" size={30} color={COLOR_GREEN_300} />
                            )}
                        </View>
                        {!uploadingPhoto && (
                            <View style={styles.cameraOverlay}>
                                <Ionicons name="camera" size={12} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    {equipe?.club?.logo_url && (
                        <View style={styles.clubLogoContainer}>
                            <Image
                                source={{ uri: equipe.club.logo_url }}
                                style={styles.clubLogo}
                                resizeMode="cover"
                            />
                        </View>
                    )}
                </View>
                <View style={styles.infoSection}>
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
                    <Text style={styles.headerCat}>{`${equipe?.nom} · ${equipe?.categorie}`}</Text>
                    <View style={styles.rowWrap}>
                        <View style={styles.statusItem}>
                            <Ionicons name="card-outline" style={styles.infoIcon} />
                            <Text style={styles.headerInfo}>
                                Licence {joueur?.numero_licence || 'Non renseignée'}
                            </Text>
                            {(!joueur?.numero_licence ||
                                joueur.numero_licence === 'N/C' ||
                                joueur.numero_licence === 'NC') && (
                                <Ionicons
                                    name="warning-outline"
                                    size={14}
                                    color="#fc2b3a"
                                    style={{ marginLeft: 5 }}
                                />
                            )}
                        </View>
                        <View style={styles.statusItem}>
                            <Ionicons name="medkit-outline" style={styles.infoIcon} />
                            <Text style={styles.headerInfo}>
                                Visite médicale{' '}
                                {joueur?.visite_medicale_valide ? 'Validée' : 'En attente'}
                            </Text>
                            {joueur?.visite_medicale_valide && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={COLOR_GREEN_300}
                                    style={{ marginLeft: 5 }}
                                />
                            )}
                        </View>
                        <View style={styles.statusItem}>
                            <Ionicons name="shirt-outline" style={styles.infoIcon} />
                            <Text style={styles.headerInfo}>
                                Équipement {joueur?.equipement || 'En attente'}
                            </Text>
                            {joueur?.equipement === 'Complet' && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={COLOR_GREEN_300}
                                    style={{ marginLeft: 5 }}
                                />
                            )}
                        </View>
                        <View style={styles.statusItem}>
                            <Ionicons name="walk-outline" style={styles.infoIcon} />
                            <Text style={styles.headerInfo}>
                                Poste : {joueur?.poste || 'Non renseigné'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
            {/* Compte à rebours licence */}
            {!timeLeft.expired &&
                (!joueur?.numero_licence ||
                    joueur.numero_licence.trim() === '' ||
                    joueur.numero_licence === 'N/C' ||
                    joueur.numero_licence === 'NC') && (
                    <View style={styles.deadlineCard}>
                        <Text style={styles.deadlineTitle}>
                            <Ionicons name="timer-outline" size={16} color="#fc2b3a" /> Date limite
                            licence : 15/10/2025
                        </Text>
                        <Text style={styles.deadlineTime}>
                            Temps restant : {timeLeft.days}j {timeLeft.hours}h {timeLeft.minutes}m
                        </Text>
                    </View>
                )}
            {timeLeft.expired &&
                (!joueur?.numero_licence ||
                    joueur.numero_licence.trim() === '' ||
                    joueur.numero_licence === 'N/C' ||
                    joueur.numero_licence === 'NC') && (
                    <View style={[styles.deadlineCard, { borderColor: '#fc2b3a' }]}>
                        <Text style={[styles.deadlineTitle, { color: '#fc2b3a' }]}>
                            <Ionicons name="alert-circle-outline" size={16} color="#fc2b3a" /> Délai
                            licence dépassé !
                        </Text>
                        <Text style={styles.deadlineTime}>
                            Le staff a été notifié automatiquement.
                        </Text>
                    </View>
                )}
            {/* Jauge présence */}
            <View style={{ width: '92%', alignSelf: 'center', marginBottom: 14, maxWidth: 790 }}>
                <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>
                    Taux de présence : <Text style={styles.attendanceTracker}>{tauxPresence}%</Text>
                    {total > 0 ? ` (${present} / ${total})` : ''}
                </Text>
                <View
                    style={{
                        height: 9,
                        backgroundColor: '#232b28',
                        borderRadius: 8,
                        overflow: 'hidden',
                    }}
                >
                    <View
                        style={{
                            height: 9,
                            width: `${tauxPresence}%`,
                            backgroundColor: COLOR_GREEN_300,
                            borderRadius: 8,
                        }}
                    />
                </View>
            </View>
            {/* Prochain événement */}
            <View style={styles.eventCard}>
                <Text style={styles.eventTitle}>
                    {evenement ? (
                        <Ionicons name="calendar" size={17} color={COLOR_GREEN_300} />
                    ) : (
                        <Ionicons name="close-circle" size={17} color="#fc2b3a" />
                    )}{' '}
                    {evenement ? 'Événement à venir' : 'Aucun événement à venir'}
                </Text>
                {evenement ? (
                    <>
                        <Text style={styles.eventText}>
                            {`${evenement?.type} - ${evenement?.date ? new Date(evenement?.date).toLocaleString() : ''}`}
                        </Text>
                        <Text style={styles.eventText}>Lieu : {evenement?.lieu}</Text>
                        {evenement?.lieu_complement && (
                            <Text
                                style={[
                                    styles.eventText,
                                    { color: '#8fd6ff', fontStyle: 'italic' },
                                ]}
                            >
                                🏟️ {evenement.lieu_complement}
                            </Text>
                        )}
                    </>
                ) : (
                    <Text style={styles.eventText}>
                        Reste connecté pour les prochains matchs et entraînements.
                    </Text>
                )}
            </View>
            {/* Aide */}
            <Text
                style={{
                    color: COLOR_GREEN_300,
                    marginBottom: 10,
                    textAlign: 'center',
                    fontSize: 13,
                }}
            >
                👉 Clique sur &quot;Convocations&quot; pour voir et répondre à tous tes prochains
                événements !
            </Text>
            {/* Raccourcis */}
            <View style={styles.gridRow}>
                {shortcuts.map((el, i) => (
                    <TouchableOpacity key={i} onPress={el.go} style={styles.btnMini}>
                        <View style={styles.btnMiniIcon}>{el.icon}</View>
                        <Text style={styles.btnMiniLabel}>{el.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.evalRow}>
                <TouchableOpacity
                    style={styles.evalBtn}
                    onPress={() => router.push('/joueur/eval-mentale')}
                >
                    <MaterialCommunityIcons
                        name="emoticon-happy-outline"
                        size={18}
                        color={COLOR_GREEN_300}
                        style={{ marginRight: 7 }}
                    />
                    <Text style={styles.evalLabel}>Éval. mentale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.evalBtn}
                    onPress={() => router.push('/joueur/eval-technique')}
                >
                    <MaterialCommunityIcons
                        name="soccer-field"
                        size={18}
                        color={COLOR_GREEN_300}
                        style={{ marginRight: 7 }}
                    />
                    <Text style={styles.evalLabel}>Éval. technique</Text>
                </TouchableOpacity>
            </View>
            {/* Réseaux sociaux club */}
            {club && (
                <View style={styles.socialLinks}>
                    {club.facebook_url ? (
                        <TouchableOpacity
                            onPress={async () => {
                                const url = club.facebook_url ?? '';
                                const app = `fb://facewebmodal/f?href=${url}`;
                                const supported = await Linking.canOpenURL(app);
                                Linking.openURL(supported ? app : url);
                            }}
                        >
                            <Image
                                source={require('../../assets/minilogo/facebook.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    ) : null}
                    {club.instagram_url ? (
                        <TouchableOpacity
                            onPress={async () => {
                                const username = club.instagram_url?.split('/').pop();
                                const app = `instagram://user?username=${username}`;
                                const supported = await Linking.canOpenURL(app);
                                Linking.openURL(supported ? app : (club.instagram_url ?? ''));
                            }}
                        >
                            <Image
                                source={require('../../assets/minilogo/instagram.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    ) : null}
                    {club.boutique_url ? (
                        <TouchableOpacity onPress={() => Linking.openURL(club.boutique_url ?? '')}>
                            <Image
                                source={require('../../assets/minilogo/boutique.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    ) : null}
                </View>
            )}
            {/* Déconnexion */}
            <TouchableOpacity
                style={{
                    marginTop: 28,
                    borderColor: COLOR_GREEN_300,
                    borderWidth: 2,
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    width: '92%',
                    alignSelf: 'center',
                    maxWidth: 790,
                    backgroundColor: COLOR_BLACK_LIGHT_900,
                }}
                onPress={async () => {
                    await signOut();
                }}
            >
                <Text
                    style={{
                        color: COLOR_GREEN_300,
                        fontSize: 16,
                        fontWeight: '700',
                        borderRadius: 10,
                    }}
                >
                    🚪 Se déconnecter
                </Text>
            </TouchableOpacity>
            {/* Modal de modification */}
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
                            <Text style={styles.inputLabel}>Numéro de licence</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editData.numero_licence || ''}
                                onChangeText={(text) =>
                                    setEditData((prev) => ({ ...prev, numero_licence: text }))
                                }
                                placeholder="Ex: 12345678"
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={styles.inputLabel}>Visite médicale validée</Text>
                            <Switch
                                value={editData.visite_medicale_valide ?? false}
                                onValueChange={(value) =>
                                    setEditData((prev) => ({
                                        ...prev,
                                        visite_medicale_valide: value,
                                    }))
                                }
                                trackColor={{ false: '#767577', true: COLOR_GREEN_300 }}
                                thumbColor={editData.visite_medicale_valide ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={styles.inputLabel}>Équipement reçu</Text>
                            <Switch
                                value={editData.equipement === 'Complet'}
                                onValueChange={(value: boolean) =>
                                    setEditData((prev) => ({
                                        ...prev,
                                        equipement: value ? 'Complet' : null,
                                    }))
                                }
                                trackColor={{ false: '#767577', true: COLOR_GREEN_300 }}
                                thumbColor={editData.equipement ? '#fff' : '#f4f3f4'}
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

const styles = StyleSheet.create({
    headerCard: {
        marginTop: 28,
        marginBottom: 16,
        backgroundColor: COLOR_BLACK_LIGHT_900,
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
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    photoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    clubLogoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: '#232b28',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clubLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    infoSection: {
        flex: 1,
    },
    attendanceTracker: {
        color: COLOR_GREEN_300,
        fontWeight: 'bold',
    },
    nameAndEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
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
        fontSize: 13,
        fontWeight: '700',
        marginTop: 1,
        marginBottom: 10,
    },
    editButton: {
        backgroundColor: '#232b28',
        borderRadius: 15,
        padding: 8,
        borderWidth: 1,
        borderColor: COLOR_GREEN_300,
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    infoIcon: {
        width: 20,
        color: COLOR_GREEN_300,
    },
    headerInfo: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarCircle: {
        backgroundColor: '#232b28',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
    },
    avatarImg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        resizeMode: 'cover',
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
        borderColor: COLOR_BLACK_LIGHT_900,
    },
    deadlineCard: {
        backgroundColor: '#2d1b1b',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fc2b3a',
        padding: 12,
        marginBottom: 16,
        width: '92%',
        alignSelf: 'center',
        maxWidth: 790,
    },
    deadlineTitle: {
        color: '#fc2b3a',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
        maxWidth: 790,
    },
    deadlineTime: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    eventCard: {
        backgroundColor: '#171e20',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        padding: 16,
        marginBottom: 20,
        width: '92%',
        alignSelf: 'center',
        maxWidth: 790,
    },
    eventTitle: {
        color: COLOR_GREEN_300,
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 6,
    },
    eventText: {
        color: '#fff',
        fontSize: 13,
        marginBottom: 2,
    },
    gridRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 12,
        width: '92%',
        alignSelf: 'center',
        rowGap: 12,
        maxWidth: 790,
    },
    btnMini: {
        backgroundColor: '#181f22',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        width: '30%',
        minWidth: 100,
        maxWidth: 160,
        shadowColor: COLOR_GREEN_300,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    btnMiniIcon: {
        marginBottom: 7,
    },
    btnMiniLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    evalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 26,
        marginBottom: 24,
        width: '92%',
        alignSelf: 'center',
        gap: 10,
        maxWidth: 790,
    },
    evalBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#171e20',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        paddingVertical: 14,
    },
    evalLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: COLOR_BLACK_LIGHT_900,
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
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 8,
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
});
