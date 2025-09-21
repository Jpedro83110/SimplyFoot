import { updateMatchCompositions } from '@/helpers/compositions.helpers';
import {
    getMatchEvenementInfosById,
    GetMatchEvenementInfosById,
} from '@/helpers/evenements.helpers';
import { CompositionsJoueurs } from '@/types/compositions.types';
import { ParticipationsEvenementReponse } from '@/types/participationsEvenement.types';
import { useState, FC, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    PanResponder,
    Animated,
    Image,
    Dimensions,
    Alert,
    ScrollView,
} from 'react-native';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import Button from '../atoms/Button';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Position {
    id: string;
    valueXY: Animated.ValueXY;
}

interface CompositionDragDropProps {
    evenementId: string;
}

export const CompositionDragDrop: FC<CompositionDragDropProps> = ({ evenementId }) => {
    const [matchEvenementInfos, setMatchEvenementInfos] =
        useState<GetMatchEvenementInfosById | null>(null);
    const [savingComposition, setSavingComposition] = useState<boolean>(false);
    const positions = useRef<Position[]>([]);

    const presents = useMemo(
        () =>
            matchEvenementInfos
                ? matchEvenementInfos.participations_evenement.filter(
                      (participation) =>
                          participation.reponse === ParticipationsEvenementReponse.PRESENT &&
                          participation.utilisateurs?.joueurs?.id,
                  )
                : [],
        [matchEvenementInfos],
    );

    const absents = useMemo(
        () =>
            matchEvenementInfos
                ? matchEvenementInfos.participations_evenement.filter(
                      (participation) =>
                          participation.reponse === ParticipationsEvenementReponse.ABSENT &&
                          participation.utilisateurs?.joueurs?.id,
                  )
                : [],
        [matchEvenementInfos],
    );

    const indecis = useMemo(
        () =>
            matchEvenementInfos
                ? matchEvenementInfos.participations_evenement.filter(
                      (participation) =>
                          !participation.reponse && participation.utilisateurs?.joueurs?.id,
                  )
                : [],
        [matchEvenementInfos],
    );

    const fetchData = async (evenementId: string) => {
        try {
            const fetchedMatchEvenementInfos = await getMatchEvenementInfosById({ evenementId });
            setMatchEvenementInfos(fetchedMatchEvenementInfos);

            const fetchedCompositions: CompositionsJoueurs = JSON.parse(
                (fetchedMatchEvenementInfos.compositions[0]?.joueurs as string) || '{}',
            );

            // positions.current = fetchedMatchEvenementInfos.participations_evenement
            //     .filter(
            //         (participation) =>
            //             participation.reponse === ParticipationsEvenementReponse.PRESENT &&
            //             participation.utilisateurs?.joueurs?.id,
            //     )
            //     .map((participation) => ({
            //         id: participation.utilisateurs!.joueurs!.id,
            //         valueXY: new Animated.ValueXY(
            //             fetchedCompositions[participation.utilisateurs!.joueurs!.id] || {
            //                 x: 0,
            //                 y: 0,
            //             },
            //         ),
            //     }));
            let joueurWithPosition = 0;
            const initalPositions: Position[] = [];
            fetchedMatchEvenementInfos.participations_evenement
                .filter(
                    (participation) =>
                        participation.reponse === ParticipationsEvenementReponse.PRESENT &&
                        participation.utilisateurs?.joueurs?.id,
                )
                .forEach((participation) => {
                    initalPositions.push({
                        id: participation.utilisateurs!.joueurs!.id,
                        valueXY: new Animated.ValueXY(
                            fetchedCompositions[participation.utilisateurs!.joueurs!.id] || {
                                x: 0,
                                y: joueurWithPosition * 60,
                            },
                        ),
                    });

                    if (!fetchedCompositions[participation.utilisateurs!.joueurs!.id]) {
                        joueurWithPosition += 1;
                    }
                });

            positions.current = initalPositions;
        } catch (error) {
            console.error('🎨 COMPOSITION: Erreur générale:', error);
            Alert.alert('Erreur', 'Impossible de charger les données.');
        }
    };

    useEffectOnce(() => {
        fetchData(evenementId);
    });

    const createPanResponder = (position: Position) =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                position.valueXY.setOffset({
                    x: (position.valueXY.x as any)._value,
                    y: (position.valueXY.y as any)._value,
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: position.valueXY.x, dy: position.valueXY.y }],
                {
                    useNativeDriver: false,
                },
            ),
            onPanResponderRelease: () => position.valueXY.flattenOffset(),
        });

    const handleValider = async (compositionId: string) => {
        try {
            setSavingComposition(true);
            await updateMatchCompositions({
                compositionId,
                joueurs: positions.current
                    .map((position) => ({
                        [position.id]: {
                            x: (position.valueXY.x as any)._value,
                            y: (position.valueXY.y as any)._value,
                        },
                    }))
                    .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
            });

            Alert.alert('✅ Composition enregistrée');
            setSavingComposition(false);
        } catch (error) {
            console.error('🎨 COMPOSITION: Erreur validation:', error);
            Alert.alert('Erreur', 'Erreur lors de la sauvegarde.');
        }
    };

    return (
        <ScrollView style={styles.wrapper}>
            <Text style={styles.titre}>📋 Composition</Text>

            <View style={styles.haut}>
                <Image
                    source={require('../../assets/terrain.png')}
                    style={styles.terrain}
                    resizeMode="contain"
                />
                <View style={styles.joueurOverlay}>
                    {presents.map((present) => {
                        const position = positions.current.find(
                            (position) => position.id === present.utilisateurs?.joueurs?.id,
                        );

                        if (!position) {
                            return null;
                        }

                        const panResponder = createPanResponder(position);

                        return (
                            <Animated.View
                                key={present.utilisateurs?.joueurs?.id}
                                style={[
                                    position.valueXY.getLayout(),
                                    { position: 'absolute', alignItems: 'center' },
                                ]}
                                {...panResponder.panHandlers}
                            >
                                <Image
                                    source={require('../../assets/maillot.png')}
                                    style={styles.maillot}
                                    resizeMode="contain"
                                />
                                <Text style={styles.joueurNom}>
                                    {present.utilisateurs?.nom}{' '}
                                    {present.utilisateurs?.joueurs?.poste
                                        ? `(${present.utilisateurs?.joueurs?.poste})`
                                        : ''}
                                    {present.besoin_transport && (
                                        <Text style={{ color: '#00bfff', fontSize: 13 }}> 🚗</Text>
                                    )}
                                </Text>
                            </Animated.View>
                        );
                    })}
                </View>
            </View>

            <Button
                style={styles.bouton}
                text="Valider la composition"
                onPress={() =>
                    matchEvenementInfos &&
                    matchEvenementInfos.compositions.length > 0 &&
                    handleValider(matchEvenementInfos!.compositions[0].id)
                }
                loading={savingComposition}
                disabled={savingComposition}
                color="primary"
            />

            {/* Absents */}
            {absents.length > 0 && (
                <View style={styles.listeStatut}>
                    <Text style={styles.absentTitle}>❌ Absents ({absents.length}) :</Text>
                    {absents.map((absent) => (
                        <View key={absent.utilisateurs?.joueurs?.id} style={styles.absentItem}>
                            <Image
                                source={require('../../assets/maillot.png')}
                                style={styles.maillotAbs}
                                resizeMode="contain"
                            />
                            <Text style={styles.absentNom}>
                                {absent.utilisateurs?.nom} {absent.utilisateurs?.prenom}{' '}
                                {absent.utilisateurs?.joueurs?.poste
                                    ? `(${absent.utilisateurs?.joueurs?.poste})`
                                    : ''}
                                {absent.besoin_transport && (
                                    <Text style={{ color: '#00bfff', fontSize: 13 }}> 🚗</Text>
                                )}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Indécis */}
            {indecis.length > 0 && (
                <View style={styles.listeStatut}>
                    <Text style={styles.indecisTitle}>❔ Non répondu ({indecis.length}) :</Text>
                    {indecis.map((indecis) => (
                        <View key={indecis.utilisateurs?.joueurs?.id} style={styles.absentItem}>
                            <Image
                                source={require('../../assets/maillot.png')}
                                style={styles.maillotAbs}
                                resizeMode="contain"
                            />
                            <Text style={styles.absentNom}>
                                {indecis.utilisateurs?.nom} {indecis.utilisateurs?.prenom}{' '}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Message si aucun joueur */}
            {presents.length === 0 && absents.length === 0 && indecis.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucun joueur trouvé pour cet événement.</Text>
                    <Text style={styles.emptySubtext}>
                        Vérifiez que les joueurs ont été convoqués et ont répondu.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#000' },
    titre: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingTop: 20,
    },
    haut: { flex: 1, alignItems: 'flex-start', position: 'relative', marginBottom: 30 },
    terrain: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.5,
        alignSelf: 'flex-start',
        marginTop: 20,
    },
    joueurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    maillot: { width: 40, height: 40 },
    joueurNom: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 10,
        marginTop: 2,
        textAlign: 'center',
    },
    bouton: {
        width: 'auto', // FIXME améliorer le bouton générique
        paddingHorizontal: 20,
        marginBottom: 15,
        alignSelf: 'center',
    },
    listeStatut: {
        marginTop: 15,
        backgroundColor: '#161b20',
        borderRadius: 12,
        padding: 10,
        width: '92%',
        alignSelf: 'center',
    },
    absentTitle: { color: '#fc2b3a', fontWeight: '700', fontSize: 14, marginBottom: 6 },
    indecisTitle: { color: '#ffe44d', fontWeight: '700', fontSize: 14, marginBottom: 6 },
    absentItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    maillotAbs: { width: 28, height: 28, marginRight: 8 },
    absentNom: { color: '#fff', fontSize: 13 },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 20,
    },
    emptyText: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
