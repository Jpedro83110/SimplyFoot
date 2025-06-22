import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Image, ActivityIndicator, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache';
import ReseauxSociaux from '../../components/ReseauxSociaux';

export default function PresidentDashboard() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (sessionError || !sessionData.session) {
        Alert.alert("Erreur de session", "Session expirée, veuillez vous reconnecter.");
        router.replace('/auth/login-club');
        return;
      }
      setUserId(sessionData.session.user.id);
      setLoadingAuth(false);
    });
  }, []);

  async function fetchPresident(userId) {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('prenom, nom, role')
      .eq('id', userId)
      .single();

    if (error || !data) throw new Error("Impossible de récupérer vos informations.");
    if (data.role !== 'president') throw new Error("Seul le président du club a accès à cet espace.");
    return data;
  }

  async function fetchClub(userId) {
    const { data: clubRows, error: clubError } = await supabase
      .from('clubs_admins')
      .select('club:club_id (id, nom, abonnement_actif, logo_url, facebook_url, instagram_url, boutique_url)')
      .eq('user_id', userId)
      .eq('role_club', 'president')
      .eq('is_active', true);

    if (!clubError && clubRows && clubRows.length > 0 && clubRows[0].club) {
      return clubRows[0].club;
    } else {
      throw new Error("Aucun club trouvé pour cet utilisateur.");
    }
  }

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

  const deleteOldLogo = async (logoUrl) => {
    try {
      if (!logoUrl || logoUrl.includes('logo.png')) return;
      const path = logoUrl.split('/fichiers/')[1];
      if (path) {
        await supabase.storage.from('fichiers').remove([path]);
      }
    } catch (e) {}
  };

  const modifierLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permission refusée');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size > 2 * 1024 * 1024)
        return Alert.alert("Fichier trop lourd ou introuvable");

      setUploading(true);

      await deleteOldLogo(club?.logo_url);

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const filePath = `logos/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('fichiers')
        .upload(filePath, base64, { contentType: 'image/png', upsert: true });

      if (uploadError) {
        setUploading(false);
        return Alert.alert("Erreur upload", uploadError.message);
      }

      const { data: urlData } = supabase.storage.from('fichiers').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      const { error: updateError } = await supabase
        .from('clubs')
        .update({ logo_url: publicUrl })
        .eq('id', club.id);

      setUploading(false);

      if (updateError) Alert.alert('Erreur', "Impossible de mettre à jour le logo.");
      else {
        setClubState((prev) => ({ ...prev, logo_url: publicUrl }));
        Alert.alert("Succès", "Logo mis à jour !");
      }
    } catch (err) {
      setUploading(false);
      Alert.alert("Erreur", "Problème lors de la sélection du logo.");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Erreur", "Déconnexion impossible");
    else router.replace('/');
  };

  useEffect(() => {
    if (president && president.role !== 'president') {
      Alert.alert('Accès refusé', 'Seul le président du club a accès à cet espace.');
      router.replace('/');
    }
    if (error) {
      Alert.alert('Erreur', error);
      router.replace('/');
    }
  }, [president, error]);

  const loading = loadingAuth || loadingPresident || loadingClub || uploading;

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" size="large" />;

  return (
    <LinearGradient colors={["#0a0a0a", "#0f0f0f"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={club?.logo_url ? { uri: club.logo_url } : require('../../assets/logo.png')}
            style={styles.logo}
          />
          <View style={styles.headerTextBox}>
            <Text style={styles.welcome}>
              Bienvenue Président {president ? `${president.prenom} ${president.nom}` : ''}
            </Text>
            <Text style={styles.title}>{club?.nom}</Text>
            <View style={styles.badge}>
              <View style={[styles.statusDot, { backgroundColor: club?.abonnement_actif ? '#00ff88' : '#ff4444' }]} />
              <Text style={styles.statusText}>
                {club?.abonnement_actif ? 'Abonnement actif' : 'Abonnement inactif'}
              </Text>
            </View>
            <TouchableOpacity onPress={modifierLogo}>
              <Text style={styles.logoButtonText}>🖼 Modifier le logo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Section title="📋 Infos club">
          <FullButton title="Infos club" icon="information-circle" onPress={() => router.push('/president/infos')} />
        </Section>

        <Section title="🧾 Gestion du club">
          <HalfButton title="Voir le staff" icon="people" onPress={() => router.push('/president/staff')} />
          <HalfButton title="Liste licenciés" icon="clipboard" onPress={() => router.push('/president/membres')} />
        </Section>

        <Section title="📅 Organisation">
          <HalfButton title="Événements" icon="calendar" onPress={() => router.push('/president/evenements')} />
          <HalfButton title="Stages" icon="book" onPress={() => router.push('/president/stages')} />
        </Section>

        <Section title="💼 Administration">
          <FullFilledButton title="Gestion Budget" icon="cash" onPress={() => router.push('/president/gestion-budget')} />
        </Section>

        {/* Logos Réseaux Sociaux */}
<View style={styles.socialLinks}>
  {club?.facebook_url && (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={async () => {
        const appUrl = `fb://facewebmodal/f?href=${club.facebook_url}`;
        const supported = await Linking.canOpenURL(appUrl);
        Linking.openURL(supported ? appUrl : club.facebook_url);
      }}
    >
      <Image source={require('../../assets/minilogo/facebook.png')} style={styles.iconSocial} />
    </TouchableOpacity>
  )}

  {club?.instagram_url && (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={async () => {
        const username = club.instagram_url.split('/').filter(Boolean).pop();
        const appUrl = `instagram://user?username=${username}`;
        const supported = await Linking.canOpenURL(appUrl);
        Linking.openURL(supported ? appUrl : club.instagram_url);
      }}
    >
      <Image source={require('../../assets/minilogo/instagram.png')} style={styles.iconSocial} />
    </TouchableOpacity>
  )}

  {club?.boutique_url && (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => Linking.openURL(club.boutique_url)}
    >
      <Image source={require('../../assets/minilogo/boutique.png')} style={styles.iconSocial} />
    </TouchableOpacity>
  )}
</View>


        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// UI Buttons + Styles
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
function HalfButton({ title, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.halfBtn} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#00ff88" style={{ marginRight: 8 }} />
      <Text style={styles.fullBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}
function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#222',
  },
  headerTextBox: { flex: 1 },
  welcome: { color: '#888', fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#00ff88', marginBottom: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#ccc', fontSize: 13 },
  logoButtonText: { color: '#00ff88', fontSize: 13, textDecorationLine: 'underline' },
  sectionTitle: { color: '#00ff88', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fullBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  fullBtnFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  halfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    padding: 14,
    width: '48%',
  },
  fullBtnText: { color: '#00ff88', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  buttonText: { color: '#111', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  logoutButton: {
    marginTop: 40,
    borderColor: '#00ff88',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { color: '#00ff88', fontSize: 16, fontWeight: '700' },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 30,
  },
iconSocial: {
  width: 72,
  height: 72,
  borderRadius: 22, // arrondi joli si tu veux un cercle
  marginHorizontal: 5,
  backgroundColor: '#222', // optionnel pour le contraste
},
});
