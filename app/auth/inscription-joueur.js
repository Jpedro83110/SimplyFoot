import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { setupNotifications, initializeNotificationsForUser } from '../../lib/notifications';
import { formatDateToISO, formatDateForDisplay, calculateAge } from '../../lib/formatDate';
import { Ionicons } from '@expo/vector-icons';
import ReturnButton from '@/components/atoms/ReturnButton';
import Input from '@/components/atoms/Input';

// DatePicker mobile
let DateTimePicker = null;
if (Platform.OS !== 'web') {
    try {
        DateTimePicker = require('@react-native-community/datetimepicker').default;
    } catch (error) {
        console.warn('DateTimePicker not available:', error);
    }
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
    if (!date) {
        return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function parseDateFromInput(dateString) {
    if (!dateString) {
        return null;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}
const WebDateInput = ({ value, onChange, disabled, style, placeholder }) => {
    if (Platform.OS !== 'web') {
        return null;
    }
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
                ...style,
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
    const [errors, setErrors] = React.useState({});

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
    const [waiverAccepted, setWaiverAccepted] = useState(null);

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
                const { data: coach } = await supabase
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
        if (!dateNaissance) {
            return;
        }
        const age = calculateAge(dateNaissance);
        setCalculatedAge(age);
        setIsMinor(age < 18);
        if (age >= 18) {
            setWaiverAccepted(null);
            setNomParent('');
            setPrenomParent('');
            setTelephoneParent('');
        }
    }, [dateNaissance]);

    // DatePicker handlers
    const handleDatePickerOpen = () => {
        if (Platform.OS !== 'web') {
            setShowDatePicker(true);
        }
    };
    const onDateChange = (event, selectedDate) => {
        if (Platform.OS !== 'web') {
            setShowDatePicker(false);
        }
        if (event.type === 'dismissed') {
            return;
        }
        if (selectedDate) {
            handleDateValidationAndSet(selectedDate);
        }
    };
    const handleWebDateChange = (dateString) => {
        if (!dateString) {
            return;
        }
        const selectedDate = parseDateFromInput(dateString);
        if (selectedDate) {
            handleDateValidationAndSet(selectedDate);
        }
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
        const newErrors = {};

        if (!email.trim() || !isValidEmail(email.trim())) {
            newErrors.email = true;
        }
        if (!password.trim() || password.length < 6) {
            newErrors.password = true;
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = true;
        }
        if (!codeEquipe.trim() || !equipeData) {
            newErrors.codeEquipe = true;
        }
        if (!nom.trim()) {
            newErrors.nom = true;
        }
        if (!prenom.trim()) {
            newErrors.prenom = true;
        }
        if (!dateNaissance) {
            newErrors.dateNaissance = true;
        }

        if (isMinor) {
            if (!nomParent.trim()) {
                newErrors.nomParent = true;
            }
            if (!prenomParent.trim()) {
                newErrors.prenomParent = true;
            }
            if (!telephoneParent.trim() || !isValidPhone(telephoneParent.trim())) {
                newErrors.telephoneParent = true;
            }
            if (waiverAccepted === null) {
                newErrors.waiverAccepted = true;
            }
        } else {
            if (!telephone.trim() || !isValidPhone(telephone.trim())) {
                newErrors.telephone = true;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 🚀 Inscription
    const handleInscription = async () => {
        if (!validateForm()) {
            return;
        }
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
            try {
                expoPushToken = await setupNotifications();
            } catch {}

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
                Alert.alert('Erreur', 'Utilisateur enregistré, mais profil joueur non créé.');
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
                    accepte_transport: waiverAccepted === true ? true : false,
                    date_signature: new Date().toISOString(),
                });
            }

            // 7. Notifications (optionnel)
            if (expoPushToken) {
                try {
                    await initializeNotificationsForUser(userId);
                } catch {}
            }

            // 8. Fin OK
            Alert.alert(
                'Inscription réussie ! 🎉',
                `Bienvenue ${prenom} dans l'équipe ${equipeData.nom} !`,
                [
                    {
                        text: 'Accéder à mon espace',
                        onPress: () => router.replace('/joueur/dashboard'),
                    },
                ],
            );
        } catch (error) {
            console.error('Error during player registration:', error);
            Alert.alert('Erreur', "Une erreur inattendue s'est produite. Veuillez réessayer.");
        } finally {
            router.push('/auth/login-joueur');
            setLoading(false);
        }
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Créer un compte Joueur</Text>
                        <Text style={styles.subtitle}>Rejoignez votre club sur SimplyFoot</Text>
                    </View>
                    <View style={styles.form}>
                        {/* EMAIL */}
                        <Input
                            icon="mail-outline"
                            placeholder="Email*"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            editable={!loading}
                            error={email === undefined ? 'Le mail est requis' : false}
                        />
                        {/* PASSWORD */}
                        <Input
                            icon="lock-closed-outline"
                            placeholder="Mot de passe*"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            showToggle
                            show={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                            textContentType="newPassword"
                            editable={!loading}
                            error={password === undefined ? 'Le mot de passe est requis' : false}
                        />
                        {/* CONFIRM PASSWORD */}
                        <Input
                            icon="lock-closed-outline"
                            placeholder="Confirmer le mot de passe*"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            showToggle
                            show={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                            textContentType="newPassword"
                            editable={!loading}
                            error={
                                confirmPassword === undefined
                                    ? 'La confirmation du mot de passe est requise'
                                    : false
                            }
                        />
                        {/* CODE EQUIPE */}
                        <Input
                            icon="key-outline"
                            placeholder="Code Équipe*"
                            value={codeEquipe}
                            onChangeText={setCodeEquipe}
                            autoCapitalize="characters"
                            editable={!loading}
                            error={codeEquipe === undefined ? 'Le code équipe est requis' : false}
                        />
                        {/* INFOS EQUIPE */}
                        {equipeData && (
                            <View style={styles.equipeInfoBlock}>
                                <Text style={styles.equipeTitle}>
                                    🎽 {equipeData.nom} (
                                    {equipeData.categorie || 'Catégorie inconnue'})
                                </Text>
                                <Text style={styles.equipeLabel}>
                                    Coach associé :{' '}
                                    <Text style={{ color: '#fff' }}>
                                        {coachData
                                            ? `${coachData.prenom} ${coachData.nom}`
                                            : 'Non renseigné'}
                                    </Text>
                                </Text>
                            </View>
                        )}
                        {/* NOM / PRÉNOM */}
                        <Input
                            icon="person-outline"
                            placeholder="Nom du joueur*"
                            value={nom}
                            onChangeText={setNom}
                            textContentType="familyName"
                            editable={!loading}
                            error={nom === undefined ? 'Le nom du joueur est requis' : false}
                        />
                        <Input
                            icon="person-outline"
                            placeholder="Prénom du joueur*"
                            value={prenom}
                            onChangeText={setPrenom}
                            textContentType="givenName"
                            editable={!loading}
                            error={prenom === undefined ? 'Le prénom du joueur est requis' : false}
                        />
                        {/* DATE DE NAISSANCE */}
                        {Platform.OS === 'web' ? (
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
                                    disabled={loading}
                                    placeholder="Date de naissance*"
                                />
                            </View>
                        ) : (
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
                                        disabled={loading}
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
                                            minimumDate={new Date(1920, 0, 1)}
                                            style={
                                                Platform.OS === 'ios'
                                                    ? styles.iosDatePicker
                                                    : undefined
                                            }
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={styles.closeDatePickerButton}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <Text style={styles.closeDatePickerText}>
                                                    Confirmer
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                        {/* ÂGE + Mineur */}
                        {calculatedAge !== null && (
                            <View
                                style={[
                                    styles.ageIndicator,
                                    isMinor ? styles.ageIndicatorMinor : styles.ageIndicatorMajor,
                                ]}
                            >
                                <Ionicons
                                    name={isMinor ? 'warning-outline' : 'checkmark-circle-outline'}
                                    size={20}
                                    color={isMinor ? '#ffb100' : '#00ff88'}
                                />
                                <Text
                                    style={[
                                        styles.ageText,
                                        { color: isMinor ? '#ffb100' : '#00ff88' },
                                    ]}
                                >
                                    {calculatedAge} ans -{' '}
                                    {isMinor
                                        ? 'Joueur mineur (moins de 18 ans)'
                                        : 'Joueur majeur (18 ans et plus)'}
                                </Text>
                            </View>
                        )}
                        {/* POSTE(S) */}
                        <Input
                            icon="football-outline"
                            placeholder="Poste(s) (optionnel, ex: Gardien, Défenseur...)"
                            value={postes}
                            onChangeText={setPostes}
                            editable={!loading}
                        />
                        {/* TÉLÉPHONE JOUEUR OU INFOS PARENT */}
                        {!isMinor && (
                            <Input
                                icon="call-outline"
                                placeholder="Votre téléphone*"
                                value={telephone}
                                onChangeText={setTelephone}
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                editable={!loading}
                                error={telephone === undefined ? 'Le téléphone est requis' : false}
                            />
                        )}
                        {isMinor && (
                            <>
                                <Input
                                    icon="person-outline"
                                    placeholder="Nom du parent / tuteur*"
                                    value={nomParent}
                                    onChangeText={setNomParent}
                                    editable={!loading}
                                    error={
                                        nomParent === undefined
                                            ? 'Le nom du parent / tuteur est requis'
                                            : false
                                    }
                                />
                                <Input
                                    icon="person-outline"
                                    placeholder="Prénom du parent / tuteur*"
                                    value={prenomParent}
                                    onChangeText={setPrenomParent}
                                    editable={!loading}
                                    error={
                                        prenomParent === undefined
                                            ? 'Le prénom du parent / tuteur est requis'
                                            : false
                                    }
                                />
                                <Input
                                    icon="call-outline"
                                    placeholder="Téléphone du parent / tuteur*"
                                    value={telephoneParent}
                                    onChangeText={setTelephoneParent}
                                    keyboardType="phone-pad"
                                    textContentType="telephoneNumber"
                                    editable={!loading}
                                    error={
                                        telephoneParent === undefined
                                            ? 'Le téléphone du parent / tuteur est requis'
                                            : false
                                    }
                                />
                                {/* Bloc décharge */}
                                <View style={styles.waiverBlock}>
                                    <Text style={styles.waiverTitle}>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={16}
                                            color="#ffb100"
                                        />{' '}
                                        Décharge parentale obligatoire
                                    </Text>
                                    <Text style={styles.waiverText}>
                                        Votre enfant étant mineur ({calculatedAge} ans), une
                                        décharge parentale est nécessaire :
                                    </Text>
                                    <Text style={styles.waiverMessage}>
                                        &quot;J&apos;accepte que mon enfant puisse être transporté
                                        sur le lieu d&apos;un événement par le coach ou un autre
                                        parent dans le cadre du club.&quot;
                                    </Text>
                                    <Text style={styles.waiverNote}>
                                        ⚠️ Ce choix pourra être modifié plus tard dans l&apos;espace
                                        parent.
                                    </Text>
                                    <View style={styles.waiverRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.waiverButton,
                                                waiverAccepted === true &&
                                                    styles.waiverButtonSelected,
                                            ]}
                                            onPress={() => setWaiverAccepted(true)}
                                            disabled={loading}
                                        >
                                            <Ionicons
                                                name="checkmark-circle-outline"
                                                size={18}
                                                color={waiverAccepted === true ? '#121212' : '#fff'}
                                            />
                                            <Text
                                                style={[
                                                    styles.waiverButtonText,
                                                    waiverAccepted === true &&
                                                        styles.waiverButtonTextSelected,
                                                ]}
                                            >
                                                Signer la décharge
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.waiverButton,
                                                waiverAccepted === false &&
                                                    styles.waiverButtonSelected,
                                            ]}
                                            onPress={() => setWaiverAccepted(false)}
                                            disabled={loading}
                                        >
                                            <Ionicons
                                                name="close-circle-outline"
                                                size={18}
                                                color={
                                                    waiverAccepted === false ? '#121212' : '#fff'
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.waiverButtonText,
                                                    waiverAccepted === false &&
                                                        styles.waiverButtonTextSelected,
                                                ]}
                                            >
                                                Ne pas signer maintenant
                                            </Text>
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
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
            <ReturnButton />
        </>
    );
}

// Styles : exactement les tiens d'origine + block équipe
const styles = StyleSheet.create({
    scroll: { flexGrow: 1, backgroundColor: '#121212', paddingVertical: 40, paddingHorizontal: 24 },
    container: { flex: 1, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 80, height: 80, marginBottom: 16 },
    title: {
        fontSize: 28,
        color: '#00ff88',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center' },
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
    inputIcon: { position: 'absolute', left: 15, zIndex: 1 },
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
    eyeButton: { position: 'absolute', right: 15, padding: 5 },
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
    datePickerText: { color: '#fff', fontSize: 16 },
    datePickerPlaceholder: { color: '#aaa' },
    datePickerContainer: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        marginBottom: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    iosDatePicker: { backgroundColor: 'transparent' },
    closeDatePickerButton: {
        backgroundColor: '#00ff88',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 10,
    },
    closeDatePickerText: { color: '#000', fontWeight: '600', fontSize: 16 },
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
    ageIndicatorMinor: { borderLeftWidth: 3, borderLeftColor: '#ffb100' },
    ageIndicatorMajor: { borderLeftWidth: 3, borderLeftColor: '#00ff88' },
    ageText: { fontSize: 14, fontWeight: '600' },
    waiverBlock: {
        marginBottom: 24,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffb100',
    },
    waiverTitle: { color: '#ffb100', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    waiverText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 8 },
    waiverMessage: {
        color: '#ddd',
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
        marginBottom: 8,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#ffb100',
    },
    waiverNote: { color: '#ffb100', fontSize: 13, fontWeight: '500', marginBottom: 16 },
    waiverRow: { flexDirection: 'row', gap: 12 },
    waiverButton: {
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
    waiverButtonSelected: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
    waiverButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    waiverButtonTextSelected: { color: '#121212' },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    buttonDisabled: { backgroundColor: '#555' },
    buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    loadingText: { color: '#000', fontWeight: '600', fontSize: 14 },
    backLink: { alignItems: 'center' },
    backLinkText: { color: '#00ff88', fontSize: 14, textDecorationLine: 'underline' },
    textDisabled: { opacity: 0.5 },
    equipeInfoBlock: {
        marginBottom: 18,
        backgroundColor: '#212b25',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 5,
        borderLeftColor: '#00ff88',
    },
    equipeTitle: { color: '#00ff88', fontSize: 18, fontWeight: '700', marginBottom: 3 },
    equipeLabel: { color: '#aaa', fontSize: 15 },
});
