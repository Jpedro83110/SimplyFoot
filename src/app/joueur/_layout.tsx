import { Slot, usePathname } from 'expo-router';
import Header from '@/components/business/Header';

export default function JoueurLayout() {
    const pathname = usePathname();

    const getPageTitle = () => {
        const pathSegments = pathname.split('/');
        const joueurIndex = pathSegments.indexOf('joueur');
        const page = pathSegments[joueurIndex + 1];
        switch (page) {
            case 'dashboard':
                return 'Dashboard Joueur';
            case 'convocation':
                return 'Convocations';
            case 'evenements':
                return 'Événements';
            default:
                return 'Espace Joueur';
        }
    };

    return (
        <>
            <Header title={getPageTitle()} showBack={pathname !== '/joueur/dashboard'} />
            <Slot />
        </>
    );
}
