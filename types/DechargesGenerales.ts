export type DechargeGeneraleFields = keyof DechargeGenerale;

export interface DechargeGenerale {
    id: string;
    joueur_id?: string; // FIXME: can be null ; must be utilisateur_id
    parent_nom?: string;
    parent_prenom?: string;
    signature_url?: string;
    accepte_transport?: boolean;
    date_signature?: string;
    parent_telephone?: string;
}
