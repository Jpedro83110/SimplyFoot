import { getUtilisateursPushTokenByClubId } from './utilisateurs.helpers';

export const sendNotificationToClubUsers = async ({
    message,
    clubId,
}: {
    message: string;
    clubId: string;
}) => {
    const utilisateurs = await getUtilisateursPushTokenByClubId({ clubId });

    const utilisateursHasPushToken = utilisateurs?.filter(
        (utilisateur) => utilisateur.expo_push_token,
    );

    const requests = utilisateursHasPushToken.map(({ expo_push_token }) =>
        fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: expo_push_token,
                title: 'Nouvel évènement',
                body: message,
            }),
        }),
    );

    await Promise.all(requests);
};
