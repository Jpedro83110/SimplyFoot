import { ReactNode, useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    Linking,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '@/hooks/useSession';
import { copyToClipboard } from '@/utils/copyToClipboard.utils';
import Tooltip from 'react-native-walkthrough-tooltip';
import {
    COLOR_BLACK_900,
    COLOR_BLACK_LIGHT_900,
    COLOR_GREEN_300,
    RED,
} from '@/utils/styleContants.utils';
import { removeImage, uploadImage } from '@/helpers/storage.helpers';
import { getClubById, GetClubById, updateClub } from '@/helpers/clubs.helpers';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

export default function PresidentDashboard() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [club, setClub] = useState<GetClubById | null>(null);

    const { signOut } = useSession();

    const { utilisateur } = useSession();

    const fetchClub = async (clubId: string) => {
        setLoading(true);

        const fetchedClub = await getClubById({ clubId });
        setClub(fetchedClub);

        setLoading(false);
    };

    useEffect(() => {
        if (!utilisateur?.club_id || loading || club) {
            return;
        }

        fetchClub(utilisateur.club_id);
    }, [club, loading, utilisateur?.club_id]);

    const processLogoUpload = useCallback(
        async (image: ImagePicker.ImagePickerAsset) => {
            if (!utilisateur?.id || !club?.logo_url) {
                Alert.alert('Erreur', 'Utilisateur ou club non défini');
                setUploading(false);
                return;
            }

            try {
                if (club?.logo_url) {
                    await removeImage({
                        url: club.logo_url,
                        name: 'logos',
                    });
                }

                const baseLogoUrl = await uploadImage({
                    image,
                    name: 'logos',
                    utilisateurId: utilisateur.id,
                });

                await updateClub({
                    clubId: club.id,
                    club: { logo_url: baseLogoUrl },
                });

                const displayLogoUrl =
                    Platform.OS === 'web' ? `${baseLogoUrl}?t=${Date.now()}` : baseLogoUrl;

                setClub((prev) => (prev ? { ...prev, logo_url: displayLogoUrl } : prev));

                Alert.alert('Succès ! 🖼️', 'Logo du club mis à jour !');
            } catch (error) {
                Alert.alert(
                    'Erreur',
                    `Impossible de mettre à jour le logo:\n${(error as Error).message}`,
                );
            } finally {
                setUploading(false);
            }
        },
        [club?.id, club?.logo_url, utilisateur?.id],
    );

    const handleLogoUpload = useCallback(async () => {
        try {
            setUploading(true);

            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission requise',
                        'Nous avons besoin de votre permission pour accéder à vos photos.',
                    );
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                await processLogoUpload(result.assets[0]);
            }
        } catch (error) {
            console.error('❌ Erreur sélection logo:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner le logo');
            setUploading(false);
        }
    }, [processLogoUpload]);

    const LogoComponent = useCallback(() => {
        const defaultLogo = require('../../assets/logo-v2.png');
        const currentLogoUrl = club?.logo_url;

        if (!currentLogoUrl || currentLogoUrl.includes('logo.png')) {
            return <Image source={defaultLogo} style={styles.logo} resizeMode="cover" />;
        }

        return (
            <Image
                source={{ uri: currentLogoUrl }}
                style={styles.logo}
                resizeMode="cover"
                onError={(error) => {
                    console.error('Erreur chargement logo:', error);
                }}
            />
        );
    }, [club?.logo_url]);

    const openSocialLink = async (url: string, appUrl?: string) => {
        const supported = appUrl ? await Linking.canOpenURL(appUrl) : false;
        const urlToOpen = supported ? appUrl : url;
        if (urlToOpen) {
            Linking.openURL(urlToOpen);
        } else {
            Alert.alert('Erreur', "Impossible d'ouvrir le lien."); // FIXME: toast
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLOR_GREEN_300} />
                <Text style={styles.loadingText}>
                    {uploading ? 'Mise à jour du logo...' : 'Chargement...'}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: COLOR_BLACK_900 }}
            contentContainerStyle={styles.container}
        >
            <ScrollView
                contentContainerStyle={[styles.scroll]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.headerCard}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.logoContainer} onPress={handleLogoUpload}>
                            <LogoComponent />
                            {uploading ? (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator size="small" color={COLOR_GREEN_300} />
                                </View>
                            ) : (
                                <View style={styles.cameraOverlay}>
                                    <Ionicons name="camera" size={12} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.headerTextBox}>
                            <Text style={styles.welcome}>
                                Bienvenue Président{' '}
                                {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : ''}
                            </Text>
                            <Text style={styles.title}>{club?.nom || 'Club'}</Text>

                            <View style={styles.badge}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        {
                                            backgroundColor: club?.abonnement_actif
                                                ? COLOR_GREEN_300
                                                : RED,
                                        },
                                    ]}
                                />
                                <Text style={styles.statusText}>
                                    {club?.abonnement_actif
                                        ? 'Abonnement actif'
                                        : 'Abonnement inactif'}
                                </Text>
                            </View>

                            <View>
                                <Text style={styles.clubCodeTitle}>
                                    Votre code club{' '}
                                    <Tooltip
                                        isVisible={tooltipVisible}
                                        contentStyle={{ padding: 12, borderRadius: 8 }}
                                        content={
                                            <Text style={styles.tooltip}>
                                                Partagez ce code avec vos joueurs et coachs pour
                                                qu’ils puissent rejoindre le club.
                                            </Text>
                                        }
                                        placement="bottom"
                                        onClose={() => setTooltipVisible(false)}
                                    >
                                        <TouchableOpacity onPress={() => setTooltipVisible(true)}>
                                            <Ionicons
                                                name="information-circle-outline"
                                                size={18}
                                                color={COLOR_GREEN_300}
                                            />
                                        </TouchableOpacity>
                                    </Tooltip>{' '}
                                    :
                                    <View style={styles.clubCodeBox}>
                                        <Ionicons
                                            name="key-outline"
                                            size={16}
                                            color={COLOR_GREEN_300}
                                        />{' '}
                                        <Text selectable style={styles.clubCode}>
                                            {club?.code_acces || 'Code indisponible'}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.copyButton}
                                            onPress={() =>
                                                club?.code_acces &&
                                                copyToClipboard(club?.code_acces)
                                            }
                                        >
                                            <Ionicons name="copy-outline" size={18} color="#000" />
                                        </TouchableOpacity>
                                    </View>{' '}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Sections */}
                <Section title="📋 Infos club">
                    <TouchableOpacity
                        style={styles.fullBtnOutline}
                        onPress={() => router.push('/president/infos')}
                    >
                        <Ionicons
                            name="information-circle"
                            size={20}
                            color={COLOR_GREEN_300}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.fullBtnText}>Infos club</Text>
                    </TouchableOpacity>
                </Section>

                <Section title="🧾 Gestion du club">
                    <HalfButton
                        title="Voir le staff"
                        icon="people"
                        onPress={() => router.push('/president/staff')}
                    />
                    <HalfButton
                        title="Liste licenciés"
                        icon="clipboard"
                        onPress={() => router.push('/president/membres')}
                    />
                    <HalfButton
                        title="Anniversaires"
                        icon="cake"
                        iconFamily="MaterialCommunityIcons"
                        onPress={() => router.push('/president/anniversaires')}
                    />
                </Section>

                <Section title="📅 Organisation">
                    <HalfButton
                        title="Événements"
                        icon="calendar"
                        onPress={() => router.push('/president/evenements')}
                    />
                    <HalfButton
                        title="Stages"
                        icon="book"
                        onPress={() => router.push('/president/stages')}
                    />
                </Section>

                <Section title="💼 Administration">
                    <TouchableOpacity
                        style={styles.fullBtnFilled}
                        onPress={() => router.push('/president/gestion-budget')}
                    >
                        <Ionicons name="cash" size={20} color="#111" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Gestion Budget</Text>
                    </TouchableOpacity>
                </Section>

                {/* Réseaux sociaux */}
                <View style={styles.socialLinks}>
                    {club?.facebook_url && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() =>
                                openSocialLink(
                                    club.facebook_url!,
                                    `fb://facewebmodal/f?href=${club.facebook_url}`,
                                )
                            }
                        >
                            <Image
                                source={require('../../assets/minilogo/facebook.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    )}

                    {club?.instagram_url && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                const username = club
                                    .instagram_url!.split('/')
                                    .filter(Boolean)
                                    .pop();
                                openSocialLink(
                                    club.instagram_url!,
                                    `instagram://user?username=${username}`,
                                );
                            }}
                        >
                            <Image
                                source={require('../../assets/minilogo/instagram.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    )}

                    {club?.boutique_url && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => openSocialLink(club.boutique_url!)}
                        >
                            <Image
                                source={require('../../assets/minilogo/boutique.png')}
                                style={styles.iconSocial}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bouton déconnexion */}
                <TouchableOpacity style={styles.logoutButton} onPress={async () => await signOut()}>
                    <Ionicons
                        name="log-out-outline"
                        size={20}
                        color={COLOR_GREEN_300}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScrollView>
    );
}

