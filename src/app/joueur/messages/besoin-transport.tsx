import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { COLOR_GREEN_300 } from '@/utils/styleContants.utils';
import { getEquipeIdByUtilisateurId } from '@/helpers/joueurs.helpers';
import {
    GetMessagesBesoinTransportAndUtilisateurByEquipeId,
    getMessagesBesoinTransportAndUtilisateurByEquipeId,
} from '@/helpers/messagesBesoinTransport.helpers';
import useEffectOnce from 'react-use/lib/useEffectOnce';

export default function BesoinTransportJoueur() {
    const [loading, setLoading] = useState(true);
    const [demandes, setDemandes] = useState<GetMessagesBesoinTransportAndUtilisateurByEquipeId>(
        [],
    );
    const router = useRouter();

    async function fetchDemandes() {
        setLoading(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const utilisateurId = sessionData?.session?.user?.id;

            if (!utilisateurId) {
                return; // FIXME: manage error
            }

            const equipeId = await getEquipeIdByUtilisateurId({
                utilisateurId,
            });

            if (!equipeId) {
                return; // FIXME: manage error
            }

            const fetchedDemandes = await getMessagesBesoinTransportAndUtilisateurByEquipeId({
                equipeId,
            });

            setDemandes(fetchedDemandes);
        } catch (error) {
            console.error('Error fetching demandes:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffectOnce(() => {
        fetchDemandes();
    });

    return (
        <View>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>🚘 Demandes de transport - Équipe</Text>
                {loading && <ActivityIndicator color={COLOR_GREEN_300} style={{ marginTop: 40 }} />}

                {!loading && demandes.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.empty}>
                            Aucune demande de transport à venir dans votre équipe.
                        </Text>
                        <Text style={styles.emptyInfo}>
                            Les demandes apparaissent quand :{'\n'}• Vous êtes dans la même équipe
                            que le demandeur
                            {'\n'}• L&apos;événement est dans le futur
                            {'\n'}• Vous avez signé la décharge transport
                        </Text>
                    </View>
                )}

                {demandes.map((demande) => (
                    <View key={demande.id} style={styles.card}>
                        <Text style={styles.joueur}>
                            👤 {demande.utilisateurs?.prenom} {demande.utilisateurs?.nom}
                        </Text>

                        {/* Affichage de l'événement associé */}
                        {demande.evenements && (
                            <Text style={styles.evenement}>
                                🏟️ {demande.evenements.titre} — {demande.evenements.date}
                                {demande.evenements.heure && ` à ${demande.evenements.heure}`}
                                {demande.evenements.lieu && ` (${demande.evenements.lieu})`}
                            </Text>
                        )}

                        <Text style={styles.info}>
                            📍 Adresse : {demande.adresse_demande || 'Non précisée'} | ⏰ Heure :{' '}
                            {demande.heure_demande || 'Non précisée'}
                        </Text>
                        <Text style={styles.statut}>
                            📊 Statut :{' '}
                            <Text
                                style={{
                                    color:
                                        demande.etat === 'en_attente'
                                            ? '#ffe44d'
                                            : demande.etat === 'proposition_faite'
                                              ? COLOR_GREEN_300
                                              : demande.etat === 'signe'
                                                ? COLOR_GREEN_300
                                                : '#ffe44d',
                                }}
                            >
                                {demande.etat}
                            </Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.detailBtn}
                            onPress={() => router.push(`/joueur/demandes-transport/${demande.id}`)}
                        >
                            <Text style={{ color: '#111', fontWeight: 'bold' }}>
                                Voir détails & Signer
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, color: '#fff', marginBottom: 10, textAlign: 'center' },
    debug: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 20,
    },
    empty: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 10,
    },
    emptyInfo: {
        color: '#666',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#222',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_GREEN_300,
    },
    joueur: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLOR_GREEN_300,
        marginBottom: 8,
    },
    evenement: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    info: {
        color: '#ccc',
        fontSize: 13,
        marginBottom: 4,
    },
    statut: {
        marginTop: 2,
        fontWeight: 'bold',
        color: '#fff',
    },
    detailBtn: {
        marginTop: 10,
        backgroundColor: COLOR_GREEN_300,
        padding: 9,
        borderRadius: 8,
        alignItems: 'center',
    },
});
