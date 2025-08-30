import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

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
        .select('id, nom, joueurs(utilisateurs:joueur_id(id, prenom, nom))')
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
            'nom, joueurs:equipe_id(id, utilisateurs(id, evaluations_mentales!joueur_id(note_globale, moyenne), evaluations_techniques!joueur_id(moyenne)))',
        )
        .eq('club_id', clubId)
        .eq('coach_id', coachId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetJoueurEquipeById = Awaited<ReturnType<typeof getJoueurEquipeById>>;

export const getJoueurEquipeById = async (equipeId: string) => {
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
