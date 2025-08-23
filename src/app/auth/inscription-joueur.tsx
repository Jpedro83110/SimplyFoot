import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp, supabase } from '@/lib/supabase';
import { setupNotifications, initializeNotificationsForUser } from '@/lib/notifications';
import { Ionicons } from '@expo/vector-icons';
import ReturnButton from '@/components/atoms/ReturnButton';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { Database } from '@/types/database.types';
import InputDate from '@/components/molecules/InputDate';
import { calculateAge, formatDateToYYYYMMDD } from '@/utils/date.utils';
import { useSession } from '@/hooks/useSession';

// Utils
function isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone: string) {
    const phoneRegex = /^[0-9+\s\-\.()]{8,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

export default function InscriptionJoueur() {
    const router = useRouter();

    // Champs utilisateur
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [codeEquipe, setCodeEquipe] = useState('');
    const [equipeData, setEquipeData] = useState<
        Database['public']['Tables']['equipes']['Insert'] | null
    >(null); // FIXME
    const [coachData, setCoachData] = useState<
        Database['public']['Tables']['staff']['Insert'] | null
    >(null); // FIXME
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');
    const [postes, setPostes] = useState('');

    // Champs parent si mineur
    const [nomParent, setNomParent] = useState('');
    const [prenomParent, setPrenomParent] = useState('');
    const [telephoneParent, setTelephoneParent] = useState('');

    const [dateNaissance, setDateNaissance] = useState<Date>(new Date(2020, 0, 1));
    const [waiverAccepted, setWaiverAccepted] = useState<boolean | null>(null);

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isMinor, setIsMinor] = useState(false);
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

    const { signIn } = useSession();

    // Fetch équipe + coach dès que codeEquipe rempli
    useEffect(() => {
        if (!codeEquipe || codeEquipe.length !== 6) {
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
        if (age > 100) {
            Alert.alert('Erreur', 'Âge non valide (plus de 100 ans).');
            return;
        }

        setDateNaissance(date);
    };

    // Validation
    const isFormValid = useMemo(() => {
        const newErrors: any = {}; // FIXME

        if (email.trim() !== '' && !isValidEmail(email.trim())) {
            newErrors.email = true;
        }
        if (password !== '' && password.length < 6) {
            newErrors.password = true;
        }
        if (password !== '' && password !== confirmPassword) {
            newErrors.confirmPassword = true;
        }
        if (codeEquipe.trim() !== '' && !equipeData) {
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
            if (telephoneParent.trim() !== '' && !isValidPhone(telephoneParent.trim())) {
                newErrors.telephoneParent = true;
            }
            if (waiverAccepted === null) {
                newErrors.waiverAccepted = true;
            }
        } else {
            if (telephone.trim() !== '' && !isValidPhone(telephone.trim())) {
                newErrors.telephone = true;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [
        email,
        password,
        confirmPassword,
        codeEquipe,
        equipeData,
        nom,
        prenom,
        dateNaissance,
        isMinor,
        nomParent,
        prenomParent,
        telephoneParent,
        waiverAccepted,
        telephone,
    ]);

    // 🚀 Inscription
    const handleInscription = async () => {
        setLoading(true);

        try {
            // 1. Crée Auth
            const signUpData = await signUp({
                email: email,
                password: password,
            });

            const userId = signUpData.user.id;

            // 2. Notifications
            let expoPushToken = null;
            try {
                expoPushToken = await setupNotifications();
            } catch {}

            // 3. Crée Utilisateur
            const dateNaissanceISO = formatDateToYYYYMMDD(dateNaissance);
            const { error: insertUserError } = await supabase.from('utilisateurs').insert({
                id: userId,
                email: email.trim().toLowerCase(),
                nom: nom.trim(),
                prenom: prenom.trim(),
                club_id: equipeData?.club_id,
                role: 'joueur',
                expo_push_token: expoPushToken,
                date_creation: new Date().toISOString(),
                date_naissance: dateNaissanceISO,
            });
            if (insertUserError) {
                Alert.alert('Erreur', 'Utilisateur créé mais insertion incomplète (utilisateurs).');
                setLoading(false);
                return;
            }

            // 4. Crée Joueur
            let joueurData = {
                equipe_id: equipeData?.id,
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
                `Bienvenue ${prenom} dans l'équipe ${equipeData?.nom} !`,
                [
                    {
                        text: 'Accéder à mon espace',
                        onPress: () => router.replace('/joueur/dashboard'),
                    },
                ],
            );

            await signIn({ email, password });
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Image source={require('../../assets/logo-v2.png')} style={styles.logo} />
                    <Text style={styles.title}>Créer un compte Joueur</Text>
                    <Text style={styles.subtitle}>Rejoignez votre club sur Simply Foot</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
                        {/* EMAIL */}
                        <Input
                            icon="mail-outline"
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            editable={!loading}
                            mandatory
                            error={errors.email ? "L'email n'est pas valide" : false}
                        />
                        {/* PASSWORD */}
                        <Input
                            icon="lock-closed-outline"
                            placeholder="Mot de passe"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            showToggle
                            show={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                            textContentType="newPassword"
                            editable={!loading}
                            mandatory
                            error={
                                errors.password
                                    ? 'Le mot de passe doit contenir au moins 6 caractères'
                                    : false
                            }
                        />
                        {/* CONFIRM PASSWORD */}
                        <Input
                            icon="lock-closed-outline"
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            showToggle
                            show={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                            textContentType="newPassword"
                            editable={!loading}
                            mandatory
                            error={
                                errors.confirmPassword ? 'Le mot de passe ne correspond pas' : false
                            }
                        />
                        {/* CODE EQUIPE */}
                        <Input
                            icon="key-outline"
                            placeholder="Code Équipe"
                            value={codeEquipe}
                            onChangeText={setCodeEquipe}
                            autoCapitalize="characters"
                            editable={!loading}
                            mandatory
                            error={errors.codeEquipe ? "Le code équipe n'est pas valide" : false}
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
                            placeholder="Nom du joueur"
                            value={nom}
                            onChangeText={setNom}
                            textContentType="familyName"
                            editable={!loading}
                            mandatory
                        />
                        <Input
                            icon="person-outline"
                            placeholder="Prénom du joueur"
                            value={prenom}
                            onChangeText={setPrenom}
                            textContentType="givenName"
                            editable={!loading}
                            mandatory
                        />

                        {/* DATE DE NAISSANCE */}
                        <InputDate
                            value={dateNaissance}
                            onChange={handleDateChange}
                            placeholder="Date de naissance"
                            maximumDate={new Date()}
                        />

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
                                placeholder="Votre téléphone"
                                value={telephone}
                                onChangeText={setTelephone}
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                editable={!loading}
                                mandatory
                                error={
                                    errors.telephone
                                        ? "Le numéro de téléphone n'est pas valide"
                                        : false
                                }
                            />
                        )}
                        {isMinor && (
                            <>
                                <Input
                                    icon="person-outline"
                                    placeholder="Nom du parent / tuteur"
                                    value={nomParent}
                                    onChangeText={setNomParent}
                                    editable={!loading}
                                    mandatory
                                />
                                <Input
                                    icon="person-outline"
                                    placeholder="Prénom du parent / tuteur"
                                    value={prenomParent}
                                    onChangeText={setPrenomParent}
                                    editable={!loading}
                                    mandatory
                                />
                                <Input
                                    icon="call-outline"
                                    placeholder="Téléphone du parent / tuteur"
                                    value={telephoneParent}
                                    onChangeText={setTelephoneParent}
                                    keyboardType="phone-pad"
                                    textContentType="telephoneNumber"
                                    editable={!loading}
                                    mandatory
                                    error={
                                        errors.telephoneParent
                                            ? "Le numéro de téléphone du parent / tuteur n'est pas valide"
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
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Button
                style={{ marginTop: 20 }}
                text="Créer mon compte"
                onPress={handleInscription}
                loading={loading}
                disabled={!isFormValid}
                color="primary"
            />
            <ReturnButton style={{ marginBottom: 24 }} forceBackRoute="/auth/login-joueur" />
        </>
    );
}

// Styles : exactement les tiens d'origine + block équipe
const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
    },
    container: {
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
    subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center' },
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
        marginBottom: 6,
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
