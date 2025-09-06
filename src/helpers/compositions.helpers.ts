import { supabase } from '@/lib/supabase';
import { CompositionsJoueurs } from '@/types/compositions.types';

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
    clubId,
}: {
    evenementId: string;
    coachId: string;
    clubId: string;
}) => {
    const { error } = await supabase.from('compositions').insert({
        evenement_id: evenementId,
        coach_id: coachId,
        club_id: clubId,
    });

    if (error) {
        throw error;
    }
};
