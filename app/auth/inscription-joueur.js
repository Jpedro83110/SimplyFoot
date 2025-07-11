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

// Import conditionnel du DateTimePicker (seulement pour mobile)
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    console.warn('DateTimePicker non disponible:', error);
  }
}

// Helper pour savoir si mineur (moins de 18 ans)
function isMineur(birthDate) {
  try {
    const age = calculateAge(birthDate);
    console.log('🎂 Âge calculé:', age, 'pour la date:', birthDate);
    return age < 18;
  } catch (error) {
    console.error('❌ Erreur calcul âge:', error);
    return false;
  }
}

// Validation email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation téléphone
function isValidPhone(phone) {
  const phoneRegex = /^[0-9+\s\-\.()]{8,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Fonction pour formater la date en YYYY-MM-DD pour l'input HTML
function formatDateForInput(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fonction pour parser une date depuis un input HTML (YYYY-MM-DD)
function parseDateFromInput(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Composant d'input date spécifique pour le web
const WebDateInput = ({ value, onChange, disabled, style, placeholder }) => {
  if (Platform.OS !== 'web') return null;

  return (
    <input
      type="date"
      value={formatDateForInput(value)}
      onChange={(e) => onChange(e.target.value)}
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeClub, setCodeClub] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  
  const [dateNaissance, setDateNaissance] = useState(new Date(1999, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accepteDecharge, setAccepteDecharge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [notificationsInitializing, setNotificationsInitializing] = useState(false);

  // 🎂 Calcul automatique de l'âge et statut mineur/majeur
  useEffect(() => {
    try {
      const age = calculateAge(dateNaissance);
      const minor = age < 18;
      
      console.log('📅 Date sélectionnée:', dateNaissance);
      console.log('🎂 Âge calculé:', age);
      console.log('👶 Est mineur:', minor);
      
      setCalculatedAge(age);
      setIsMinor(minor);
      
      // Reset le choix de décharge si changement de statut
      if (!minor && accepteDecharge !== null) {
        setAccepteDecharge(null);
      }
    } catch (error) {
      console.error('❌ Erreur calcul âge:', error);
      setCalculatedAge(null);
      setIsMinor(false);
      setAccepteDecharge(null);
    }
  }, [dateNaissance]);

  // Gestion du DatePicker pour mobile
  const handleDatePickerOpen = () => {
    if (Platform.OS === 'web') return;
    console.log('📅 Ouverture DatePicker...');
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    console.log('📅 DatePicker onChange:', { event: event.type, selectedDate });
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      handleDateValidationAndSet(selectedDate);
    }
  };

  // Gestion de la date pour le web
  const handleWebDateChange = (dateString) => {
    if (!dateString) return;
    
    const selectedDate = parseDateFromInput(dateString);
    if (selectedDate) {
      handleDateValidationAndSet(selectedDate);
    }
  };

  // Fonction commune de validation et définition de date
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
    
    console.log('✅ Nouvelle date sélectionnée:', selectedDate, '- Âge:', age);
    setDateNaissance(selectedDate);
  };

  // 🔍 Validation complète des champs
  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est obligatoire.');
      return false;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Erreur', 'Format d\'email invalide.');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Erreur', 'Le mot de passe est obligatoire.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return false;
    }

    if (!codeClub.trim()) {
      Alert.alert('Erreur', 'Le code club est obligatoire.');
      return false;
    }

    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return false;
    }

    if (!prenom.trim()) {
      Alert.alert('Erreur', 'Le prénom est obligatoire.');
      return false;
    }

    if (!telephone.trim()) {
      const phoneContext = isMinor ? 'Le téléphone du parent/tuteur' : 'Votre téléphone';
      Alert.alert('Erreur', `${phoneContext} est obligatoire.`);
      return false;
    }

    if (!isValidPhone(telephone.trim())) {
      Alert.alert('Erreur', 'Format de téléphone invalide.');
      return false;
    }

    if (!dateNaissance) {
      Alert.alert('Erreur', 'La date de naissance est obligatoire.');
      return false;
    }

    const today = new Date();
    if (dateNaissance >= today) {
      Alert.alert('Erreur', 'La date de naissance doit être antérieure à aujourd\'hui.');
      return false;
    }

    if (isMinor && accepteDecharge === null) {
      Alert.alert(
        'Décharge parentale requise', 
        `Votre enfant est mineur (${calculatedAge} ans). Veuillez choisir si vous souhaitez signer la décharge parentale ou non.\n\nVous pourrez modifier ce choix plus tard dans l\'espace parent.`
      );
      return false;
    }

    return true;
  };

  // 🔔 Initialiser les notifications après inscription
  const initializeNotifications = async (userId) => {
    try {
      setNotificationsInitializing(true);
      console.log('🔔 Initialisation notifications après inscription...');

      const { token } = await initializeNotificationsForUser(userId);

      if (token) {
        console.log('✅ Notifications configurées avec succès');
        return token;
      } else {
        console.warn('⚠️ Notifications non configurées (simulateur ou permissions refusées)');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
      return null;
    } finally {
      setNotificationsInitializing(false);
    }
  };

  // 🚀 Inscription principale
  const handleInscription = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('🚀 Début inscription joueur...');
      console.log('👤 Âge:', calculatedAge, 'ans - Mineur:', isMinor);

      // 1. Vérifier le code club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('id, nom')
        .eq('code_acces', codeClub.trim().toUpperCase())
        .single();

      if (clubError || !clubData) {
        Alert.alert('Erreur', 'Code club invalide ou club non trouvé.');
        return;
      }

      console.log('✅ Club trouvé:', clubData.nom);

      // 2. Création du compte Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (signUpError || !signUpData?.user) {
        console.error('❌ Erreur inscription auth:', signUpError);
        Alert.alert('Erreur', `Inscription échouée : ${signUpError?.message || 'Erreur inconnue.'}`);
        return;
      }

      const userId = signUpData.user.id;
      console.log('✅ Compte auth créé:', userId);

      // 3. Générer le token de notification
      const expoPushToken = await setupNotifications();
      console.log('🔔 Token notifications généré:', expoPushToken);

      // 4. Insertion dans la table utilisateurs
      const { error: insertUserError } = await supabase.from('utilisateurs').insert({
        id: userId,
        email: email.trim().toLowerCase(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        club_id: clubData.id,
        role: 'joueur',
        expo_push_token: expoPushToken,
        date_creation: new Date().toISOString(),
      });

      if (insertUserError) {
        console.error('❌ Erreur insertion utilisateur:', insertUserError);
        Alert.alert('Erreur', 'Utilisateur créé mais insertion incomplète (utilisateurs).');
        return;
      }

      console.log('✅ Utilisateur inséré dans la base');

      // 5. Insertion dans la table joueurs avec gestion du téléphone
      const dateNaissanceISO = formatDateToISO(dateNaissance);
      const joueurData = {
        utilisateur_id: userId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: dateNaissanceISO,
        ...((!isMinor) && { telephone: telephone.trim() })
      };

      console.log('📅 Date de naissance formatée:', dateNaissanceISO);
      console.log('📱 Téléphone ajouté à joueurs:', !isMinor ? telephone.trim() : 'Non (mineur)');

      const { data: insertedJoueur, error: insertJoueurError } = await supabase
        .from('joueurs')
        .insert(joueurData)
        .select('id')
        .single();

      if (insertJoueurError) {
        console.error('❌ Erreur insertion joueur:', insertJoueurError);
        Alert.alert(
          'Erreur',
          'Utilisateur enregistré, mais profil joueur non créé.\n\nMerci de contacter le support !'
        );
        return;
      }

      const joueurId = insertedJoueur.id;
      console.log('✅ Profil joueur créé avec ID:', joueurId);

      // 6. Gestion de la décharge pour mineurs
      if (isMinor) {
        console.log('📄 Gestion décharge pour mineur...');
        
        if (accepteDecharge === true) {
          const dechargeData = {
            joueur_id: joueurId,
            utilisateur_id: userId,
            parent_nom: nom.trim(),
            parent_prenom: prenom.trim(),
            telephone_parent: telephone.trim(),
            accepte_transport: true,
            date_signature: new Date().toISOString(),
            club_id: clubData.id,
            message: "J'accepte que mon enfant puisse être transporté sur le lieu d'un événement par le coach ou un autre parent dans le cadre du club.",
            nom_parent: `${nom.trim()} ${prenom.trim()}`,
            est_valide: true
          };

          const { error: dechargeError } = await supabase
            .from('decharges_generales')
            .insert(dechargeData);

          if (dechargeError) {
            console.warn('⚠️ Erreur décharge:', dechargeError);
            Alert.alert(
              'Attention', 
              'Décharge non enregistrée, vous pourrez la signer plus tard dans l\'espace parent.'
            );
          } else {
            console.log('✅ Décharge signée avec succès (téléphone parent sauvé)');
          }
        } else {
          console.log('📄 Décharge non signée (choix du parent) - téléphone non sauvé');
        }
      }

      // 7. Finaliser les notifications
      if (expoPushToken) {
        await initializeNotifications(userId);
      }

      // 8. Succès !
      console.log('🎉 Inscription terminée avec succès');
      
      const ageInfo = isMinor ? ` (${calculatedAge} ans - mineur)` : ` (${calculatedAge} ans)`;
      const telephoneInfo = isMinor 
        ? (accepteDecharge ? '\n📱 Téléphone parent sauvé avec la décharge' : '\n📱 Téléphone parent non sauvé (décharge non signée)')
        : '\n📱 Téléphone joueur sauvé';
      const dechargeInfo = isMinor ? (accepteDecharge ? '\n✅ Décharge parentale signée' : '\n⚠️ Décharge parentale non signée') : '';
      
      Alert.alert(
        'Inscription réussie ! 🎉',
        `Bienvenue ${prenom} dans le club ${clubData.nom} !${ageInfo}\n\n${expoPushToken ? '🔔 Notifications activées' : ''}${telephoneInfo}${dechargeInfo}`,
        [
          { 
            text: 'Accéder à mon espace', 
            onPress: () => router.replace('/joueur/dashboard'),
            style: 'default'
          }
        ]
      );

    } catch (error) {
      console.error('❌ Erreur inscription générale:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Rendu du bouton avec états de chargement
  const renderSubmitButton = () => {
    const isSubmitting = loading || notificationsInitializing;
    let buttonText = 'Créer mon compte';
    
    if (notificationsInitializing) {
      buttonText = 'Configuration notifications...';
    } else if (loading) {
      buttonText = 'Création du compte...';
    }

    return (
      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.buttonDisabled]} 
        onPress={handleInscription} 
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#000" size="small" />
            <Text style={styles.loadingText}>{buttonText}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Rendu du sélecteur de date adaptatif (web/mobile)
  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      // Sur web : input HTML natif
      return (
        <View style={styles.inputGroup}>
          <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
          <WebDateInput
            value={dateNaissance}
            onChange={handleWebDateChange}
            disabled={loading || notificationsInitializing}
            placeholder="Date de naissance"
          />
        </View>
      );
    } else {
      // Sur mobile : TouchableOpacity + DateTimePicker
      return (
        <>
          <View style={styles.inputGroup}>
            <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={handleDatePickerOpen}
              disabled={loading || notificationsInitializing}
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

          {/* DatePicker Modal pour mobile */}
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
      );
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        
        {/* Header avec logo */}
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Créer un compte Joueur</Text>
          <Text style={styles.subtitle}>Rejoignez votre club sur SimplyFoot</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          
          {/* Email */}
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
              editable={!loading && !notificationsInitializing}
            />
          </View>

          {/* Mot de passe */}
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
              editable={!loading && !notificationsInitializing}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading || notificationsInitializing}
            >
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Confirmation mot de passe */}
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
              editable={!loading && !notificationsInitializing}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading || notificationsInitializing}
            >
              <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Code Club */}
          <View style={styles.inputGroup}>
            <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Code Club" 
              placeholderTextColor="#aaa" 
              value={codeClub} 
              onChangeText={setCodeClub} 
              autoCapitalize="characters"
              editable={!loading && !notificationsInitializing}
            />
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Nom" 
              placeholderTextColor="#aaa" 
              value={nom} 
              onChangeText={setNom}
              textContentType="familyName"
              editable={!loading && !notificationsInitializing}
            />
          </View>

          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Prénom" 
              placeholderTextColor="#aaa" 
              value={prenom} 
              onChangeText={setPrenom}
              textContentType="givenName"
              editable={!loading && !notificationsInitializing}
            />
          </View>

          {/* Date de naissance - Rendu adaptatif web/mobile */}
          {renderDatePicker()}

          {/* Indicateur âge */}
          {calculatedAge !== null && (
            <View style={[styles.ageIndicator, isMinor ? styles.ageIndicatorMinor : styles.ageIndicatorMajor]}>
              <Ionicons 
                name={isMinor ? 'warning-outline' : 'checkmark-circle-outline'} 
                size={20} 
                color={isMinor ? '#ffb100' : '#00ff88'} 
              />
              <Text style={[styles.ageText, { color: isMinor ? '#ffb100' : '#00ff88' }]}>
                {calculatedAge} ans - {isMinor ? 'Joueur mineur (moins de 18 ans)' : 'Joueur majeur (18 ans et plus)'}
              </Text>
            </View>
          )}

          {/* Téléphone avec contexte selon l'âge */}
          <View style={styles.inputGroup}>
            <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder={isMinor ? "Téléphone du parent/tuteur légal" : "Votre téléphone"}
              placeholderTextColor="#aaa" 
              value={telephone} 
              onChangeText={setTelephone} 
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              editable={!loading && !notificationsInitializing}
            />
          </View>

          {/* Indication sur la sauvegarde du téléphone */}
          {calculatedAge !== null && (
            <View style={styles.phoneInfo}>
              <Ionicons 
                name="information-circle-outline" 
                size={16} 
                color="#888" 
              />
              <Text style={styles.phoneInfoText}>
                {isMinor 
                  ? "Ce téléphone sera associé à la décharge parentale si vous la signez"
                  : "Ce téléphone sera associé à votre profil joueur"
                }
              </Text>
            </View>
          )}

          {/* Section décharge pour mineurs */}
          {isMinor && (
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
                  disabled={loading || notificationsInitializing}
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
                  disabled={loading || notificationsInitializing}
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
          )}

          {/* Bouton d'inscription */}
          {renderSubmitButton()}

          {/* Lien retour connexion */}
          <TouchableOpacity 
            onPress={() => router.push('/auth/login-joueur')}
            disabled={loading || notificationsInitializing}
            style={styles.backLink}
          >
            <Text style={[styles.backLinkText, (loading || notificationsInitializing) && styles.textDisabled]}>
              Déjà un compte ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: '#121212',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    color: '#00ff88',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  inputGroup: {
    position: 'relative',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingLeft: 45,
    paddingRight: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingVertical: 14,
    paddingLeft: 45,
    paddingRight: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
  },
  datePickerPlaceholder: {
    color: '#aaa',
  },
  datePickerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  iosDatePicker: {
    backgroundColor: 'transparent',
  },
  closeDatePickerButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  closeDatePickerText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  ageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  ageIndicatorMinor: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffb100',
  },
  ageIndicatorMajor: {
    borderLeftWidth: 3,
    borderLeftColor: '#00ff88',
  },
  ageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 16,
    gap: 8,
  },
  phoneInfoText: {
    color: '#888',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  dechargeBlock: {
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffb100',
  },
  dechargeTitle: {
    color: '#ffb100',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  dechargeText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  dechargeMessage: {
    color: '#ddd',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#ffb100',
  },
  dechargeNote: {
    color: '#ffb100',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  dechargeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dechargeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#555',
    gap: 6,
  },
  dechargeButtonSelected: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  dechargeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  dechargeButtonTextSelected: {
    color: '#121212',
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#00ff88',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  textDisabled: {
    opacity: 0.5,
  },
});