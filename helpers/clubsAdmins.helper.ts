import { supabase } from '@/lib/supabase';
import { PublicClubAdmin } from '@/types/ClubAdmin';

export const getClubAdminByUserId = async (args: { userId: string }) => {
    const { userId } = args;

    const { data, error } = await supabase
        .from('clubs_admins')
        .select('id, club_id, date_added')
        .eq('user_id', userId)
        .single();

    if (error) {
        throw error;
    }

    return data as PublicClubAdmin;
};
