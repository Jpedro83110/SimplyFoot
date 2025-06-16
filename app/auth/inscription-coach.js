import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function InscriptionCoach() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codeClub, setCodeClub] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [diplome, setDiplome] = useState(false);
  const [expoToken, setExpoToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (!Device.isDevice) return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoToken(token);
    };
    registerForPushNotifications();
  }, []);

  const handleInscription = async () => {
    if (!email || !password || !codeClub || !nom || !prenom || !telephone || !dateNaissance) {
      Alert.alert('Erreur', 'Tous les champs doivent être remplis.');
      return;
    }
    setLoading(true);

    // 1. Vérifie le code club
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('code_acces', codeClub.trim().toUpperCase())
      .single();

    if (clubError || !clubData) {
      setLoading(false);
      Alert.alert('Erreur', 'Code club invalide.');
      return;
    }

    // 2. Création Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    if (signUpError || !signUpData?.user) {
      setLoading(false);
      Alert.alert('Erreur', `Inscription échouée : ${signUpError?.message || 'Erreur inconnue.'}`);
      return;
    }
    const userId = signUpData.user.id;

    // 3. Insertion dans utilisateurs
    const { error: insertUserError } = await supabase.from('utilisateurs').insert({
      id: userId,
      email: email.trim().toLowerCase(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      club_id: clubData.id,
      role: 'coach',
      expo_push_token: expoToken,
      date_creation: new Date().toISOString(),
    });
    if (insertUserError) {
      setLoading(false);
      Alert.alert('Erreur', 'Utilisateur créé mais insertion incomplète (utilisateurs).');
      return;
    }

    // 4. Insertion dans staff
    const { error: insertStaffError } = await supabase.from('staff').insert({
      utilisateur_id: userId,
      club_id: clubData.id,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone.trim(),
      date_naissance: dateNaissance.trim(),
      diplome: diplome,
    });
    setLoading(false);
    if (insertStaffError) {
      Alert.alert('Erreur', 'Utilisateur enregistré, mais staff non ajouté.');
      return;
    }

    Alert.alert('Succès', 'Compte coach créé avec succès.', [
      { text: 'OK', onPress: () => router.replace('/coach/dashboard') }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Créer un compte Coach</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#aaa" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Code Club" placeholderTextColor="#aaa" value={codeClub} onChangeText={setCodeClub} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#aaa" value={nom} onChangeText={setNom} />
        <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#aaa" value={prenom} onChangeText={setPrenom} />
        <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor="#aaa" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Date de naissance (YYYY-MM-DD)" placeholderTextColor="#aaa" value={dateNaissance} onChangeText={setDateNaissance} />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Diplômé(e)</Text>
          <Switch value={diplome} onValueChange={setDiplome} thumbColor={diplome ? "#00ff88" : "#555"} />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleInscription} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#121212',
  },
  container: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '700',
    marginBottom: 30,
    marginTop: 20,
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
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
