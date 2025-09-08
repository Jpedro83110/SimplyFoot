export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '12.2.3 (519615d)';
    };
    public: {
        Tables: {
            banque_lignes: {
                Row: {
                    date_op: string | null;
                    id: string;
                    libelle: string | null;
                    montant_cents: number;
                    rapproche_ecriture_id: string | null;
                    releve_id: string;
                };
                Insert: {
                    date_op?: string | null;
                    id?: string;
                    libelle?: string | null;
                    montant_cents: number;
                    rapproche_ecriture_id?: string | null;
                    releve_id: string;
                };
                Update: {
                    date_op?: string | null;
                    id?: string;
                    libelle?: string | null;
                    montant_cents?: number;
                    rapproche_ecriture_id?: string | null;
                    releve_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'banque_lignes_rapproche_ecriture_id_fkey';
                        columns: ['rapproche_ecriture_id'];
                        isOneToOne: false;
                        referencedRelation: 'ecritures';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'banque_lignes_releve_id_fkey';
                        columns: ['releve_id'];
                        isOneToOne: false;
                        referencedRelation: 'banque_releves';
                        referencedColumns: ['id'];
                    },
                ];
            };
            banque_releves: {
                Row: {
                    club_id: string;
                    created_at: string | null;
                    file_url: string | null;
                    id: string;
                    periode: string | null;
                };
                Insert: {
                    club_id: string;
                    created_at?: string | null;
                    file_url?: string | null;
                    id?: string;
                    periode?: string | null;
                };
                Update: {
                    club_id?: string;
                    created_at?: string | null;
                    file_url?: string | null;
                    id?: string;
                    periode?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'banque_releves_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            budgets: {
                Row: {
                    categorie: string | null;
                    club_id: string | null;
                    commentaire: string | null;
                    created_at: string | null;
                    date: string;
                    id: number;
                    intitule: string | null;
                    montant: number | null;
                    type: string | null;
                };
                Insert: {
                    categorie?: string | null;
                    club_id?: string | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    date: string;
                    id?: never;
                    intitule?: string | null;
                    montant?: number | null;
                    type?: string | null;
                };
                Update: {
                    categorie?: string | null;
                    club_id?: string | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    date?: string;
                    id?: never;
                    intitule?: string | null;
                    montant?: number | null;
                    type?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'budgets_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            budgets_archive: {
                Row: {
                    categorie: string | null;
                    club_id: string | null;
                    commentaire: string | null;
                    created_at: string | null;
                    date: string | null;
                    id: number | null;
                    intitule: string | null;
                    montant: number | null;
                    type: string | null;
                };
                Insert: {
                    categorie?: string | null;
                    club_id?: string | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    date?: string | null;
                    id?: number | null;
                    intitule?: string | null;
                    montant?: number | null;
                    type?: string | null;
                };
                Update: {
                    categorie?: string | null;
                    club_id?: string | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    date?: string | null;
                    id?: number | null;
                    intitule?: string | null;
                    montant?: number | null;
                    type?: string | null;
                };
                Relationships: [];
            };
            clubs: {
                Row: {
                    abonnement_actif: boolean | null;
                    adresse: string | null;
                    boutique_url: string | null;
                    clubtv_enabled: boolean;
                    code_acces: string | null;
                    code_postal: string | null;
                    created_by: string | null;
                    dailymotion_url: string | null;
                    date_creation: string | null;
                    description: string | null;
                    email: string | null;
                    facebook_url: string | null;
                    id: string;
                    instagram_url: string | null;
                    logo_url: string | null;
                    nom: string;
                    site: string | null;
                    site_web: string | null;
                    telephone: string | null;
                    ville: string | null;
                    youtube_url: string | null;
                };
                Insert: {
                    abonnement_actif?: boolean | null;
                    adresse?: string | null;
                    boutique_url?: string | null;
                    clubtv_enabled?: boolean;
                    code_acces?: string | null;
                    code_postal?: string | null;
                    created_by?: string | null;
                    dailymotion_url?: string | null;
                    date_creation?: string | null;
                    description?: string | null;
                    email?: string | null;
                    facebook_url?: string | null;
                    id?: string;
                    instagram_url?: string | null;
                    logo_url?: string | null;
                    nom: string;
                    site?: string | null;
                    site_web?: string | null;
                    telephone?: string | null;
                    ville?: string | null;
                    youtube_url?: string | null;
                };
                Update: {
                    abonnement_actif?: boolean | null;
                    adresse?: string | null;
                    boutique_url?: string | null;
                    clubtv_enabled?: boolean;
                    code_acces?: string | null;
                    code_postal?: string | null;
                    created_by?: string | null;
                    dailymotion_url?: string | null;
                    date_creation?: string | null;
                    description?: string | null;
                    email?: string | null;
                    facebook_url?: string | null;
                    id?: string;
                    instagram_url?: string | null;
                    logo_url?: string | null;
                    nom?: string;
                    site?: string | null;
                    site_web?: string | null;
                    telephone?: string | null;
                    ville?: string | null;
                    youtube_url?: string | null;
                };
                Relationships: [];
            };
            clubs_admins: {
                Row: {
                    club_id: string | null;
                    date_added: string | null;
                    id: number;
                    is_active: boolean | null;
                    role_club: string;
                    user_id: string | null;
                };
                Insert: {
                    club_id?: string | null;
                    date_added?: string | null;
                    id?: number;
                    is_active?: boolean | null;
                    role_club: string;
                    user_id?: string | null;
                };
                Update: {
                    club_id?: string | null;
                    date_added?: string | null;
                    id?: number;
                    is_active?: boolean | null;
                    role_club?: string;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'clubs_admins_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'clubs_admins_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            compositions: {
                Row: {
                    coach_id: string | null;
                    date_creation: string | null;
                    equipe_id: string | null;
                    evenement_id: string | null;
                    id: string;
                    joueurs: Json | null;
                    tactique: string | null;
                };
                Insert: {
                    coach_id?: string | null;
                    date_creation?: string | null;
                    equipe_id?: string | null;
                    evenement_id?: string | null;
                    id?: string;
                    joueurs?: Json | null;
                    tactique?: string | null;
                };
                Update: {
                    coach_id?: string | null;
                    date_creation?: string | null;
                    equipe_id?: string | null;
                    evenement_id?: string | null;
                    id?: string;
                    joueurs?: Json | null;
                    tactique?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'compositions_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'compositions_equipe_id_fkey';
                        columns: ['equipe_id'];
                        isOneToOne: false;
                        referencedRelation: 'equipes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'compositions_evenement_id_fkey';
                        columns: ['evenement_id'];
                        isOneToOne: false;
                        referencedRelation: 'evenements';
                        referencedColumns: ['id'];
                    },
                ];
            };
            compta_exports: {
                Row: {
                    club_id: string;
                    file_url: string | null;
                    id: string;
                    periode: string | null;
                    statut: string | null;
                    type: string;
                };
                Insert: {
                    club_id: string;
                    file_url?: string | null;
                    id?: string;
                    periode?: string | null;
                    statut?: string | null;
                    type: string;
                };
                Update: {
                    club_id?: string;
                    file_url?: string | null;
                    id?: string;
                    periode?: string | null;
                    statut?: string | null;
                    type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'compta_exports_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            comptes: {
                Row: {
                    club_id: string;
                    code: string;
                    id: string;
                    libelle: string;
                    nature: string;
                };
                Insert: {
                    club_id: string;
                    code: string;
                    id?: string;
                    libelle: string;
                    nature: string;
                };
                Update: {
                    club_id?: string;
                    code?: string;
                    id?: string;
                    libelle?: string;
                    nature?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'comptes_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            decharges_generales: {
                Row: {
                    accepte_transport: boolean | null;
                    date_signature: string | null;
                    id: string;
                    joueur_id: string | null;
                    parent_nom: string | null;
                    parent_prenom: string | null;
                    parent_telephone: string | null;
                    signature_url: string | null;
                };
                Insert: {
                    accepte_transport?: boolean | null;
                    date_signature?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    parent_nom?: string | null;
                    parent_prenom?: string | null;
                    parent_telephone?: string | null;
                    signature_url?: string | null;
                };
                Update: {
                    accepte_transport?: boolean | null;
                    date_signature?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    parent_nom?: string | null;
                    parent_prenom?: string | null;
                    parent_telephone?: string | null;
                    signature_url?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'decharges_generales_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: false;
                        referencedRelation: 'joueurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            depenses: {
                Row: {
                    categorie: string | null;
                    club_id: string;
                    commentaire: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    date_depense: string | null;
                    fournisseur_id: string | null;
                    id: string;
                    montant_ttc_cents: number;
                    statut: string;
                };
                Insert: {
                    categorie?: string | null;
                    club_id: string;
                    commentaire?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    date_depense?: string | null;
                    fournisseur_id?: string | null;
                    id?: string;
                    montant_ttc_cents?: number;
                    statut?: string;
                };
                Update: {
                    categorie?: string | null;
                    club_id?: string;
                    commentaire?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    date_depense?: string | null;
                    fournisseur_id?: string | null;
                    id?: string;
                    montant_ttc_cents?: number;
                    statut?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'depenses_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'depenses_fournisseur_id_fkey';
                        columns: ['fournisseur_id'];
                        isOneToOne: false;
                        referencedRelation: 'tiers';
                        referencedColumns: ['id'];
                    },
                ];
            };
            depenses_pieces: {
                Row: {
                    depense_id: string;
                    file_url: string;
                    id: string;
                };
                Insert: {
                    depense_id: string;
                    file_url: string;
                    id?: string;
                };
                Update: {
                    depense_id?: string;
                    file_url?: string;
                    id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'depenses_pieces_depense_id_fkey';
                        columns: ['depense_id'];
                        isOneToOne: false;
                        referencedRelation: 'depenses';
                        referencedColumns: ['id'];
                    },
                ];
            };
            ecritures: {
                Row: {
                    club_id: string;
                    created_at: string | null;
                    created_by: string | null;
                    date_ecriture: string;
                    hash_prev: string | null;
                    hash_self: string | null;
                    id: string;
                    journal_id: string;
                    libelle: string;
                    reference: string | null;
                    total_credit_cents: number;
                    total_debit_cents: number;
                };
                Insert: {
                    club_id: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    date_ecriture?: string;
                    hash_prev?: string | null;
                    hash_self?: string | null;
                    id?: string;
                    journal_id: string;
                    libelle: string;
                    reference?: string | null;
                    total_credit_cents?: number;
                    total_debit_cents?: number;
                };
                Update: {
                    club_id?: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    date_ecriture?: string;
                    hash_prev?: string | null;
                    hash_self?: string | null;
                    id?: string;
                    journal_id?: string;
                    libelle?: string;
                    reference?: string | null;
                    total_credit_cents?: number;
                    total_debit_cents?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'ecritures_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'ecritures_journal_id_fkey';
                        columns: ['journal_id'];
                        isOneToOne: false;
                        referencedRelation: 'journaux';
                        referencedColumns: ['id'];
                    },
                ];
            };
            ecritures_lignes: {
                Row: {
                    compte_id: string;
                    credit_cents: number;
                    debit_cents: number;
                    ecriture_id: string;
                    id: string;
                    libelle: string | null;
                };
                Insert: {
                    compte_id: string;
                    credit_cents?: number;
                    debit_cents?: number;
                    ecriture_id: string;
                    id?: string;
                    libelle?: string | null;
                };
                Update: {
                    compte_id?: string;
                    credit_cents?: number;
                    debit_cents?: number;
                    ecriture_id?: string;
                    id?: string;
                    libelle?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'ecritures_lignes_compte_id_fkey';
                        columns: ['compte_id'];
                        isOneToOne: false;
                        referencedRelation: 'comptes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'ecritures_lignes_ecriture_id_fkey';
                        columns: ['ecriture_id'];
                        isOneToOne: false;
                        referencedRelation: 'ecritures';
                        referencedColumns: ['id'];
                    },
                ];
            };
            equipes: {
                Row: {
                    categorie: string | null;
                    club_id: string | null;
                    coach_id: string | null;
                    code_equipe: string | null;
                    date_creation: string | null;
                    description: string | null;
                    id: string;
                    nom: string;
                };
                Insert: {
                    categorie?: string | null;
                    club_id?: string | null;
                    coach_id?: string | null;
                    code_equipe?: string | null;
                    date_creation?: string | null;
                    description?: string | null;
                    id?: string;
                    nom: string;
                };
                Update: {
                    categorie?: string | null;
                    club_id?: string | null;
                    coach_id?: string | null;
                    code_equipe?: string | null;
                    date_creation?: string | null;
                    description?: string | null;
                    id?: string;
                    nom?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'equipes_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'equipes_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            evaluations_mentales: {
                Row: {
                    attitude: number | null;
                    coach_id: string | null;
                    commentaire: string | null;
                    created_at: string | null;
                    date: string | null;
                    id: string;
                    implication: number | null;
                    joueur_id: string | null;
                    motivation: number | null;
                    moyenne: number | null;
                    note_globale: number | null;
                    ponctualite: number | null;
                    respect: number | null;
                    rigueur: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    attitude?: number | null;
                    coach_id?: string | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    date?: string | null;
                    id?: string;
                    implication?: number | null;
                    joueur_id?: string | null;
                    motivation?: number | null;
                    moyenne?: number | null;
                    note_globale?: number | null;
                    ponctualite?: number | null;
                    respect?: number | null;
                    rigueur?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    attitude?: number | null;
                    coach_id?: string | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    date?: string | null;
                    id?: string;
                    implication?: number | null;
                    joueur_id?: string | null;
                    motivation?: number | null;
                    moyenne?: number | null;
                    note_globale?: number | null;
                    ponctualite?: number | null;
                    respect?: number | null;
                    rigueur?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'evaluations_joueur_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'evaluations_joueur_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            evaluations_techniques: {
                Row: {
                    centre: number | null;
                    coach_id: string | null;
                    defense: number | null;
                    id: string;
                    jeu_sans_ballon: number | null;
                    joueur_id: string | null;
                    moyenne: number | null;
                    passe: number | null;
                    placement: number | null;
                    tete: number | null;
                    tir: number | null;
                    updated_at: string | null;
                    vitesse: number | null;
                };
                Insert: {
                    centre?: number | null;
                    coach_id?: string | null;
                    defense?: number | null;
                    id?: string;
                    jeu_sans_ballon?: number | null;
                    joueur_id?: string | null;
                    moyenne?: number | null;
                    passe?: number | null;
                    placement?: number | null;
                    tete?: number | null;
                    tir?: number | null;
                    updated_at?: string | null;
                    vitesse?: number | null;
                };
                Update: {
                    centre?: number | null;
                    coach_id?: string | null;
                    defense?: number | null;
                    id?: string;
                    jeu_sans_ballon?: number | null;
                    joueur_id?: string | null;
                    moyenne?: number | null;
                    passe?: number | null;
                    placement?: number | null;
                    tete?: number | null;
                    tir?: number | null;
                    updated_at?: string | null;
                    vitesse?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'evaluations_techniques_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'evaluations_techniques_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: true;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            evenements: {
                Row: {
                    adversaires: string | null;
                    club_id: string | null;
                    created_by: string | null;
                    date: string | null;
                    date_creation: string | null;
                    description: string | null;
                    equipe_id: string | null;
                    heure: string | null;
                    id: string;
                    latitude: number | null;
                    lieu: string | null;
                    lieu_complement: string | null;
                    longitude: number | null;
                    meteo: Json | null;
                    titre: string | null;
                    type: string | null;
                };
                Insert: {
                    adversaires?: string | null;
                    club_id?: string | null;
                    created_by?: string | null;
                    date?: string | null;
                    date_creation?: string | null;
                    description?: string | null;
                    equipe_id?: string | null;
                    heure?: string | null;
                    id?: string;
                    latitude?: number | null;
                    lieu?: string | null;
                    lieu_complement?: string | null;
                    longitude?: number | null;
                    meteo?: Json | null;
                    titre?: string | null;
                    type?: string | null;
                };
                Update: {
                    adversaires?: string | null;
                    club_id?: string | null;
                    created_by?: string | null;
                    date?: string | null;
                    date_creation?: string | null;
                    description?: string | null;
                    equipe_id?: string | null;
                    heure?: string | null;
                    id?: string;
                    latitude?: number | null;
                    lieu?: string | null;
                    lieu_complement?: string | null;
                    longitude?: number | null;
                    meteo?: Json | null;
                    titre?: string | null;
                    type?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'evenements_created_by_fkey';
                        columns: ['created_by'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'evenements_equipe_id_fkey';
                        columns: ['equipe_id'];
                        isOneToOne: false;
                        referencedRelation: 'equipes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_evenements_club';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            factures: {
                Row: {
                    client_id: string | null;
                    club_id: string;
                    created_at: string | null;
                    date_facture: string | null;
                    due_date: string | null;
                    id: string;
                    montant_ht_cents: number;
                    montant_ttc_cents: number;
                    montant_tva_cents: number;
                    numero: string | null;
                    statut: string;
                };
                Insert: {
                    client_id?: string | null;
                    club_id: string;
                    created_at?: string | null;
                    date_facture?: string | null;
                    due_date?: string | null;
                    id?: string;
                    montant_ht_cents?: number;
                    montant_ttc_cents?: number;
                    montant_tva_cents?: number;
                    numero?: string | null;
                    statut?: string;
                };
                Update: {
                    client_id?: string | null;
                    club_id?: string;
                    created_at?: string | null;
                    date_facture?: string | null;
                    due_date?: string | null;
                    id?: string;
                    montant_ht_cents?: number;
                    montant_ttc_cents?: number;
                    montant_tva_cents?: number;
                    numero?: string | null;
                    statut?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'factures_client_id_fkey';
                        columns: ['client_id'];
                        isOneToOne: false;
                        referencedRelation: 'tiers';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'factures_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            factures_lignes: {
                Row: {
                    designation: string;
                    facture_id: string;
                    id: string;
                    prix_unitaire_cents: number;
                    quantite: number;
                    taxe_id: string | null;
                };
                Insert: {
                    designation: string;
                    facture_id: string;
                    id?: string;
                    prix_unitaire_cents?: number;
                    quantite?: number;
                    taxe_id?: string | null;
                };
                Update: {
                    designation?: string;
                    facture_id?: string;
                    id?: string;
                    prix_unitaire_cents?: number;
                    quantite?: number;
                    taxe_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'factures_lignes_facture_id_fkey';
                        columns: ['facture_id'];
                        isOneToOne: false;
                        referencedRelation: 'factures';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'factures_lignes_taxe_id_fkey';
                        columns: ['taxe_id'];
                        isOneToOne: false;
                        referencedRelation: 'taxes';
                        referencedColumns: ['id'];
                    },
                ];
            };
            feuilles_de_match: {
                Row: {
                    coach_id: string | null;
                    created_at: string | null;
                    equipe_id: string | null;
                    evenement_id: string | null;
                    id: string;
                    joueurs: Json | null;
                };
                Insert: {
                    coach_id?: string | null;
                    created_at?: string | null;
                    equipe_id?: string | null;
                    evenement_id?: string | null;
                    id?: string;
                    joueurs?: Json | null;
                };
                Update: {
                    coach_id?: string | null;
                    created_at?: string | null;
                    equipe_id?: string | null;
                    evenement_id?: string | null;
                    id?: string;
                    joueurs?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'feuilles_de_match_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'feuilles_de_match_equipe_id_fkey';
                        columns: ['equipe_id'];
                        isOneToOne: false;
                        referencedRelation: 'equipes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'feuilles_de_match_evenement_id_fkey';
                        columns: ['evenement_id'];
                        isOneToOne: false;
                        referencedRelation: 'evenements';
                        referencedColumns: ['id'];
                    },
                ];
            };
            feuilles_match_archive: {
                Row: {
                    date_creation: string | null;
                    evenement_id: string | null;
                    id: string | null;
                    joueurs: Json | null;
                };
                Insert: {
                    date_creation?: string | null;
                    evenement_id?: string | null;
                    id?: string | null;
                    joueurs?: Json | null;
                };
                Update: {
                    date_creation?: string | null;
                    evenement_id?: string | null;
                    id?: string | null;
                    joueurs?: Json | null;
                };
                Relationships: [];
            };
            inscriptions_stages: {
                Row: {
                    commentaire: string | null;
                    created_at: string | null;
                    id: string;
                    joueur_id: string | null;
                    stage_id: string | null;
                    statut: string | null;
                };
                Insert: {
                    commentaire?: string | null;
                    created_at?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    stage_id?: string | null;
                    statut?: string | null;
                };
                Update: {
                    commentaire?: string | null;
                    created_at?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    stage_id?: string | null;
                    statut?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inscriptions_stages_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inscriptions_stages_stage_id_fkey';
                        columns: ['stage_id'];
                        isOneToOne: false;
                        referencedRelation: 'stages';
                        referencedColumns: ['id'];
                    },
                ];
            };
            joueurs: {
                Row: {
                    code_equipe: string | null;
                    date_naissance: string | null;
                    equipe_id: string | null;
                    equipement: string | null;
                    id: string;
                    nom: string | null;
                    numero_licence: string | null;
                    photo_profil_url: string | null;
                    photo_url: string | null;
                    poste: string | null;
                    prenom: string | null;
                    telephone: string | null;
                    visite_medicale_valide: boolean | null;
                };
                Insert: {
                    code_equipe?: string | null;
                    date_naissance?: string | null;
                    equipe_id?: string | null;
                    equipement?: string | null;
                    id?: string;
                    nom?: string | null;
                    numero_licence?: string | null;
                    photo_profil_url?: string | null;
                    photo_url?: string | null;
                    poste?: string | null;
                    prenom?: string | null;
                    telephone?: string | null;
                    visite_medicale_valide?: boolean | null;
                };
                Update: {
                    code_equipe?: string | null;
                    date_naissance?: string | null;
                    equipe_id?: string | null;
                    equipement?: string | null;
                    id?: string;
                    nom?: string | null;
                    numero_licence?: string | null;
                    photo_profil_url?: string | null;
                    photo_url?: string | null;
                    poste?: string | null;
                    prenom?: string | null;
                    telephone?: string | null;
                    visite_medicale_valide?: boolean | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'joueurs_equipe_id_fkey';
                        columns: ['equipe_id'];
                        isOneToOne: false;
                        referencedRelation: 'equipes';
                        referencedColumns: ['id'];
                    },
                ];
            };
            journaux: {
                Row: {
                    club_id: string;
                    code: string;
                    id: string;
                    libelle: string;
                };
                Insert: {
                    club_id: string;
                    code: string;
                    id?: string;
                    libelle: string;
                };
                Update: {
                    club_id?: string;
                    code?: string;
                    id?: string;
                    libelle?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'journaux_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            messages_besoin_transport: {
                Row: {
                    adresse_demande: string | null;
                    adresse_proposee: string | null;
                    created_at: string | null;
                    etat: string | null;
                    evenement_id: string | null;
                    heure_demande: string | null;
                    heure_proposee: string | null;
                    id: string;
                    signature_conducteur: boolean | null;
                    signature_conducteur_date: string | null;
                    signature_demandeur: boolean | null;
                    signature_demandeur_date: string | null;
                    signature_parent: boolean | null;
                    signature_transporteur: boolean | null;
                    utilisateur_id: string | null;
                };
                Insert: {
                    adresse_demande?: string | null;
                    adresse_proposee?: string | null;
                    created_at?: string | null;
                    etat?: string | null;
                    evenement_id?: string | null;
                    heure_demande?: string | null;
                    heure_proposee?: string | null;
                    id?: string;
                    signature_conducteur?: boolean | null;
                    signature_conducteur_date?: string | null;
                    signature_demandeur?: boolean | null;
                    signature_demandeur_date?: string | null;
                    signature_parent?: boolean | null;
                    signature_transporteur?: boolean | null;
                    utilisateur_id?: string | null;
                };
                Update: {
                    adresse_demande?: string | null;
                    adresse_proposee?: string | null;
                    created_at?: string | null;
                    etat?: string | null;
                    evenement_id?: string | null;
                    heure_demande?: string | null;
                    heure_proposee?: string | null;
                    id?: string;
                    signature_conducteur?: boolean | null;
                    signature_conducteur_date?: string | null;
                    signature_demandeur?: boolean | null;
                    signature_demandeur_date?: string | null;
                    signature_parent?: boolean | null;
                    signature_transporteur?: boolean | null;
                    utilisateur_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'messages_besoin_transport_evenement_id_fkey';
                        columns: ['evenement_id'];
                        isOneToOne: false;
                        referencedRelation: 'evenements';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'messages_besoin_transport_utilisateur_id_fkey';
                        columns: ['utilisateur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            messages_groupe_coach: {
                Row: {
                    coach_id: string | null;
                    contenu: string | null;
                    created_at: string | null;
                    equipe_id: string | null;
                    id: string;
                    titre: string | null;
                };
                Insert: {
                    coach_id?: string | null;
                    contenu?: string | null;
                    created_at?: string | null;
                    equipe_id?: string | null;
                    id?: string;
                    titre?: string | null;
                };
                Update: {
                    coach_id?: string | null;
                    contenu?: string | null;
                    created_at?: string | null;
                    equipe_id?: string | null;
                    id?: string;
                    titre?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'messages_groupe_coach_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'messages_groupe_coach_equipe_id_fkey';
                        columns: ['equipe_id'];
                        isOneToOne: false;
                        referencedRelation: 'equipes';
                        referencedColumns: ['id'];
                    },
                ];
            };
            messages_prives: {
                Row: {
                    auteur: string | null;
                    created_at: string | null;
                    emetteur_id: string | null;
                    id: string;
                    recepteur_id: string | null;
                    texte: string | null;
                };
                Insert: {
                    auteur?: string | null;
                    created_at?: string | null;
                    emetteur_id?: string | null;
                    id?: string;
                    recepteur_id?: string | null;
                    texte?: string | null;
                };
                Update: {
                    auteur?: string | null;
                    created_at?: string | null;
                    emetteur_id?: string | null;
                    id?: string;
                    recepteur_id?: string | null;
                    texte?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'messages_prives_emetteur_id_fkey';
                        columns: ['emetteur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'messages_prives_recepteur_id_fkey';
                        columns: ['recepteur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            notifications: {
                Row: {
                    contenu: string;
                    created_at: string | null;
                    expire_at: string | null;
                    id: string;
                    lu: boolean | null;
                    recepteur_id: string | null;
                    titre: string;
                    type: string | null;
                };
                Insert: {
                    contenu: string;
                    created_at?: string | null;
                    expire_at?: string | null;
                    id?: string;
                    lu?: boolean | null;
                    recepteur_id?: string | null;
                    titre: string;
                    type?: string | null;
                };
                Update: {
                    contenu?: string;
                    created_at?: string | null;
                    expire_at?: string | null;
                    id?: string;
                    lu?: boolean | null;
                    recepteur_id?: string | null;
                    titre?: string;
                    type?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'notifications_recepteur_id_fkey';
                        columns: ['recepteur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            participations_evenement: {
                Row: {
                    besoin_transport: boolean | null;
                    commentaire: string | null;
                    created_at: string | null;
                    evenement_id: string | null;
                    heure_rdv: string | null;
                    id: string;
                    lieu_rdv: string | null;
                    reponse: string | null;
                    transport_valide_par: string | null;
                    utilisateur_id: string | null;
                };
                Insert: {
                    besoin_transport?: boolean | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    evenement_id?: string | null;
                    heure_rdv?: string | null;
                    id?: string;
                    lieu_rdv?: string | null;
                    reponse?: string | null;
                    transport_valide_par?: string | null;
                    utilisateur_id?: string | null;
                };
                Update: {
                    besoin_transport?: boolean | null;
                    commentaire?: string | null;
                    created_at?: string | null;
                    evenement_id?: string | null;
                    heure_rdv?: string | null;
                    id?: string;
                    lieu_rdv?: string | null;
                    reponse?: string | null;
                    transport_valide_par?: string | null;
                    utilisateur_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'participations_evenement_utilisateur_id_fkey';
                        columns: ['utilisateur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'participations_evenements_evenement_id_fkey';
                        columns: ['evenement_id'];
                        isOneToOne: false;
                        referencedRelation: 'evenements';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'participations_evenements_transport_valide_par_fkey';
                        columns: ['transport_valide_par'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            propositions_transport: {
                Row: {
                    accepte: boolean | null;
                    date_proposition: string | null;
                    demande_id: string | null;
                    heure_rdv: string | null;
                    id: string;
                    lieu_rdv: string | null;
                    parent_proposeur_id: string | null;
                };
                Insert: {
                    accepte?: boolean | null;
                    date_proposition?: string | null;
                    demande_id?: string | null;
                    heure_rdv?: string | null;
                    id?: string;
                    lieu_rdv?: string | null;
                    parent_proposeur_id?: string | null;
                };
                Update: {
                    accepte?: boolean | null;
                    date_proposition?: string | null;
                    demande_id?: string | null;
                    heure_rdv?: string | null;
                    id?: string;
                    lieu_rdv?: string | null;
                    parent_proposeur_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'propositions_transport_demande_id_fkey';
                        columns: ['demande_id'];
                        isOneToOne: false;
                        referencedRelation: 'messages_besoin_transport';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'propositions_transport_parent_proposeur_id_fkey';
                        columns: ['parent_proposeur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            reponses_messages_joueur: {
                Row: {
                    created_at: string | null;
                    id: string;
                    joueur_id: string | null;
                    message_id: string | null;
                    texte: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    message_id?: string | null;
                    texte?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    message_id?: string | null;
                    texte?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reponses_messages_joueur_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reponses_messages_joueur_message_id_fkey';
                        columns: ['message_id'];
                        isOneToOne: false;
                        referencedRelation: 'messages_groupe_coach';
                        referencedColumns: ['id'];
                    },
                ];
            };
            signatures_transport: {
                Row: {
                    date_signature: string | null;
                    id: string;
                    ip_signature: string | null;
                    parent1_id: string | null;
                    parent2_id: string | null;
                    proposition_id: string | null;
                    status: string | null;
                    texte_signature: string | null;
                };
                Insert: {
                    date_signature?: string | null;
                    id?: string;
                    ip_signature?: string | null;
                    parent1_id?: string | null;
                    parent2_id?: string | null;
                    proposition_id?: string | null;
                    status?: string | null;
                    texte_signature?: string | null;
                };
                Update: {
                    date_signature?: string | null;
                    id?: string;
                    ip_signature?: string | null;
                    parent1_id?: string | null;
                    parent2_id?: string | null;
                    proposition_id?: string | null;
                    status?: string | null;
                    texte_signature?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'signatures_transport_parent1_id_fkey';
                        columns: ['parent1_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'signatures_transport_parent2_id_fkey';
                        columns: ['parent2_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'signatures_transport_proposition_id_fkey';
                        columns: ['proposition_id'];
                        isOneToOne: false;
                        referencedRelation: 'propositions_transport';
                        referencedColumns: ['id'];
                    },
                ];
            };
            staff: {
                Row: {
                    actif: boolean | null;
                    club_id: string | null;
                    created_at: string | null;
                    date_embauche: string | null;
                    date_naissance: string | null;
                    diplome: boolean | null;
                    email: string;
                    experience: string | null;
                    id: string;
                    niveau_diplome: string | null;
                    nom: string;
                    photo_url: string | null;
                    prenom: string;
                    role: string | null;
                    statut: string | null;
                    telephone: string | null;
                    utilisateur_id: string | null;
                };
                Insert: {
                    actif?: boolean | null;
                    club_id?: string | null;
                    created_at?: string | null;
                    date_embauche?: string | null;
                    date_naissance?: string | null;
                    diplome?: boolean | null;
                    email: string;
                    experience?: string | null;
                    id?: string;
                    niveau_diplome?: string | null;
                    nom: string;
                    photo_url?: string | null;
                    prenom: string;
                    role?: string | null;
                    statut?: string | null;
                    telephone?: string | null;
                    utilisateur_id?: string | null;
                };
                Update: {
                    actif?: boolean | null;
                    club_id?: string | null;
                    created_at?: string | null;
                    date_embauche?: string | null;
                    date_naissance?: string | null;
                    diplome?: boolean | null;
                    email?: string;
                    experience?: string | null;
                    id?: string;
                    niveau_diplome?: string | null;
                    nom?: string;
                    photo_url?: string | null;
                    prenom?: string;
                    role?: string | null;
                    statut?: string | null;
                    telephone?: string | null;
                    utilisateur_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'staff_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'staff_utilisateur_id_fkey';
                        columns: ['utilisateur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            stages: {
                Row: {
                    age_max: number | null;
                    age_min: number | null;
                    club_id: string | null;
                    date_debut: string | null;
                    date_fin: string | null;
                    description: string | null;
                    heure_debut: string | null;
                    heure_fin: string | null;
                    id: string;
                    lieu: string | null;
                    programme_jeudi: Json | null;
                    programme_lundi: Json | null;
                    programme_mardi: Json | null;
                    programme_mercredi: Json | null;
                    programme_vendredi: Json | null;
                    titre: string | null;
                };
                Insert: {
                    age_max?: number | null;
                    age_min?: number | null;
                    club_id?: string | null;
                    date_debut?: string | null;
                    date_fin?: string | null;
                    description?: string | null;
                    heure_debut?: string | null;
                    heure_fin?: string | null;
                    id?: string;
                    lieu?: string | null;
                    programme_jeudi?: Json | null;
                    programme_lundi?: Json | null;
                    programme_mardi?: Json | null;
                    programme_mercredi?: Json | null;
                    programme_vendredi?: Json | null;
                    titre?: string | null;
                };
                Update: {
                    age_max?: number | null;
                    age_min?: number | null;
                    club_id?: string | null;
                    date_debut?: string | null;
                    date_fin?: string | null;
                    description?: string | null;
                    heure_debut?: string | null;
                    heure_fin?: string | null;
                    id?: string;
                    lieu?: string | null;
                    programme_jeudi?: Json | null;
                    programme_lundi?: Json | null;
                    programme_mardi?: Json | null;
                    programme_mercredi?: Json | null;
                    programme_vendredi?: Json | null;
                    titre?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'stages_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            stories: {
                Row: {
                    created_at: string;
                    duration: number;
                    expires_at: string;
                    id: string;
                    media_url: string;
                    utilisateur_id: string;
                    views_count: number;
                };
                Insert: {
                    created_at?: string;
                    duration?: number;
                    expires_at: string;
                    id?: string;
                    media_url: string;
                    utilisateur_id: string;
                    views_count?: number;
                };
                Update: {
                    created_at?: string;
                    duration?: number;
                    expires_at?: string;
                    id?: string;
                    media_url?: string;
                    utilisateur_id?: string;
                    views_count?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'stories_utilisateur_id_fkey';
                        columns: ['utilisateur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            story_views: {
                Row: {
                    id: string;
                    story_id: string;
                    viewed_at: string;
                    viewer_id: string;
                };
                Insert: {
                    id?: string;
                    story_id: string;
                    viewed_at?: string;
                    viewer_id: string;
                };
                Update: {
                    id?: string;
                    story_id?: string;
                    viewed_at?: string;
                    viewer_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'story_views_story_id_fkey';
                        columns: ['story_id'];
                        isOneToOne: false;
                        referencedRelation: 'stories';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'story_views_viewer_id_fkey';
                        columns: ['viewer_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            suivis_personnalises: {
                Row: {
                    axe_travail: string | null;
                    coach_id: string | null;
                    contenu: string | null;
                    created_at: string | null;
                    id: string;
                    joueur_id: string | null;
                    point_fort: string | null;
                    titre: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    axe_travail?: string | null;
                    coach_id?: string | null;
                    contenu?: string | null;
                    created_at?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    point_fort?: string | null;
                    titre?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    axe_travail?: string | null;
                    coach_id?: string | null;
                    contenu?: string | null;
                    created_at?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    point_fort?: string | null;
                    titre?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'suivis_personnalises_coach_id_fkey';
                        columns: ['coach_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'suivis_personnalises_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: false;
                        referencedRelation: 'utilisateurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            taxes: {
                Row: {
                    club_id: string;
                    id: string;
                    nom: string;
                    taux: number;
                };
                Insert: {
                    club_id: string;
                    id?: string;
                    nom: string;
                    taux?: number;
                };
                Update: {
                    club_id?: string;
                    id?: string;
                    nom?: string;
                    taux?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'taxes_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            tiers: {
                Row: {
                    adresse: string | null;
                    club_id: string;
                    created_at: string | null;
                    email: string | null;
                    id: string;
                    nom: string;
                    telephone: string | null;
                    type: string;
                };
                Insert: {
                    adresse?: string | null;
                    club_id: string;
                    created_at?: string | null;
                    email?: string | null;
                    id?: string;
                    nom: string;
                    telephone?: string | null;
                    type: string;
                };
                Update: {
                    adresse?: string | null;
                    club_id?: string;
                    created_at?: string | null;
                    email?: string | null;
                    id?: string;
                    nom?: string;
                    telephone?: string | null;
                    type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'tiers_club_id_fkey';
                        columns: ['club_id'];
                        isOneToOne: false;
                        referencedRelation: 'clubs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            utilisateurs: {
                Row: {
                    club_id: string | null;
                    date_creation: string | null;
                    date_naissance: string | null;
                    email: string;
                    expo_push_token: string | null;
                    id: string;
                    joueur_id: string | null;
                    nom: string | null;
                    prenom: string | null;
                    role: string;
                    telephone: string | null;
                };
                Insert: {
                    club_id?: string | null;
                    date_creation?: string | null;
                    date_naissance?: string | null;
                    email: string;
                    expo_push_token?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    nom?: string | null;
                    prenom?: string | null;
                    role: string;
                    telephone?: string | null;
                };
                Update: {
                    club_id?: string | null;
                    date_creation?: string | null;
                    date_naissance?: string | null;
                    email?: string;
                    expo_push_token?: string | null;
                    id?: string;
                    joueur_id?: string | null;
                    nom?: string | null;
                    prenom?: string | null;
                    role?: string;
                    telephone?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'utilisateurs_joueur_id_fkey';
                        columns: ['joueur_id'];
                        isOneToOne: false;
                        referencedRelation: 'joueurs';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            archiver_budgets: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            archiver_feuilles_match: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            delete_old_messages: {
                Args: { cutoff: string };
                Returns: undefined;
            };
            purge_messages: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            supprimer_compositions_evenements_passes: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            supprimer_evenements_passes: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            supprimer_stages_passes: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {},
    },
} as const;
