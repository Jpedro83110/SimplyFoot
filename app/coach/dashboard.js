import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import TeamCard from '../../components/TeamCard';
import useCacheData from '../../lib/cache';

export default function CoachDashboard() {
  const [userId, setUserId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [club, setClub] = useState(null);
  const router = useRouter();

useEffect(() => {
  supabase.auth.getSession().then(async ({ data: sessionData }) => {
    const id = sessionData?.session?.user?.id ?? null;
    setUserId(id);
    setLoadingAuth(false);

    if (id) {
      // Récupérer les infos du coach pour obtenir le club_id
      const { data: coachData } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', id)
        .single();

      const clubId = coachData?.club_id;
      if (clubId) {
        const { data: clubData } = await supabase
          .from('clubs')
          .select('id, nom, facebook_url, instagram_url, boutique_url')
          .eq('id', clubId)
          .single();

        console.log('clubData:', clubData);
        setClub(clubData);
      }
    }
  });
}, []);

  async function fetchCoach(userId) {
    const { data, error } = await supabase.from('utilisateurs').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  }

  async function fetchEquipes(userId) {
    const { data, error } = await supabase.from('equipes').select('*').eq('coach_id', userId);
    if (error) throw error;
    const equipesAvecJoueurs = await Promise.all(
      (data || []).map(async (equipe) => {
        const { data: joueurs } = await supabase
          .from('joueurs')
          .select('id')
          .eq('equipe_id', equipe.id);
        return {
          ...equipe,
          joueurs: joueurs?.length || 0,
        };
      })
    );
    return equipesAvecJoueurs;
  }

  async function fetchStages(clubId) {
    const { data } = await supabase.from('stages').select('id').eq('club_id', clubId).maybeSingle();
    return data;
  }

  async function fetchEvenements(userId) {
    const { data, error } = await supabase.from('evenements')
      .select('*')
      .eq('coach_id', userId)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  }

  async function fetchParticipations(evenementId) {
    const { data } = await supabase.from('participations_evenement')
      .select('*')
      .eq('evenement_id', evenementId);
    return data;
  }

  const [coach, , loadingCoach] = useCacheData(
    userId ? `coach_${userId}` : null,
    () => fetchCoach(userId),
    12 * 3600
  );
  const [equipes, , loadingEquipes] = useCacheData(
    userId ? `equipes_${userId}` : null,
    () => fetchEquipes(userId),
    3 * 3600
  );
  const clubId = coach?.club_id;
  const [stage] = useCacheData(
    clubId ? `stage_${clubId}` : null,
    () => fetchStages(clubId),
    12 * 3600
  );
  const [evenements] = useCacheData(
    userId ? `evenements_${userId}` : null,
    () => fetchEvenements(userId),
    1 * 3600
  );

  const evenement = evenements?.[0] || null;
  const [participations] = useCacheData(
    evenement?.id ? `participations_${evenement.id}` : null,
    () => fetchParticipations(evenement.id),
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

  // DEBUG: voir ce que reçoit le dashboard
  console.log('COACH club =', club);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
  if (error) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#ff4444', marginBottom: 20 }}>{error}</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#00ff88', width: 180 }]}
        onPress={() => router.replace('/auth/login-club')}
      >
        <Text style={styles.buttonText}>Reconnexion</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {coach
          ? <>Bienvenue {coach.prenom} {coach.nom} – <Text style={{ color: '#aaa', fontWeight: '400' }}>Coach</Text></>
          : "Bienvenue Coach"}
      </Text>

      <Text style={styles.subtitle}>📌 Vos équipes</Text>
      {equipes && equipes.length > 0 ? (
        equipes.map((eq) => (
          <TouchableOpacity key={eq.id} onPress={() => router.push(`/coach/equipe/${eq.id}`)}>
            <TeamCard equipe={eq} />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ color: '#aaa', fontStyle: 'italic', marginBottom: 10 }}>Aucune équipe pour le moment.</Text>
      )}

      <TouchableOpacity
        style={{ backgroundColor: '#00ff88', padding: 12, borderRadius: 10, marginTop: 20 }}
        onPress={() => router.push('/coach/evenements-club')}
      >
        <Text style={{ color: '#000', textAlign: 'center', fontWeight: 'bold' }}>
          📆 Événements du Club
        </Text>
      </TouchableOpacity>

      {/* EVENEMENT */}
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
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${evenement.latitude},${evenement.longitude}`)
              }
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

      <TouchableOpacity
        style={{
          backgroundColor: '#171e20',
          borderColor: '#00ff88',
          borderWidth: 1,
          borderRadius: 10,
          marginBottom: 14,
          paddingVertical: 13,
          alignItems: 'center'
        }}
        onPress={() => router.push('/coach/convocation')}
      >
        <Text style={{ color: '#00ff88', fontWeight: 'bold', fontSize: 15 }}>
          📑 Voir toutes les convocations / événements
        </Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>⚙️ Actions rapides</Text>
      <View style={styles.buttonRow}>
        <ActionButton label="Créer équipe" icon="people" onPress={() => router.push('/coach/creation-equipe')} />
        <ActionButton label="Créer événement" icon="calendar" onPress={() => router.push('/coach/creation-evenement')} />
          <ActionButton label="Anniversaires" icon="cake" onPress={() => router.push('/coach/anniversaires')} />
      </View>
      <View style={styles.buttonRow}>
        <ActionButton label="Feuille de match" icon="document-text" onPress={() => router.push('/coach/feuille-match')} />
        <ActionButton label="Composition" icon="grid" onPress={() => router.push('/coach/composition')} />
      </View>
      <View style={styles.buttonRow}>
        <ActionButton label="Messagerie" icon="chatbox" onPress={() => router.push('/coach/messages')} />
        <ActionButton label="Statistiques" icon="bar-chart" onPress={() => router.push('/coach/statistiques')} />
      </View>
      {stage?.id && (
        <View style={styles.buttonRow}>
          <ActionButton label="Programme de stage" icon="book" onPress={() => router.push('/coach/programme-stage')} />
        </View>
      )}

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

      <TouchableOpacity
        style={{
          marginTop: 40,
          borderColor: '#00ff88',
          borderWidth: 2,
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: 'center',
        }}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
      >
        <Text style={{ color: '#00ff88', fontSize: 16, fontWeight: '700' }}>🚪 Se déconnecter</Text>
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
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 26, color: '#00ff88', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderColor: '#00ff88',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 6,
    minWidth: 120,
  },
  buttonText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#00ff88',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginTop: 12,
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
});
