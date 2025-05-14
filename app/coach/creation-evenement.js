import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // à installer si pas déjà : npm install @react-native-picker/picker

export default function CreateEvent() {
  const [type, setType] = useState('match');
  const [titre, setTitre] = useState('');
  const [date, setDate] = useState('');
  const [lieu, setLieu] = useState('');

  const handleCreate = () => {
    if (!titre || !date || !lieu) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs.');
      return;
    }

    Alert.alert('✅ Événement créé', `Type : ${type}\nTitre : ${titre}`);
    // Tu pourras ici enregistrer dans Supabase
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗓️ Créer un Événement</Text>

      <Text style={styles.label}>Type d'événement</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={type}
          onValueChange={(itemValue) => setType(itemValue)}
          style={styles.picker}
          dropdownIconColor="#00ff88"
        >
          <Picker.Item label="Match" value="match" />
          <Picker.Item label="Entraînement" value="entrainement" />
          <Picker.Item label="Tournoi" value="tournoi" />
          <Picker.Item label="Plateau" value="plateau" />
          <Picker.Item label="Autre" value="autre" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'événement"
        placeholderTextColor="#aaa"
        value={titre}
        onChangeText={setTitre}
      />

      <TextInput
        style={styles.input}
        placeholder="Date et heure (ex: 24/05 à 15h00)"
        placeholderTextColor="#aaa"
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Lieu"
        placeholderTextColor="#aaa"
        value={lieu}
        onChangeText={setLieu}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Créer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    color: '#aaa',
    marginBottom: 5,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  picker: {
    color: '#fff',
    height: Platform.OS === 'android' ? 50 : undefined,
  },
  input: {
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
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
