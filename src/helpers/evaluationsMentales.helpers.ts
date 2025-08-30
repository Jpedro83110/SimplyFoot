import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// FIXME: bof mais required et non nullable ne fonctionne pas
export interface EvaluationsMentale {
    motivation: number;
    rigueur: number;
    ponctualite: number;
    attitude: number;
    respect: number;
}

export type GetEvaluationsMentalesByJoueur = Awaited<
    ReturnType<typeof getEvaluationsMentalesByJoueur>
>;

export const getEvaluationsMentalesByJoueur = async ({ joueurId }: { joueurId: string }) => {
    const { data, error } = await supabase
        .from('evaluations_mentales')
        .select(
            'motivation, rigueur, ponctualite, attitude, respect, utilisateurs!joueur_id(id, nom, prenom, role, joueur_id)',
        )
        .eq('joueur_id', joueurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const upsertEvaluationsMentales = async ({
    joueurId,
    coachId,
    dataToUpdate,
}: {
    joueurId: string;
    coachId: string;
    dataToUpdate: Database['public']['Tables']['evaluations_mentales']['Update'];
}) => {
    const { data, error } = await supabase
        .from('evaluations_mentales')
        .upsert(dataToUpdate)
        .eq('joueur_id', joueurId)
        .eq('coach_id', coachId)
        .select();

    if (error) {
        throw error;
    }

    return data;
};
