import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import useCacheData, { saveToCache } from '../../lib/cache';

export default function CreationEquipe() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [description, setDescription] = useState('');
  const [coachId, setCoachId] = useState(null);
  const [clubId, setClubId] = useState(null);

  // Ajout du cache : on tente d'abord cache, puis fallback Supabase si rien trouvé
  const [userInfo, refreshUserInfo, loadingUserInfo] = useCacheData(
    'coach_user_info',
    async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const id = sessionData?.session?.user?.id;
      if (!id) return {};
      const { data: userInfo, error } = await supabase
        .from('utilisateurs')
        .select('club_id')
        .eq('id', id)
        .single();
      if (userInfo) {
        saveToCache('coach_user_info', userInfo); // Pour remplir dès prochain boot
        return { ...userInfo, coach_id: id };
      }
      return {};
    },
    1800 // 30 min de cache, tu adaptes si besoin
  );

  useEffect(() => {
    if (userInfo && userInfo.club_id) {
      setClubId(userInfo.club_id);
      setCoachId(userInfo.coach_id);
    }
  }, [userInfo]);

  const handleCreate = async () => {
    if (!nom || !categorie) {
      Alert.alert('Erreur', 'Merci de remplir au minimum le nom et la catégorie.');
      return;
    }

    if (!coachId || !clubId) {
      Alert.alert('Erreur', 'Informations utilisateur incomplètes.');
      return;
    }

    const { error } = await supabase.from('equipes').insert({
      nom,
      categorie,
      description: description.trim() !== '' ? description : null, // facultatif
      coach_id: coachId,
      club_id: clubId,
    });

    if (error) {
      console.error('[EQUIPE] ❌ Erreur création :', error);
      Alert.alert('Erreur', 'Création de l’équipe échouée.');
    } else {
      Alert.alert('Succès', 'Équipe créée avec succès !');
      router.replace('/coach/dashboard');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>Créer une Équipe</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'équipe"
        placeholderTextColor="#aaa"
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        style={styles.input}
        placeholder="Catégorie (ex: U11, U17, Séniors)"
        placeholderTextColor="#aaa"
        value={categorie}
        onChangeText={setCategorie}
      />
      <TextInput
        style={styles.input}
        placeholder="Description (facultatif)"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loadingUserInfo}>
        <Text style={styles.buttonText}>
          {loadingUserInfo ? 'Chargement...' : "Créer l'équipe"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
