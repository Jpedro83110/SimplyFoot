import { useLocalSearchParams } from 'expo-router';
import { TransportDetail } from '@/components/business/TransportDetail';

type TransportDetailParams = {
    id: string;
};

export default function TransportDetailLayout() {
    const { id } = useLocalSearchParams<TransportDetailParams>();

    return <TransportDetail demandeId={id} />;
}
