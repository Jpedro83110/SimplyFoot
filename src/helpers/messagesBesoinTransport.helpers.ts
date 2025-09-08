import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetMessagesBesoinTransportAndUtilisateurByEquipeId = Awaited<
    ReturnType<typeof getMessagesBesoinTransportAndUtilisateurByEquipeId>
>;

export const getMessagesBesoinTransportAndUtilisateurByEquipeId = async ({
    equipeId,
}: {
    equipeId: string;
}) => {
    const { data, error } = await supabase
        .from('messages_besoin_transport')
        .select(
            'id, adresse_demande, heure_demande, etat, evenements(equipe_id, id, titre, date, heure, lieu, equipe_id) , utilisateurs(id, prenom, nom)',
        )
        .not('evenements', 'is', null)
        .gte('evenements.date', new Date().toISOString().split('T')[0])
        .eq('evenements.equipe_id', equipeId);

    if (error) {
        throw error;
    }

    return data;
};

export type GetMessagesBesoinTransportById = Awaited<
    ReturnType<typeof getMessagesBesoinTransportById>
>;

export const getMessagesBesoinTransportById = async ({
    messagesBesoinTransportId,
}: {
    messagesBesoinTransportId: string;
}) => {
    const { data, error } = await supabase
        .from('messages_besoin_transport')
        .select(
            'id, adresse_demande, heure_demande, etat, utilisateur_id, utilisateurs(joueur_id, nom, prenom, joueurs(decharges_generales(parent_nom, parent_prenom, accepte_transport))), evenements(titre, date, heure, equipes(coach_id)), propositions_transport(id, lieu_rdv, heure_rdv, parent_proposeur_id, accepte, parent_proposeur:parent_proposeur_id(prenom, nom), signatures_transport(id, parent1_id, parent2_id))',
        )
        .eq('id', messagesBesoinTransportId)
        .order('accepte', { referencedTable: 'propositions_transport', ascending: false })
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const updateMessageBesoinTransport = async ({
    messagesBesoinTransportId,
    dataToUpdate,
}: {
    messagesBesoinTransportId: string;
    dataToUpdate: Database['public']['Tables']['messages_besoin_transport']['Update'];
}) => {
    const { error } = await supabase
        .from('messages_besoin_transport')
        .update({ ...dataToUpdate })
        .eq('id', messagesBesoinTransportId);

    if (error) {
        throw error;
    }
};
