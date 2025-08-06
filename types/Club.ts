export interface Club {
    id: string;
    nom: string;
    logo_url?: string;
    adresse?: string;
    code_acces?: string; // FIXME: can be null
    abonnement_actif?: boolean; // FIXME: can be null
    date_creation?: string; // FIXME: can be null
    created_by?: string; // FIXME: can be null
    site?: string;
    telephone?: string;
    email?: string;
    facebook_url?: string;
    instagram_url?: string;
    boutique_url?: string;
    ville?: string;
    code_postal?: string;
    description?: string;
    site_web?: string;
}
