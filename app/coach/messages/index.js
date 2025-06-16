import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GREEN = '#00ff88';

export default function MessagesIndex() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../../../assets/messagerie-fond.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient colors={['#121212cc', '#121212dd']} style={styles.container}>
        <Text style={styles.title}>💬 Messagerie Coach</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/coach/messages/prives')}
        >
          <MaterialCommunityIcons
            name="account-box-multiple-outline"
            size={30}
            color={GREEN}
            style={{ marginRight: 12 }}
          />
          <Text style={styles.buttonText}>Messagerie privée</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/coach/messages/groupes')}
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={30}
            color={GREEN}
            style={{ marginRight: 12 }}
          />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#00000088',
  },
  buttonText: {
    color: GREEN,
    fontSize: 18,
    fontWeight: '600',
  },
});
