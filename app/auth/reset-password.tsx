import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
    const router = useRouter();
    const { access_token } = useLocalSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!access_token) {
            Alert.alert('Lien invalide ou expiré');
            router.replace('/auth/login-joueur');
        } else {
            supabase.auth.setSession({
                access_token: access_token as string,
                refresh_token: '',
            });
        }
    }, [access_token]);

    const handleSubmit = async () => {
        if (password.length < 6) {
            Alert.alert('Mot de passe trop court');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            Alert.alert('Succès', 'Mot de passe modifié. Vous pouvez vous connecter.');
            // Je me déconnecte l'utilisateur après la réinitialisation du mot de passe
            await supabase.auth.signOut();
            router.replace('/');
        }
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.form}>
                    <Text style={styles.title}>Nouveau mot de passe</Text>
                    <View style={styles.inputGroup}>
                        <TextInput
                            style={[styles.input, { paddingRight: 44 }]}
                            placeholder="Nouveau mot de passe"
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
                    <View style={styles.inputGroup}>
                        <TextInput
                            style={[styles.input, { paddingRight: 44 }]}
                            placeholder="Confirmez le mot de passe"
                            placeholderTextColor="#aaa"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="password"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#000" />
                            : <Text style={styles.buttonText}>Valider</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        marginTop: 50,
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
        borderWidth: 1,
        borderColor: '#333',
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
        elevation: 2,
    },
    buttonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 14,
        position: 'relative',
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: 13,
        padding: 5,
        zIndex: 2,
    },
    form: {
        width: '100%',
        maxWidth: 380,
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(30,30,30,0.85)',
        borderRadius: 18,
        padding: 26,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 2,
    },
});
