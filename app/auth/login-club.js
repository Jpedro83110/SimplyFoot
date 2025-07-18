import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginClub() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      // Authentification Supabase
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

      // Récupération du rôle utilisateur
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
          setLoading(false);
          return;
      }
    } catch (err) {
      console.log('Erreur générale', err);
      Alert.alert('Erreur', 'Problème de connexion, réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.title}>Connexion Club</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Champ mot de passe + œil */}
        <View style={{ width: '100%', position: 'relative', marginBottom: 15 }}>
          <TextInput
            style={[styles.input, { paddingRight: 44 }]}
            placeholder="Mot de passe"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 18,
              top: 14,
              padding: 2,
              zIndex: 2,
            }}
            onPress={() => setShowPassword(prev => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
          </TouchableOpacity>
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

        <TouchableOpacity onPress={() => router.push('/auth/inscription-coach')}>
          <Text style={styles.switchText}>Créer un compte Coach</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/inscription-president')}>
          <Text style={styles.switchText}>Créer un nouveau club (Président)</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flexGrow: 1,
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
