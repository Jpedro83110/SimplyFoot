import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetJoueurById = Awaited<ReturnType<typeof getJoueurById>>;

export const getJoueurById = async (args: { joueurId: string }) => {
    let { joueurId } = args;

    const { data, error } = await supabase
        .from('joueurs')
        .select(
            'id, equipe_id, poste, numero_licence, visite_medicale_valide, photo_url, date_naissance, equipement, photo_profil_url',
        )
        .eq('id', joueurId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetEquipeIdByUtilisateurId = Awaited<ReturnType<typeof getEquipeIdByUtilisateurId>>;

export const getEquipeIdByUtilisateurId = async (args: { utilisateurId: string }) => {
    let { utilisateurId } = args;

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(`joueurs:joueur_id(equipe_id)`)
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    }

    return data?.joueurs ? data.joueurs.equipe_id : null;
};

export type GetAccepteTransportByUtilisateurId = Awaited<
    ReturnType<typeof getAccepteTransportByUtilisateurId>
>;

export const getAccepteTransportByUtilisateurId = async (args: { utilisateurId: string }) => {
    let { utilisateurId } = args;

    const { data, error } = await supabase
        .from('utilisateurs')
        .select(`joueurs:joueur_id(decharges_generales(accepte_transport))`)
        .eq('id', utilisateurId)
        .single();

    if (error) {
        throw error;
    }

    return data?.joueurs?.decharges_generales?.length === 1
        ? (data.joueurs.decharges_generales[0].accepte_transport ?? false)
        : false;
};

export const updateJoueur = async (args: {
    joueurId: string;
    dataToUpdate: Database['public']['Tables']['joueurs']['Update'];
}) => {
    const { joueurId, dataToUpdate } = args;

    const { error } = await supabase.from('joueurs').update(dataToUpdate).eq('id', joueurId);

    if (error) {
        throw error;
    }
};
