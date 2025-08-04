export interface DechargeGenerale {
    id: string;
    joueur_id?: string; // FIXME: can be null
    parent_nom?: string;
    parent_prenom?: string;
    signature_url?: string;
    accepte_transport?: boolean;
    date_signature?: string;
    parent_telephone?: string;
}
