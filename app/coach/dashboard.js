import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image, Platform, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import TeamCard from '../../components/TeamCard';
import useCacheData from '../../lib/cache';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function CoachDashboard() {
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [club, setClub] = useState(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const id = sessionData?.session?.user?.id ?? null;
      setUserId(id);
      setLoadingAuth(false);

      if (id) {
        // Récupérer club infos pour social
        const { data: coachData, error: coachError } = await supabase
          .from('utilisateurs')
          .select('club_id')
          .eq('id', id)
          .single();
        
        const clubId = coachData?.club_id;
        
        if (clubId) {
          const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('id, nom, facebook_url, instagram_url, boutique_url, logo_url')
            .eq('id', clubId)
            .single();
          
          setClub(clubData);
        }
      }
    });
  }, []);

  // Fetch coach full info (pour prénom/nom)
  const [coach, , loadingCoach] = useCacheData(
    userId ? `coach_${userId}` : null,
    async () => {
      const { data, error } = await supabase.from('utilisateurs').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    },
    12 * 3600
  );
  
  const clubId = coach?.club_id;

  // Fetch équipes du club
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

  // --- SUPPRIMER une équipe ---
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

  // --- Autres hooks (stages, events, participations) ---
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

  // Gestion upload photo de profil
  const handleUploadProfilePhoto = () => {
    Alert.alert(
      "Photo de profil",
      "Fonctionnalité de téléchargement de photo à implémenter",
      [{ text: "OK" }]
    );
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
        style={[styles.button, { backgroundColor: '#00ff88', width: 180 }]}
        onPress={() => router.replace('/auth/login-club')}
      >
        <Text style={styles.buttonText}>Reconnexion</Text>
      </TouchableOpacity>
    </View>
  );

  // Actions rapides data
  const actionsData = [
    { label: "Créer équipe", icon: "people", route: "/coach/creation-equipe" },
    { label: "Créer événement", icon: "calendar", route: "/coach/creation-evenement" },
    { label: "Anniversaires", icon: "gift-outline", route: "/coach/anniversaires" },
    { label: "Feuille de match", icon: "document-text", route: "/coach/feuille-match" },
    { label: "Composition", icon: "grid", route: "/coach/composition" },
    { label: "Messagerie", icon: "chatbox", route: "/coach/messages" },
    { label: "Statistiques", icon: "bar-chart", route: "/coach/statistiques" },
  ];

  // Ajouter le stage si disponible
  if (stage?.id) {
    actionsData.push({ label: "Programme de stage", icon: "book", route: "/coach/programme-stage" });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* --- HEADER AVEC LOGOS --- */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          {/* Logo du club */}
          <View style={styles.logoWrapper}>
            {club?.logo_url ? (
              <Image 
                source={{ uri: club.logo_url }} 
                style={styles.clubLogo}
                onError={() => console.log("Erreur chargement logo club")}
              />
            ) : (
              <View style={[styles.clubLogo, styles.placeholderLogo]}>
                <Ionicons name="shield-outline" size={20} color="#00ff88" />
              </View>
            )}
          </View>

          {/* Photo de profil */}
          <TouchableOpacity 
            style={styles.profilePhotoWrapper}
            onPress={handleUploadProfilePhoto}
          >
            {coach?.photo_url ? (
              <Image 
                source={{ uri: coach.photo_url }} 
                style={styles.profilePhoto}
                onError={() => console.log("Erreur chargement photo profil")}
              />
            ) : (
              <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                <Ionicons name="person-add-outline" size={16} color="#00ff88" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {coach
            ? <>Bienvenue {coach.prenom} {coach.nom} – <Text style={styles.titleSub}>Coach</Text></>
            : "Bienvenue Coach"}
        </Text>
      </View>

      {/* --- ÉQUIPES --- */}
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

      {/* --- BOUTON EVENEMENTS --- */}
      <TouchableOpacity
        style={styles.clubEventsButton}
        onPress={() => router.push('/coach/evenements-club')}
      >
        <Text style={styles.clubEventsButtonText}>
          📆 Événements du Club
        </Text>
      </TouchableOpacity>

      {/* --- PROCHAIN ÉVÉNEMENT --- */}
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

      {/* --- CONVOCATIONS / EVENEMENTS --- */}
      <TouchableOpacity
        style={styles.allConvocationsButton}
        onPress={() => router.push('/coach/convocation')}
      >
        <Text style={styles.allConvocationsButtonText}>
          📑 Voir toutes les convocations / événements
        </Text>
      </TouchableOpacity>

      {/* --- ACTIONS RAPIDES RESPONSIVE --- */}
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

      {/* --- SOCIAL LINKS --- */}
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

      {/* --- LOGOUT --- */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
      >
        <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
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

  // Header avec logos
  headerSection: {
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  logoWrapper: {
    flex: 1,
  },
  clubLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  placeholderLogo: {
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoWrapper: {
    marginLeft: 'auto',
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  placeholderPhoto: {
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Actions responsive
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
    
    // Responsive width
    width: Platform.OS === 'web' 
      ? `${100 / 3 - 1}%`  // Web: 3 colonnes (33% - margin)
      : `${100 / 2 - 1}%`, // Mobile: 2 colonnes (50% - margin)
    
    // Hover effect sur web
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },

  // Styles existants
  title: { fontSize: 26, color: '#00ff88', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  titleSub: { color: '#aaa', fontWeight: '400' },
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