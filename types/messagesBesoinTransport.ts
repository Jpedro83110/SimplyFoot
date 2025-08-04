export type MessagesBesoinTransportEtat = 'en_attente' | 'proposition_faite' | 'signe';

export interface MessagesBesoinTransport {
    id: string;
    evenement_id?: string; // FIXME: can be null
    utilisateur_id?: string; // FIXME: can be null
    auteur_id?: string; // FIXME: can be null
    adresse_demande?: string;
    heure_demande?: string;
    etat?: MessagesBesoinTransportEtat;
    adresse_proposee?: string;
    heure_proposee?: string;
    propose_par?: string;
    signature_parent?: string;
    signature_transporteur?: string;
    created_at?: string;
    signature_demandeur?: string;
    signature_conducteur?: string;
    signature_demandeur_date?: string;
    signature_conducteur_date?: string;
}
