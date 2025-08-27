import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// FIXME: bof mais required et non nullable ne fonctionne pas
export interface EvaluationsTechnique {
    tir: number;
    passe: number;
    centre: number;
    tete: number;
    vitesse: number;
    defense: number;
    placement: number;
    jeu_sans_ballon: number;
}

export type GetEvaluationsTechniquesByJoueur = Awaited<
    ReturnType<typeof getEvaluationsTechniquesByJoueur>
>;

export const getEvaluationsTechniquesByJoueur = async ({ joueurId }: { joueurId: string }) => {
    const { data, error } = await supabase
        .from('evaluations_techniques')
        .select(
            'tir, passe, centre, tete, vitesse, defense, placement, jeu_sans_ballon, utilisateurs!joueur_id(id, nom, prenom, role, joueur_id)',
        )
        .eq('joueur_id', joueurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const upsertEvaluationsTechniques = async ({
    joueurId,
    coachId,
    dataToUpdate,
}: {
    joueurId: string;
    coachId: string;
    dataToUpdate: Database['public']['Tables']['evaluations_techniques']['Update'];
}) => {
    const { data, error } = await supabase
        .from('evaluations_techniques')
        .upsert(dataToUpdate)
        .eq('joueur_id', joueurId)
        .eq('coach_id', coachId)
        .select();

    if (error) {
        throw error;
    }

    return data;
};
