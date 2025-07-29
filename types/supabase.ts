export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          nom: string;
          adresse?: string;
          ville?: string;
          code_postal?: string;
          telephone?: string;
          email?: string;
          site_web?: string;
          facebook_url?: string;
          instagram_url?: string;
          boutique_url?: string;
          code_acces: string;
          logo_url?: string;
          date_creation: string;
          created_by?: string;
        };
        Insert: Omit<Database['public']['Tables']['clubs']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>;
      };
      utilisateurs: {
        Row: {
          id: string;
          email: string;
          nom: string;
          prenom: string;
          club_id?: string;
          role: 'joueur' | 'coach' | 'president';
          joueur_id?: string;
          date_creation: string;
        };
        Insert: Omit<Database['public']['Tables']['utilisateurs']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['utilisateurs']['Insert']>;
      };
      equipes: {
        Row: {
          id: string;
          nom: string;
          categorie?: string;
          description?: string;
          coach_id?: string;
          club_id: string;
          code_equipe?: string;
        };
        Insert: Omit<Database['public']['Tables']['equipes']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['equipes']['Insert']>;
      };
      // Ajoutez d'autres tables au fur et à mesure
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
