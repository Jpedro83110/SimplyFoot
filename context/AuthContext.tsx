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
    updateUtilisateur: (dataToUpdate: Partial<PublicUtilisateur>) => Promise<void>;
    joueur?: PublicJoueur;
    updateJoueur: (dataToUpdate: Partial<PublicJoueur>) => Promise<void>;
    staff?: PublicStaff;
    updateStaff: (dataToUpdate: Partial<PublicStaff>) => Promise<void>;
    clubAdmin?: PublicClubAdmin;
    updateClubAdmin: (dataToUpdate: Partial<PublicClubAdmin>) => Promise<void>;
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
    updateUtilisateur: async () => void 0,
    joueur: undefined,
    updateJoueur: async () => void 0,
    staff: undefined,
    updateStaff: async () => void 0,
    clubAdmin: undefined,
    updateClubAdmin: async () => void 0,
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

    const updateSession = useCallback(
        <T extends PublicUtilisateur | PublicJoueur | PublicStaff | PublicClubAdmin>(
            type: 'utilisateur' | 'joueur' | 'staff' | 'clubAdmin',
            data: T,
        ) => {
            if (!session) {
                console.warn('Cannot update session: user is not logged in');
                return;
            }

            switch (type) {
                case 'utilisateur':
                    setUtilisateur(data as PublicUtilisateur);
                    break;
                case 'joueur':
                    setJoueur(data as PublicJoueur);
                    break;
                case 'staff':
                    setStaff(data as PublicStaff);
                    break;
                case 'clubAdmin':
                    setClubAdmin(data as PublicClubAdmin);
                    break;
            }

            const sessionUpdate: Session = {
                ...JSON.parse(session),
                [type]: data,
            };

            console.log('isLoading', { isLoading, sessionUpdate }, JSON.stringify(sessionUpdate));
            setSession(JSON.stringify(sessionUpdate));
        },
        [session, isLoading, setSession],
    );

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
            }

            setSession(JSON.stringify(sessionData));
            setUtilisateur(sessionData.utilisateur);
            setJoueur(sessionData.joueur);
            setStaff(sessionData.staff);
            setClubAdmin(sessionData.clubAdmin);
        },
        [setSession],
    );

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

    const updateUtilisateur = useCallback(
        async (dataToUpdate: Partial<PublicUtilisateur>) => {
            if (!utilisateur) {
                console.warn('Cannot update utilisateur: user is not logged in');
                return;
            }

            await UtilisateursHelper.updateUtilisateur({
                utilisateurId: utilisateur.id,
                dataToUpdate,
            });

            updateSession('utilisateur', {
                ...utilisateur,
                ...dataToUpdate,
            });
        },
        [utilisateur, updateSession],
    );

    const updateJoueur = useCallback(
        async (dataToUpdate: Partial<PublicJoueur>) => {
            if (!joueur) {
                console.warn('Cannot update joueur: user is not logged in');
                return;
            }

            await JoueursHelper.updateJoueur({
                joueurId: joueur.id,
                dataToUpdate,
            });

            updateSession('joueur', {
                ...joueur,
                ...dataToUpdate,
            });
        },
        [joueur, updateSession],
    );

    const updateStaff = useCallback(
        async (dataToUpdate: Partial<PublicStaff>) => {
            if (!staff) {
                console.warn('Cannot update staff: user is not logged in');
                return;
            }

            await StaffHelper.updateStaff({ staffId: staff.id, dataToUpdate });

            updateSession('staff', {
                ...staff,
                ...dataToUpdate,
            });
        },
        [staff, updateSession],
    );

    const updateClubAdmin = useCallback(
        async (dataToUpdate: Partial<PublicClubAdmin>) => {
            if (!clubAdmin) {
                console.warn('Cannot update clubAdmin: user is not logged in');
                return;
            }

            await ClubAdminsHelper.updateClubAdmin({
                clubAdminId: clubAdmin.id,
                dataToUpdate,
            });

            updateSession('clubAdmin', {
                ...clubAdmin,
                ...dataToUpdate,
            });
        },
        [clubAdmin, updateSession],
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
                updateUtilisateur,
                joueur,
                updateJoueur,
                staff,
                updateStaff,
                clubAdmin,
                updateClubAdmin,
            }}
        >
            {children}
        </AuthContext>
    );
}
