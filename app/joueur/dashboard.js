import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Image, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';

const GREEN = '#00ff88';
const DARK = '#101415';
const LAST_MESSAGES_VIEWED = 'last_messages_viewed';

export default function JoueurDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [joueur, setJoueur] = useState(null);
  const [equipe, setEquipe] = useState(null);
  const [club, setClub] = useState(null);
  const [evenement, setEvenement] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (!session) throw new Error('Session expirée, reconnectez-vous.');

        const { data: userData } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (!userData?.joueur_id) throw new Error("Utilisateur non lié à un joueur.");
        if (mounted) setUser(userData);

        const { data: joueurData } = await supabase
          .from('joueurs')
          .select('*')
          .eq('id', userData.joueur_id)
          .single();
        if (mounted) setJoueur(joueurData);

        const { data: equipeData } = await supabase
          .from('equipes')
          .select('*')
          .eq('id', joueurData.equipe_id)
          .single();
        if (mounted) setEquipe(equipeData);

        const { data: clubData } = await supabase
          .from('clubs')
          .select('id, nom, logo_url, facebook_url, instagram_url, boutique_url')
          .eq('id', equipeData.club_id)
          .single();
        if (mounted) setClub(clubData);

        const { data: eventData } = await supabase
          .from('evenements')
          .select('*')
          .eq('equipe_id', equipeData.id)
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1)
          .single();
        if (mounted) setEvenement(eventData || null);

        const { data: participData } = await supabase
          .from('participations_evenement')
          .select('*')
          .eq('joueur_id', joueurData.id);
        if (mounted) setParticipations(participData || []);

        const lastViewed = await AsyncStorage.getItem(LAST_MESSAGES_VIEWED);
        const lastDate = lastViewed ? new Date(lastViewed) : new Date(0);
        const { data: messagesPrives } = await supabase
          .from('messages_prives')
          .select('created_at')
          .eq('recepteur_id', session.user.id);
        const { data: messagesGroupes } = await supabase
          .from('messages_groupe_coach')
          .select('created_at')
          .eq('equipe_id', equipeData.id);
        const allDates = [
          ...(messagesPrives?.map(m => new Date(m.created_at)) || []),
          ...(messagesGroupes?.map(m => new Date(m.created_at)) || []),
        ];
        const nouveau = allDates.some(date => date > lastDate);
        if (mounted) setNouveauMessage(nouveau);

        if (mounted) setLoading(false);
      } catch (e) {
        if (mounted) {
          setError(e.message);
          setLoading(false);
        }
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, []);

  const present = participations.filter(p => p.reponse === 'present').length;
  const total = participations.length;
  const tauxPresence = total > 0 ? Math.round((present / total) * 100) : 0;

  const calculAge = (date) => {
    if (!date) return 'Non renseigné';
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age + ' ans';
  };

  const handleOpenMessages = async () => {
    await AsyncStorage.setItem(LAST_MESSAGES_VIEWED, new Date().toISOString());
    setNouveauMessage(false);
    router.push('/joueur/messages');
  };

  const shortcuts = [
    { icon: <Ionicons name="calendar" size={28} color={GREEN} />, label: 'Convocations', go: () => router.push('/joueur/convocation') },
    {
      icon: (
        <View style={{ position: 'relative' }}>
          <MaterialCommunityIcons name="message-text-outline" size={28} color={GREEN} />
          {nouveauMessage && (
            <View style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#fc2b3a' }} />
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
    { icon: <Ionicons name="nutrition" size={28} color={GREEN} />, label: 'Conseils', go: () => router.push('/joueur/nutrition/scanner') },
  ];

  // LOADING / ERROR
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK }}>
        <ActivityIndicator size="large" color={GREEN} />
        <TouchableOpacity
          style={{ marginTop: 22, backgroundColor: GREEN, padding: 9, borderRadius: 7 }}
          onPress={() => router.replace('/')}
        >
          <Text style={{ color: '#111', fontWeight: '700' }}>Retour accueil</Text>
        </TouchableOpacity>
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

  // Fusion affichage
  const joueurFusionne = joueur && user
    ? { ...joueur, ...user, equipe: equipe?.nom || 'Non affecté' }
    : joueur || {};

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DARK }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: GREEN, fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 0 }}>
        Bienvenue {joueurFusionne?.prenom} {joueurFusionne?.nom} – <Text style={{ color: '#aaa', fontWeight: '400' }}>{user?.role === 'parent' ? 'Parent' : 'Joueur'}</Text>
      </Text>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.rowBetween}>
          <View style={styles.avatarCircle}>
            {club?.logo_url ? <Image source={{ uri: club.logo_url }} style={styles.avatarImg} /> : <Ionicons name="football" size={30} color={GREEN} />}
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerName}>{joueurFusionne?.prenom} {joueurFusionne?.nom}</Text>
            <Text style={styles.headerCat}>{user?.role === 'parent' ? 'Parent' : 'Joueur'} · {joueurFusionne?.equipe} · {calculAge(joueurFusionne?.date_naissance)}</Text>
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
          {total > 0 ?  ` (${present} / ${total})` : ''}
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

      {/* Prochain événement */}
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

      {/* Aide */}
      <Text style={{ color: GREEN, marginBottom: 10, textAlign: 'center', fontSize: 13 }}>
        👉 Clique sur "Convocations" pour voir et répondre à tous tes prochains événements !
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
        <TouchableOpacity style={styles.evalBtn} onPress={() => router.push('/joueur/eval-mentale')}>
          <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color={GREEN} style={{ marginRight: 7 }} />
          <Text style={styles.evalLabel}>Éval. mentale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.evalBtn} onPress={() => router.push('/joueur/eval-technique')}>
          <MaterialCommunityIcons name="soccer-field" size={18} color={GREEN} style={{ marginRight: 7 }} />
          <Text style={styles.evalLabel}>Éval. technique</Text>
        </TouchableOpacity>
      </View>

      {/* Réseaux sociaux club */}
      {club && (
        <View style={styles.socialLinks}>
          {club.facebook_url ? (
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
          ) : null}
          {club.instagram_url ? (
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
          ) : null}
          {club.boutique_url ? (
            <TouchableOpacity onPress={() => Linking.openURL(club.boutique_url)}>
              <Image source={require('../../assets/minilogo/boutique.png')} style={styles.iconSocial} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

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
          router.replace('/auth/login-joueur');
        }}
      >
        <Text style={{ color: GREEN, fontSize: 16, fontWeight: '700' }}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles : inchangés (reprends ceux de tes autres dashboards)
const styles = StyleSheet.create({
  headerCard: {
    marginTop: 28,
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
  socialLinks: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 30 },
  iconSocial: { width: 72, height: 72 },
});
