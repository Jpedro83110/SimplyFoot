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
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReturnButton from '@/components/atoms/ReturnButton';
import Button from '@/components/atoms/Button';
import { useSession } from '@/hooks/useSession';

export default function LoginJoueur() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const { signIn } = useSession();

    // Charger email enregistré si "Se souvenir de moi"
    useEffect(() => {
        AsyncStorage.getItem('remembered-email').then((savedEmail) => {
            if (savedEmail) {
                setEmail(savedEmail);
            }
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
        if (loading) {
            return;
        }
        setLoading(true);

        try {
            await signIn({ email, password });
        } catch (error) {
            console.log('Erreur générale', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <Image source={require('../../assets/logo-v2.png')} style={styles.logo} />
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

                <Button
                    text="Se connecter"
                    onPress={handleLogin}
                    loading={loading}
                    color="primary"
                />

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

                <ReturnButton forceBackRoute="/" />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: '700',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        maxWidth: '50%', // FIXME: règle le souci de taille variable quand il y a beaucoup de caractère, je ne sais pas pourquoi
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
