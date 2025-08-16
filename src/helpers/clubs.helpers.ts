import { supabase } from '@/lib/supabase';

export type GetClubById = Awaited<ReturnType<typeof getClubById>>;

export const getClubById = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('clubs')
        .select('id, nom, logo_url, facebook_url, instagram_url, boutique_url')
        .eq('id', clubId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};
