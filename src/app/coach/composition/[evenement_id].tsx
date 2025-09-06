import { useLocalSearchParams } from 'expo-router';
import { CompositionDragDrop } from '@/components/business/CompositionDragDrop';

type CompositionEvenementParams = {
    evenement_id: string;
};

export default function CompositionEvenement() {
    const { evenement_id } = useLocalSearchParams<CompositionEvenementParams>();
    return <CompositionDragDrop evenementId={evenement_id} />;
}
