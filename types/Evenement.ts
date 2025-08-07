import {
    getEvenementByCoachId,
    getEvenementInfosByUtilisateurId,
} from '@/helpers/evenements.helper';

export type EvenementFields = keyof Evenement;

export type EvenementType = 'match' | 'entrainement' | 'tournoi' | 'plateau' | 'autre';

export interface Evenement {
    id: string;
    equipe_id?: string; // FIXME: can be null
    coach_id?: string; // FIXME: can be null
    type?: EvenementType;
    titre?: string;
    date?: string;
    heure?: string;
    lieu?: string;
    description?: string;
    meteo?: string;
    date_creation?: string;
    adversaires?: string; // TODO: idée, permettre de cherche et lié un club inscrit sur l'app
    latitude?: number;
    longitude?: number;
    club_id?: string; // FIXME: can be null
    lieu_complement?: string;
}

export type CoachEvenements = Awaited<ReturnType<typeof getEvenementByCoachId>>;
export type EvenementInfos = Awaited<ReturnType<typeof getEvenementInfosByUtilisateurId>>;
