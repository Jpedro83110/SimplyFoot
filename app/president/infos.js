import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache';

const labels = {
  nom: 'Nom du club',
  adresse: 'Adresse',
  site: 'Site Web',
  facebook_url: 'Lien Facebook',
  instagram_url: 'Lien Instagram',
  boutique_url: 'Boutique en ligne',
  telephone: 'Téléphone',
  email: 'Email',
};

const icons = {
  nom: 'shield',
  adresse: 'location',
  site: 'globe',
  facebook_url: 'logo-facebook',
  instagram_url: 'logo-instagram',
  boutique_url: 'cart',
  telephone: 'call',
  email: 'mail',
};

export default function Infos() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function getUser() {
      const session = await supabase.auth.getSession();
      setUserId(session.data?.session?.user?.id);
    }
    getUser();
  }, []);

  const fetchClubInfo = async () => {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('created_by', userId)
      .single();

    if (!error && data) {
      setForm(data);
      return data;
    }
    throw new Error(error?.message || "Impossible de charger le club");
  };

  const [infosClub, refreshClub, loading] = useCacheData(
    userId ? `infos_club_${userId}` : null,
    fetchClubInfo,
    6 * 3600
  );

  useEffect(() => {
    if (infosClub) setForm(infosClub);
  }, [infosClub]);

  const handleSave = async () => {
    const { error } = await supabase
      .from('clubs')
      .update({
        nom: form.nom,
        adresse: form.adresse,
        site: form.site,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        boutique_url: form.boutique_url,
        telephone: form.telephone,
        email: form.email,
      })
      .eq('created_by', userId);

    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      setEditing(false);
      refreshClub();
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f0f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏟️ Informations du Club</Text>

        {[
          'nom',
          'adresse',
          'site',
          'facebook_url',
          'instagram_url',
          'boutique_url',
          'telephone',
          'email',
        ].map((field) => (
          <View style={styles.block} key={field}>
            <Ionicons name={icons[field]} size={20} color="#00ff88" style={styles.icon} />
            <Text style={styles.label}>{labels[field]}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={form[field] || ''}
                onChangeText={(text) => setForm({ ...form, [field]: text })}
                placeholder={`Entrez ${labels[field].toLowerCase()}`}
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.value}>{infosClub?.[field] || '-'}</Text>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: editing ? '#00c4aa' : '#00ff88' }]}
          onPress={() => (editing ? handleSave() : setEditing(true))}
        >
          <Text style={styles.buttonText}>
            {editing ? '💾 Enregistrer' : '✏️ Modifier les infos'}
          </Text>
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#444' }]}
            onPress={() => setEditing(false)}
          >
            <Text style={styles.buttonText}>❌ Annuler</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  block: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  icon: {
    marginBottom: 6,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    color: '#fff',
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingVertical: 6,
  },
  button: {
    marginBottom: 14,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
