import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function InscriptionPresident() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [clubNom, setClubNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [loading, setLoading] = useState(false);
  const [clubCode, setClubCode] = useState('');

  function genererCodeClub() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `SF-${code}`;
  }

  async function creerPresidentEtClub() {
    setLoading(true);
    setClubCode('');
    // 1. Création Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError || !signUpData.user) {
      setLoading(false);
      Alert.alert('Erreur', signUpError?.message || 'Inscription échouée.');
      return;
    }
    const userId = signUpData.user.id;

    // 2. Création club
    const generatedCode = genererCodeClub();
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .insert([{
        nom: clubNom,
        adresse,
        code_acces: generatedCode,
        created_by: userId,
        email,
      }])
      .select()
      .single();

    if (clubError || !clubData) {
      setLoading(false);
      Alert.alert('Erreur', clubError?.message || 'Création du club échouée.');
      return;
    }

    // 3. Création utilisateur dans table utilisateurs
    const { error: userError } = await supabase
      .from('utilisateurs')
      .insert([{
        id: userId,
        email,
        nom,
        prenom,
        role: 'president',
        club_id: clubData.id,
        date_creation: new Date().toISOString(),
      }]);
    if (userError) {
      setLoading(false);
      Alert.alert('Erreur', userError?.message || 'Utilisateur créé mais lien club échoué.');
      return;
    }

    // 4. Lien club_admins (LA PARTIE MANQUANTE AVANT !)
    const { error: adminError } = await supabase
      .from('club_admins') // ou clubs_admins selon ton nom de table
      .insert([{
        club_id: clubData.id,
        user_id: userId,
        role: 'president',
        date_ajout: new Date().toISOString(),
      }]);
    if (adminError) {
      setLoading(false);
      Alert.alert('Erreur', adminError?.message || 'Utilisateur et club créés, mais pas de lien admin.');
      return;
    }

    // 5. Succès !
    setLoading(false);
    setClubCode(generatedCode);
    Alert.alert(
      'Félicitations !',
      `Votre club est créé.\nVoici votre code club :\n\n${generatedCode}\n\nGardez-le bien précieusement.`,
      [{ text: 'OK' }]
    );
    setEmail(''); setPassword(''); setNom(''); setPrenom(''); setClubNom(''); setAdresse('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription Président</Text>
      <TextInput style={styles.input} placeholder="Nom du club" value={clubNom} onChangeText={setClubNom} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder="Adresse du club" value={adresse} onChangeText={setAdresse} autoCapitalize="sentences" />
      <TextInput style={styles.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder="Nom" value={nom} onChangeText={setNom} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={creerPresidentEtClub} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon club</Text>}
      </TouchableOpacity>
      {clubCode !== '' && (
        <View style={styles.clubCodeBox}>
          <Text style={styles.clubCodeTitle}>Votre code club :</Text>
          <Text selectable style={styles.clubCode}>{clubCode}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#00ff88', marginBottom: 30 },
  input: { width: '100%', backgroundColor: '#222', color: '#fff', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 16 },
  button: { backgroundColor: '#00ff88', borderRadius: 10, padding: 15, width: '100%', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#111', fontWeight: 'bold', fontSize: 18 },
  clubCodeBox: { marginTop: 30, backgroundColor: '#1e1e1e', borderRadius: 10, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#00ff88' },
  clubCodeTitle: { color: '#fff', marginBottom: 5 },
  clubCode: { color: '#00ff88', fontSize: 20, letterSpacing: 2, fontWeight: 'bold' },
});
