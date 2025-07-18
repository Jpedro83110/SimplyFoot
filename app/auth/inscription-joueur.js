import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { setupNotifications, initializeNotificationsForUser } from '../../lib/notifications';
import { formatDateToISO, formatDateForDisplay, calculateAge } from '../../lib/formatDate';
import { Ionicons } from '@expo/vector-icons';

// DatePicker mobile
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch (error) {}
}

// Utils
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPhone(phone) {
  const phoneRegex = /^[0-9+\s\-\.()]{8,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
function formatDateForInput(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function parseDateFromInput(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
const WebDateInput = ({ value, onChange, disabled, style, placeholder }) => {
  if (Platform.OS !== 'web') return null;
  return (
    <input
      type="date"
      value={formatDateForInput(value)}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      max={formatDateForInput(new Date())}
      min={formatDateForInput(new Date(1920, 0, 1))}
      style={{
        flex: 1,
        backgroundColor: '#1e1e1e',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: '10px',
        paddingTop: '14px',
        paddingBottom: '14px',
        paddingLeft: '45px',
        paddingRight: '18px',
        fontSize: '16px',
        outline: 'none',
        fontFamily: 'inherit',
        ...style
      }}
      placeholder={placeholder}
    />
  );
};

export default function InscriptionJoueur() {
  const router = useRouter();

  // Champs utilisateur
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeEquipe, setCodeEquipe] = useState('');
  const [equipeData, setEquipeData] = useState(null);
  const [coachData, setCoachData] = useState(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [postes, setPostes] = useState('');

  // Champs parent si mineur
  const [nomParent, setNomParent] = useState('');
  const [prenomParent, setPrenomParent] = useState('');
  const [telephoneParent, setTelephoneParent] = useState('');

  const [dateNaissance, setDateNaissance] = useState(new Date(2008, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accepteDecharge, setAccepteDecharge] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState(null);

  // Fetch équipe + coach dès que codeEquipe rempli
  useEffect(() => {
    if (!codeEquipe || codeEquipe.length < 3) {
      setEquipeData(null);
      setCoachData(null);
      return;
    }
    const fetchEquipeAndCoach = async () => {
      setLoading(true);
      const { data: equipe, error: errorEquipe } = await supabase
        .from('equipes')
        .select('id, nom, categorie, coach_id, club_id')
        .eq('code_equipe', codeEquipe.trim().toUpperCase())
        .single();
      if (errorEquipe || !equipe) {
        setEquipeData(null);
        setCoachData(null);
        setLoading(false);
        return;
      }
      setEquipeData(equipe);
      // Fetch coach associé à cette équipe
      if (equipe.coach_id) {
        const { data: coach, error: errorCoach } = await supabase
          .from('staff')
          .select('nom, prenom, email')
          .eq('utilisateur_id', equipe.coach_id)
          .single();
        setCoachData(coach || null);
      } else {
        setCoachData(null);
      }
      setLoading(false);
    };
    fetchEquipeAndCoach();
  }, [codeEquipe]);

  // Calcul âge et mineur/majeur
  useEffect(() => {
    if (!dateNaissance) return;
    const age = calculateAge(dateNaissance);
    setCalculatedAge(age);
    setIsMinor(age < 18);
    if (age >= 18) {
      setAccepteDecharge(null);
      setNomParent('');
      setPrenomParent('');
      setTelephoneParent('');
    }
  }, [dateNaissance]);

  // DatePicker handlers
  const handleDatePickerOpen = () => { if (Platform.OS !== 'web') setShowDatePicker(true); };
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'web') setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) handleDateValidationAndSet(selectedDate);
  };
  const handleWebDateChange = (dateString) => {
    if (!dateString) return;
    const selectedDate = parseDateFromInput(dateString);
    if (selectedDate) handleDateValidationAndSet(selectedDate);
  };
  const handleDateValidationAndSet = (selectedDate) => {
    const today = new Date();
    if (selectedDate > today) {
      Alert.alert('Erreur', 'La date de naissance ne peut pas être dans le futur.');
      return;
    }
    const age = calculateAge(selectedDate);
    if (age > 100) {
      Alert.alert('Erreur', 'Âge non valide (plus de 100 ans).');
      return;
    }
    setDateNaissance(selectedDate);
  };

  // Validation
  const validateForm = () => {
    if (!email.trim()) { Alert.alert('Erreur', 'L\'email est obligatoire.'); return false; }
    if (!isValidEmail(email.trim())) { Alert.alert('Erreur', 'Format d\'email invalide.'); return false; }
    if (!password.trim()) { Alert.alert('Erreur', 'Le mot de passe est obligatoire.'); return false; }
    if (password.length < 6) { Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.'); return false; }
    if (password !== confirmPassword) { Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.'); return false; }
    if (!codeEquipe.trim()) { Alert.alert('Erreur', 'Le code équipe est obligatoire.'); return false; }
    if (!equipeData) { Alert.alert('Erreur', 'Le code équipe est invalide ou inexistant.'); return false; }
    if (!nom.trim()) { Alert.alert('Erreur', 'Le nom est obligatoire.'); return false; }
    if (!prenom.trim()) { Alert.alert('Erreur', 'Le prénom est obligatoire.'); return false; }
    if (!dateNaissance) { Alert.alert('Erreur', 'La date de naissance est obligatoire.'); return false; }
    // Poste(s) optionnel
    if (isMinor) {
      if (!nomParent.trim()) { Alert.alert('Erreur', 'Nom du parent/tuteur obligatoire.'); return false; }
      if (!prenomParent.trim()) { Alert.alert('Erreur', 'Prénom du parent/tuteur obligatoire.'); return false; }
      if (!telephoneParent.trim()) { Alert.alert('Erreur', 'Téléphone du parent/tuteur obligatoire.'); return false; }
      if (!isValidPhone(telephoneParent.trim())) { Alert.alert('Erreur', 'Format de téléphone du parent/tuteur invalide.'); return false; }
      if (accepteDecharge === null) {
        Alert.alert('Décharge parentale requise', 'Merci d\'indiquer si vous acceptez ou refusez la décharge parentale.');
        return false;
      }
    } else {
      if (!telephone.trim()) { Alert.alert('Erreur', 'Votre téléphone est obligatoire.'); return false; }
      if (!isValidPhone(telephone.trim())) { Alert.alert('Erreur', 'Format de téléphone invalide.'); return false; }
    }
    return true;
  };

  // 🚀 Inscription
  const handleInscription = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      // 1. Crée Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (signUpError || !signUpData?.user) {
        Alert.alert('Erreur', signUpError?.message || 'Erreur création Auth');
        setLoading(false);
        return;
      }
      const userId = signUpData.user.id;

      // 2. Notifications
      let expoPushToken = null;
      try { expoPushToken = await setupNotifications(); } catch {}

      // 3. Crée Utilisateur
      const { error: insertUserError } = await supabase.from('utilisateurs').insert({
        id: userId,
        email: email.trim().toLowerCase(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        club_id: equipeData.club_id,
        role: 'joueur',
        expo_push_token: expoPushToken,
        date_creation: new Date().toISOString(),
      });
      if (insertUserError) {
        Alert.alert('Erreur', 'Utilisateur créé mais insertion incomplète (utilisateurs).');
        setLoading(false);
        return;
      }

      // 4. Crée Joueur
      const dateNaissanceISO = formatDateToISO(dateNaissance);
      let joueurData = {
        equipe_id: equipeData.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: dateNaissanceISO,
        poste: postes.trim() || null,
        numero_licence: 'N/C',
        visite_medicale_valide: false,
        photo_url: '',
        equipement: null,
        photo_profil_url: null,
        telephone: !isMinor ? telephone.trim() : null,
      };
      const { data: insertedJoueur, error: insertJoueurError } = await supabase
        .from('joueurs')
        .insert(joueurData)
        .select('id')
        .single();

      if (insertJoueurError || !insertedJoueur?.id) {
        Alert.alert('Erreur', "Utilisateur enregistré, mais profil joueur non créé.");
        setLoading(false);
        return;
      }
      const joueurId = insertedJoueur.id;
      // 5. Lie utilisateur <-> joueur
      await supabase.from('utilisateurs').update({ joueur_id: joueurId }).eq('id', userId);

      // 6. Si mineur : décharge parentale obligatoire (parent_nom, parent_prenom, parent_telephone)
      if (isMinor) {
        await supabase.from('decharges_generales').insert({
          joueur_id: joueurId,
          parent_nom: nomParent.trim(),
          parent_prenom: prenomParent.trim(),
          parent_telephone: telephoneParent.trim(),
          accepte_transport: accepteDecharge === true ? true : false,
          date_signature: new Date().toISOString(),
        });
      }

      // 7. Notifications (optionnel)
      if (expoPushToken) {
        try { await initializeNotificationsForUser(userId); } catch {}
      }

      // 8. Fin OK
      Alert.alert(
        'Inscription réussie ! 🎉',
        `Bienvenue ${prenom} dans l'équipe ${equipeData.nom} !`,
        [{ text: 'Accéder à mon espace', onPress: () => router.replace('/joueur/dashboard') }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // -------- UI --------
  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Créer un compte Joueur</Text>
          <Text style={styles.subtitle}>Rejoignez votre club sur SimplyFoot</Text>
        </View>
        <View style={styles.form}>
          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!loading}
            />
          </View>
          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="Mot de passe (min. 6 caractères)"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              textContentType="newPassword"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
          {/* CONFIRM PASSWORD */}
          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              textContentType="newPassword"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
          {/* CODE EQUIPE */}
          <View style={styles.inputGroup}>
            <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Code Équipe"
              placeholderTextColor="#aaa"
              value={codeEquipe}
              onChangeText={setCodeEquipe}
              autoCapitalize="characters"
              editable={!loading}
            />
          </View>
          {/* INFOS EQUIPE */}
          {equipeData && (
            <View style={styles.equipeInfoBlock}>
              <Text style={styles.equipeTitle}>🎽 {equipeData.nom} ({equipeData.categorie || 'Catégorie inconnue'})</Text>
              <Text style={styles.equipeLabel}>
                Coach associé : <Text style={{ color: '#fff' }}>{coachData ? `${coachData.prenom} ${coachData.nom}` : 'Non renseigné'}</Text>
              </Text>
            </View>
          )}
          {/* NOM / PRÉNOM */}
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#aaa"
              value={nom}
              onChangeText={setNom}
              textContentType="familyName"
              editable={!loading}
            />
          </View>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              placeholderTextColor="#aaa"
              value={prenom}
              onChangeText={setPrenom}
              textContentType="givenName"
              editable={!loading}
            />
          </View>
          {/* DATE DE NAISSANCE */}
          {Platform.OS === 'web' ? (
            <View style={styles.inputGroup}>
              <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
              <WebDateInput
                value={dateNaissance}
                onChange={handleWebDateChange}
                disabled={loading}
                placeholder="Date de naissance"
              />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={handleDatePickerOpen}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.datePickerText,
                    !dateNaissance && styles.datePickerPlaceholder
                  ]}>
                    {dateNaissance ? formatDateForDisplay(dateNaissance) : 'Sélectionner la date de naissance'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </TouchableOpacity>
              </View>
              {showDatePicker && DateTimePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={dateNaissance}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                    style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.closeDatePickerButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.closeDatePickerText}>Confirmer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
          {/* ÂGE + Mineur */}
          {calculatedAge !== null && (
            <View style={[
              styles.ageIndicator, isMinor ? styles.ageIndicatorMinor : styles.ageIndicatorMajor
            ]}>
              <Ionicons
                name={isMinor ? 'warning-outline' : 'checkmark-circle-outline'}
                size={20}
                color={isMinor ? '#ffb100' : '#00ff88'}
              />
              <Text style={[
                styles.ageText, { color: isMinor ? '#ffb100' : '#00ff88' }
              ]}>
                {calculatedAge} ans - {isMinor ? 'Joueur mineur (moins de 18 ans)' : 'Joueur majeur (18 ans et plus)'}
              </Text>
            </View>
          )}
          {/* POSTE(S) */}
          <View style={styles.inputGroup}>
            <Ionicons name="football-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Poste(s) (optionnel, ex: Gardien, Défenseur...)"
              placeholderTextColor="#aaa"
              value={postes}
              onChangeText={setPostes}
              editable={!loading}
            />
          </View>
          {/* TÉLÉPHONE JOUEUR OU INFOS PARENT */}
          {!isMinor && (
            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre téléphone"
                placeholderTextColor="#aaa"
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                editable={!loading}
              />
            </View>
          )}
          {isMinor && (
            <>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#ffb100" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom du parent / tuteur"
                  placeholderTextColor="#aaa"
                  value={nomParent}
                  onChangeText={setNomParent}
                  editable={!loading}
                />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#ffb100" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom du parent / tuteur"
                  placeholderTextColor="#aaa"
                  value={prenomParent}
                  onChangeText={setPrenomParent}
                  editable={!loading}
                />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={20} color="#ffb100" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Téléphone du parent / tuteur"
                  placeholderTextColor="#aaa"
                  value={telephoneParent}
                  onChangeText={setTelephoneParent}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  editable={!loading}
                />
              </View>
              {/* Bloc décharge */}
              <View style={styles.dechargeBlock}>
                <Text style={styles.dechargeTitle}>
                  <Ionicons name="document-text-outline" size={16} color="#ffb100" /> Décharge parentale obligatoire
                </Text>
                <Text style={styles.dechargeText}>
                  Votre enfant étant mineur ({calculatedAge} ans), une décharge parentale est nécessaire :
                </Text>
                <Text style={styles.dechargeMessage}>
                  "J'accepte que mon enfant puisse être transporté sur le lieu d'un événement par le coach ou un autre parent dans le cadre du club."
                </Text>
                <Text style={styles.dechargeNote}>
                  ⚠️ Ce choix pourra être modifié plus tard dans l'espace parent.
                </Text>
                <View style={styles.dechargeRow}>
                  <TouchableOpacity
                    style={[
                      styles.dechargeButton,
                      accepteDecharge === true && styles.dechargeButtonSelected,
                    ]}
                    onPress={() => setAccepteDecharge(true)}
                    disabled={loading}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={accepteDecharge === true ? '#121212' : '#fff'}
                    />
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
                    disabled={loading}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={accepteDecharge === false ? '#121212' : '#fff'}
                    />
                    <Text style={[
                      styles.dechargeButtonText,
                      accepteDecharge === false && styles.dechargeButtonTextSelected,
                    ]}>Ne pas signer maintenant</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          {/* BTN INSCRIPTION */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleInscription}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.loadingText}>Création du compte...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/auth/login-joueur')}
            disabled={loading}
            style={styles.backLink}
          >
            <Text style={[styles.backLinkText, loading && styles.textDisabled]}>
              Déjà un compte ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

// Styles : exactement les tiens d'origine + block équipe
const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#121212', paddingVertical: 40, paddingHorizontal: 24 },
  container: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: { fontSize: 28, color: '#00ff88', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center' },
  form: { backgroundColor: 'rgba(30,30,30,0.85)', borderRadius: 18, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 2 },
  inputGroup: { position: 'relative', marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 15, zIndex: 1 },
  input: { flex: 1, backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 10, paddingVertical: 14, paddingLeft: 45, paddingRight: 18, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  eyeButton: { position: 'absolute', right: 15, padding: 5 },
  datePickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e1e1e', borderRadius: 10, paddingVertical: 14, paddingLeft: 45, paddingRight: 18, borderWidth: 1, borderColor: '#333' },
  datePickerText: { color: '#fff', fontSize: 16 }, datePickerPlaceholder: { color: '#aaa' },
  datePickerContainer: { backgroundColor: '#1e1e1e', borderRadius: 10, marginBottom: 16, padding: 10, borderWidth: 1, borderColor: '#333' },
  iosDatePicker: { backgroundColor: 'transparent' },
  closeDatePickerButton: { backgroundColor: '#00ff88', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignSelf: 'center', marginTop: 10 },
  closeDatePickerText: { color: '#000', fontWeight: '600', fontSize: 16 },
  ageIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 16, gap: 8 },
  ageIndicatorMinor: { borderLeftWidth: 3, borderLeftColor: '#ffb100' },
  ageIndicatorMajor: { borderLeftWidth: 3, borderLeftColor: '#00ff88' },
  ageText: { fontSize: 14, fontWeight: '600' },
  dechargeBlock: { marginBottom: 24, backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ffb100' },
  dechargeTitle: { color: '#ffb100', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  dechargeText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  dechargeMessage: { color: '#ddd', fontSize: 14, fontStyle: 'italic', lineHeight: 20, marginBottom: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#ffb100' },
  dechargeNote: { color: '#ffb100', fontSize: 13, fontWeight: '500', marginBottom: 16 },
  dechargeRow: { flexDirection: 'row', gap: 12 },
  dechargeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#242424', borderWidth: 1, borderColor: '#555', gap: 6 },
  dechargeButtonSelected: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  dechargeButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dechargeButtonTextSelected: { color: '#121212' },
  button: { backgroundColor: '#00ff88', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#000', fontWeight: '600', fontSize: 14 },
  backLink: { alignItems: 'center' },
  backLinkText: { color: '#00ff88', fontSize: 14, textDecorationLine: 'underline' },
  textDisabled: { opacity: 0.5 },
  equipeInfoBlock: { marginBottom: 18, backgroundColor: '#212b25', borderRadius: 10, padding: 12, borderLeftWidth: 5, borderLeftColor: '#00ff88' },
  equipeTitle: { color: '#00ff88', fontSize: 18, fontWeight: '700', marginBottom: 3 },
  equipeLabel: { color: '#aaa', fontSize: 15 },
});

