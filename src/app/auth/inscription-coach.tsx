import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp, supabase } from '../../lib/supabase';
import { setupNotifications, initializeNotificationsForUser } from '../../lib/notifications';
import ReturnButton from '@/components/atoms/ReturnButton';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import InputDate from '@/components/molecules/InputDate';
import { calculateAge, formatDateToYYYYMMDD } from '@/utils/date.utils';
import { useSession } from '@/hooks/useSession';

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

export default function InscriptionCoach() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [codeClub, setCodeClub] = useState('');
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');

    // Date de naissance avec valeur par défaut plus appropriée pour un coach (35 ans)
    const [dateNaissance, setDateNaissance] = useState(new Date(1989, 0, 1));
    const [diplome, setDiplome] = useState(false);
    const [niveauDiplome, setNiveauDiplome] = useState('');
    const [experience, setExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
    const [notificationsInitializing, setNotificationsInitializing] = useState(false);

    const { signIn } = useSession();

    // 🎂 Calcul automatique de l'âge
    useEffect(() => {
        try {
            const age = calculateAge(dateNaissance);
            console.log('📅 Date coach sélectionnée:', dateNaissance);
            console.log('🎂 Âge coach calculé:', age);
            setCalculatedAge(age);
        } catch (error) {
            console.error('❌ Erreur calcul âge coach:', error);
            setCalculatedAge(null);
        }
    }, [dateNaissance]);

    const handleDateChange = (date?: Date) => {
        if (!date) {
            return;
        }

        const today = new Date();
        if (date > today) {
            Alert.alert('Erreur', 'La date de naissance ne peut pas être dans le futur.');
            return;
        }

        const age = calculateAge(date);
        if (age < 16) {
            Alert.alert('Erreur', 'Un coach doit avoir au moins 16 ans.');
            return;
        }

        if (age > 100) {
            Alert.alert('Erreur', 'Âge non valide (plus de 100 ans).');
            return;
        }

        setDateNaissance(date);
    };

    // 🔍 Validation complète des champs
    const isFormValid = useMemo(() => {
        // Email
        if (!email.trim()) {
            return false;
        }

        if (!isValidEmail(email.trim())) {
            return false;
        }

        // Mots de passe
        if (!password) {
            return false;
        }

        if (password.length < 6) {
            return false;
        }

        if (password !== confirmPassword) {
            return false;
        }

        // Autres champs obligatoires
        if (!codeClub.trim()) {
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

        // Date de naissance
        if (!dateNaissance) {
            return false;
        }

        const today = new Date();
        if (dateNaissance >= today) {
            return false;
        }

        const age = calculateAge(dateNaissance);
        if (age < 16) {
            return false;
        }

        // Validation diplôme
        if (diplome && !niveauDiplome.trim()) {
            return false;
        }

        return true;
    }, [
        codeClub,
        confirmPassword,
        dateNaissance,
        diplome,
        email,
        niveauDiplome,
        nom,
        password,
        prenom,
        telephone,
    ]);

    // 🔔 Initialiser les notifications après inscription
    const initializeNotifications = async (userId: string) => {
        try {
            setNotificationsInitializing(true);
            console.log('🔔 Initialisation notifications coach...');

            const { token } = await initializeNotificationsForUser(userId);

            if (token) {
                console.log('✅ Notifications coach configurées avec succès');
                return token;
            } else {
                console.warn('⚠️ Notifications coach non configurées');
                return null;
            }
        } catch (error) {
            console.error('❌ Erreur initialisation notifications coach:', error);
            return null;
        } finally {
            setNotificationsInitializing(false);
        }
    };

    // 🚀 Inscription principale
    const handleInscription = async () => {
        if (!isFormValid) {
            return;
        }

        setLoading(true);

        try {
            console.log('🚀 Début inscription coach...');
            console.log('👤 Âge coach:', calculatedAge, 'ans');

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

            console.log('✅ Club trouvé pour coach:', clubData.nom);

            // 2. Création du compte Auth
            const signUpData = await signUp({
                email: email,
                password: password,
            });

            const userId = signUpData.user.id;
            console.log('✅ Compte auth coach créé:', userId);

            // 3. Générer le token de notification
            const expoPushToken = await setupNotifications();
            console.log('🔔 Token notifications coach généré:', expoPushToken);

            // 4. Insertion dans la table utilisateurs
            const dateNaissanceISO = formatDateToYYYYMMDD(dateNaissance);
            const { error: insertUserError } = await supabase.from('utilisateurs').insert({
                id: userId,
                email: email.trim().toLowerCase(),
                nom: nom.trim(),
                prenom: prenom.trim(),
                club_id: clubData.id,
                role: 'coach',
                expo_push_token: expoPushToken,
                date_creation: new Date().toISOString(),
                date_naissance: dateNaissanceISO,
            });

            if (insertUserError) {
                console.error('❌ Erreur insertion utilisateur coach:', insertUserError);
                Alert.alert('Erreur', 'Utilisateur créé mais insertion incomplète (utilisateurs).');
                return;
            }

            console.log('✅ Utilisateur coach inséré dans la base');

            // 5. Insertion dans la table staff avec informations complètes
            const staffData = {
                utilisateur_id: userId,
                club_id: clubData.id,
                nom: nom.trim(),
                prenom: prenom.trim(),
                email: email.trim().toLowerCase(),
                telephone: telephone.trim(),
                date_naissance: dateNaissanceISO,
                diplome: diplome,
                ...(diplome && niveauDiplome.trim() && { niveau_diplome: niveauDiplome.trim() }),
                ...(experience.trim() && { experience: experience.trim() }),
                statut: 'actif',
                date_embauche: new Date().toISOString(),
            };

            console.log('📅 Date de naissance coach formatée:', dateNaissanceISO);

            const { data: insertedStaff, error: insertStaffError } = await supabase
                .from('staff')
                .insert(staffData)
                .select('id')
                .single();

            if (insertStaffError) {
                console.error('❌ Erreur insertion staff:', insertStaffError);
                Alert.alert(
                    'Erreur',
                    'Utilisateur enregistré, mais profil coach non créé.\n\nMerci de contacter le support !',
                );
                return;
            }

            const staffId = insertedStaff.id;
            console.log('✅ Profil staff créé avec ID:', staffId);

            // 6. Finaliser les notifications
            if (expoPushToken) {
                await initializeNotifications(userId);
            }

            // 7. Succès !
            console.log('🎉 Inscription coach terminée avec succès');

            const ageInfo = ` (${calculatedAge} ans)`;
            const diplomeInfo = diplome
                ? `\n🎓 Diplômé: ${niveauDiplome || 'Oui'}`
                : '\n📚 Non diplômé pour le moment';
            const experienceInfo = experience.trim() ? `\n💼 Expérience: ${experience.trim()}` : '';

            Alert.alert(
                'Inscription réussie ! 🎉',
                `Bienvenue Coach ${prenom} dans le club ${clubData.nom} !${ageInfo}\n\n${expoPushToken ? '🔔 Notifications activées' : ''}${diplomeInfo}${experienceInfo}`,
                [
                    {
                        text: 'Accéder à mon espace',
                        onPress: () => router.replace('/coach/dashboard'),
                        style: 'default',
                    },
                ],
            );

            await signIn({ email, password });
        } catch (error) {
            console.error('❌ Erreur inscription coach générale:', error);
            Alert.alert('Erreur', "Une erreur inattendue s'est produite. Veuillez réessayer.");
        } finally {
            setLoading(false);
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
                    <Text style={styles.title}>Créer un compte Coach</Text>
                    <Text style={styles.subtitle}>
                        Rejoignez votre club en tant qu&apos;encadrant
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Formulaire */}
                    <View style={styles.form}>
                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color="#888"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email professionnel"
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

                        {/* Code Club */}
                        <View style={styles.inputGroup}>
                            <Ionicons
                                name="key-outline"
                                size={20}
                                color="#888"
                                style={styles.inputIcon}
                            />
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

                        {/* Téléphone */}
                        <View style={styles.inputGroup}>
                            <Ionicons
                                name="call-outline"
                                size={20}
                                color="#888"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Téléphone professionnel"
                                placeholderTextColor="#aaa"
                                value={telephone}
                                onChangeText={setTelephone}
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                editable={!loading && !notificationsInitializing}
                            />
                        </View>

                        {/* Date de naissance - Rendu adaptatif web/mobile */}
                        <InputDate
                            value={dateNaissance}
                            onChange={handleDateChange}
                            placeholder="Date de naissance"
                            maximumDate={new Date()}
                        />

                        {/* Indicateur âge */}
                        {calculatedAge !== null && (
                            <View style={styles.ageIndicator}>
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#00ff88"
                                />
                                <Text style={[styles.ageText, { color: '#00ff88' }]}>
                                    {calculatedAge} ans - Âge validé pour encadrer
                                </Text>
                            </View>
                        )}

                        {/* Section Diplômes et formations */}
                        <View style={styles.diplomaSection}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="school-outline" size={16} color="#00ff88" />{' '}
                                Formations et diplômes
                            </Text>

                            {/* Switch diplômé */}
                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Diplômé(e) en sport/football</Text>
                                <Switch
                                    value={diplome}
                                    onValueChange={setDiplome}
                                    thumbColor={diplome ? '#00ff88' : '#555'}
                                    trackColor={{ false: '#333', true: '#00ff8850' }}
                                    disabled={loading || notificationsInitializing}
                                />
                            </View>

                            {/* Niveau de diplôme (si diplômé) */}
                            {diplome && (
                                <View style={styles.inputGroup}>
                                    <Ionicons
                                        name="ribbon-outline"
                                        size={20}
                                        color="#888"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Niveau de diplôme (ex: BEES, DES, BMF...)"
                                        placeholderTextColor="#aaa"
                                        value={niveauDiplome}
                                        onChangeText={setNiveauDiplome}
                                        editable={!loading && !notificationsInitializing}
                                    />
                                </View>
                            )}

                            {/* Expérience */}
                            <View style={styles.inputGroup}>
                                <Ionicons
                                    name="time-outline"
                                    size={20}
                                    color="#888"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Expérience (ex: 5 ans en club amateur)"
                                    placeholderTextColor="#aaa"
                                    value={experience}
                                    onChangeText={setExperience}
                                    editable={!loading && !notificationsInitializing}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Button
                style={{ marginTop: 20 }}
                text="Créer mon compte Coach"
                onPress={handleInscription}
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
        borderLeftWidth: 3,
        borderLeftColor: '#00ff88',
    },
    ageText: {
        fontSize: 14,
        fontWeight: '600',
    },
    diplomaSection: {
        marginBottom: 24,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    sectionTitle: {
        color: '#00ff88',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 8,
    },
    switchLabel: {
        color: '#fff',
        fontSize: 15,
        flex: 1,
        marginRight: 12,
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
