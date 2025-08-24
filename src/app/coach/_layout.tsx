import { Slot, usePathname } from 'expo-router';
import Header from '@/components/business/Header';

export default function CoachLayout() {
    const pathname = usePathname();

    const getPageTitle = () => {
        // Gère les sous-routes, toujours basé sur le segment après 'coach'
        const pathSegments = pathname.split('/');
        const coachIndex = pathSegments.indexOf('coach');
        const page = pathSegments[coachIndex + 1];
        switch (page) {
            case 'dashboard':
                return 'Dashboard Coach';
            case 'convocation':
                return 'Convocations';
            case 'composition':
                return 'Composition';
            case 'creation-evenement':
                return 'Créer un événement';
            case 'evaluation-mentale':
                return 'Évaluation mentale';
            case 'evaluation-technique':
                return 'Évaluation technique';
            default:
                return 'Espace Coach';
        }
    };

    return (
        <>
            <Header title={getPageTitle()} showBack={pathname !== '/coach/dashboard'} />
            <Slot />
        </>
    );
}
