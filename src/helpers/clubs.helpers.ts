import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetClubById = Awaited<ReturnType<typeof getClubById>>;

export const getClubById = async ({ clubId }: { clubId: string }) => {
    const { data, error } = await supabase
        .from('clubs')
        .select(
            'id, nom, logo_url, facebook_url, instagram_url, boutique_url, adresse, site, telephone, email, abonnement_actif, code_acces',
        )
        .eq('id', clubId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachClubData = Awaited<ReturnType<typeof getCoachClubData>>;

export const getCoachClubData = async ({ clubId }: { clubId: string }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
        .from('clubs')
        .select(
            'nom, logo_url, facebook_url, instagram_url, boutique_url, equipes(id, nom, joueurs(count)), evenements(id, titre, lieu, lieu_complement, meteo, latitude, longitude, date, heure, participations_evenement(reponse, besoin_transport)), stages(id)',
        )
        .eq('id', clubId)
        .gte('evenements.date', yesterday.toISOString().split('T')[0])
        .order('date', { referencedTable: 'evenements', ascending: true })
        .limit(1, { referencedTable: 'evenements' })
        .limit(1, { referencedTable: 'stages' })
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const updateClub = async ({
    clubId,
    club,
}: {
    clubId: string;
    club: Database['public']['Tables']['clubs']['Update'];
}) => {
    const { error } = await supabase.from('clubs').update(club).eq('id', clubId);

    if (error) {
        throw error;
    }
};
