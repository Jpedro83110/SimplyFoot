import { supabase } from '@/lib/supabase';

export type GetCoachMessagesPrives = Awaited<ReturnType<typeof getCoachMessagesPrives>>;

export const getCoachMessagesPrives = async (args: { coachId: string }) => {
    const { coachId } = args;

    const { data, error } = await supabase
        .from('messages_prives')
        .select('id, emetteur_id, recepteur_id, texte, created_at, auteur')
        .or(`emetteur_id.eq.${coachId},recepteur_id.eq.${coachId}`)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

// FIXME: replace by a true ttl in bdd
export const deleteMessagesPrivesOneWeekOld = async () => {
    await supabase
        .from('messages_prives')
        .delete()
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
};
