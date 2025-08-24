import { Slot, usePathname } from 'expo-router';
import Header from '@/components/business/Header';

export default function PresidentLayout() {
    const pathname = usePathname();

    const getPageTitle = () => {
        const pathSegments = pathname.split('/');
        const presidentIndex = pathSegments.indexOf('president');
        const page = pathSegments[presidentIndex + 1];
        switch (page) {
            case 'dashboard':
                return 'Mon Club';
            case 'membres':
                return 'Liste des membres';
            case 'budget':
                return 'Budget du club';
            case 'stages':
                return 'Programme de stage';
            case 'infos-publiques-club':
                return 'Infos publiques';
            default:
                return 'Espace Président';
        }
    };

    return (
        <>
            <Header title={getPageTitle()} showBack={pathname !== '/president/dashboard'} />
            <Slot />
        </>
    );
}
