import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CompositionDragDrop({ evenementId }) {
  const [presents, setPresents] = useState([]);
  const [absents, setAbsents] = useState([]);
  const [indecis, setIndecis] = useState([]);
  const [positions, setPositions] = useState({});
  const [equipeId, setEquipeId] = useState(null);
  const [coachId, setCoachId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('🎨 COMPOSITION: Début fetchData pour événement:', evenementId);

      try {
        // 1. Récupère l'événement (coach_id, equipe_id)
        const { data: evt, error: evtError } = await supabase
          .from('evenements')
          .select('equipe_id, coach_id')
          .eq('id', evenementId)
          .single();

        console.log('🎨 COMPOSITION: Événement récupéré:', evt);

        if (evtError || !evt) {
          console.error('🎨 COMPOSITION: Erreur événement:', evtError);
          Alert.alert('Erreur', 'Événement introuvable.');
          return;
        }
        setEquipeId(evt.equipe_id);
        setCoachId(evt.coach_id);

        // 2. Récupère toutes les participations à cet événement
        const { data: participations, error: partError } = await supabase
          .from('participations_evenement')
          .select('joueur_id, reponse, besoin_transport')
          .eq('evenement_id', evenementId);

        console.log('🎨 COMPOSITION: Participations récupérées:', participations?.length || 0);
        console.log('🎨 COMPOSITION: Participations détails:', participations);

        if (partError) {
          console.error('🎨 COMPOSITION: Erreur participations:', partError);
          setPresents([]);
          setAbsents([]);
          setIndecis([]);
          return;
        }

        // 3. Récupère tous les joueurs de l'équipe
        const { data: allJoueurs, error: joueursError } = await supabase
          .from('joueurs')
          .select('id, nom, prenom, poste')
          .eq('equipe_id', evt.equipe_id);

        console.log('🎨 COMPOSITION: Joueurs de l\'équipe récupérés:', allJoueurs?.length || 0);
        console.log('🎨 COMPOSITION: Joueurs détails:', allJoueurs);

        if (joueursError) {
          console.error('🎨 COMPOSITION: Erreur joueurs:', joueursError);
        }

        // 4. Récupère les utilisateurs pour faire la liaison
        const joueursIds = (allJoueurs || []).map(j => j.id);
        let utilisateursMap = {};

        if (joueursIds.length) {
          const { data: utilisateurs, error: utilisateursError } = await supabase
            .from('utilisateurs')
            .select('id, joueur_id, nom, prenom')
            .eq('role', 'joueur')
            .in('joueur_id', joueursIds);

          console.log('🎨 COMPOSITION: Utilisateurs récupérés:', utilisateurs?.length || 0);
          console.log('🎨 COMPOSITION: Utilisateurs détails:', utilisateurs);

          if (utilisateursError) {
            console.error('🎨 COMPOSITION: Erreur utilisateurs:', utilisateursError);
          }

          // Map utilisateur_id -> joueur_id
          (utilisateurs || []).forEach(u => {
            utilisateursMap[u.id] = u.joueur_id;
          });
        }

        console.log('🎨 COMPOSITION: Map utilisateurs -> joueurs:', utilisateursMap);

        // 5. 🎯 CORRECTION : Traiter les participations avec la bonne logique
        const presentsData = [];
        const absentsData = [];

        (participations || []).forEach(participation => {
          console.log(`🎨 COMPOSITION: Traitement participation:`, participation);
          
          // participation.joueur_id = ID UTILISATEUR
          // Trouver le joueur_id correspondant
          const joueurTableId = utilisateursMap[participation.joueur_id];
          
          console.log(`🎨 COMPOSITION: User ID ${participation.joueur_id} -> Joueur ID ${joueurTableId}`);
          
          if (joueurTableId) {
            // Trouver les infos complètes du joueur
            const joueurInfo = allJoueurs.find(j => j.id === joueurTableId);
            
            if (joueurInfo) {
              const joueurComplet = {
                ...joueurInfo,
                besoin_transport: participation.besoin_transport,
                participation_user_id: participation.joueur_id
              };
              
              if (participation.reponse === 'present') {
                console.log(`🎨 COMPOSITION: ${joueurInfo.nom} -> PRÉSENT`);
                presentsData.push(joueurComplet);
              } else if (participation.reponse === 'absent') {
                console.log(`🎨 COMPOSITION: ${joueurInfo.nom} -> ABSENT`);
                absentsData.push(joueurComplet);
              }
            }
          }
        });

        // 6. Générer la liste des indécis (joueurs sans participation)
        const participantsJoueursIds = (participations || [])
          .map(p => utilisateursMap[p.joueur_id])
          .filter(Boolean);
          
        const indecisData = (allJoueurs || [])
          .filter(j => !participantsJoueursIds.includes(j.id))
          .map(j => ({
            ...j,
            besoin_transport: false,
          }));

        console.log('🎨 COMPOSITION: Résultats finaux:');
        console.log('🎨 COMPOSITION: Présents:', presentsData.length, presentsData.map(p => p.nom));
        console.log('🎨 COMPOSITION: Absents:', absentsData.length, absentsData.map(p => p.nom));
        console.log('🎨 COMPOSITION: Indécis:', indecisData.length, indecisData.map(p => p.nom));

        // 7. Récupère la composition sauvegardée si elle existe
        const { data: compo } = await supabase
          .from('compositions')
          .select('joueurs')
          .eq('evenement_id', evenementId)
          .single();

        console.log('🎨 COMPOSITION: Composition sauvegardée:', compo);

        // 8. Init positions drag&drop pour présents, avec priorité à la compo sauvegardée
        const initPositions = {};
        presentsData.forEach((j, i) => {
          if (compo && compo.joueurs) {
            let joueursSaved;
            try {
              joueursSaved = typeof compo.joueurs === "string"
                ? JSON.parse(compo.joueurs)
                : compo.joueurs;
            } catch (e) {
              joueursSaved = null;
            }
            if (joueursSaved && joueursSaved[j.id]) {
              initPositions[j.id] = new Animated.ValueXY(joueursSaved[j.id]);
              console.log(`🎨 COMPOSITION: Position sauvegardée pour ${j.nom}:`, joueursSaved[j.id]);
              return;
            }
          }
          // Position par défaut si pas de sauvegarde
          const defaultPos = {
            x: 30 + (i % 3) * 100,
            y: 60 + Math.floor(i / 3) * 80,
          };
          initPositions[j.id] = new Animated.ValueXY(defaultPos);
          console.log(`🎨 COMPOSITION: Position par défaut pour ${j.nom}:`, defaultPos);
        });

        setPresents(presentsData);
        setAbsents(absentsData);
        setIndecis(indecisData);
        setPositions(initPositions);

      } catch (error) {
        console.error('🎨 COMPOSITION: Erreur générale:', error);
        Alert.alert('Erreur', 'Impossible de charger les données.');
      }
    };

    fetchData();
  }, [evenementId]);

  const createPanResponder = (playerId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (positions[playerId]) {
          positions[playerId].setOffset({
            x: positions[playerId].x._value,
            y: positions[playerId].y._value,
          });
          positions[playerId].setValue({ x: 0, y: 0 });
        }
      },
      onPanResponderMove: positions[playerId] ? Animated.event(
        [null, { dx: positions[playerId].x, dy: positions[playerId].y }],
        { useNativeDriver: false }
      ) : null,
      onPanResponderRelease: () => {
        if (positions[playerId]) {
          positions[playerId].flattenOffset();
        }
      },
    });

  const handleValider = async () => {
    console.log('🎨 COMPOSITION: Validation de la composition');
    console.log('🎨 COMPOSITION: Données:', { evenementId, coachId, equipeId, presents: presents.length });

    // Construction du payload (positions joueurs)
    const payload = {};
    presents.forEach(j => {
      if (positions[j.id]) {
        payload[j.id] = {
          x: positions[j.id].x._value,
          y: positions[j.id].y._value,
        };
      }
    });

    console.log('🎨 COMPOSITION: Payload à sauvegarder:', payload);

    if (!evenementId || !coachId || !equipeId) {
      Alert.alert('Erreur', 'Impossible de sauvegarder : infos manquantes !');
      console.error('🎨 COMPOSITION: Données manquantes', { evenementId, coachId, equipeId });
      return;
    }

    try {
      const { data: existing, error: selectError } = await supabase
        .from('compositions')
        .select('id')
        .eq('evenement_id', evenementId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('🎨 COMPOSITION: Erreur select composition:', selectError);
      }

      let result;
      if (existing) {
        console.log('🎨 COMPOSITION: Mise à jour composition existante');
        result = await supabase
          .from('compositions')
          .update({ joueurs: JSON.stringify(payload) })
          .eq('id', existing.id);
      } else {
        console.log('🎨 COMPOSITION: Création nouvelle composition');
        result = await supabase
          .from('compositions')
          .insert({
            evenement_id: evenementId,
            coach_id: coachId,
            equipe_id: equipeId,
            joueurs: JSON.stringify(payload),
          });
      }

      if (result.error) {
        Alert.alert('Erreur', result.error.message ?? 'Échec de la sauvegarde de la composition.');
        console.error('🎨 COMPOSITION: Erreur sauvegarde:', result.error);
      } else {
        Alert.alert('✅ Composition enregistrée');
        console.log('🎨 COMPOSITION: Composition sauvegardée avec succès');
      }
    } catch (error) {
      console.error('🎨 COMPOSITION: Erreur validation:', error);
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde.');
    }
  };

  // Debug info
  const debugInfo = `Présents: ${presents.length} | Absents: ${absents.length} | Indécis: ${indecis.length}`;

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.titre}>📋 Composition</Text>
      
      {/* Debug info */}
      <Text style={styles.debug}>{debugInfo}</Text>

      <View style={styles.haut}>
        <Image source={require('../assets/terrain.png')} style={styles.terrain} resizeMode="contain" />
        <View style={styles.joueurOverlay}>
          {presents.map((player) => {
            const panResponder = createPanResponder(player.id);
            if (!positions[player.id]) {
              console.warn('🎨 COMPOSITION: Position manquante pour', player.nom);
              return null;
            }
            return (
              <Animated.View
                key={player.id}
                style={[positions[player.id].getLayout(), { position: 'absolute', alignItems: 'center' }]}
                {...panResponder.panHandlers}
              >
                <Image source={require('../assets/maillot.png')} style={styles.maillot} resizeMode="contain" />
                <Text style={styles.joueurNom}>
                  {player.nom} {player.poste ? `(${player.poste})` : ''}
                  {player.besoin_transport && <Text style={{ color: '#00bfff', fontSize: 13 }}> 🚗</Text>}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.bouton} onPress={handleValider}>
        <Text style={styles.boutonText}>Valider la composition</Text>
      </TouchableOpacity>

      {/* Absents */}
      {absents.length > 0 && (
        <View style={styles.listeStatut}>
          <Text style={styles.absentTitle}>❌ Absents ({absents.length}) :</Text>
          {absents.map(j => (
            <View key={j.id} style={styles.absentItem}>
              <Image source={require('../assets/maillot.png')} style={styles.maillotAbs} resizeMode="contain" />
              <Text style={styles.absentNom}>
                {j.nom} {j.prenom} {j.poste ? `(${j.poste})` : ''}
                {j.besoin_transport && <Text style={{ color: '#00bfff', fontSize: 13 }}> 🚗</Text>}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Indécis */}
      {indecis.length > 0 && (
        <View style={styles.listeStatut}>
          <Text style={styles.indecisTitle}>❔ Non répondu ({indecis.length}) :</Text>
          {indecis.map(j => (
            <View key={j.id} style={styles.absentItem}>
              <Image source={require('../assets/maillot.png')} style={styles.maillotAbs} resizeMode="contain" />
              <Text style={styles.absentNom}>
                {j.nom} {j.prenom} {j.poste ? `(${j.poste})` : ''}
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
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#000' },
  titre: { color: '#00ff88', fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingTop: 20 },
  debug: { 
    color: '#666', 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 5,
    fontStyle: 'italic' 
  },
  haut: { flex: 1, alignItems: 'flex-start', position: 'relative' },
  terrain: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.5, alignSelf: 'flex-start', marginTop: 20 },
  joueurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  maillot: { width: 40, height: 40 },
  joueurNom: { color: '#fff', fontWeight: '600', fontSize: 10, marginTop: 2, textAlign: 'center' },
  bouton: {
    marginBottom: 15,
    alignSelf: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 6,
  },
  boutonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  listeStatut: { 
    marginTop: 15, 
    backgroundColor: '#161b20', 
    borderRadius: 12, 
    padding: 10, 
    width: '92%', 
    alignSelf: 'center' 
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
