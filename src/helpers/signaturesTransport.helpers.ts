import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { updateMessageBesoinTransport } from './messagesBesoinTransport.helpers';
import { MessagesBesoinTransportEtat } from '@/types/messagesBesoinTransport.types';

export const upsertSignatureTransport = async ({
    messagesBesoinTransportId,
    dataToUpdate,
}: {
    messagesBesoinTransportId: string;
    dataToUpdate: Database['public']['Tables']['signatures_transport']['Update'];
}) => {
    const { data, error } = await supabase
        .from('signatures_transport')
        .upsert(dataToUpdate, { onConflict: 'proposition_id, parent1_id, parent2_id' })
        .select('parent1_id, parent2_id')
        .single();

    if (error) {
        throw error;
    }

    if (data.parent1_id && data.parent2_id) {
        const etat: MessagesBesoinTransportEtat = 'signe';

        await updateMessageBesoinTransport({
            messagesBesoinTransportId,
            messageBesoinTransport: { etat },
        });
    }
};
