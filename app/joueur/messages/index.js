import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GREEN = '#00ff88';

export default function MessagesIndex() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../../../assets/messagerie-fond.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient colors={['#0a0a0acc', '#0f0f0fcc']} style={styles.container}>
        <Text style={styles.title}>📬 Choisis ta messagerie</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/joueur/messages/prives')}
        >
          <MaterialCommunityIcons name="account" size={36} color={GREEN} />
          <Text style={styles.buttonText}>Messagerie privée</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/joueur/messages/groupes')}
        >
          <MaterialCommunityIcons name="account-group" size={36} color={GREEN} />
          <Text style={styles.buttonText}>Messagerie de groupe</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: GREEN,
    marginBottom: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    borderColor: GREEN,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 30,
    alignItems: 'center',
    width: '70%',
  },
  buttonText: {
    color: GREEN,
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
});
