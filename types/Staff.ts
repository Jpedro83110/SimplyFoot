export type StaffStatut = 'actif' | 'inactif';

export interface Staff {
    id: string;
    utilisateur_id?: string; // FIXME: can be null
    club_id?: string; // FIXME: can be null
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    date_naissance?: string;
    diplome?: boolean;
    actif?: boolean;
    role?: string; // FIXME: type
    created_at?: string;
    niveau_diplome?: string;
    experience?: string;
    statut?: StaffStatut;
    date_embauche?: string;
    photo_url?: string;
}
