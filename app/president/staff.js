import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useCacheData from '../../lib/cache';

const GREEN = '#00ff88';
const DARK = '#101415';
const DARK_LIGHT = '#161b20';

export default function Staff() {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [clubId, setClubId] = useState(null);

    // Récupération clubId (session)
    useEffect(() => {
        async function getClubId() {
            const session = await supabase.auth.getSession();
            const userId = session.data.session.user.id;
            const { data: utilisateur, error: errorUser } = await supabase
                .from('utilisateurs')
                .select('club_id')
                .eq('id', userId)
                .single();
            if (!errorUser && utilisateur) {
                setClubId(utilisateur.club_id);
            }
        }
        getClubId();
    }, []);

    // --- Fonction fetch staff
    const fetchStaff = async () => {
        if (!clubId) return [];
        const { data, error } = await supabase.from('staff').select('*').eq('club_id', clubId);
        if (error) throw new Error(error.message);
        return data || [];
    };

    // --- useCacheData
    const cacheKey = clubId ? `staff_club_${clubId}` : null;
    const [staff, refreshStaff, loading] = useCacheData(
        cacheKey,
        fetchStaff,
        3600, // 1h
    );

    // --- Ajout coach
    // const handleAddCoach = async () => {
    //     if (!clubId) {
    //     Alert.alert("Erreur", "Le club n'est pas encore chargé. Réessaie dans un instant.");
    //     return;
    //   }

    //   if (!prenom || !nom) {
    //     Alert.alert("Champs manquants", "Merci de remplir le nom et le prénom.");
    //     return;
    //   }
    //   // Vérification si le coach existe déjà
    //   const { data: existingCoach, error: existingError } = await supabase
    //     .from('staff')
    //     .select('id')
    //     .eq('club_id', clubId)
    //     .eq('nom', nom)
    //     .eq('prenom', prenom)
    //     .maybeSingle();
    //   if (existingError) {
    //     Alert.alert("Erreur", "Impossible de vérifier l'existence du coach.");
    //     console.error("Erreur vérification coach :", existingError);
    //     return;
    //   }
    //   if (existingCoach) {
    //     Alert.alert("Coach déjà existant", `${prenom} ${nom} est déjà dans le staff.`);
    //     return;
    //   }
    //   // Insertion du nouveau coach
    //   console.log("Ajout du coach :", prenom, nom);

    //   const { error } = await supabase.from('staff').insert({
    //     nom,
    //     prenom,
    //     club_id: clubId,
    //   });
    //   if (error) {
    //     Alert.alert("Erreur", "Impossible de créer le coach.");
    //     console.error("Erreur insertion coach :", error);
    //   } else {
    //     Alert.alert("✅ Coach ajouté", `${prenom} ${nom} a été ajouté au staff.`);
    //     setNom('');
    //     setPrenom('');
    //     refreshStaff();
    //   }
    // };

    // --- Suppression coach
    const handleDeleteCoach = async (coachId) => {
        Alert.alert('Confirmer la suppression', 'Es-tu sûr de vouloir supprimer ce coach ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('staff').delete().eq('id', coachId);
                    if (error) {
                        Alert.alert('Erreur', 'Impossible de supprimer ce coach.');
                        console.error('Erreur suppression :', error);
                    } else {
                        refreshStaff();
                    }
                },
            },
        ]);
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

    return (
        <ScrollView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>👥 Membres du Staff</Text>

                {!staff || staff.length === 0 ? (
                    <Text style={{ color: '#ccc', marginBottom: 20 }}>
                        Aucun coach encore créé.
                    </Text>
                ) : (
                    staff.map((membre) => (
                        <View key={membre.id} style={styles.card}>
                            <View style={styles.cardRow}>
                                <View style={styles.avatarRow}>
                                    <Image
                                        source={{
                                            uri:
                                                membre.photo_url && membre.photo_url.trim() !== ''
                                                    ? membre.photo_url
                                                    : 'https://ui-avatars.com/api/?name=' +
                                                      encodeURIComponent(
                                                          `${membre.prenom || ''} ${membre.nom || ''}`,
                                                      ) +
                                                      '&background=232b28&color=fff&rounded=true',
                                        }}
                                        style={styles.avatar}
                                    />
                                    <Text style={styles.cardName}>
                                        {membre.prenom} {membre.nom}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteCoach(membre.id)}>
                                    <Ionicons name="trash" size={22} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.cardDetail}>
                                📧 {membre.email || 'Email non renseigné'}
                            </Text>
                            <Text style={styles.cardDetail}>
                                📞 {membre.telephone || 'Téléphone non renseigné'}
                            </Text>
                            <Text style={styles.cardDetail}>
                                🎂 {membre.date_naissance || 'Date non renseignée'}
                            </Text>
                            <Text style={styles.cardDetail}>
                                🎓 Diplôme : {membre.diplome ? '✅ Oui' : '❌ Non'}
                            </Text>
                            <Text style={styles.cardRole}>Rôle : {membre.role || 'Coach'}</Text>
                        </View>
                    ))
                )}

                {/* Formulaire d'ajout d'un coach */}
                {/* <View style={styles.form}>
          <Text style={styles.subtitle}>➕ Ajouter un coach</Text>
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor="#aaa"
            value={prenom}
            onChangeText={setPrenom}
          />
          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="#aaa"
            value={nom}
            onChangeText={setNom}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddCoach}>
            <Ionicons name="add-circle" size={20} color="#111" />
            <Text style={styles.buttonText}>Créer le coach</Text>
          </TouchableOpacity>
        </View> */}
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: DARK,
    },
    scroll: { padding: 20, alignSelf: 'center', maxWidth: 790, width: '92%' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#00ff88',
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#00ff88',
        backgroundColor: '#232b28',
    },
    cardName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    cardRole: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 6,
    },
    cardDetail: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 2,
    },
    form: {
        marginTop: 30,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
    },
    subtitle: {
        fontSize: 18,
        color: '#00ff88',
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#2a2a2a',
        color: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#444',
    },
    button: {
        backgroundColor: '#00ff88',
        borderRadius: 10,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#111',
    },
});
