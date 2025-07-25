import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image, Platform, Dimensions,
  Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import TeamCard from '../../components/TeamCard';
import useCacheData from '../../lib/cache';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

const { width: screenWidth } = Dimensions.get('window');
const GREEN = '#00ff88';

export default function CoachDashboard() {
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [club, setClub] = useState(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  // États pour la modification
  const [editData, setEditData] = useState({
    telephone: '',
    email: '',
    niveau_diplome: '',
    experience: '',
  });

  // Fonction helper pour ajouter un cache-buster à l'affichage
  const getImageUrlWithCacheBuster = (url) => {
    if (!url) return url;
    
    // Si l'URL contient déjà un paramètre, ajouter avec &, sinon avec ?
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${refreshKey}`;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const id = sessionData?.session?.user?.id ?? null;
      setUserId(id);
      setLoadingAuth(false);

      if (id) {
        const { data: coachData } = await supabase
          .from('utilisateurs')
          .select('club_id')
          .eq('id', id)
          .single();
        
        if (coachData?.club_id) {
          const { data: clubData } = await supabase
            .from('clubs')
            .select('id, nom, facebook_url, instagram_url, boutique_url, logo_url')
            .eq('id', coachData.club_id)
            .single();
          
          setClub(clubData);
        }
      }
    });
  }, []);

  // Fetch coach depuis staff avec URI stable + refreshKey pour forcer le refresh
  const [coach, setCoach, loadingCoach] = useCacheData(
    userId ? `coach_${userId}_${refreshKey}` : null,
    async () => {
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('utilisateur_id', userId)
        .single();
      
      if (staffError) {
        const { data: userData, error: userError } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (userError) throw userError;
        return userData;
      }
      
      // Nettoyer l'URL photo pour éviter les cache-busters
      if (staffData.photo_url) {
        staffData.photo_url = staffData.photo_url.split('?')[0];
      }
      
      console.log('📷 Coach data loaded:', {
        id: staffData.id,
        nom: staffData.nom,
        photo_url: staffData.photo_url,
        refreshKey: refreshKey
      });
      
      return staffData;
    },
    12 * 3600
  );

  useEffect(() => {
    if (coach) {
      setEditData({
        telephone: coach?.telephone || '',
        email: coach?.email || '',
        niveau_diplome: coach?.niveau_diplome || '',
        experience: coach?.experience || '',
      });
    }
  }, [coach]);
  
  const clubId = coach?.club_id;

  // Fetch équipes
  async function fetchEquipesByClub(clubId) {
    if (!clubId) return [];
    
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .eq('club_id', clubId);
    
    if (error) throw error;
    
    const equipesAvecJoueurs = await Promise.all(
      (data || []).map(async (equipe) => {
        const { data: joueurs } = await supabase
          .from('joueurs')
          .select('id')
          .eq('equipe_id', equipe.id);
        
        return { ...equipe, joueurs: joueurs?.length || 0 };
      })
    );
    
    return equipesAvecJoueurs;
  }

  const [equipes, , loadingEquipes] = useCacheData(
    clubId ? `equipes_${clubId}_${refreshKey}` : null,
    () => fetchEquipesByClub(clubId),
    3 * 3600
  );

  // Upload photo
  const handleUploadProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
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
          // 1. Supprimer l'ancienne photo plus efficacement
          if (coach?.photo_url) {
            try {
              // Extraire le nom de fichier de l'URL complète
              const url = coach.photo_url.split('?')[0]; // Enlever les paramètres de cache
              const pathParts = url.split('/');
              
              // Chercher l'index de "photos_profils_coachs" dans l'URL
              const folderIndex = pathParts.findIndex(part => part === 'photos_profils_coachs');
              
              if (folderIndex !== -1 && pathParts[folderIndex + 1]) {
                const fileName = pathParts[folderIndex + 1];
                const oldFilePath = `photos_profils_coachs/${fileName}`;
                
                console.log('🗑️ Suppression ancienne photo:', oldFilePath);
                
                const { error: deleteError } = await supabase.storage
                  .from('fichiers')
                  .remove([oldFilePath]);
                
                if (deleteError) {
                  console.warn('⚠️ Erreur suppression:', deleteError.message);
                } else {
                  console.log('✅ Ancienne photo supprimée');
                }
              }
            } catch (deleteErr) {
              console.warn('⚠️ Erreur lors de la suppression:', deleteErr);
            }
          }

          let fileData;
          let fileExt = 'jpg';
          
          if (Platform.OS === 'web') {
            const response = await fetch(image.uri);
            fileData = await response.blob();
            
            if (image.uri.includes('.png')) fileExt = 'png';
            else if (image.uri.includes('.jpeg') || image.uri.includes('.jpg')) fileExt = 'jpg';
            else if (image.uri.includes('.gif')) fileExt = 'gif';
          } else {
            if (!image.base64) {
              throw new Error('Pas de données base64 disponibles');
            }
            
            fileData = decode(image.base64);
            
            if (image.uri.includes('png') || image.type?.includes('png')) fileExt = 'png';
            else if (image.uri.includes('jpeg') || image.uri.includes('jpg') || image.type?.includes('jpeg')) fileExt = 'jpg';
            else if (image.uri.includes('gif') || image.type?.includes('gif')) fileExt = 'gif';
          }
          
          // 3. Nom de fichier avec timestamp
          const fileName = `photos_profils_coachs/${userId}_${Date.now()}.${fileExt}`;
          console.log('📁 Tentative upload:', fileName);
          console.log('📦 Taille fichier:', fileData.size || fileData.byteLength || 'inconnue');

          // 4. Upload avec gestion d'erreur améliorée
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fichiers')
            .upload(fileName, fileData, {
              contentType: `image/${fileExt}`,
              upsert: true
            });

          console.log('📤 Résultat upload:', { uploadData, uploadError });

          if (uploadError) {
            console.error('❌ Détail erreur upload:', uploadError);
            throw new Error(`Upload échoué: ${uploadError.message}`);
          }

          if (!uploadData || !uploadData.path) {
            throw new Error('Upload réussi mais pas de path retourné');
          }

          const { data: urlData } = supabase.storage
            .from('fichiers')
            .getPublicUrl(fileName);

          const basePhotoUrl = urlData.publicUrl;
          
          // 6. Sauvegarder l'URL PROPRE en base (sans paramètres)
          console.log('💾 Sauvegarde en base:', basePhotoUrl);
          
          const { error: updateError } = await supabase
            .from('staff')
            .update({ photo_url: basePhotoUrl })
            .eq('utilisateur_id', userId);

          if (updateError) {
            console.error('❌ Erreur sauvegarde base:', updateError);
            throw new Error(`Sauvegarde échouée: ${updateError.message}`);
          }

          console.log('✅ Sauvegarde en base réussie');

          // 7. Mettre à jour l'état local et forcer le refresh complet
          setCoach(prev => ({ ...prev, photo_url: basePhotoUrl }));
          
          // IMPORTANT : Forcer un nouveau refreshKey pour synchroniser toutes les plateformes
          const newRefreshKey = Date.now();
          setRefreshKey(newRefreshKey);
          
          console.log('🔄 RefreshKey updated:', newRefreshKey);
          console.log('🎯 Photo finale mise à jour:', basePhotoUrl);
          
          // Petit délai pour s'assurer que le cache se met à jour
          setTimeout(() => {
            console.log('🔄 Forcing complete refresh...');
          }, 500);
          
          Alert.alert('Succès ! 📸', 'Photo de profil mise à jour sur toutes les plateformes !');
          
        } catch (error) {
          console.error('❌ Erreur complète:', error);
          Alert.alert('Erreur', `Impossible de mettre à jour la photo:\n${error.message}`);
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
      const updateData = {
        telephone: editData.telephone.trim(),
        email: editData.email.trim(),
        niveau_diplome: editData.niveau_diplome.trim(),
        experience: editData.experience.trim(),
      };

      const { error } = await supabase
        .from('staff')
        .update(updateData)
        .eq('utilisateur_id', userId);

      if (error) throw error;

      setCoach(prev => ({ ...prev, ...updateData }));
      setShowEditModal(false);
      
      Alert.alert('Succès', 'Informations mises à jour !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    }
  };

  // Supprimer équipe
  const handleDeleteEquipe = (equipeId, nomEquipe) => {
    Alert.alert(
      "Suppression",
      `Supprimer l'équipe "${nomEquipe}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer", style: "destructive",
          onPress: async () => {
            await supabase.from('equipes').delete().eq('id', equipeId);
            setRefreshKey(Date.now());
          }
        }
      ]
    );
  };

  // Calculer âge
  const calculAge = (date) => {
    if (!date) return null;
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age + ' ans';
  };

  // Hooks pour autres données
  const [stage] = useCacheData(
    clubId ? `stage_${clubId}` : null,
    async () => {
      const { data } = await supabase.from('stages').select('id').eq('club_id', clubId).maybeSingle();
      return data;
    },
    12 * 3600
  );

  const [evenements] = useCacheData(
    userId ? `evenements_${userId}` : null,
    async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const filterDate = yesterday.toISOString().split('T')[0];
      
      const { data, error } = await supabase.from('evenements')
        .select('*').eq('coach_id', userId)
        .gte('date', filterDate)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    1 * 3600
  );
  const evenement = evenements?.[0] || null;

  const [participations] = useCacheData(
    evenement?.id ? `participations_${evenement.id}` : null,
    async () => {
      const { data } = await supabase.from('participations_evenement')
        .select('*').eq('evenement_id', evenement.id);
      return data;
    },
    300
  );
  
  const presences = {
    present: participations?.filter(p => p.reponse === 'present').length ?? 0,
    absent: participations?.filter(p => p.reponse === 'absent').length ?? 0,
    transport: participations?.filter(
      p => p.besoin_transport === true || p.besoin_transport === "true" || p.besoin_transport === 1 || p.besoin_transport === "1"
    ).length ?? 0,
  };

  const loading = loadingAuth || loadingCoach || loadingEquipes;

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color="#00ff88" size="large" />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
  
  if (error) return (
    <View style={styles.loadingContainer}>
      <Text style={{ color: '#ff4444', marginBottom: 20 }}>{error}</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#00ff88', padding: 14, borderRadius: 12, width: 180 }}
        onPress={() => router.replace('/auth/login-club')}
      >
        <Text style={{ color: '#111', fontWeight: '700', textAlign: 'center' }}>Reconnexion</Text>
      </TouchableOpacity>
    </View>
  );

  const actionsData = [
    { label: "Créer équipe", icon: "people", route: "/coach/creation-equipe" },
    { label: "Créer événement", icon: "calendar", route: "/coach/creation-evenement" },
    { label: "Anniversaires", icon: "gift-outline", route: "/coach/anniversaires" },
    { label: "Feuille de match", icon: "document-text", route: "/coach/feuille-match" },
    { label: "Composition", icon: "grid", route: "/coach/composition" },
    { label: "Messagerie", icon: "chatbox", route: "/coach/messages" },
    { label: "Statistiques", icon: "bar-chart", route: "/coach/statistiques" },
  ];

  if (stage?.id) {
    actionsData.push({ label: "Programme de stage", icon: "book", route: "/coach/programme-stage" });
  }

  const isMobile = screenWidth < 768;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec photo + titre + logo */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.profilePhotoWrapper} onPress={handleUploadProfilePhoto}>
          {uploadingPhoto ? (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <ActivityIndicator size="small" color={GREEN} />
            </View>
          ) : coach?.photo_url ? (
            <Image 
              source={{ uri: getImageUrlWithCacheBuster(coach.photo_url) }} 
              style={styles.profilePhoto}
              key={`${coach.photo_url}_${refreshKey}`} // Clé qui change à chaque refresh
              onError={(error) => {
                console.log('❌ Erreur chargement image:', error);
                console.log('📷 URL problématique:', coach.photo_url);
              }}
              onLoad={() => {
                console.log('✅ Image chargée avec succès:', getImageUrlWithCacheBuster(coach.photo_url));
              }}
            />
          ) : (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <Ionicons name="camera" size={20} color={GREEN} />
            </View>
          )}
          {!uploadingPhoto && (
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.welcomeTitle}>Bienvenue Coach</Text>

        <View style={styles.logoWrapper}>
          {club?.logo_url ? (
            <Image source={{ uri: club.logo_url }} style={styles.clubLogo} />
          ) : (
            <View style={[styles.clubLogo, styles.placeholderLogo]}>
              <Ionicons name="shield-outline" size={20} color={GREEN} />
            </View>
          )}
        </View>
      </View>

      {/* Encadré infos coach */}
      <View style={styles.headerCard}>
        <View style={styles.nameAndEditRow}>
          <Text style={styles.headerName}>
            {coach?.prenom} {coach?.nom}
          </Text>
          <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color={GREEN} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerCat}>
          Coach · {club?.nom || 'Club'}
        </Text>

        <View style={isMobile ? styles.infoContainerMobile : styles.infoContainerDesktop}>
          {coach?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={isMobile ? 16 : 14} color={GREEN} style={styles.infoIcon} />
              <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                {coach.email}
              </Text>
            </View>
          )}
          
          {coach?.telephone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={isMobile ? 16 : 14} color={GREEN} style={styles.infoIcon} />
              <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                {coach.telephone}
              </Text>
            </View>
          )}
          
          {calculAge(coach?.date_naissance) && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={isMobile ? 16 : 14} color={GREEN} style={styles.infoIcon} />
              <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                {calculAge(coach.date_naissance)}
              </Text>
            </View>
          )}
          
          {coach?.niveau_diplome && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={isMobile ? 16 : 14} color={GREEN} style={styles.infoIcon} />
              <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                Diplôme : {coach.niveau_diplome}
              </Text>
            </View>
          )}

          {coach?.experience && (
            <View style={styles.infoRow}>
              <Ionicons name="trophy-outline" size={isMobile ? 16 : 14} color={GREEN} style={styles.infoIcon} />
              <Text style={isMobile ? styles.infoTextMobile : styles.infoTextDesktop}>
                Expérience : {coach.experience}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Équipes */}
      <Text style={styles.subtitle}>📌 Vos équipes</Text>
      {equipes && equipes.length > 0 ? (
        equipes.map((eq) => (
          <View key={eq.id} style={{ marginBottom: 12 }}>
            <TouchableOpacity onPress={() => router.push(`/coach/equipe/${eq.id}`)}>
              <TeamCard equipe={eq} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEquipe(eq.id, eq.nom)}
            >
              <Ionicons name="trash-outline" size={18} color="#ff4444" />
              <Text style={{ color: "#ff4444", marginLeft: 6, fontSize: 13 }}>Supprimer</Text>
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
        <Text style={styles.clubEventsButtonText}>
          📆 Événements du Club
        </Text>
      </TouchableOpacity>

      {/* Prochain événement */}
      <Text style={styles.subtitle}>📋 Prochain événement</Text>
      {evenement ? (
        <TouchableOpacity style={styles.cardGreen} onPress={() => router.push(`/coach/convocation/${evenement.id}`)}>
          <Text style={styles.eventTitle}>{evenement.titre}</Text>
          <Text style={styles.eventInfo}>📅 {evenement.date} à {evenement.heure}</Text>
          <Text style={styles.eventInfo}>📍 {evenement.lieu}</Text>
          {evenement.lieu_complement && (
            <Text style={[styles.eventInfo, { fontStyle: 'italic', color: '#8fd6ff' }]}>🏟️ {evenement.lieu_complement}</Text>
          )}
          {evenement.meteo && (
            <Text style={[styles.eventInfo, { color: '#00ff88' }]}>🌦️ {evenement.meteo}</Text>
          )}
          {evenement.latitude && evenement.longitude && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${evenement.latitude},${evenement.longitude}`)}
              style={{ marginTop: 4, alignSelf: 'flex-start' }}
            >
              <Text style={styles.mapLink}>🗺️ Voir sur Google Maps</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.eventInfo}>✅ Présents : {presences.present}</Text>
          <Text style={styles.eventInfo}>❌ Absents : {presences.absent}</Text>
          <Text style={styles.eventInfo}>🚗 À prendre en charge : {presences.transport}</Text>
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
        {actionsData.map((action, index) => (
          <ActionButton 
            key={index}
            label={action.label} 
            icon={action.icon} 
            onPress={() => router.push(action.route)} 
          />
        ))}
      </View>

      {/* Réseaux sociaux */}
      {club && (
        <View style={styles.socialLinks}>
          {club.facebook_url && (
            <TouchableOpacity
              onPress={async () => {
                const url = club.facebook_url;
                const app = `fb://facewebmodal/f?href=${url}`;
                const supported = await Linking.canOpenURL(app);
                Linking.openURL(supported ? app : url);
              }}
            >
              <Image source={require('../../assets/minilogo/facebook.png')} style={styles.iconSocial} />
            </TouchableOpacity>
          )}
          {club.instagram_url && (
            <TouchableOpacity
              onPress={async () => {
                const username = club.instagram_url.split('/').pop();
                const app = `instagram://user?username=${username}`;
                const supported = await Linking.canOpenURL(app);
                Linking.openURL(supported ? app : club.instagram_url);
              }}
            >
              <Image source={require('../../assets/minilogo/instagram.png')} style={styles.iconSocial} />
            </TouchableOpacity>
          )}
          {club.boutique_url && (
            <TouchableOpacity onPress={() => Linking.openURL(club.boutique_url)}>
              <Image source={require('../../assets/minilogo/boutique.png')} style={styles.iconSocial} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Déconnexion */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/');
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
                onChangeText={(text) => setEditData(prev => ({ ...prev, email: text }))}
                placeholder="email@exemple.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.textInput}
                value={editData.telephone}
                onChangeText={(text) => setEditData(prev => ({ ...prev, telephone: text }))}
                placeholder="06 12 34 56 78"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Niveau diplôme</Text>
              <TextInput
                style={styles.textInput}
                value={editData.niveau_diplome}
                onChangeText={(text) => setEditData(prev => ({ ...prev, niveau_diplome: text }))}
                placeholder="Brevet, CFF1, etc."
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Expérience</Text>
              <TextInput
                style={styles.textInput}
                value={editData.experience}
                onChangeText={(text) => setEditData(prev => ({ ...prev, experience: text }))}
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
                style={[styles.modalButton, { backgroundColor: GREEN }]}
                onPress={handleSaveChanges}
              >
                <Text style={[styles.modalButtonText, { color: '#000' }]}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ActionButton({ label, icon, onPress }) {
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
    backgroundColor: '#121212',
    padding: Platform.OS === 'web' ? 24 : 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#00ff88',
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
  },
  welcomeTitle: {
    color: GREEN,
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
    borderColor: GREEN,
  },
  placeholderPhoto: {
    backgroundColor: '#1e1e1e',
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
    borderColor: GREEN,
  },
  placeholderLogo: {
    backgroundColor: '#1e1e1e',
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
    borderColor: '#121212'
  },

  // Encadré infos
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#161b20',
    borderRadius: 22,
    padding: 20,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    width: '92%',
    alignSelf: 'center'
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
    color: GREEN, 
    fontSize: 14, 
    fontWeight: '700', 
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#232b28',
    borderRadius: 15,
    padding: 8,
    borderWidth: 1,
    borderColor: GREEN
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
  },
  infoIcon: {
    marginRight: 8,
    width: 20,
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
    paddingHorizontal: 20
  },
  modalContent: {
    backgroundColor: '#161b20',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: GREEN
  },
  modalTitle: {
    color: GREEN,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24
  },
  inputContainer: {
    marginBottom: 20
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#232b28',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GREEN,
    padding: 12,
    color: '#fff',
    fontSize: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderColor: '#00ff88',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 8 : 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: Platform.OS === 'web' ? 100 : 85,
    width: Platform.OS === 'web' 
      ? `${100 / 3 - 1}%`
      : `${100 / 2 - 1}%`,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },

  // Autres styles
  subtitle: { color: '#aaa', fontSize: 16, marginTop: 20, marginBottom: 10 },
  cardGreen: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderLeftColor: '#00ff88',
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  eventTitle: { color: '#00ff88', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  eventInfo: { color: '#ccc', fontSize: 15, marginBottom: 4 },
  mapLink: { color: '#00ff88', textDecorationLine: 'underline', marginTop: 4 },
  buttonText: {
    color: '#00ff88',
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
  },
  clubEventsButtonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  allConvocationsButton: {
    backgroundColor: '#171e20',
    borderColor: '#00ff88',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    marginBottom: 14,
    alignItems: 'center'
  },
  allConvocationsButtonText: {
    color: '#00ff88',
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
  },
  logoutButtonText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '700',
  },
});