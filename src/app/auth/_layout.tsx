import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

export default function AuthLayout() {
    const router = useRouter();

    // 🔗 Interception des liens Supabase (type=recovery)
    useEffect(() => {
        const handleDeepLink: Linking.URLListener = (event) => {
            let url = event.url;

            if (url.includes('#')) {
                url = url.replace('#', '?');
            }

            const parsed = Linking.parse(url);
            const accessToken = parsed.queryParams?.access_token;
            const type = parsed.queryParams?.type;

            if (type === 'recovery' && accessToken) {
                router.replace({
                    pathname: '/auth/reset-password',
                    params: { access_token: accessToken },
                });
            }
        };

        // 🔄 Événement lors du clic sur un lien dans l'email
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // ⚡ Gestion du lien lors du lancement de l'app (appli fermée)
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
        };
    }, [router]);

    return (
        <View style={styles.container}>
            <Slot />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
