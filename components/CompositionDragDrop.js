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
import { supabase } from '../lib/supabase';

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
      // 1. Récupère l’évènement (coach_id, equipe_id)
      const { data: evt, error: evtError } = await supabase
        .from('evenements')
        .select('equipe_id, coach_id')
        .eq('id', evenementId)
        .single();

      if (evtError || !evt) {
        Alert.alert('Erreur', 'Événement introuvable.');
        return;
      }
      setEquipeId(evt.equipe_id);
      setCoachId(evt.coach_id);

      // 2. Récupère toutes les participations
      const { data: participations, error: partError } = await supabase
        .from('participations_evenement')
        .select('joueur_id, reponse, besoin_transport')
        .eq('evenement_id', evenementId);

      if (partError || !participations) {
        setPresents([]);
        setAbsents([]);
        setIndecis([]);
        return;
      }

      // 3. Trie les joueurs
      const presentsIds = participations.filter(p => p.reponse === 'present').map(p => ({ id: p.joueur_id, besoin_transport: p.besoin_transport }));
      const absentsIds  = participations.filter(p => p.reponse === 'absent').map(p => ({ id: p.joueur_id, besoin_transport: p.besoin_transport }));

      // Récupère tous les joueurs de l’équipe liés à cet événement
      const { data: allJoueurs } = await supabase
        .from('joueurs')
        .select('id, nom, poste')
        .eq('equipe_id', evt.equipe_id);

      // 4. Génère la liste non répondu
      const reponduIds = new Set([...presentsIds, ...absentsIds].map(j => j.id));
      const indecisIds = allJoueurs.filter(j => !reponduIds.has(j.id)).map(j => j.id);

      // 5. Récupère infos complètes pour chaque catégorie
      const presentsInfos = allJoueurs
        .filter(j => presentsIds.map(p => p.id).includes(j.id))
        .map(j => ({
          ...j,
          besoin_transport: presentsIds.find(p => p.id === j.id)?.besoin_transport,
        }));

      const absentsInfos = allJoueurs
        .filter(j => absentsIds.map(p => p.id).includes(j.id))
        .map(j => ({
          ...j,
          besoin_transport: absentsIds.find(p => p.id === j.id)?.besoin_transport,
        }));

      const indecisInfos = allJoueurs
        .filter(j => indecisIds.includes(j.id))
        .map(j => ({
          ...j,
          besoin_transport: false,
        }));

      // 6. (NEW) Récupère la composition sauvegardée si elle existe
      const { data: compo } = await supabase
        .from('compositions')
        .select('joueurs')
        .eq('evenement_id', evenementId)
        .single();

      // 7. Init positions drag&drop pour présents, avec priorité à la compo sauvegardée
      const initPositions = {};
      presentsInfos.forEach((j, i) => {
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
            return;
          }
        }
        // Position par défaut si pas de sauvegarde
        initPositions[j.id] = new Animated.ValueXY({
          x: 30 + (i % 3) * 100,
          y: 60 + Math.floor(i / 3) * 80,
        });
      });

      setPresents(presentsInfos);
      setAbsents(absentsInfos);
      setIndecis(indecisInfos);
      setPositions(initPositions);
    };

    fetchData();
  }, [evenementId]);

  const createPanResponder = (playerId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        positions[playerId].setOffset({
          x: positions[playerId].x._value,
          y: positions[playerId].y._value,
        });
        positions[playerId].setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: positions[playerId].x, dy: positions[playerId].y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        positions[playerId].flattenOffset();
      },
    });

  const handleValider = async () => {
    console.log('→ [handleValider] Appel de la fonction');
    console.log({ evenementId, coachId, equipeId, positions, presents });

    // Construction du payload (positions joueurs)
    const payload = {};
    presents.forEach(j => {
      payload[j.id] = {
        x: positions[j.id]?.x._value,
        y: positions[j.id]?.y._value,
      };
    });

    console.log('Payload à sauvegarder :', payload);

    if (!evenementId || !coachId || !equipeId) {
      Alert.alert('Erreur', 'Impossible de sauvegarder : infos manquantes !');
      console.error('Données manquantes', { evenementId, coachId, equipeId });
      return;
    }

    const { data: existing, error: selectError } = await supabase
      .from('compositions')
      .select('id')
      .eq('evenement_id', evenementId)
      .single();

    if (selectError) console.error('Erreur select composition:', selectError);

    let result;
    if (existing) {
      result = await supabase
        .from('compositions')
        .update({ joueurs: JSON.stringify(payload) })
        .eq('id', existing.id);
    } else {
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
      console.error('Erreur sauvegarde composition :', result.error);
    } else {
      Alert.alert('✅ Composition enregistrée');
      console.log('Composition sauvegardée !', result);
    }
  };

  return (
    <ScrollView style={styles.wrapper}>
      <Text style={styles.titre}>📋 Composition</Text>

      <View style={styles.haut}>
        <Image source={require('../assets/terrain.png')} style={styles.terrain} resizeMode="contain" />
        <View style={styles.joueurOverlay}>
          {presents.map((player) => {
            const panResponder = createPanResponder(player.id);
            return (
              <Animated.View
                key={player.id}
                style={[positions[player.id]?.getLayout(), { position: 'absolute', alignItems: 'center' }]}
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
          <Text style={styles.absentTitle}>❌ Absents :</Text>
          {absents.map(j => (
            <View key={j.id} style={styles.absentItem}>
              <Image source={require('../assets/maillot.png')} style={styles.maillotAbs} resizeMode="contain" />
              <Text style={styles.absentNom}>
                {j.nom} {j.poste ? `(${j.poste})` : ''}
                {j.besoin_transport && <Text style={{ color: '#00bfff', fontSize: 13 }}> 🚗</Text>}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Indécis */}
      {indecis.length > 0 && (
        <View style={styles.listeStatut}>
          <Text style={styles.absentTitle}>❔ Non répondu :</Text>
          {indecis.map(j => (
            <View key={j.id} style={styles.absentItem}>
              <Image source={require('../assets/maillot.png')} style={styles.maillotAbs} resizeMode="contain" />
              <Text style={styles.absentNom}>
                {j.nom} {j.poste ? `(${j.poste})` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#000' },
  titre: { color: '#00ff88', fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingTop: 20 },
  haut: { flex: 1, alignItems: 'flex-start', position: 'relative' },
  terrain: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.5, alignSelf: 'flex-start', marginTop: 20 },
  joueurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  maillot: { width: 40, height: 40 },
  joueurNom: { color: '#fff', fontWeight: '600', fontSize: 10, marginTop: 2 },
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
  listeStatut: { marginTop: 15, backgroundColor: '#161b20', borderRadius: 12, padding: 10, width: '92%', alignSelf: 'center' },
  absentTitle: { color: '#fc2b3a', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  absentItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  maillotAbs: { width: 28, height: 28, marginRight: 8 },
  absentNom: { color: '#fff', fontSize: 13 },
});
