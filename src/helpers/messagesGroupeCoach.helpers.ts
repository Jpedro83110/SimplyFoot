import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetMessagesGroupeCoach = Awaited<ReturnType<typeof getMessagesGroupeCoach>>;

export const getMessagesGroupeCoach = async ({ equipeId }: { equipeId: string }) => {
    const { data, error } = await supabase
        .from('messages_groupe_coach')
        .select('id, titre, contenu, created_at, reponses_messages_joueur(texte)')
        .eq('equipe_id', equipeId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
        throw error;
    }

    return data;
};

export const insertMessageGroupeCoach = async ({
    dataToInsert,
}: {
    dataToInsert: Database['public']['Tables']['messages_groupe_coach']['Insert'];
}) => {
    const { error } = await supabase.from('messages_groupe_coach').insert(dataToInsert);
    if (error) {
        throw error;
    }
};

// FIXME: replace by a true ttl in bdd
export const deleteMessagesGroupeCoachOneWeekOld = async () => {
    await supabase
        .from('messages_groupe_coach')
        .delete()
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
};
