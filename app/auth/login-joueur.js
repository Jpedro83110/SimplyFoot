import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginJoueur() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // GESTION OUBLI MOT DE PASSE
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Entrez d’abord votre email pour recevoir un lien de réinitialisation.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Vérifiez vos emails', 'Un lien de réinitialisation a été envoyé.');
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // 🔐 Mode admin démo local
    if (trimmedEmail === 'demo@simplyfoot.fr' && trimmedPassword === 'Demojr') {
      setLoading(false);
      Alert.alert('✅ Connexion admin', 'Bienvenue en mode administrateur complet');
      router.replace('/admin/dashboard');
      return;
    }

    // 🔐 Connexion Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (authError || !authData?.user) {
      setLoading(false);
      Alert.alert('Erreur', authError?.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : `Erreur : ${authError?.message || 'Connexion impossible.'}`);
      return;
    }

    // 🔄 Récupération du rôle utilisateur
    const { data: userData, error: userError } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData?.role) {
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de récupérer le rôle utilisateur.');
      return;
    }

    const role = userData.role;

    switch (role) {
      case 'admin':
        router.replace('/admin/dashboard');
        break;
      case 'president':
        router.replace('/president/dashboard');
        break;
      case 'coach':
      case 'staff':
        router.replace('/coach/dashboard');
        break;
      case 'joueur':
      case 'parent':
        router.replace('/joueur/dashboard');
        break;
      default:
        setLoading(false);
        Alert.alert('Erreur', `Rôle non reconnu : ${role}`);
        return;
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Connexion Joueur / Parent</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.rememberContainer}>
        <Switch
          value={rememberMe}
          onValueChange={setRememberMe}
          thumbColor={rememberMe ? "#00ff88" : "#555"}
        />
        <Text style={styles.rememberText}>Se souvenir de moi</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#000" />
          : <Text style={styles.buttonText}>Se connecter</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/inscription-joueur')}>
        <Text style={styles.switchText}>Pas encore de compte ? Créer un compte Joueur</Text>
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  rememberText: {
    color: '#00ff88',
    fontSize: 14,
    marginLeft: 10,
  },
  forgotText: {
    color: '#00bfff',
    marginTop: 22,
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  switchText: {
    color: '#00ff88',
    marginTop: 30,
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
});
