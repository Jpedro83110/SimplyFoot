import React, { useEffect, useState, useCallback } from 'react';
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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache';

export default function PresidentDashboard() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  
  // États pour la gestion des erreurs d'image
  const [imageError, setImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const MAX_RETRY = 3;

  // Hook pour forcer le rechargement de l'image
  const useForceImageReload = () => {
    const [reloadKey, setReloadKey] = useState(Date.now());
    
    const forceReload = useCallback(() => {
      console.log('Force reload déclenché');
      setReloadKey(Date.now());
    }, []);
    
    return [reloadKey, forceReload];
  };

  const [forceReloadKey, forceReload] = useForceImageReload();

  // Réinitialisez les états lors du changement d'image
  const resetImageStates = () => {
    console.log('Reset des états image');
    setImageError(false);
    setImageRetryCount(0);
    setImageLoaded(false);
    setImageRefreshKey(Date.now());
  };

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          Alert.alert("Erreur de session", "Session expirée, veuillez vous reconnecter.");
          router.replace('/auth/login-club');
          return;
        }
        
        setUserId(sessionData.session.user.id);
      } catch (err) {
        console.error('Erreur auth:', err);
        Alert.alert("Erreur", "Problème de connexion");
        router.replace('/auth/login-club');
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fonction pour récupérer les données du président
  const fetchPresident = async (userId) => {
    if (!userId) throw new Error("ID utilisateur manquant");
    
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('prenom, nom, role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error("Impossible de récupérer vos informations.");
    }
    
    if (data.role !== 'president') {
      throw new Error("Seul le président du club a accès à cet espace.");
    }
    
    return data;
  };

  // Fonction pour récupérer les données du club
  const fetchClub = async (userId) => {
    if (!userId) throw new Error("ID utilisateur manquant");
    
    const { data: clubRows, error: clubError } = await supabase
      .from('clubs_admins')
      .select(`
        club:club_id (
          id, 
          nom, 
          abonnement_actif, 
          logo_url, 
          facebook_url, 
          instagram_url, 
          boutique_url
        )
      `)
      .eq('user_id', userId)
      .eq('role_club', 'president')
      .eq('is_active', true);

    if (clubError || !clubRows || clubRows.length === 0 || !clubRows[0].club) {
      throw new Error("Aucun club trouvé pour cet utilisateur.");
    }

    return clubRows[0].club;
  };

  // Utilisation du cache pour les données
  const [president, , loadingPresident] = useCacheData(
    userId ? `president_${userId}` : null,
    () => fetchPresident(userId),
    12 * 3600
  );

  const [club, setClubState, loadingClub] = useCacheData(
    userId ? `club_president_${userId}` : null,
    () => fetchClub(userId),
    6 * 3600
  );

  // Fonction pour supprimer l'ancien logo
  const deleteOldLogo = async (logoUrl) => {
    try {
      if (!logoUrl || logoUrl.includes('logo.png')) return;
      
      const urlParts = logoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const cleanFileName = fileName.split('?')[0];
      const filePath = `logos/${cleanFileName}`;
      
      console.log('Tentative de suppression du fichier:', filePath);
      
      const { error } = await supabase.storage
        .from('fichiers')
        .remove([filePath]);
      
      if (error) {
        console.warn('Erreur lors de la suppression:', error);
      } else {
        console.log('Ancien logo supprimé avec succès');
      }
    } catch (err) {
      console.warn('Erreur lors de la suppression de l\'ancien logo:', err);
    }
  };

  // FONCTION CORRIGÉE - Mise à jour de l'état local
  const updateLocalState = async (publicUrl) => {
    try {
      console.log('=== MISE À JOUR ÉTAT LOCAL ===');
      console.log('Nouvelle URL:', publicUrl);
      
      // 1. Forcer la réinitialisation des états d'image AVANT tout
      resetImageStates();
      
      // 2. Mettre à jour l'état local IMMÉDIATEMENT
      setClubState(prev => ({ 
        ...prev, 
        logo_url: publicUrl 
      }));
      
      // 3. NE PAS invalider le cache - cela recharge les anciennes données !
      // On garde l'état local à jour sans toucher au cache
      
      // 4. Forcer un re-render
      forceReload();
      
      // 5. Attendre que la nouvelle URL soit propagée
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('État local mis à jour avec succès');
      console.log('==================================');
      
    } catch (error) {
      console.error('Erreur updateLocalState:', error);
    }
  };

  // FONCTION CORRIGÉE - Mise à jour après upload  
  const updateLogoAfterUpload = async (publicUrl) => {
    try {
      console.log('Début mise à jour logo:', publicUrl);
      
      // 1. Attendre un peu que le serveur soit prêt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Mettre à jour l'état local SANS invalider le cache
      await updateLocalState(publicUrl);
      
      console.log('Mise à jour terminée avec succès');
      
    } catch (error) {
      console.error('Erreur mise à jour logo:', error);
      // Continuer quand même
      await updateLocalState(publicUrl);
    }
  };

  // FONCTION CORRIGÉE - Modifier le logo (mobile)
  const modifierLogo = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      setUploading(true);
      setError(null);
      
      // Vérifier la session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        Alert.alert("Erreur", "Session expirée, veuillez vous reconnecter.");
        router.replace('/auth/login-club');
        return;
      }
      
      // Demander les permissions
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission refusée", "L'accès à la galerie est nécessaire pour changer le logo.");
        return;
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      
      // Lire le fichier avec FileSystem d'Expo
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("Fichier non trouvé");
      }

      // Vérifier la taille du fichier
      if (fileInfo.size > 2 * 1024 * 1024) {
        Alert.alert("Erreur", "Le fichier est trop volumineux (max 2MB).");
        return;
      }

      // SUPPRIMER L'ANCIEN LOGO D'ABORD
      if (club?.logo_url) {
        await deleteOldLogo(club.logo_url);
      }

      // Créer un nom de fichier unique
      const fileExtension = asset.mimeType?.split('/')[1] || 'png';
      const fileName = `logo_${club.id}_${Date.now()}.${fileExtension}`;
      const filePath = `logos/${fileName}`;

      // Lire le fichier en base64 pour mobile
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convertir en Blob pour l'upload
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: asset.mimeType || 'image/png' });

      // Upload du fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fichiers')
        .upload(filePath, blob, {
          contentType: asset.mimeType || 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erreur upload détaillée:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('fichiers')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error("Impossible d'obtenir l'URL du fichier");
      }

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('clubs')
        .update({ logo_url: publicUrl })
        .eq('id', club.id);

      if (updateError) {
        console.error('Erreur mise à jour BDD:', updateError);
        
        // Nettoyer le fichier uploadé en cas d'échec
        await supabase.storage
          .from('fichiers')
          .remove([filePath]);
          
        throw new Error(`Erreur mise à jour: ${updateError.message}`);
      }

      // Utiliser la nouvelle fonction de mise à jour
      await updateLogoAfterUpload(publicUrl);

      // Confirmation de succès
      Alert.alert("Succès", "Logo mis à jour avec succès !");

    } catch (err) {
      console.error('Erreur modification logo:', err);
      setError(err.message);
      Alert.alert("Erreur", err.message || "Problème lors de la modification du logo.");
    } finally {
      setUploading(false);
    }
  };

  // FONCTION CORRIGÉE - Modifier le logo (web)
  const modifierLogoWeb = async (event) => {
    if (Platform.OS !== 'web') return;
    
    try {
      setUploading(true);
      setError(null);
      
      const file = event.target.files[0];
      if (!file) return;

      // Vérifications de base
      if (!file.type.startsWith('image/')) {
        Alert.alert("Erreur", "Veuillez sélectionner un fichier image.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        Alert.alert("Erreur", "Le fichier est trop volumineux (max 2MB).");
        return;
      }

      // Vérifier la session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        Alert.alert("Erreur", "Session expirée, veuillez vous reconnecter.");
        router.replace('/auth/login-club');
        return;
      }

      // SUPPRIMER L'ANCIEN LOGO D'ABORD
      if (club?.logo_url) {
        await deleteOldLogo(club.logo_url);
      }

      // Créer un nom de fichier unique
      const fileExtension = file.type.split('/')[1] || 'png';
      const fileName = `logo_${club.id}_${Date.now()}.${fileExtension}`;
      const filePath = `logos/${fileName}`;

      // Upload direct du fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fichiers')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Erreur upload détaillée:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('fichiers')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error("Impossible d'obtenir l'URL du fichier");
      }

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('clubs')
        .update({ logo_url: publicUrl })
        .eq('id', club.id);

      if (updateError) {
        console.error('Erreur mise à jour BDD:', updateError);
        
        // Nettoyer le fichier uploadé en cas d'échec
        await supabase.storage
          .from('fichiers')
          .remove([filePath]);
          
        throw new Error(`Erreur mise à jour: ${updateError.message}`);
      }

      // Utiliser la nouvelle fonction de mise à jour
      await updateLogoAfterUpload(publicUrl);

      // Confirmation de succès
      Alert.alert("Succès", "Logo mis à jour avec succès !");

    } catch (err) {
      console.error('Erreur modification logo web:', err);
      setError(err.message);
      Alert.alert("Erreur", err.message || "Problème lors de la modification du logo.");
    } finally {
      setUploading(false);
      // Réinitialiser l'input file
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // COMPOSANT IMAGE ULTRA-SIMPLIFIÉ ET FONCTIONNEL
  const ImageComponent = () => {
    const defaultLogo = require('../../assets/logo.png');
    
    // Utiliser DIRECTEMENT l'URL du state local
    const currentLogoUrl = club?.logo_url;
    
    // Si erreur ou pas d'URL, afficher l'image par défaut
    if (imageError || !currentLogoUrl) {
      return (
        <Image
          source={defaultLogo}
          style={styles.logo}
          resizeMode="cover"
        />
      );
    }
    
    // URL SANS paramètres complexes - juste un timestamp simple
    const imageUrl = `${currentLogoUrl}?refresh=${Date.now()}`;
    
    console.log('ImageComponent - URL utilisée:', imageUrl);
    
    return (
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.logo}
          resizeMode="cover"
          onError={(error) => {
            console.log('Erreur image:', error);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Image chargée avec succès !');
            setImageLoaded(true);
            setImageError(false);
          }}
        />
      </View>
    );
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Erreur", "Impossible de se déconnecter");
      } else {
        router.replace('/');
      }
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      Alert.alert("Erreur", "Problème lors de la déconnexion");
    }
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

  // Debug effet pour l'URL du logo
  useEffect(() => {
    if (club?.logo_url) {
      console.log('=== LOGO DEBUG ===');
      console.log('Logo URL:', club.logo_url);
      console.log('Image refresh key:', imageRefreshKey);
      console.log('Force reload key:', forceReloadKey);
      console.log('Image error:', imageError);
      console.log('Image loaded:', imageLoaded);
      console.log('================');
    }
  }, [club?.logo_url, imageRefreshKey, forceReloadKey, imageError, imageLoaded]);

  const loading = loadingAuth || loadingPresident || loadingClub || uploading;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={styles.loadingText}>
          {uploading ? 'Mise à jour du logo...' : 'Chargement...'}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ImageComponent />
          <View style={styles.headerTextBox}>
            <Text style={styles.welcome}>
              Bienvenue Président {president ? `${president.prenom} ${president.nom}` : ''}
            </Text>
            <Text style={styles.title}>{club?.nom || 'Club'}</Text>
            <View style={styles.badge}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: club?.abonnement_actif ? '#00ff88' : '#ff4444' }
              ]} />
              <Text style={styles.statusText}>
                {club?.abonnement_actif ? 'Abonnement actif' : 'Abonnement inactif'}
              </Text>
            </View>
            
            {/* Bouton modifier logo */}
            {Platform.OS === 'web' ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  id="logo-upload"
                  style={{ display: 'none' }}
                  onChange={modifierLogoWeb}
                />
                <TouchableOpacity 
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      const input = document.getElementById('logo-upload');
                      if (input) {
                        input.click();
                      }
                    }
                  }}
                  disabled={uploading}
                >
                  <Text style={styles.logoButtonText}>
                    {uploading ? '⏳ Modification...' : '🖼 Modifier le logo'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={modifierLogo} disabled={uploading}>
                <Text style={styles.logoButtonText}>
                  {uploading ? '⏳ Modification...' : '🖼 Modifier le logo'}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Bouton de debug temporaire */}
            <TouchableOpacity 
              onPress={() => {
                console.log('Debug: Force reload + reset');
                forceReload();
                resetImageStates();
              }}
              style={{ marginTop: 5 }}
            >
              <Text style={[styles.logoButtonText, { fontSize: 11 }]}>
                🔄 Forcer rechargement
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sections */}
        <Section title="📋 Infos club">
          <FullButton 
            title="Infos club" 
            icon="information-circle" 
            onPress={() => router.push('/president/infos')} 
          />
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
          <FullFilledButton 
            title="Gestion Budget" 
            icon="cash" 
            onPress={() => router.push('/president/gestion-budget')} 
          />
        </Section>

        {/* Réseaux sociaux */}
        <View style={styles.socialLinks}>
          {club?.facebook_url && (
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => openSocialLink(
                club.facebook_url,
                `fb://facewebmodal/f?href=${club.facebook_url}`
              )}
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
                const username = club.instagram_url.split('/').filter(Boolean).pop();
                openSocialLink(
                  club.instagram_url,
                  `instagram://user?username=${username}`
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// Composants réutilisables
function FullButton({ title, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.fullBtnOutline} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#00ff88" style={{ marginRight: 8 }} />
      <Text style={styles.fullBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

function FullFilledButton({ title, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.fullBtnFilled} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#111" style={{ marginRight: 8 }} />
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function HalfButton({ title, icon, onPress, iconFamily = "Ionicons" }) {
  const IconComponent = iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  return (
    <TouchableOpacity style={styles.halfBtn} onPress={onPress}>
      <IconComponent name={icon} size={20} color="#00ff88" style={{ marginRight: 8 }} />
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#00ff88',
    marginTop: 10,
    fontSize: 16,
  },
  scroll: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 16,
  },
  logoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
  },
  headerTextBox: {
    flex: 1,
  },
  welcome: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 8,
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
  logoButtonText: {
    color: '#00ff88',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#00ff88',
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
    borderColor: '#00ff88',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  fullBtnFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  halfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    padding: 16,
    width: '48%',
  },
  fullBtnText: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '700',
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
    marginTop: 20,
    borderColor: '#00ff88',
    borderWidth: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '700',
  },
});