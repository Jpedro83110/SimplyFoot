import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Image, Dimensions, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useCacheData from '../../lib/cache'; // <-- AJOUTE ICI

const { width: windowWidth } = Dimensions.get('window');
const GREEN = '#00ff88';
const DARK = '#101415';
const LAST_MESSAGES_VIEWED = 'last_messages_viewed';

export default function JoueurDashboard() {
  const [userId, setUserId] = useState(null);
  const [joueurId, setJoueurId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [logoClub, setLogoClub] = useState(null);
  const [nouveauMessage, setNouveauMessage] = useState(false);
  const [role, setRole] = useState('Joueur');
  const router = useRouter();

  // 1. Auth/session, récup userId
  useEffect(() => {
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!sessionData?.session) {
        setError('Session expirée, reconnectez-vous.');
        setLoadingAuth(false);
        return;
      }
      setUserId(sessionData.session.user.id);
      setLoadingAuth(false);
    });
  }, []);

  // 2. Fetch user (pour avoir joueur_id et role)
  async function fetchUser(userId) {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data?.joueur_id) throw new Error('Utilisateur non lié à un joueur.');
    setJoueurId(data.joueur_id); // on stocke pour fetch joueur
    setRole(data?.role === 'parent' ? 'Parent' : 'Joueur');
    return data;
  }

  // 3. Fetch joueur (pour les infos et équipe)
  async function fetchJoueur(joueurId) {
    const { data, error } = await supabase
      .from('joueurs')
      .select('*')
      .eq('id', joueurId)
      .single();
    if (error || !data) throw new Error("Pas encore affecté à une équipe.");
    return data;
  }

  // 4. Fetch équipe pour le nom et club_id
  async function fetchEquipe(equipeId) {
    if (!equipeId) return { nom: 'Non affecté', club_id: null };
    const { data } = await supabase.from('equipes').select('nom, club_id').eq('id', equipeId).single();
    return data || { nom: 'Non affecté', club_id: null };
  }

  // 5. Fetch club/logo
  async function fetchClub(clubId) {
    if (!clubId) return { logo_url: null };
    const { data } = await supabase.from('clubs').select('logo_url').eq('id', clubId).single();
    return data || { logo_url: null };
  }

  // 6. Prochain évènement
  async function fetchNextEvent(equipeId) {
    if (!equipeId) return null;
    const { data } = await supabase
      .from('evenements')
      .select('*')
      .eq('equipe_id', equipeId)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(1)
      .single();
    return data;
  }

  // 7. Participations (présence)
  async function fetchParticipations(joueurId) {
    const { data } = await supabase
      .from('participations_evenement')
      .select('*')
      .eq('joueur_id', joueurId);
    return data || [];
  }

  // 8. Messages (prives/groupes)
  async function fetchNouveauMessage(userId, equipeId) {
    const lastViewed = await AsyncStorage.getItem(LAST_MESSAGES_VIEWED);
    const lastDate = lastViewed ? new Date(lastViewed) : new Date(0);

    // Messages privés
    const { data: messagesPrives } = await supabase
      .from('messages_prives')
      .select('created_at')
      .eq('recepteur_id', userId);

    // Messages groupes
    let messagesGroupes = [];
    if (equipeId) {
      const { data } = await supabase
        .from('messages_groupe_coach')
        .select('created_at')
        .eq('equipe_id', equipeId);
      messagesGroupes = data || [];
    }
    // Combine dates
    const allDates = [
      ...(messagesPrives?.map(m => new Date(m.created_at)) || []),
      ...(messagesGroupes?.map(m => new Date(m.created_at)) || [])
    ];
    return allDates.some(date => date > lastDate);
  }

  // HOOKS cache
  const [user, , loadingUser] = useCacheData(
    userId ? `user_${userId}` : null,
    () => fetchUser(userId),
    12 * 3600
  );

  const [joueur, , loadingJoueur] = useCacheData(
    joueurId ? `joueur_${joueurId}` : null,
    () => fetchJoueur(joueurId),
    12 * 3600
  );

  // Dès qu'on a le joueur, on récup l'équipe et le club/logo
  const equipeId = joueur?.equipe_id;
  const [equipe, , loadingEquipe] = useCacheData(
    equipeId ? `equipe_${equipeId}` : null,
    () => fetchEquipe(equipeId),
    12 * 3600
  );
  const clubId = equipe?.club_id;
  const [club, , loadingClub] = useCacheData(
    clubId ? `club_${clubId}` : null,
    () => fetchClub(clubId),
    24 * 3600
  );

  // Logo club (géré via useEffect si dispo)
  useEffect(() => {
    if (club?.logo_url) setLogoClub(club.logo_url);
  }, [club?.logo_url]);

  // Prochain événement
  const [evenement, , loadingEvent] = useCacheData(
    equipeId ? `evenement_joueur_${equipeId}` : null,
    () => fetchNextEvent(equipeId),
    600 // 10 min
  );

  // Présence (participations)
  const [participations, , loadingParticipations] = useCacheData(
    joueurId ? `participations_joueur_${joueurId}` : null,
    () => fetchParticipations(joueurId),
    600 // 10 min
  );
  const total = participations?.length || 0;
  const present = participations?.filter(p => p.reponse === 'present').length || 0;
  const presence = { total, present };

  // Badge nouveaux messages
  useEffect(() => {
    async function checkMessages() {
      if (userId && equipeId) {
        const nouveau = await fetchNouveauMessage(userId, equipeId);
        setNouveauMessage(nouveau);
      }
    }
    checkMessages();
  }, [userId, equipeId, evenement]);

  // Navigation messagerie pour marquer comme vu
  const handleOpenMessages = async () => {
    await AsyncStorage.setItem(LAST_MESSAGES_VIEWED, new Date().toISOString());
    setNouveauMessage(false);
    router.push('/joueur/messages');
  };

  // Shortcuts
  const shortcuts = [
    { icon: <Ionicons name="calendar" size={28} color={GREEN} />, label: 'Convocations', go: () => router.push('/joueur/convocation') },
    {
      icon: (
        <View style={{ position: 'relative' }}>
          <MaterialCommunityIcons name="message-text-outline" size={28} color={GREEN} />
          {nouveauMessage && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#fc2b3a',
            }} />
          )}
        </View>
      ),
      label: 'Messagerie',
      go: handleOpenMessages
    },
    { icon: <MaterialCommunityIcons name="star-circle-outline" size={28} color={GREEN} />, label: 'Note globale', go: () => router.push('/joueur/note-globale') },
    { icon: <MaterialCommunityIcons name="account-tie" size={28} color={GREEN} />, label: 'Suivi coach', go: () => router.push('/joueur/suivi-coach') },
    { icon: <MaterialCommunityIcons name="calendar-month-outline" size={28} color={GREEN} />, label: 'Programme', go: () => router.push('/joueur/programme-stage') },
    { icon: <Ionicons name="people" size={28} color={GREEN} />, label: 'Mon équipe', go: () => router.push('/joueur/equipe') },
  ];

  // Age
  const calculAge = (date) => {
    if (!date) return 'Non renseigné';
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age + ' ans';
  };

  // Taux de présence (%)
  let tauxPresence = 0;
  if (presence.total > 0) {
    tauxPresence = Math.round((presence.present / presence.total) * 100);
  }

  // Loading global
  const loading = loadingAuth || loadingUser || loadingJoueur || loadingEquipe || loadingClub || loadingEvent || loadingParticipations;

  if (loading || !joueur) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK }}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK }}>
        <Text style={{ color: '#fc2b3a', marginBottom: 30, fontWeight: 'bold' }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: GREEN, padding: 14, borderRadius: 12 }}
          onPress={() => router.replace('/auth/login-joueur')}
        >
          <Text style={{ color: '#111', fontWeight: '700' }}>Reconnexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fusion joueur + user + équipe (pour l'affichage)
  const joueurFusionne = joueur && user
    ? { ...joueur, ...user, equipe: equipe?.nom || 'Non affecté' }
    : joueur || {};

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DARK }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {/* Header Bienvenue */}
      <Text style={{ color: GREEN, fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 0 }}>
        Bienvenue {joueurFusionne?.prenom} {joueurFusionne?.nom} – <Text style={{ color: '#aaa', fontWeight: '400' }}>{role}</Text>
      </Text>

      <View style={styles.headerCard}>
        <View style={styles.rowBetween}>
          <View style={styles.avatarCircle}>
            {logoClub ? <Image source={{ uri: logoClub }} style={styles.avatarImg} /> : <Ionicons name="football" size={30} color={GREEN} />}
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerName}>{joueurFusionne?.prenom} {joueurFusionne?.nom}</Text>
            <Text style={styles.headerCat}>{role} · {joueurFusionne?.equipe} · {calculAge(joueurFusionne?.date_naissance)}</Text>
            <View style={styles.rowWrap}>
              <Ionicons name="card-outline" size={14} color={GREEN} style={{ marginRight: 5 }} />
              <Text style={styles.headerInfo}>Licence {joueurFusionne?.licence || 'Non renseignée'}</Text>
              <Ionicons name="medkit-outline" size={14} color={GREEN} style={{ marginLeft: 10, marginRight: 5 }} />
              <Text style={styles.headerInfo}>Visite médicale {joueurFusionne?.visite_medicale || 'Non renseignée'}</Text>
              <Ionicons name="shirt-outline" size={14} color={GREEN} style={{ marginLeft: 10, marginRight: 5 }} />
              <Text style={styles.headerInfo}>Équipement {joueurFusionne?.equipement || 'Non renseigné'}</Text>
              <Ionicons name="walk-outline" size={14} color={GREEN} style={{ marginLeft: 10, marginRight: 5 }} />
              <Text style={styles.headerInfo}>Poste : {joueurFusionne?.poste || 'Non renseigné'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Jauge présence */}
      <View style={{ width: '92%', alignSelf: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>
          Taux de présence : <Text style={{ color: GREEN, fontWeight: 'bold' }}>{tauxPresence}%</Text>
          {presence.total > 0 ? ` (${presence.present} / ${presence.total})` : ''}
        </Text>
        <View style={{ height: 9, backgroundColor: '#232b28', borderRadius: 8, overflow: 'hidden' }}>
          <View style={{
            height: 9,
            width: `${tauxPresence}%`,
            backgroundColor: GREEN,
            borderRadius: 8,
          }} />
        </View>
      </View>

      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>
          {evenement ? <Ionicons name="calendar" size={17} color={GREEN} /> : <Ionicons name="close-circle" size={17} color="#fc2b3a" />}  {evenement ? 'Événement à venir' : 'Aucun événement à venir'}
        </Text>
        {evenement ? (
          <>
            <Text style={styles.eventText}>{evenement?.type} – {new Date(evenement?.date).toLocaleString()}</Text>
            <Text style={styles.eventText}>Lieu : {evenement?.lieu}</Text>
            {evenement?.lieu_complement && (
              <Text style={[styles.eventText, { color: '#8fd6ff', fontStyle: 'italic' }]}>
                🏟️ {evenement.lieu_complement}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.eventText}>Reste connecté pour les prochains matchs et entraînements.</Text>
        )}
      </View>

      {/* Ajout du message d'aide */}
      <Text style={{ color: GREEN, marginBottom: 10, textAlign: 'center', fontSize: 13 }}>
        👉 Clique sur "Convocations" pour voir et répondre à tous tes prochains événements !
      </Text>

      <View style={styles.gridRow}>
        {shortcuts.map((el, i) => (
          <TouchableOpacity key={i} onPress={el.go} style={styles.btnMini}>
            <View style={styles.btnMiniIcon}>{el.icon}</View>
            <Text style={styles.btnMiniLabel}>{el.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.evalRow}>
        <TouchableOpacity style={styles.evalBtn} onPress={() => router.push('/joueur/eval-mentale')}>
          <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color={GREEN} style={{ marginRight: 7 }} />
          <Text style={styles.evalLabel}>Éval. mentale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.evalBtn} onPress={() => router.push('/joueur/eval-technique')}>
          <MaterialCommunityIcons name="soccer-field" size={18} color={GREEN} style={{ marginRight: 7 }} />
          <Text style={styles.evalLabel}>Éval. technique</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageRow}>
        <Image source={require('../../assets/JoueurDashboard1.png')} style={styles.imageHalf} />
        <Image source={require('../../assets/JoueurDashboard2.png')} style={styles.imageHalf} />
      </View>

      {/* Déconnexion */}
      <TouchableOpacity
        style={{
          marginTop: 28,
          borderColor: GREEN,
          borderWidth: 2,
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: 'center',
          width: '92%',
          alignSelf: 'center',
        }}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
      >
        <Text style={{ color: GREEN, fontSize: 16, fontWeight: '700' }}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles : inchangés, tu reprends les tiens
const styles = StyleSheet.create({
  headerCard: { marginTop: 28, marginBottom: 16, backgroundColor: '#161b20', borderRadius: 22, padding: 20, borderWidth: 2, borderColor: GREEN, shadowColor: GREEN, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, width: '92%', alignSelf: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 6 },
  avatarCircle: { backgroundColor: '#232b28', width: 54, height: 54, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GREEN },
  avatarImg: { width: 38, height: 38, borderRadius: 20 },
  headerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.4 },
  headerCat: { color: GREEN, fontSize: 13, fontWeight: '700', marginTop: 1 },
  headerInfo: { color: '#fff', fontSize: 12, marginRight: 8, fontWeight: '500' },
  eventCard: { backgroundColor: '#171e20', borderRadius: 18, borderWidth: 2, borderColor: GREEN, padding: 16, marginBottom: 20, width: '92%', alignSelf: 'center' },
  eventTitle: { color: GREEN, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  eventText: { color: '#fff', fontSize: 13, marginBottom: 2 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12, width: '92%', alignSelf: 'center', rowGap: 12 },
  btnMini: { backgroundColor: '#181f22', borderRadius: 18, borderWidth: 2, borderColor: GREEN, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, width: '30%', minWidth: 100, maxWidth: 160, shadowColor: GREEN, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  btnMiniIcon: { marginBottom: 7 },
  btnMiniLabel: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  evalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 26, marginBottom: 24, width: '92%', alignSelf: 'center', gap: 10 },
  evalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#171e20', borderRadius: 16, borderWidth: 2, borderColor: GREEN, paddingVertical: 14 },
  evalLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  imageRow: { flexDirection: 'row', justifyContent: 'space-between', width: '92%', alignSelf: 'center', marginTop: 30, marginBottom: 40 },
  imageHalf: { width: '48%', height: undefined, aspectRatio: 1, resizeMode: 'contain' }
});
