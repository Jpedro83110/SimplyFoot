export interface Stage {
    id: string;
    club_id?: string; // FIXME: can be null
    titre?: string;
    description?: string;
    date_debut?: string;
    date_fin?: string;
    programme_lundi?: string;
    programme_mardi?: string;
    programme_mercredi?: string;
    programme_jeudi?: string;
    programme_vendredi?: string;
    lieu?: string;
    age_min?: number;
    age_max?: number;
    heure_debut?: string;
    heure_fin?: string;
}
