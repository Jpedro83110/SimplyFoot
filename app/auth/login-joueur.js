import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Switch,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReturnButton from '@/components/atoms/ReturnButton';
import Button from '@/components/atoms/Button';

export default function LoginJoueur() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Charger email enregistré si "Se souvenir de moi"
    useEffect(() => {
        AsyncStorage.getItem('remembered_email').then((savedEmail) => {
            if (savedEmail) setEmail(savedEmail);
        });
    }, []);

    // GESTION OUBLI MOT DE PASSE
    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert(
                'Erreur',
                "Entrez d'abord votre email pour recevoir un lien de réinitialisation.",
            );
            console.log(
                'Erreur',
                "Entrez d'abord votre email pour recevoir un lien de réinitialisation.",
            );
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: '/auth/reset-password', // FIXME
        });
        if (error) {
            Alert.alert('Erreur', error.message);
            console.log('Erreur', error.message);
        } else {
            Alert.alert('Vérifiez vos emails', 'Un lien de réinitialisation a été envoyé.');
            console.log('Vérifiez vos emails', 'Un lien de réinitialisation a été envoyé.');
        }
    };

    const handleLogin = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const trimmedEmail = email.trim().toLowerCase();
            const trimmedPassword = password.trim();

            // Connexion admin démo
            if (trimmedEmail === 'demo@simplyfoot.fr' && trimmedPassword === 'Demojr') {
                setLoading(false);
                Alert.alert('✅ Connexion admin', 'Bienvenue en mode administrateur complet');
                router.replace('/admin/dashboard');
                return;
            }

            // Connexion via Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: trimmedPassword,
            });

            if (authError || !authData?.user) {
                Alert.alert(
                    'Erreur',
                    authError?.message === 'Invalid login credentials'
                        ? 'Email ou mot de passe incorrect.'
                        : `Erreur : ${authError?.message || 'Connexion impossible.'}`,
                );
                setLoading(false);
                return;
            }

            // Récupération du rôle
            const { data: userData, error: userError } = await supabase
                .from('utilisateurs')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (userError || !userData?.role) {
                console.log('Erreur récupération rôle:', userError, userData);
                Alert.alert('Erreur', 'Impossible de récupérer le rôle utilisateur.');
                setLoading(false);
                return;
            }

            // Si rememberMe, on mémorise l'email
            if (rememberMe) {
                await AsyncStorage.setItem('remembered_email', trimmedEmail);
            } else {
                await AsyncStorage.removeItem('remembered_email');
            }

            // Redirection selon le rôle
            const role = userData.role;
            switch (role) {
                case 'admin':
                    router.replace('/admin/dashboard');
                    break;
                case 'president':
                    router.replace('/president/dashboard');
                    break;
                case 'coach':
                case 'staff':
                    router.replace('/coach/dashboard');
                    break;
                case 'joueur':
                case 'parent':
                    router.replace('/joueur/dashboard');
                    break;
                default:
                    Alert.alert('Erreur', `Rôle non reconnu : ${role}`);
                    break;
            }
        } catch (err) {
            console.log('Erreur générale', err);
            Alert.alert('Erreur', 'Problème de connexion, réessaie plus tard.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Connexion Joueur / Parent</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    autoCorrect={false}
                    textContentType="username"
                />

                <View style={{ width: '100%', position: 'relative', marginBottom: 5 }}>
                    <TextInput
                        style={[styles.input, { paddingRight: 44 }]}
                        placeholder="Mot de passe"
                        placeholderTextColor="#aaa"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="password"
                    />
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
                    </TouchableOpacity>
                </View>

                <View style={{ ...styles.rememberContainer, marginBottom: 20 }}>
                    <Switch
                        value={rememberMe}
                        onValueChange={setRememberMe}
                        thumbColor={rememberMe ? '#4D8065' : '#333'}
                        trackColor={{ false: '#333', true: '#4D8065' }}
                    />
                    <Text style={styles.rememberText}>Se souvenir de moi</Text>
                </View>

                <Button text="Se connecter" onPress={handleLogin} color="primary" />

                <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                <Text style={styles.text}>Pas encore de compte ? </Text>
                <Button
                    text="Créer un compte Joueur"
                    onPress={() => router.push('/auth/inscription-joueur')}
                    color="secondary"
                />

                <ReturnButton />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        flexGrow: 1,
        justifyContent: 'center',
    },
    scrollContent: {
        marginTop: 30,
    },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: '700',
        marginBottom: 30,
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
        minWidth: 300,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: 10,
        padding: 5,
        zIndex: 2,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
        maxWidth: 400,
        elevation: 2,
    },
    buttonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 18,
    },
    rememberText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 10,
    },
    forgotText: {
        color: '#00ff88',
        fontSize: 12,
        marginTop: 18,
        textAlign: 'right',
        textDecorationLine: 'underline',
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        width: '80%',
        alignSelf: 'center',
        marginVertical: 20,
        marginTop: 30,
    },
    switchText: {
        color: '#00ff88',
        textDecorationLine: 'underline',
        fontSize: 13,
        textAlign: 'center',
    },
    text: {
        fontSize: 13,
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 15,
    },
});
