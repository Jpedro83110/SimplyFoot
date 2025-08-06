export type ParticipationsEvenementFields = keyof ParticipationsEvenement;

export type ParticipationsEvenementReponse = 'present' | 'absent';

export interface ParticipationsEvenement {
    id: string;
    evenement_id?: string; // FIXME: can be null
    utilisateur_id?: string; // FIXME: can be null
    reponse?: ParticipationsEvenementReponse;
    besoin_transport?: boolean;
    transport_valide_par?: string; // FIXME: id
    commentaire?: string;
    created_at?: string;
    lieu_rdv?: string;
    heure_rdv?: string;
}
