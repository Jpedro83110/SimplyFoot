import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginClub() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (trimmedEmail === 'president@club.com' && trimmedPassword === 'secret') {
      Alert.alert("Connexion réussie !", "Bienvenue Président.");
      router.replace('/president/dashboard');
    } else if (trimmedEmail === 'coach@club.com' && trimmedPassword === 'secret') {
      Alert.alert("Connexion réussie !", "Bienvenue Coach.");
      router.replace('/coach/dashboard');
    } else {
      Alert.alert("Erreur", "Identifiants incorrects. Veuillez réessayer.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>Connexion Club</Text>
      <Text style={styles.subtitle}>(Président / Coach)</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/login-joueur')}>
        <Text style={styles.switchText}>Vous êtes un joueur ? Connectez-vous ici</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 30,
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
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  switchText: {
    color: '#00ff88',
    marginTop: 20,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
