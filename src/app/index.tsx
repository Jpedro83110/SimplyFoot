import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/atoms/Button';

export default function Accueil() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Image source={require('../assets/logo-v2.png')} style={styles.logoImage} />
            <Text style={styles.title}>Bienvenue sur</Text>
            <Text style={styles.logo}>Simply Foot</Text>
            <Text style={styles.subtitle}>L&apos;application des clubs de foot amateur</Text>

            <Button text="Connexion" onPress={() => router.push('/auth/login')} color="primary" />

            <View style={styles.separator} />
            <Text style={styles.text}>Pas encore de compte ? </Text>
            <Button
                text="Créer un compte Coach"
                onPress={() => router.push('/auth/inscription-coach')}
                color="secondary"
            />
            <View style={{ marginBottom: 15 }} />
            <Button
                text="Créer un compte Joueur"
                onPress={() => router.push('/auth/inscription-joueur')}
                color="secondary"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        color: '#00ff88',
        fontWeight: '600',
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginVertical: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaaaaa',
        marginBottom: 40,
    },
    logoutText: {
        color: '#00ff88',
        fontSize: 13,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        width: '80%',
        alignSelf: 'center',
        marginVertical: 20,
        marginTop: 25,
    },
    text: {
        fontSize: 13,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 15,
    },
});
