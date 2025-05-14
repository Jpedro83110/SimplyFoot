import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

export default function Staff() {
  const staffMembers = [
    { id: 1, name: 'Coach John', role: 'Entraîneur Principal' },
    { id: 2, name: 'Coach Jane', role: 'Assistant Entraîneur' },
  ];

  const handleDetails = (member) => {
    Alert.alert('📄 Détails du Staff', `${member.name} — ${member.role}`);
    // ➕ Tu pourras faire router.push(`/president/staff/${member.id}`)
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👥 Membres du Staff</Text>

      {staffMembers.map((member) => (
        <View key={member.id} style={styles.card}>
          <Text style={styles.cardName}>{member.name}</Text>
          <Text style={styles.cardRole}>{member.role}</Text>

          <TouchableOpacity style={styles.button} onPress={() => handleDetails(member)}>
            <Text style={styles.buttonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  cardRole: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
