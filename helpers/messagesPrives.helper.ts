import { supabase } from '@/lib/supabase';

// FIXME: replace by a true ttl in bdd
export const deleteMessagesPrivesOneWeekOld = async () => {
    await supabase
        .from('messages_prives')
        .delete()
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
};
