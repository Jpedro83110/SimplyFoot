import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export const insertReponsesMessagesJoueur = async ({
    dataToInsert,
}: {
    dataToInsert: Database['public']['Tables']['reponses_messages_joueur']['Insert'];
}) => {
    const { error } = await supabase.from('reponses_messages_joueur').insert(dataToInsert);
    if (error) {
        throw error;
    }
};
