import React, { useState } from 'react';
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
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import ReturnButton from '@/components/atoms/ReturnButton';
import Button from '@/components/atoms/Button';
import { useSession } from '@/hooks/useSession';

export default function LoginClub() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { signIn } = useSession();

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert(
                'Erreur',
                "Entrez d'abord votre email pour recevoir un lien de réinitialisation.",
            );
            alert('Veuillez entrer votre email pour recevoir un lien de réinitialisation.'); //FIXME: Toast notification
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            Alert.alert('Vérifiez vos emails', 'Un lien de réinitialisation a été envoyé.');
            alert('Vérifiez vos emails, Un lien de réinitialisation a été envoyé.'); //FIXME: Toast notification
        }
    };

    const handleLogin = async () => {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
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
                <Text style={styles.title}>Connexion Club</Text>
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

                <View style={{ width: '100%', position: 'relative', marginBottom: 15 }}>
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

                <Button
                    text="Se connecter"
                    onPress={handleLogin}
                    loading={loading}
                    color="primary"
                />

                <View style={styles.forgotContainer}>
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.separator} />
                <Button
                    text="Créer un compte Coach"
                    onPress={() => router.push('/auth/inscription-coach')}
                    color="secondary"
                />
                <View style={{ marginBottom: 15 }} />
                <Button
                    text="Créer un nouveau Club (Président)"
                    onPress={() => router.push('/auth/inscription-president')}
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
    forgotContainer: {
        width: '100%',
        alignItems: 'flex-end',
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
});
