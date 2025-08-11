import React, { useState, useEffect, useMemo, FC } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { setupNotifications, initializeNotificationsForUser } from '../../lib/notifications';
import { formatDateForDisplay, calculateAge } from '../../lib/formatDate';
import { Ionicons } from '@expo/vector-icons';
import ReturnButton from '@/components/atoms/ReturnButton';
import * as Clipboard from 'expo-clipboard';
import Button from '@/components/atoms/Button';

// Import conditionnel du DateTimePicker (seulement pour mobile)
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
    try {
        DateTimePicker = require('@react-native-community/datetimepicker').default;
    } catch (error) {
        console.warn('DateTimePicker non disponible:', error);
    }
}

// Validation email
function isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validation téléphone
function isValidPhone(phone: string) {
    const phoneRegex = /^[0-9+\s\-\.()]{8,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Fonction pour formater la date en YYYY-MM-DD pour l'input HTML
function formatDateForInput(date: Date) {
    if (!date) {
        return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fonction pour parser une date depuis un input HTML (YYYY-MM-DD)
function parseDateFromInput(dateString: string) {
    if (!dateString) {
        return null;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

interface WebDateInputProps {
    value: Date | undefined;
    onChange: (dateString: string) => void;
    disabled?: boolean;
    style?: React.CSSProperties;
    placeholder?: string;
}

// Composant d'input date spécifique pour le web
const WebDateInput: FC<WebDateInputProps> = ({ value, onChange, disabled, style, placeholder }) => {
    if (Platform.OS !== 'web') {
        return null;
    }

    return (
        <input
            type="date"
            value={value ? formatDateForInput(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            max={formatDateForInput(new Date())}
            min={formatDateForInput(new Date(1940, 0, 1))}
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
                ...style,
            }}
            placeholder={placeholder}
        />
    );
};

export default function InscriptionPresident() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');

    // Date de naissance avec valeur par défaut (45 ans)
    const [dateNaissance, setDateNaissance] = useState(new Date(1979, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Informations du club
    const [clubNom, setClubNom] = useState('');
    const [adresse, setAdresse] = useState('');
    const [ville, setVille] = useState('');
    const [codePostal, setCodePostal] = useState('');
    const [emailClub, setEmailClub] = useState('');
    const [telephoneClub, setTelephoneClub] = useState('');

    // États de l'application
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
    const [notificationsInitializing, setNotificationsInitializing] = useState(false);
    const [clubCode, setClubCode] = useState('');
    const [clubCreated, setClubCreated] = useState(false);

    // 🎂 Calcul automatique de l'âge
    useEffect(() => {
        try {
            const age = calculateAge(dateNaissance);
            setCalculatedAge(age);
        } catch (error) {
            console.error("Erreur lors du calcul de l'âge:", error);
            setCalculatedAge(null);
        }
    }, [dateNaissance]);

    // Génération du code club
    function genererCodeClub() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `SF-${code}`;
    }

    // Gestion du DatePicker pour mobile
    const handleDatePickerOpen = () => {
        if (Platform.OS === 'web') {
            return;
        }
        setShowDatePicker(true);
    };

    const onDateChange = (event: Event, selectedDate: Date | undefined) => {
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
    const handleWebDateChange = (dateString: string) => {
        if (!dateString) {
            return;
        }
        const selectedDate = parseDateFromInput(dateString);
        if (selectedDate) {
            handleDateValidationAndSet(selectedDate);
        }
    };

    // Fonction commune de validation et définition de date
    const handleDateValidationAndSet = (selectedDate: Date) => {
        const today = new Date();
        if (selectedDate > today) {
            Alert.alert('Erreur', 'La date de naissance ne peut pas être dans le futur.');
            return;
        }
        const age = calculateAge(selectedDate);
        if (age < 18) {
            Alert.alert('Erreur', 'Un président doit être majeur (18 ans minimum).');
            return;
        }
        if (age > 100) {
            Alert.alert('Erreur', 'Âge non valide (plus de 100 ans).');
            return;
        }
        setDateNaissance(selectedDate);
    };

    // 🔍 Validation complète des champs
    const isFormValid = useMemo(() => {
        if (!email.trim()) {
            return false;
        }
        if (!isValidEmail(email.trim())) {
            return false;
        }
        if (!password.trim()) {
            return false;
        }
        if (password.length < 6) {
            return false;
        }
        if (password !== confirmPassword) {
            return false;
        }
        if (!nom.trim()) {
            return false;
        }
        if (!prenom.trim()) {
            return false;
        }
        if (!telephone.trim()) {
            return false;
        }
        if (!isValidPhone(telephone.trim())) {
            return false;
        }
        if (!dateNaissance) {
            return false;
        }
        const today = new Date();
        if (dateNaissance >= today) {
            return false;
        }
        const age = calculateAge(dateNaissance);
        if (age < 18) {
            return false;
        }
        if (!clubNom.trim()) {
            return false;
        }
        if (!adresse.trim()) {
            return false;
        }
        if (!ville.trim()) {
            return false;
        }
        if (!codePostal.trim()) {
            return false;
        }
        if (!/^\d{5}$/.test(codePostal.trim())) {
            return false;
        }
        if (!emailClub.trim()) {
            return false;
        }
        if (!isValidEmail(emailClub.trim())) {
            return false;
        }
        if (!telephoneClub.trim()) {
            return false;
        }
        if (!isValidPhone(telephoneClub.trim())) {
            return false;
        }
        return true;
    }, [
        adresse,
        clubNom,
        codePostal,
        confirmPassword,
        dateNaissance,
        email,
        emailClub,
        nom,
        password,
        prenom,
        telephone,
        telephoneClub,
        ville,
    ]);

    // 🔔 Initialiser les notifications après inscription
    const initializeNotifications = async (userId: string) => {
        try {
            setNotificationsInitializing(true);
            const { token } = await initializeNotificationsForUser(userId);
            if (token) {
                return token;
            }
            return null;
        } catch (error) {
            console.error('🔔 Erreur notifications:', error);
            return null;
        } finally {
            setNotificationsInitializing(false);
        }
    };

    // 🚀 Création du club et inscription président
    const creerPresidentEtClub = async () => {
        if (!isFormValid) {
            return;
        }
        setLoading(true);
        try {
            console.log("🚀 Début de l'inscription président...");

            // 1. Création du compte Auth
            console.log('📧 Tentative de création du compte Auth...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: password.trim(),
            });

            if (signUpError || !signUpData?.user) {
                console.error('❌ Erreur Auth SignUp:', signUpError);
                Alert.alert(
                    'Erreur',
                    `Inscription échouée : ${signUpError?.message || 'Erreur inconnue.'}`,
                );
                return;
            }

            const userId = signUpData.user.id;
            console.log('✅ Compte Auth créé, userId:', userId);

            // Après signUp, vérifier la session
            console.log('🔐 Vérification de la session...');
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                console.log('⚠️ Pas de session, tentative de login...');
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: email.trim().toLowerCase(),
                    password: password.trim(),
                }); // FIXME: on ne fait rien du résultat ?
                if (loginError) {
                    console.error('❌ Erreur Login:', loginError);
                    Alert.alert('Erreur', "Problème d'authentification après inscription.");
                    setLoading(false);
                    return;
                }
                console.log('✅ Login réussi');
            } else {
                console.log('✅ Session active');
            }

            // 2. Générer le token de notification
            console.log('🔔 Configuration des notifications...');
            const expoPushToken = await setupNotifications();
            console.log('📱 Token expo:', expoPushToken ? 'Généré' : 'Non disponible');

            // 3. Générer le code club unique
            const generatedCode = genererCodeClub();
            console.log('🔑 Code club généré:', generatedCode);

            // 4. Création du club avec informations essentielles
            console.log('🏆 Tentative de création du club...');
            const adresseComplete = `${adresse.trim()}, ${codePostal.trim()} ${ville.trim()}`;

            const clubDataToInsert = {
                nom: clubNom.trim(),
                adresse: adresseComplete,
                ville: ville.trim(),
                code_postal: codePostal.trim(),
                code_acces: generatedCode,
                created_by: userId,
                email: emailClub.trim().toLowerCase(),
                telephone: telephoneClub.trim(),
                date_creation: new Date().toISOString(),
            };

            console.log('📋 Données club à insérer:', clubDataToInsert);

            const { data: clubData, error: clubError } = await supabase
                .from('clubs')
                .insert(clubDataToInsert)
                .select()
                .single();

            console.log('🏆 Réponse création club:', { clubData, clubError });

            if (clubError || !clubData) {
                console.error('❌ Erreur création club:', clubError);
                Alert.alert(
                    'Erreur',
                    `Erreur lors de la création du club: ${clubError?.message || 'Erreur inconnue'}`,
                );
                return;
            }

            console.log('✅ Club créé avec succès:', clubData);
            console.log('🔑 Club ID:', clubData.id, 'Type:', typeof clubData.id);

            // 5. Insertion dans la table utilisateurs
            console.log("👤 Tentative de création de l'utilisateur...");

            const userDataToInsert = {
                id: userId,
                email: email.trim().toLowerCase(),
                nom: nom.trim(),
                prenom: prenom.trim(),
                club_id: clubData.id,
                role: 'president',
                expo_push_token: expoPushToken,
                date_creation: new Date().toISOString(),
            };

            console.log('📋 Données utilisateur à insérer:', userDataToInsert);

            const { error: insertUserError } = await supabase
                .from('utilisateurs')
                .insert(userDataToInsert);

            if (insertUserError) {
                console.error('❌ Erreur création utilisateur:', insertUserError);
                Alert.alert(
                    'Erreur',
                    `Club créé mais profil utilisateur incomplet: ${insertUserError.message}`,
                );
                return;
            }

            console.log('✅ Utilisateur créé avec succès');

            // 6. Lien dans clubs_admins
            console.log('🔗 Création du lien administrateur...');
            const { error: adminError } = await supabase.from('clubs_admins').insert({
                club_id: clubData.id,
                user_id: userId,
                role_club: 'president',
                is_active: true,
                date_added: new Date().toISOString(),
            });

            if (adminError) {
                console.error('⚠️ Erreur lien admin:', adminError);
                Alert.alert(
                    'Attention',
                    'Club et utilisateur créés, mais lien administrateur incomplet.',
                );
            } else {
                console.log('✅ Lien administrateur créé');
            }

            // 7. Finaliser les notifications
            if (expoPushToken) {
                console.log('🔔 Finalisation des notifications...');
                await initializeNotifications(userId);
            }

            // 8. Succès !
            setClubCode(generatedCode);
            setClubCreated(true);

            console.log('🎉 Inscription complète avec succès !');

            Alert.alert(
                'Félicitations ! 🎉',
                `Votre club "${clubData.nom}" a été créé avec succès ! (${calculatedAge} ans)\n\nCode club : ${generatedCode}\n\nGardez précieusement ce code pour que vos joueurs et coachs puissent rejoindre le club.`,
                [
                    {
                        text: 'Accéder à mon espace',
                        onPress: () => router.replace('/president/dashboard'),
                        style: 'default',
                    },
                    {
                        text: 'Copier le code',
                        onPress: () => copierCodeClub(),
                        style: 'cancel',
                    },
                ],
            );
        } catch (error) {
            console.error('💥 Erreur générale:', error);
            Alert.alert(
                'Erreur',
                `Une erreur inattendue s'est produite: ${(error as Error).message}`,
            );
        } finally {
            setLoading(false);
        }
    };

    // Fonction de copie du code club
    const copierCodeClub = async () => {
        if (clubCode) {
            await Clipboard.setStringAsync(clubCode);
            Alert.alert('Copié ! 📋', 'Le code club a été copié dans le presse-papier.');
        }
    };

    // Rendu du sélecteur de date adaptatif (web/mobile)
    const renderDatePicker = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.inputGroup}>
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#888"
                        style={styles.inputIcon}
                    />
                    <WebDateInput
                        value={dateNaissance}
                        onChange={handleWebDateChange}
                        disabled={loading || notificationsInitializing}
                        placeholder="Date de naissance"
                    />
                </View>
            );
        } else {
            return (
                <>
                    <View style={styles.inputGroup}>
                        <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#888"
                            style={styles.inputIcon}
                        />
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={handleDatePickerOpen}
                            disabled={loading || notificationsInitializing}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.datePickerText,
                                    !dateNaissance && styles.datePickerPlaceholder,
                                ]}
                            >
                                {dateNaissance
                                    ? formatDateForDisplay(dateNaissance)
                                    : 'Sélectionner la date de naissance'}
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
                                minimumDate={new Date(1940, 0, 1)}
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
        <>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Image source={require('../../assets/logo-v2.png')} style={styles.logo} />
                    <Text style={styles.title}>Créer votre club</Text>
                    <Text style={styles.subtitle}>
                        Créez votre club et commencez l&apos;aventure
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Formulaire */}
                    <View style={styles.form}>
                        {/* Section Informations du club */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="trophy-outline" size={16} color="#00ff88" />{' '}
                                Informations du club
                            </Text>

                            {/* Nom du club */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="football-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom du club"
                                    placeholderTextColor="#aaa"
                                    value={clubNom}
                                    onChangeText={setClubNom}
                                    autoCapitalize="words"
                                    editable={!loading && !notificationsInitializing}
                                />
                            </View>

                            {/* Adresse */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="location-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Adresse du club"
                                    placeholderTextColor="#aaa"
                                    value={adresse}
                                    onChangeText={setAdresse}
                                    autoCapitalize="sentences"
                                    editable={!loading && !notificationsInitializing}
                                />
                            </View>

                            {/* Ville et Code postal (VERTICAL, OPTIMISÉ) */}
                            <View style={{ marginBottom: 16 }}>
                                <View style={styles.inputGroup}>
                                    <Ionicons
                                        name="business-outline"
                                        size={20}
                                        color="#888"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ville"
                                        placeholderTextColor="#aaa"
                                        value={ville}
                                        onChangeText={setVille}
                                        autoCapitalize="words"
                                        editable={!loading && !notificationsInitializing}
                                        returnKeyType="next"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Ionicons
                                        name="pin-outline"
                                        size={20}
                                        color="#888"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Code postal"
                                        placeholderTextColor="#aaa"
                                        value={codePostal}
                                        onChangeText={setCodePostal}
                                        keyboardType="numeric"
                                        maxLength={5}
                                        editable={!loading && !notificationsInitializing}
                                        returnKeyType="done"
                                    />
                                </View>
                            </View>

                            {/* Email du club */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email de contact du club"
                                    placeholderTextColor="#aaa"
                                    value={emailClub}
                                    onChangeText={setEmailClub}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading && !notificationsInitializing}
                                />
                            </View>

                            {/* Téléphone du club */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="call-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Téléphone du club"
                                    placeholderTextColor="#aaa"
                                    value={telephoneClub}
                                    onChangeText={setTelephoneClub}
                                    keyboardType="phone-pad"
                                    editable={!loading && !notificationsInitializing}
                                />
                            </View>
                        </View>

                        {/* Section Informations personnelles */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="person-outline" size={16} color="#00ff88" /> Vos
                                informations de président
                            </Text>

                            {/* Email personnel */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Votre email personnel"
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
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
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
                                    <Ionicons
                                        name={showPassword ? 'eye' : 'eye-off'}
                                        size={22}
                                        color="#888"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Confirmation mot de passe */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
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
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye' : 'eye-off'}
                                        size={22}
                                        color="#888"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Nom */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
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
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
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

                            {/* Téléphone personnel */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="call-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Votre téléphone personnel"
                                    placeholderTextColor="#aaa"
                                    value={telephone}
                                    onChangeText={setTelephone}
                                    keyboardType="phone-pad"
                                    textContentType="telephoneNumber"
                                    editable={!loading && !notificationsInitializing}
                                />
                            </View>

                            {/* Date de naissance */}
                            {renderDatePicker()}

                            {/* Indicateur âge */}
                            {calculatedAge !== null && (
                                <View style={styles.ageIndicator}>
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={20}
                                        color="#00ff88"
                                    />
                                    <Text style={[styles.ageText, { color: '#00ff88' }]}>
                                        {calculatedAge} ans - Âge validé pour diriger un club
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Code club généré */}
                        {clubCreated && clubCode && (
                            <View style={styles.clubCodeSection}>
                                <Text style={styles.clubCodeTitle}>
                                    <Ionicons name="key-outline" size={16} color="#00ff88" /> Votre
                                    code club
                                </Text>
                                <View style={styles.clubCodeBox}>
                                    <Text selectable style={styles.clubCode}>
                                        {clubCode}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={copierCodeClub}
                                    >
                                        <Ionicons name="copy-outline" size={18} color="#000" />
                                        <Text style={styles.copyButtonText}>Copier</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.clubCodeInfo}>
                                    Partagez ce code avec vos joueurs et coachs pour qu&apos;ils
                                    puissent rejoindre le club. Vous pourrez configurer les autres
                                    informations (site web, réseaux sociaux, etc.) dans votre
                                    dashboard.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Button
                style={{ marginTop: 20 }}
                text="Créer mon club"
                onPress={creerPresidentEtClub}
                loading={loading}
                disabled={!isFormValid}
                color="primary"
            />
            <ReturnButton style={{ marginBottom: 24 }} forceBackRoute="/auth/login-club" />
        </>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
    },
    container: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
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
        marginLeft: 12,
        marginRight: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 2,
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#00ff88',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
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
    textArea: {
        paddingTop: 14,
        minHeight: 80,
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
        gap: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#00ff88',
    },
    ageText: {
        fontSize: 14,
        fontWeight: '600',
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
    clubCodeSection: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00ff88',
        marginBottom: 20,
        alignItems: 'center',
    },
    clubCodeTitle: {
        color: '#00ff88',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    clubCodeBox: {
        backgroundColor: '#0a0a0a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#00ff88',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    clubCode: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        backgroundColor: '#00ff88',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 4,
    },
    copyButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 12,
    },
    clubCodeInfo: {
        color: '#aaa',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
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
