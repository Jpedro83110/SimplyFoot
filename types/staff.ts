export interface Staff {
  id?: string;
  utilisateur_id: string;
  club_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_naissance?: string;
  diplome?: boolean;
  niveau_diplome?: string;
  experience?: string;
  statut?: 'actif' | 'inactif';
  date_embauche?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}
