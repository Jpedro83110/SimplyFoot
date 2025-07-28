export interface Evenement {
  id: string;
  titre: string;
  description?: string;
  date: string;
  heure: string;
  lieu: string;
  lieu_complement?: string;
  type: 'match' | 'entrainement' | 'reunion' | 'autre';
  equipe_id?: string;
  coach_id: string;
  club_id?: string;
  adversaire?: string;
  domicile?: boolean;
  meteo?: string;
  latitude?: number;
  longitude?: number;
  statut?: 'planifie' | 'confirme' | 'annule' | 'reporte';
  created_at?: string;
  updated_at?: string;
}
