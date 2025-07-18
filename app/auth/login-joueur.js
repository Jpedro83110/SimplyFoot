import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Switch, ScrollView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginJoueur() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Charger email enregistré si "Se souvenir de moi"
  useEffect(() => {
    AsyncStorage.getItem('remembered_email').then(savedEmail => {
      if (savedEmail) setEmail(savedEmail);
    });
  }, []);

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

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Connexion admin démo
      if (trimmedEmail === 'demo@simplyfoot.fr' && trimmedPassword === 'Demojr') {
        setLoading(false);
        Alert.alert('✅ Connexion admin', 'Bienvenue en mode administrateur complet');
        router.replace('/admin/dashboard');
        return;
      }

      // Connexion via Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (authError || !authData?.user) {
        Alert.alert('Erreur', authError?.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : `Erreur : ${authError?.message || 'Connexion impossible.'}`);
        setLoading(false);
        return;
      }

      // Récupération du rôle
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData?.role) {
        console.log('Erreur récupération rôle:', userError, userData);
        Alert.alert('Erreur', 'Impossible de récupérer le rôle utilisateur.');
        setLoading(false);
        return;
      }

      // Si rememberMe, on mémorise l'email
      if (rememberMe) {
        await AsyncStorage.setItem('remembered_email', trimmedEmail);
      } else {
        await AsyncStorage.removeItem('remembered_email');
      }

      // Redirection selon le rôle
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
          Alert.alert('Erreur', `Rôle non reconnu : ${role}`);
          break;
      }
    } catch (err) {
      console.log('Erreur générale', err);
      Alert.alert('Erreur', 'Problème de connexion, réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.welcome}>Bienvenue sur SimplyFoot</Text>

        <View style={styles.form}>
          <Text style={styles.title}>Connexion Joueur / Parent</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              autoCorrect={false}
              textContentType="username"
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { paddingRight: 44 }]}
              placeholder="Mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.rememberContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              thumbColor={rememberMe ? "#00ff88" : "#555"}
              trackColor={{ false: "#555", true: "#1e1e1e" }}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  welcome: {
    fontSize: 20,
    color: '#00ff88',
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderRadius: 18,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
    position: 'relative',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 13,
    padding: 5,
    zIndex: 2,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    elevation: 2,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    marginTop: 8,
  },
  rememberText: {
    color: '#00ff88',
    fontSize: 14,
    marginLeft: 10,
  },
  forgotText: {
    color: '#00bfff',
    marginTop: 18,
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  switchText: {
    color: '#00ff88',
    marginTop: 28,
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
});
