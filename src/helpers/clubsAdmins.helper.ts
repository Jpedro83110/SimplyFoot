import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetClubAdminByUserId = Awaited<ReturnType<typeof getClubAdminByUserId>>;

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

    return data;
};

export const updateClubAdmin = async (args: {
    clubAdminId: number;
    dataToUpdate: Partial<Database['public']['Tables']['clubs_admins']['Update']>;
}) => {
    const { clubAdminId, dataToUpdate } = args;

    const { error } = await supabase
        .from('clubs_admins')
        .update(dataToUpdate)
        .eq('id', clubAdminId);

    if (error) {
        throw error;
    }
};
