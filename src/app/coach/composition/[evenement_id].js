import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CompositionDragDrop from '../../../components/business/CompositionDragDrop';

export default function CompositionEvenement() {
    const { evenement_id } = useLocalSearchParams();
    return <CompositionDragDrop evenementId={evenement_id} />;
}
