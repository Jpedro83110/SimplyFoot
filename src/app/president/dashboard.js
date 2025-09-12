import React, { useEffect, useState } from 'react';
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
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import useCacheData from '@/lib/cache';
import { useSession } from '@/hooks/useSession';
import { copyToClipboard } from '@/utils/copyToClipboard.utils';
import Tooltip from 'react-native-walkthrough-tooltip';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';

const GREEN = '#00ff88';
const DARK = '#101415';
const DARK_LIGHT = '#161b20';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

export default function PresidentDashboard() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [tooltipVisible, setTooltipVisible] = React.useState(false);

    const { signOut } = useSession();

    const { utilisateur } = useSession();

    const fetchPresident = async (userId) => {
        if (!userId) {
            throw new Error('ID utilisateur manquant');
        }

        const { data, error } = await supabase
            .from('utilisateurs')
            .select('prenom, nom, role')
            .eq('id', userId)
            .single();

        if (error || !data) {
            throw new Error('Impossible de récupérer vos informations.');
        }

        if (data.role !== 'president') {
            throw new Error('Seul le président du club a accès à cet espace.');
        }

        return data;
    };

    const fetchClub = async (userId) => {
        if (!userId) {
            throw new Error('ID utilisateur manquant');
        }

        const { data: clubRows, error: clubError } = await supabase
            .from('clubs_admins')
            .select(
                `
        club:club_id (
          id, 
          nom, 
          abonnement_actif, 
          code_acces,
          logo_url, 
          facebook_url, 
          instagram_url, 
          boutique_url
        )
      `,
            )
            .eq('user_id', userId)
            .eq('role_club', 'president')
            .eq('is_active', true);

        if (clubError || !clubRows || clubRows.length === 0 || !clubRows[0].club) {
            throw new Error('Aucun club trouvé pour cet utilisateur.');
        }

        return clubRows[0].club;
    };

    const [president, , loadingPresident] = useCacheData(
        utilisateur?.id ? `president_${utilisateur?.id}` : null,
        () => fetchPresident(utilisateur?.id),
        12 * 3600,
    );

    const [club, setClubState, loadingClub] = useCacheData(
        utilisateur?.id ? `club_president_${utilisateur?.id}` : null,
        () => fetchClub(utilisateur?.id),
        6 * 3600,
    );

    const handleLogoUpload = async () => {
        try {
            setUploading(true);
            setError(null);

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

            if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';

                return new Promise((resolve) => {
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            await processLogoUpload(file, null);
                        }
                        resolve();
                    };
                    input.click();
                });
            } else {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                    base64: true,
                });

                if (!result.canceled && result.assets[0]) {
                    await processLogoUpload(null, result.assets[0]);
                }
            }
        } catch (error) {
            console.error('❌ Erreur sélection logo:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner le logo');
            setUploading(false);
        }
    };

    const processLogoUpload = async (webFile, mobileImage) => {
        try {
            if (club?.logo_url && !club.logo_url.includes('logo.png')) {
                try {
                    const urlParts = club.logo_url.split('/');
                    let oldFileName = urlParts[urlParts.length - 1];

                    oldFileName = oldFileName.split('?')[0];

                    const oldFilePath = `logos/${oldFileName}`;

                    const { error: deleteError } = await supabase.storage
                        .from('fichiers')
                        .remove([oldFilePath]);

                    if (deleteError) {
                        console.warn(
                            "⚠️ Impossible de supprimer l'ancien logo:",
                            deleteError.message,
                        );
                    }
                } catch (deleteErr) {
                    console.warn('⚠️ Erreur lors de la suppression:', deleteErr);
                }
            }

            let fileData;
            let fileExt = 'png';
            let contentType = 'image/png';

            if (Platform.OS === 'web' && webFile) {
                fileData = webFile;
                fileExt = webFile.type.split('/')[1] || 'png';
                contentType = webFile.type;

                if (webFile.size > 2 * 1024 * 1024) {
                    throw new Error('Le fichier est trop volumineux (max 2MB)');
                }
            } else if (mobileImage) {
                if (!mobileImage.base64) {
                    throw new Error('Pas de données base64 disponibles');
                }

                fileData = decode(mobileImage.base64);

                if (mobileImage.uri.includes('png') || mobileImage.type?.includes('png')) {
                    fileExt = 'png';
                    contentType = 'image/png';
                } else if (
                    mobileImage.uri.includes('jpeg') ||
                    mobileImage.uri.includes('jpg') ||
                    mobileImage.type?.includes('jpeg')
                ) {
                    fileExt = 'jpg';
                    contentType = 'image/jpeg';
                }
            } else {
                throw new Error("Aucune donnée d'image disponible");
            }

            const fileName = `logos/${club.id}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('fichiers')
                .upload(fileName, fileData, {
                    contentType: contentType,
                    upsert: true,
                });

            if (uploadError) {
                console.error('❌ Erreur upload:', uploadError);
                throw new Error(`Upload échoué: ${uploadError.message}`);
            }

            const { data: urlData } = supabase.storage.from('fichiers').getPublicUrl(fileName);

            const baseLogoUrl = urlData.publicUrl;

            const { error: updateError } = await supabase
                .from('clubs')
                .update({ logo_url: baseLogoUrl })
                .eq('id', club.id);

            if (updateError) {
                console.error('❌ Erreur sauvegarde:', updateError);
                throw new Error(`Sauvegarde échouée: ${updateError.message}`);
            }

            const displayLogoUrl =
                Platform.OS === 'web' ? `${baseLogoUrl}?t=${Date.now()}` : baseLogoUrl;

            setClubState((prev) => ({ ...prev, logo_url: displayLogoUrl }));

            Alert.alert('Succès ! 🖼️', 'Logo du club mis à jour !');
        } catch (error) {
            console.error('❌ Erreur:', error);
            Alert.alert('Erreur', `Impossible de mettre à jour le logo:\n${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // COMPOSANT IMAGE OPTIMISÉ
    const LogoComponent = () => {
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
                    console.log('Erreur chargement logo:', error);
                }}
                onLoad={() => {
                    console.log('Logo chargé avec succès !');
                }}
            />
        );
    };

    // Fonction pour ouvrir les réseaux sociaux
    const openSocialLink = async (url, appUrl) => {
        try {
            if (Platform.OS !== 'web' && appUrl) {
                const supported = await Linking.canOpenURL(appUrl);
                Linking.openURL(supported ? appUrl : url);
            } else {
                Linking.openURL(url);
            }
        } catch (err) {
            console.error('Erreur ouverture lien:', err);
            Linking.openURL(url);
        }
    };

    // Effet pour vérifier les autorisations
    useEffect(() => {
        if (president && president.role !== 'president') {
            Alert.alert('Accès refusé', 'Seul le président du club a accès à cet espace.');
            router.replace('/');
        }
        if (error) {
            Alert.alert('Erreur', error);
            router.replace('/');
        }
    }, [president, error, router]);

    const loading = loadingPresident || loadingClub;

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
            style={{ flex: 1, backgroundColor: DARK }}
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
                                {president ? `${president.prenom} ${president.nom}` : ''}
                            </Text>
                            <Text style={styles.title}>{club?.nom || 'Club'}</Text>

                            <View style={styles.badge}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        {
                                            backgroundColor: club?.abonnement_actif
                                                ? GREEN
                                                : '#ff4444',
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
                                        <TouchableOpacity
                                            onPress={() => setTooltipVisible(true)}
                                            style={styles.infoButton}
                                        >
                                            <Ionicons
                                                name="information-circle-outline"
                                                size={18}
                                                color={GREEN}
                                            />
                                        </TouchableOpacity>
                                    </Tooltip>{' '}
                                    :
                                    <View style={styles.clubCodeBox}>
                                        <Ionicons name="key-outline" size={16} color={GREEN} />{' '}
                                        <Text selectable style={styles.clubCode}>
                                            {club?.code_acces || 'Code indisponible'}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.copyButton}
                                            onPress={() => copyToClipboard(club?.code_acces)}
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
                                    club.facebook_url,
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
                                const username = club.instagram_url
                                    .split('/')
                                    .filter(Boolean)
                                    .pop();
                                openSocialLink(
                                    club.instagram_url,
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
                            onPress={() => openSocialLink(club.boutique_url)}
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

function HalfButton({ title, icon, onPress, iconFamily = 'Ionicons' }) {
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

function Section({ title, children }) {
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
        backgroundColor: DARK_LIGHT,
        borderRadius: 22,
        padding: 20,
        borderWidth: 2,
        borderColor: GREEN,
        shadowColor: GREEN,
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
        color: GREEN,
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
        backgroundColor: GREEN,
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
        color: GREEN,
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
        color: GREEN,
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
        borderColor: GREEN,
        backgroundColor: DARK_LIGHT,
        borderRadius: 22,
        padding: 16,
        width: '100%',
    },
    fullBtnFilled: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: GREEN,
        borderRadius: 22,
        padding: 16,
        width: '100%',
    },
    halfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: GREEN,
        backgroundColor: DARK_LIGHT,
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
        borderColor: GREEN,
        backgroundColor: DARK_LIGHT,
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
        color: GREEN,
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
        color: GREEN,
        fontSize: isMobile ? 12 : 16,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        backgroundColor: GREEN,
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
