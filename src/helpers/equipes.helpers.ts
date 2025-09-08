import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

/**
 * FIXME: à supprimer quand on génèrera le code équipe différemment
 */
export const checkIfCodeEquipeExists = async (codeEquipe: string) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id')
        .eq('code_equipe', codeEquipe)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
};

export type GetCoachEquipes = Awaited<ReturnType<typeof getCoachEquipes>>;

export const getCoachEquipes = async ({ coachId, clubId }: { coachId: string; clubId: string }) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id, nom, categorie, code_equipe')
        .eq('coach_id', coachId)
        .eq('club_id', clubId)
        .order('categorie', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachEquipesWithJoueursCount = Awaited<
    Awaited<ReturnType<typeof getCoachEquipesWithJoueursCount>>
>;

export const getCoachEquipesWithJoueursCount = async ({
    coachId,
    clubId,
}: {
    coachId: string;
    clubId: string;
}) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id, nom, joueurs(count)')
        .eq('coach_id', coachId)
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachEquipesWithJoueurs = Awaited<
    Awaited<ReturnType<typeof getCoachEquipesWithJoueurs>>
>;

export const getCoachEquipesWithJoueurs = async ({
    coachId,
    clubId,
}: {
    coachId: string;
    clubId: string;
}) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id, nom, joueurs(utilisateurs(id, prenom, nom))')
        .eq('coach_id', coachId)
        .eq('club_id', clubId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachEquipesEvaluations = Awaited<ReturnType<typeof getCoachEquipesEvaluations>>;

export const getCoachEquipesEvaluations = async ({
    coachId,
    clubId,
}: {
    coachId: string;
    clubId: string;
}) => {
    const { data, error } = await supabase
        .from('equipes')
        .select(
            'nom, joueurs(id, utilisateurs(id, evaluations_mentales!joueur_id(note_globale, moyenne), evaluations_techniques!joueur_id(moyenne)))',
        )
        .eq('club_id', clubId)
        .eq('coach_id', coachId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetEquipeById = Awaited<ReturnType<typeof getEquipeById>>;

export const getEquipeById = async ({ equipeId }: { equipeId: string }) => {
    const { data, error } = await supabase
        .from('equipes')
        .select('id, club_id, nom, categorie, club:club_id(logo_url)')
        .eq('id', equipeId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetEquipeWithJoueurById = Awaited<ReturnType<typeof getEquipeWithJoueurById>>;

export const getEquipeWithJoueurById = async ({ equipeId }: { equipeId: string }) => {
    const { data, error } = await supabase
        .from('equipes')
        .select(
            'nom, code_equipe, joueurs!equipe_id(id, poste, numero_licence, visite_medicale_valide, equipement, photo_profil_url, utilisateurs!joueur_id(prenom, nom, date_naissance))',
        )
        .eq('id', equipeId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const insertEquipe = async ({
    dataToInsert,
}: {
    dataToInsert: Database['public']['Tables']['equipes']['Insert'];
}) => {
    const { error } = await supabase.from('equipes').insert(dataToInsert);

    if (error) {
        throw error;
    }
};

export const deleteEquipe = async ({ equipeId }: { equipeId: string }) => {
    const { error } = await supabase.from('equipes').delete().eq('id', equipeId);

    if (error) {
        throw error;
    }
};
