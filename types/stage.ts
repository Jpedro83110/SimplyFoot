export interface Stage {
  id: string;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  lieu?: string;
  club_id: string;
  prix?: number;
  places_max?: number;
  statut?: 'ouvert' | 'complet' | 'annule';
  created_at?: string;
  updated_at?: string;
}
