import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export const upsertPropositionTransport = async ({
    propisitionsTransportId,
    dataToUpdate,
}: {
    propisitionsTransportId: string | null;
    dataToUpdate: Database['public']['Tables']['propositions_transport']['Update'];
}) => {
    const { error } = await supabase
        .from('propositions_transport')
        .upsert({ ...dataToUpdate, id: propisitionsTransportId || undefined });

    if (error) {
        throw error;
    }
};

export const acceptPropositionTransport = async ({
    propositionsTransportId,
    messagesBesoinTransportId,
}: {
    propositionsTransportId: string;
    messagesBesoinTransportId: string;
}) => {
    const { error: errorOnRefuse } = await supabase
        .from('propositions_transport')
        .update({ accepte: false })
        .eq('demande_id', messagesBesoinTransportId);

    const { error: errorOnAccept } = await supabase
        .from('propositions_transport')
        .update({ accepte: true })
        .eq('id', propositionsTransportId);

    if (errorOnAccept || errorOnRefuse) {
        throw errorOnAccept || errorOnRefuse;
    }
};

export const deletePropositionTransportById = async ({
    propositionsTransportId,
}: {
    propositionsTransportId: string;
}) => {
    const { error } = await supabase
        .from('propositions_transport')
        .delete()
        .eq('id', propositionsTransportId);

    if (error) {
        throw error;
    }
};
