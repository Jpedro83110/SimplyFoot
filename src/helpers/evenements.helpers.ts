import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type GetCoachEvenementsByEquipes = Awaited<ReturnType<typeof getCoachEvenementsByEquipes>>;

export const getCoachEvenementsByEquipes = async ({
    coachId,
    since,
}: {
    coachId: string;
    since?: Date;
}) => {
    let request = supabase
        .from('equipes')
        .select(
            'nom, categorie, evenements!equipe_id(id, type, titre, lieu, lieu_complement, date, heure, description, utilisateurs:created_by(prenom, nom))',
        )
        .eq('coach_id', coachId); // id from utilisateurs table

    if (since) {
        request = request.gte('evenements.date', since.toISOString().split('T')[0]);
    }

    const { data, error } = await request.order('date', {
        referencedTable: 'evenements',
        ascending: true,
    });

    if (error) {
        throw error;
    }

    return data;
};

export type GetCoachEvenements = Awaited<ReturnType<typeof getCoachEvenements>>;

export const getCoachEvenements = async ({ coachId, since }: { coachId: string; since?: Date }) => {
    const equipes = await getCoachEvenementsByEquipes({ coachId, since });

    const evenements = equipes?.flatMap((equipe) =>
        equipe.evenements.map((evenement) => ({
            ...evenement,
        })),
    );

    return evenements.sort((a, b) =>
        a.date && b.date ? (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) : 0,
    );
};

export type GetCoachEvenementsHasComposition = Awaited<
    ReturnType<typeof getCoachEvenementsHasComposition>
>;

export const getCoachEvenementsHasComposition = async ({
    coachId,
    since,
}: {
    coachId: string;
    since?: Date;
}) => {
    // FIXME: à optimiser avec un count des compositions
    let request = supabase
        .from('equipes')
        .select(
            'evenements!equipe_id(id, titre, date, heure, lieu, utilisateurs:created_by(id), compositions:evenement_id(id))',
        )
        .eq('coach_id', coachId); // id from utilisateurs table

    if (since) {
        request = request.gte('date', since.toISOString().split('T')[0]);
    }

    const { data, error } = await request.order('date', { ascending: true });

    if (error) {
        throw error;
    }

    return data.flatMap((equipe) =>
        equipe.evenements.map((evenement) => ({
            ...evenement,
            hasCompo: (evenement.compositions?.length ?? 0) > 0,
        })),
    );
};

export type GetEvenementsByClubId = Awaited<ReturnType<typeof getEvenementsByClubId>>;

export const getEvenementsByClubId = async ({
    clubId,
    since,
}: {
    clubId: string;
    since?: Date;
}) => {
    let request = supabase
        .from('evenements')
        .select(
            'id, type, titre, lieu, lieu_complement, date, heure, description, utilisateurs:created_by(prenom, nom)',
        )
        .eq('club_id', clubId);

    if (since) {
        request = request.gte('date', since.toISOString().split('T')[0]);
    }

    const { data, error } = await request.order('date', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export type GetEvenementInfosByUtilisateurId = Awaited<
    ReturnType<typeof getEvenementInfosByUtilisateurId>
>;

export const getEvenementInfosByUtilisateurId = async (args: {
    evenementId: string;
    utilisateurId: string;
}) => {
    let { evenementId, utilisateurId } = args;

    const { data, error } = await supabase
        .from('evenements')
        .select(
            `id, titre, date, heure, lieu, lieu_complement, meteo, latitude, longitude, participations_evenement(id, besoin_transport, reponse, utilisateurs!utilisateur_id(id, prenom, nom, joueurs:joueur_id(decharges_generales(accepte_transport)))), messages_besoin_transport(id, etat, adresse_demande, heure_demande, signature_demandeur, signature_conducteur, utilisateurs:utilisateur_id(id, prenom, nom))`,
        )
        // .neq('messages_besoin_transport.utilisateur_id', utilisateurId)
        .eq('participations_evenement.utilisateur_id', utilisateurId)
        .eq('id', evenementId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetEvenementInfosById = Awaited<ReturnType<typeof getEvenementInfosById>>;

export const getEvenementInfosById = async ({ evenementId }: { evenementId: string }) => {
    const { data, error } = await supabase
        .from('evenements')
        .select(
            `titre, date, heure, lieu, participations_evenement(id, reponse, besoin_transport, transport_valide_par, lieu_rdv, heure_rdv, utilisateurs!utilisateur_id(nom, prenom, email, telephone, joueurs:joueur_id(poste)))`,
        )
        .eq('id', evenementId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export type GetEquipeEvenementBesoinsTransport = Awaited<
    ReturnType<typeof getEquipeEvenementBesoinsTransport>
>;

export const getEquipeEvenementBesoinsTransport = async ({
    equipeId,
    since,
}: {
    equipeId: string;
    since?: Date;
}) => {
    let request = supabase
        .from('evenements')
        .select(
            'id, titre, lieu, date, messages_besoin_transport(id, adresse_demande, heure_demande, etat, utilisateurs(prenom, nom, joueurs(decharges_generales(parent_prenom, parent_nom, accepte_transport))))',
        )
        .eq('equipe_id', equipeId);

    if (since) {
        request = request.gte('date', since.toISOString().split('T')[0]);
    }

    const { data, error } = await request.order('date', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

export type GetTeamList = Awaited<ReturnType<typeof getTeamList>>;

export const getTeamList = async ({ evenementId }: { evenementId: string }) => {
    const { data, error } = await supabase
        .from('evenements')
        .select(
            'date, lieu, adversaires, compositions:evenement_id(id), equipes:equipe_id(nom, categorie, joueurs(id, numero_licence, utilisateurs(nom, prenom, date_naissance)))',
        )
        .eq('id', evenementId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const createEvenement = async ({
    dataToInsert,
    joueursId,
}: {
    dataToInsert: Database['public']['Tables']['evenements']['Insert'];
    joueursId: string[];
}) => {
    // FIXME: change db schema to make equipe_id not nullable
    if (!dataToInsert.equipe_id) {
        throw new Error('equipe_id is required to create an evenement');
    }

    const { data: insertedEvenement, error: insertEvenementError } = await supabase
        .from('evenements')
        .insert(dataToInsert)
        .select('id')
        .single();

    if (insertEvenementError) {
        throw insertEvenementError;
    } else if (!insertedEvenement) {
        throw new Error('Failed to insert evenement');
    }

    const { error: insertParticipationsError } = await supabase
        .from('participations_evenement')
        .insert(
            joueursId.map((joueurId) => ({
                evenement_id: insertedEvenement?.id,
                utilisateur_id: joueurId,
                reponse: null,
                besoin_transport: false,
            })),
        );

    if (insertParticipationsError) {
        throw insertParticipationsError;
    }
};

// also cascading delete participations_evenement linked to this evenement
export const deleteEvenementById = async ({ evenementId }: { evenementId: string }) => {
    const { error } = await supabase.from('evenements').delete().eq('id', evenementId);

    if (error) {
        throw error;
    }
};
