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
    ScrollView,
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
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
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        justifyContent: 'center',
    },
    scrollContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
    switchText: {
        color: '#00ff88',
        marginTop: 30,
        textDecorationLine: 'underline',
        fontSize: 14,
        textAlign: 'center',
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
