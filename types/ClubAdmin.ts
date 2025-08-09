export type ClubAdminRole = 'president';

export interface ClubAdmin {
    id: string;
    club_id?: string; // FIXME: can be null
    user_id?: string; // FIXME: can be null
    role_club: ClubAdminRole;
    is_active?: boolean;
    date_added?: string;
}

export type PublicClubAdmin = Omit<ClubAdmin, 'user_id' | 'role_club' | 'is_active'>;
