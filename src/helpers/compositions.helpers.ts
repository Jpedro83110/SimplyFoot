import { supabase } from '@/lib/supabase';
import { CompositionsJoueurs } from '@/types/compositions.types';
import { Database } from '@/types/database.types';

export const updateMatchCompositions = async ({
    compositionId,
    joueurs,
}: {
    compositionId: string;
    joueurs: CompositionsJoueurs;
}) => {
    const { error } = await supabase
        .from('compositions')
        .update({
            joueurs: JSON.stringify(joueurs),
        })
        .eq('id', compositionId);

    if (error) {
        throw error;
    }
};

export const createMatchCompositions = async ({
    evenementId,
    coachId,
}: {
    evenementId: string;
    coachId: string;
}) => {
    // to ensure that there is all required fields
    const dataToInsert: Database['public']['Tables']['compositions']['Insert'] = {
        evenement_id: evenementId,
        coach_id: coachId,
        is_masked: false,
    };

    const { error } = await supabase.from('compositions').insert(dataToInsert);

    if (error) {
        throw error;
    }
};
