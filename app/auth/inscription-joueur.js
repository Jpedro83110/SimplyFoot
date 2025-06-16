import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Helper pour savoir si mineur
function isMineur(dateNaissance) {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age < 18;
}

export default function InscriptionJoueur() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codeClub, setCodeClub] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [accepteDecharge, setAccepteDecharge] = useState(null); // null = non choisi, true = signé, false = pas signé
  const [loading, setLoading] = useState(false);
  const [expoToken, setExpoToken] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  // Push token
  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (!Device.isDevice) return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoToken(token);
    };
    registerForPushNotifications();
  }, []);

  // Calcul auto mineur/majeur
  useEffect(() => {
    if (dateNaissance && /^\d{4}-\d{2}-\d{2}$/.test(dateNaissance)) {
      setIsMinor(isMineur(dateNaissance));
      setAccepteDecharge(null); // reset le choix si changement de date
    } else {
      setIsMinor(false);
      setAccepteDecharge(null);
    }
  }, [dateNaissance]);

  const handleInscription = async () => {
    if (!email || !password || !codeClub || !nom || !prenom || !telephone || !dateNaissance) {
      Alert.alert('Erreur', 'Tous les champs doivent être remplis.');
      return;
    }
    if (isMinor && accepteDecharge === null) {
      Alert.alert('Information', 'Veuillez choisir si vous souhaitez signer la décharge ou non. Vous pourrez changer d’avis plus tard dans l’espace parent.');
      return;
    }
    setLoading(true);

    // 1. Vérifie le code club
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('code_acces', codeClub.trim().toUpperCase())
      .single();
    if (clubError || !clubData) {
      setLoading(false);
      Alert.alert('Erreur', 'Code club invalide.');
      return;
    }

    // 2. Création Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    if (signUpError || !signUpData?.user) {
      setLoading(false);
      Alert.alert('Erreur', `Inscription échouée : ${signUpError?.message || 'Erreur inconnue.'}`);
      return;
    }
    const userId = signUpData.user.id;

    // 3. Insertion dans utilisateurs
    const { error: insertUserError } = await supabase.from('utilisateurs').insert({
      id: userId,
      email: email.trim().toLowerCase(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      club_id: clubData.id,
      role: 'joueur',
      expo_push_token: expoToken,
      date_creation: new Date().toISOString(),
    });
    if (insertUserError) {
      setLoading(false);
      Alert.alert('Erreur', 'Utilisateur créé mais insertion incomplète (utilisateurs).');
      return;
    }

    // 4. Insertion dans joueurs
    const { error: insertJoueurError } = await supabase.from('joueurs').insert({
      utilisateur_id: userId,
      club_id: clubData.id,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim(),
      date_naissance: dateNaissance.trim(),
    });
    if (insertJoueurError) {
      setLoading(false);
      Alert.alert('Erreur', 'Utilisateur enregistré, mais joueur non ajouté.');
      return;
    }

    // 5. Si mineur ET décharge signée, on ajoute la décharge
    if (isMinor && accepteDecharge === true) {
      const { error: dechargeError } = await supabase.from('decharges_generales').insert({
        utilisateur_id: userId,
        club_id: clubData.id,
        date_signature: new Date().toISOString(),
        message: "J’accepte que mon enfant puisse être transporté sur le lieu d’un événement par le coach ou un autre parent dans le cadre du club.",
        nom_parent: nom.trim() + ' ' + prenom.trim(),
        est_valide: true
      });
      if (dechargeError) {
        Alert.alert('Attention', 'Décharge non enregistrée, vous pourrez la signer plus tard dans l\'espace parent.');
      }
    }

    setLoading(false);
    Alert.alert('Succès', 'Compte joueur créé avec succès.', [
      { text: 'OK', onPress: () => router.replace('/joueur/dashboard') }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Créer un compte Joueur</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#aaa" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Code Club" placeholderTextColor="#aaa" value={codeClub} onChangeText={setCodeClub} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#aaa" value={nom} onChangeText={setNom} />
        <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#aaa" value={prenom} onChangeText={setPrenom} />
        <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor="#aaa" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Date de naissance (YYYY-MM-DD)" placeholderTextColor="#aaa" value={dateNaissance} onChangeText={setDateNaissance} />
        {isMinor && (
          <View style={styles.dechargeBlock}>
            <Text style={styles.switchLabel}>
              Décharge parentale :  
              {"\n"}J’accepte que mon enfant puisse être transporté sur le lieu d’un événement par le coach ou un autre parent dans le cadre du club.
              {"\n"}<Text style={{ color: '#ffb100' }}>Ce choix n’est pas obligatoire et pourra être modifié plus tard dans l’espace parent.</Text>
            </Text>
            <View style={styles.dechargeRow}>
              <TouchableOpacity
                style={[
                  styles.dechargeButton,
                  accepteDecharge === true && styles.dechargeButtonSelected,
                ]}
                onPress={() => setAccepteDecharge(true)}
              >
                <Text style={[
                  styles.dechargeButtonText,
                  accepteDecharge === true && styles.dechargeButtonTextSelected,
                ]}>Signer la décharge</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dechargeButton,
                  accepteDecharge === false && styles.dechargeButtonSelected,
                ]}
                onPress={() => setAccepteDecharge(false)}
              >
                <Text style={[
                  styles.dechargeButtonText,
                  accepteDecharge === false && styles.dechargeButtonTextSelected,
                ]}>Ne pas signer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleInscription} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#121212',
  },
  container: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '700',
    marginBottom: 30,
    marginTop: 20,
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
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  dechargeBlock: {
    marginVertical: 20,
    backgroundColor: '#191919',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchLabel: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
  },
  dechargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dechargeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
  },
  dechargeButtonSelected: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  dechargeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  dechargeButtonTextSelected: {
    color: '#121212',
  },
});