function HalfButton({
    title,
    icon,
    onPress,
    iconFamily = 'Ionicons',
}: {
    title: string;
    icon: any; // FIXME: create a shared component and fix this type
    onPress: () => void;
    iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
}) {
    const IconComponent =
        iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

    return (
        <TouchableOpacity style={styles.halfBtn} onPress={onPress}>
            <IconComponent
                name={icon}
                size={20}
                color={COLOR_GREEN_300}
                style={{ marginRight: 8 }}
            />
            <Text style={styles.fullBtnText}>{title}</Text>
        </TouchableOpacity>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.grid}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
    },
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
    },
    loadingText: {
        color: COLOR_GREEN_300,
        marginTop: 10,
        fontSize: 16,
    },
    scroll: {
        flexGrow: 1,
        padding: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 25,
    },
    logoContainer: {
        position: 'relative',
        width: isMobile ? 40 : 80,
        height: isMobile ? 40 : 80,
    },
    logo: {
        width: isMobile ? 40 : 80,
        height: isMobile ? 40 : 80,
        borderRadius: isMobile ? 20 : 40,
        backgroundColor: '#222',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 40,
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
        borderColor: '#0a0a0a',
    },
    headerTextBox: {
        flex: 1,
    },
    welcome: {
        color: '#888',
        fontSize: isMobile ? 12 : 14,
        marginBottom: 12,
    },
    title: {
        fontSize: isMobile ? 20 : 22,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        marginBottom: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        color: '#ccc',
        fontSize: 13,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        color: COLOR_GREEN_300,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    fullBtnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: COLOR_BLACK_LIGHT_900,
        borderRadius: 22,
        padding: 16,
        width: '100%',
    },
    fullBtnFilled: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLOR_GREEN_300,
        borderRadius: 22,
        padding: 16,
        width: '100%',
    },
    halfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLOR_GREEN_300,
        backgroundColor: COLOR_BLACK_LIGHT_900,
        borderRadius: 22,
        padding: 16,
        width: '48%',
    },
    fullBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 1,
    },
    buttonText: {
        color: '#111',
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 1,
    },
    socialLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
        marginTop: 30,
        marginBottom: 20,
    },
    iconSocial: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: '#222',
    },
    logoutButton: {
        borderColor: COLOR_GREEN_300,
        backgroundColor: COLOR_BLACK_LIGHT_900,
        borderWidth: 2,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        marginHorizontal: 'auto',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    logoutText: {
        color: COLOR_GREEN_300,
        fontSize: 16,
        fontWeight: '700',
    },
    clubCodeTitle: {
        color: '#ccc',
        fontSize: 14,
    },
    tooltip: {
        color: '#111',
        padding: 4,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: 'Arial',
        textAlign: 'justify',
    },
    clubCodeBox: {
        paddingTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: isMobile ? 0 : 26,
    },
    clubCode: {
        color: COLOR_GREEN_300,
        fontSize: isMobile ? 12 : 16,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        backgroundColor: COLOR_GREEN_300,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 4,
    },
    clubCodeInfo: {
        color: '#aaa',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
});
