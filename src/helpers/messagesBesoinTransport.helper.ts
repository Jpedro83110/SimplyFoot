import { supabase } from '@/lib/supabase';

export type GetMessagesBesoinTransportAndUtilisateurByEquipeId = Awaited<
    ReturnType<typeof getMessagesBesoinTransportAndUtilisateurByEquipeId>
>;

export const getMessagesBesoinTransportAndUtilisateurByEquipeId = async (args: {
    equipeId: string;
}) => {
    let { equipeId } = args;

    const { data, error } = await supabase
        .from('messages_besoin_transport')
        .select(
            `id, adresse_demande, heure_demande, etat, evenements:evenement_id(equipe_id, id, titre, date, heure, lieu, equipe_id) , utilisateurs:utilisateur_id(id, prenom, nom)`,
        )
        .not('evenements', 'is', null)
        .eq('evenements.equipe_id', equipeId);

    if (error) {
        throw error;
    }

    return data;
};
