import { useSession } from '@/hooks/useSession';
import { SplashScreen } from 'expo-router';

export default function SplashScreenController() {
    const { isLoading } = useSession();

    if (!isLoading) {
        SplashScreen.hideAsync();
    }

    return null;
}
