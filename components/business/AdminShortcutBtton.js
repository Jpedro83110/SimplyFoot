import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { adminMode } from '../../lib/auth'; // Ton flag admin

// FIXME: seams not used
export default function AdminShortcutButton() {
  const router = useRouter();

  if (!adminMode) return null;

  return (
    <TouchableOpacity style={styles.button} onPress={() => router.replace('/admin/dashboard')}>
      <Text style={styles.text}>🛠️ Admin</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#00ff88',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 999,
  },
  text: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
