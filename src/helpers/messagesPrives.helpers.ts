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
        .or(`emetteur_id.eq.${coachId},recepteur_id.eq.${joueurId}`)
        .or(`emetteur_id.eq.${joueurId},recepteur_id.eq.${coachId}`)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
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
