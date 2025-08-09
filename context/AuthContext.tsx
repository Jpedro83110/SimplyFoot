import { useStorageState } from '@/hooks/useStorageState';
import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import * as JoueursHelper from '@/helpers/joueurs.helper';
import * as UtilisateursHelper from '@/helpers/utilisateurs.helper';
import { PublicUtilisateur } from '@/types/Utilisateur';
import { PublicJoueur } from '@/types/Joueur';
import * as StaffHelper from '@/helpers/staff.helper';
import { PublicStaff } from '@/types/Staff';
import { router } from 'expo-router';
import { PublicClubAdmin } from '@/types/ClubAdmin';
import * as ClubAdminsHelper from '@/helpers/clubsAdmins.helper';

interface AuthContextProps {
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isLoggedIn: boolean;
    isLoggedOut: boolean;
    isLoading: boolean;
    utilisateur?: PublicUtilisateur;
    joueur?: PublicJoueur;
    staff?: PublicStaff;
    clubAdmin?: PublicClubAdmin;
    updateUserData: (params: {
        utilisateurData?: Partial<PublicUtilisateur>;
        joueurData?: Partial<PublicJoueur>;
        staffData?: Partial<PublicStaff>;
        clubAdminData?: Partial<PublicClubAdmin>;
    }) => Promise<void>;
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
    isLoggedIn: false,
    isLoggedOut: true,
    isLoading: false,
    utilisateur: undefined,
    joueur: undefined,
    staff: undefined,
    clubAdmin: undefined,
    updateUserData: async () => void 0,
};

export const AuthContext = createContext<AuthContextProps>(authContextDefaultValue);

export function AuthProvider({ children }: PropsWithChildren) {
    const [[isLoading, session], setSession] = useStorageState('user-data');
    const [utilisateur, setUtilisateur] = useState<PublicUtilisateur>();
    const [joueur, setJoueur] = useState<PublicJoueur>();
    const [staff, setStaff] = useState<PublicStaff>();
    const [clubAdmin, setClubAdmin] = useState<PublicClubAdmin>();

    const isLoggedIn = useMemo(
        () => !isLoading && !!session && !!utilisateur,
        [isLoading, session, utilisateur],
    );

    const isLoggedOut = useMemo(
        () => !isLoading && !session && !utilisateur,
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
        } else if (isLoggedOut) {
            router.replace('/');
        }
    }, [isLoggedIn, isLoggedOut, utilisateur]);

    const signOut = useCallback(async () => {
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
    }, [setSession]);

    const signIn = useCallback(
        async (email: string, password: string) => {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(
                {
                    email,
                    password,
                },
            );

            if (signInError) {
                const message =
                    signInError?.code === 'invalid_credentials'
                        ? 'Email ou mot de passe incorrect.'
                        : `Erreur : ${signInError?.message || 'Connexion impossible.'}`;
                Toast.show({ type: 'error', text1: message });

                throw signInError;
            }

            const utilisateur = await UtilisateursHelper.getUtilisateurById({
                utilisateurId: signInData.user.id,
            });

            let sessionData: Session = { utilisateur };

            if (utilisateur.role === 'joueur') {
                if (!utilisateur.joueur_id) {
                    throw new Error(`joueur_has_no_id`);
                }

                const joueur = await JoueursHelper.getJoueurById({
                    joueurId: utilisateur.joueur_id,
                });

                sessionData = { ...sessionData, joueur };
            } else if (utilisateur.role === 'coach') {
                const staff = await StaffHelper.getStaffByUtilisateurId({
                    utilisateurId: utilisateur.id,
                });

                // Nettoyer l'URL photo pour éviter les cache-busters
                // FIXME est-ce que c'est nécessaire ? pas tout compris
                if (staff.photo_url) {
                    staff.photo_url = staff.photo_url.split('?')[0];
                }

                sessionData = { ...sessionData, staff };
            } else if (utilisateur.role === 'president') {
                const clubAdmin = await ClubAdminsHelper.getClubAdminByUserId({
                    userId: utilisateur.id,
                });
                sessionData = { ...sessionData, clubAdmin };
            } else {
                console.warn(`Unknown role for utilisateur: ${utilisateur.role}`);
                await signOut();
                return;
            }

            setSession(JSON.stringify(sessionData));
            setUtilisateur(sessionData.utilisateur);
            setJoueur(sessionData.joueur);
            setStaff(sessionData.staff);
            setClubAdmin(sessionData.clubAdmin);
        },
        [setSession, signOut],
    );

    const updateUserData = useCallback(
        async ({
            utilisateurData,
            joueurData,
            staffData,
            clubAdminData,
        }: {
            utilisateurData?: Partial<PublicUtilisateur>;
            joueurData?: Partial<PublicJoueur>;
            staffData?: Partial<PublicStaff>;
            clubAdminData?: Partial<PublicClubAdmin>;
        }) => {
            if (!session) {
                console.warn('Cannot update user data: user is not logged in');
                await signOut();
                return;
            }

            const updatingSession: Session = JSON.parse(session);

            // Process each entity update individually
            if (utilisateurData && utilisateur) {
                await UtilisateursHelper.updateUtilisateur({
                    utilisateurId: utilisateur.id,
                    dataToUpdate: utilisateurData,
                });

                const updatedUtilisateur = {
                    ...utilisateur,
                    ...utilisateurData,
                };

                setUtilisateur(updatedUtilisateur);
                updatingSession.utilisateur = updatedUtilisateur;
            }

            if (joueurData && joueur) {
                await JoueursHelper.updateJoueur({
                    joueurId: joueur.id,
                    dataToUpdate: joueurData,
                });

                const updatedJoueur = {
                    ...joueur,
                    ...joueurData,
                };

                setJoueur(updatedJoueur);
                updatingSession.joueur = updatedJoueur;
            }

            if (staffData && staff) {
                await StaffHelper.updateStaff({
                    staffId: staff.id,
                    dataToUpdate: staffData,
                });

                const updatedStaff = {
                    ...staff,
                    ...staffData,
                };

                setStaff(updatedStaff);
                updatingSession.staff = updatedStaff;
            }

            if (clubAdminData && clubAdmin) {
                await ClubAdminsHelper.updateClubAdmin({
                    clubAdminId: clubAdmin.id,
                    dataToUpdate: clubAdminData,
                });

                const updatedClubAdmin = {
                    ...clubAdmin,
                    ...clubAdminData,
                };

                setClubAdmin(updatedClubAdmin);
                updatingSession.clubAdmin = updatedClubAdmin;
            }

            setSession(JSON.stringify(updatingSession));
        },
        [clubAdmin, joueur, session, setSession, signOut, staff, utilisateur],
    );

    return (
        <AuthContext
            value={{
                signIn,
                signOut,
                isLoggedIn,
                isLoggedOut,
                isLoading,
                utilisateur,
                joueur,
                staff,
                clubAdmin,
                updateUserData,
            }}
        >
            {children}
        </AuthContext>
    );
}
