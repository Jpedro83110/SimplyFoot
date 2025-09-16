import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetCoachMessagesPrivesWithJoueur = Awaited<
    ReturnType<typeof getCoachMessagesPrivesWithJoueur>
>;

export const getCoachMessagesPrivesWithJoueur = async ({
    coachId,
    joueurId,
}: {
    coachId: string;
    joueurId: string;
}) => {
    const { data, error } = await supabase
        .from('messages_prives')
        .select('id, emetteur_id, recepteur_id, texte, created_at, auteur')
        .or(`emetteur_id.eq.${coachId},recepteur_id.eq.${coachId}`)
        .or(`emetteur_id.eq.${joueurId},recepteur_id.eq.${joueurId}`)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export type GetJoueurMessagesPrivesWithCoach = Awaited<
    ReturnType<typeof getJoueurMessagesPrivesWithCoach>
>;

export const getJoueurMessagesPrivesWithCoach = async ({
    joueurId,
    equipeId,
}: {
    joueurId: string;
    equipeId: string;
}) => {
    const { data: equipeData, error: equipeError } = await supabase
        .from('equipes')
        .select('coach_id')
        .eq('id', equipeId)
        .single();

    if (equipeError) {
        throw equipeError;
    }

    if (!equipeData?.coach_id) {
        throw new Error("L'équipe n'a pas de coach associé.");
    }

    const coachId = equipeData.coach_id;

    const { data, error } = await supabase
        .from('messages_prives')
        .select('id, emetteur_id, recepteur_id, texte, created_at, auteur')
        .or(`emetteur_id.eq.${coachId},recepteur_id.eq.${coachId}`)
        .or(`emetteur_id.eq.${joueurId},recepteur_id.eq.${joueurId}`)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return { messages: data, coachId };
};

export const insertMessagePrive = async ({
    dataToInsert,
}: {
    dataToInsert: Database['public']['Tables']['messages_prives']['Insert'];
}) => {
    const { error } = await supabase.from('messages_prives').insert({
        ...dataToInsert,
        texte: dataToInsert.texte?.trim(),
    });

    if (error) {
        throw error;
    }
};

// FIXME: replace by a true ttl in bdd
export const deleteMessagesPrivesOneWeekOld = async () => {
    await supabase
        .from('messages_prives')
        .delete()
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
};
