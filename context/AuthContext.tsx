import { useStorageState } from '@/hooks/useStorageState';
import { createContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { getJoueurById } from '@/helpers/joueurs.helper';
import { getUtilisateurById } from '@/helpers/utilisateurs.helper';
import { PublicUtilisateur } from '@/types/Utilisateur';
import { PublicJoueur } from '@/types/Joueur';
import { getStaffByUtilisateurId } from '@/helpers/staff.helper';
import { PublicStaff } from '@/types/Staff';
import { router } from 'expo-router';
import { PublicClubAdmin } from '@/types/ClubAdmin';
import { getClubAdminByUserId } from '@/helpers/clubsAdmins.helper';

interface AuthContextProps {
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isLoading: boolean;
    utilisateur?: PublicUtilisateur;
    joueur?: PublicJoueur;
    staff?: PublicStaff;
    clubAdmin?: PublicClubAdmin;
}

interface Session {
    utilisateur?: PublicUtilisateur;
    joueur?: PublicJoueur;
    staff?: PublicStaff;
    clubAdmin?: PublicClubAdmin;
}

export const authContextDefaultValue: AuthContextProps = {
    signIn: async () => void 0,
    signOut: async () => void 0,
    isLoading: false,
    utilisateur: undefined,
    joueur: undefined,
    staff: undefined,
    clubAdmin: undefined,
};

export const AuthContext = createContext<AuthContextProps>(authContextDefaultValue);

export function AuthProvider({ children }: PropsWithChildren) {
    const [[isLoading, session], setSession] = useStorageState('user-data');
    const [utilisateur, setUtilisateur] = useState<PublicUtilisateur>();
    const [joueur, setJoueur] = useState<PublicJoueur>();
    const [staff, setStaff] = useState<PublicStaff>();
    const [clubAdmin, setClubAdmin] = useState<PublicClubAdmin>();

    const isNotLoggedIn = useMemo(
        () => !isLoading && !session && !utilisateur,
        [isLoading, session, utilisateur],
    );

    const isLoggedIn = useMemo(
        () => !isLoading && !!session && !!utilisateur,
        [isLoading, session, utilisateur],
    );

    useEffect(() => {
        if (!isLoading && session && !utilisateur) {
            const sessionParsed = JSON.parse(session) as Session;
            setUtilisateur(sessionParsed.utilisateur);
            setJoueur(sessionParsed.joueur);
            setStaff(sessionParsed.staff);
            setClubAdmin(sessionParsed.clubAdmin);
        }
    }, [session, utilisateur, isLoading]);

    useEffect(() => {
        if (isLoggedIn && utilisateur) {
            // utilisateur can't be null here
            switch (utilisateur.role) {
                // case 'admin':
                //     router.replace('/admin/dashboard');
                //     break;
                case 'president':
                    router.replace('/president/dashboard');
                    break;
                case 'coach':
                    router.replace('/coach/dashboard');
                    break;
                case 'joueur':
                    router.replace('/joueur/dashboard');
                    break;
                default:
                    Toast.show({
                        type: 'error',
                        text1: 'Rôle inconnu',
                    });
                    break;
            }
        } else if (isNotLoggedIn) {
            router.replace('/');
        }
    }, [isLoggedIn, isNotLoggedIn, utilisateur]);

    return (
        <AuthContext
            value={{
                signIn: async (email: string, password: string) => {
                    const { data: signInData, error: signInError } =
                        await supabase.auth.signInWithPassword({
                            email,
                            password,
                        });

                    if (signInError) {
                        const message =
                            signInError?.code === 'invalid_credentials'
                                ? 'Email ou mot de passe incorrect.'
                                : `Erreur : ${signInError?.message || 'Connexion impossible.'}`;
                        Toast.show({ type: 'error', text1: message });

                        throw signInError;
                    }

                    const utilisateur = await getUtilisateurById({
                        utilisateurId: signInData.user.id,
                    });

                    let sessionData: Session = { utilisateur };

                    if (utilisateur.role === 'joueur') {
                        if (!utilisateur.joueur_id) {
                            throw new Error(`joueur_has_no_id`);
                        }

                        const joueur = await getJoueurById({
                            joueurId: utilisateur.joueur_id,
                        });

                        sessionData = { ...sessionData, joueur };
                    } else if (utilisateur.role === 'coach') {
                        const staff = await getStaffByUtilisateurId({
                            utilisateurId: utilisateur.id,
                        });

                        sessionData = { ...sessionData, staff };
                    } else if (utilisateur.role === 'president') {
                        const clubAdmin = await getClubAdminByUserId({
                            userId: utilisateur.id,
                        });
                        sessionData = { ...sessionData, clubAdmin };
                    }

                    setSession(JSON.stringify(sessionData));
                    setUtilisateur(sessionData.utilisateur);
                    setJoueur(sessionData.joueur);
                    setStaff(sessionData.staff);
                    setClubAdmin(sessionData.clubAdmin);
                },
                signOut: async () => {
                    try {
                        await supabase.auth.signOut();
                    } catch (error) {
                        console.error('Error signing out:', error);
                    } finally {
                        setSession(null);
                        setUtilisateur(undefined);
                        setJoueur(undefined);
                        setStaff(undefined);
                        setClubAdmin(undefined);
                    }
                },
                isLoading,
                utilisateur,
                joueur,
                staff,
                clubAdmin,
            }}
        >
            {children}
        </AuthContext>
    );
}
