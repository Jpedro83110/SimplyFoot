import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function JoueurDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // --- INFOS JOUEUR ET UTILISATEUR ---
  const [joueur, setJoueur] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- SUIVI PERSONNALISÉ ---
  const [suivi, setSuivi] = useState(null);
  const [newSuivi, setNewSuivi] = useState({ point_fort: '', axe_travail: '' });
  const [saving, setSaving] = useState(false);

  // 🔧 FONCTION DE RECHARGEMENT COMPLÈTE
  const fetchAll = async () => {
    setLoading(true);

    try {
      // 1. Charger joueur (table joueurs)
      const { data: j, error: e1 } = await supabase
        .from('joueurs')
        .select('*')
        .eq('id', id)
        .single();

      if (e1) {
        console.error('Erreur joueur:', e1);
      }

      // 2. Charger utilisateur lié
      let u = null;
      if (j) {
        const { data: util } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('joueur_id', j.id)
          .single();
        u = util;
      }

      setJoueur(j || null);
      setUtilisateur(u || null);

      // 3. Charger suivi personnalisé du coach connecté
      const { data: sessionData } = await supabase.auth.getSession();
      const coachId = sessionData?.session?.user?.id;
      
      if (coachId) {
        // 🎯 CORRECTION : Utiliser toujours l'ID de l'utilisateur pour les suivis
        const utilisateurId = u?.id;
        
        if (utilisateurId) {
          const { data: suiviData } = await supabase
            .from('suivis_personnalises')
            .select('*')
            .eq('joueur_id', utilisateurId) // ID utilisateur, pas ID joueur
            .eq('coach_id', coachId)
            .single();
          
          setSuivi(suiviData || null);
          
          // Pré-remplir les champs avec les données existantes
          if (suiviData) {
            setNewSuivi({
              point_fort: suiviData.point_fort || '',
              axe_travail: suiviData.axe_travail || ''
            });
          }
        } else {
          console.warn('Aucun utilisateur trouvé pour ce joueur');
          setSuivi(null);
        }
      } else {
        setSuivi(null);
      }
    } catch (error) {
      console.error('Erreur générale:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  // --- Ajouter / MAJ suivi personnalisé ---
  const ajouterOuMajSuivi = async () => {
    if (!newSuivi.point_fort?.trim() && !newSuivi.axe_travail?.trim()) {
      Alert.alert('Information', 'Veuillez remplir au moins un champ (point fort ou axe de travail)');
      return;
    }
    
    setSaving(true);

    try {
      // Récupérer l'id du coach connecté
      const { data: sessionData } = await supabase.auth.getSession();
      const coachId = sessionData?.session?.user?.id;

      if (!coachId) {
        Alert.alert('Erreur', 'Utilisateur non identifié.');
        setSaving(false);
        return;
      }

      // 🎯 SOLUTION SIMPLE : Utiliser l'ID utilisateur directement
      const utilisateurId = utilisateur?.id;
      
      if (!utilisateurId) {
        Alert.alert('Erreur', 'Aucun utilisateur associé à ce joueur. Impossible de sauvegarder le suivi.');
        setSaving(false);
        return;
      }

      console.log('💾 Sauvegarde suivi:', {
        joueur_id: utilisateurId, // ID utilisateur
        coach_id: coachId,
        point_fort: newSuivi.point_fort,
        axe_travail: newSuivi.axe_travail
      });

      // Sauvegarder avec l'ID utilisateur
      const { data, error } = await supabase
        .from('suivis_personnalises')
        .upsert({
          joueur_id: utilisateurId, // Toujours l'ID utilisateur
          coach_id: coachId,
          point_fort: newSuivi.point_fort.trim(),
          axe_travail: newSuivi.axe_travail.trim(),
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'joueur_id,coach_id',
          ignoreDuplicates: false 
        })
        .select();

      setSaving(false);

      if (error) {
        console.error('Erreur sauvegarde:', error);
        Alert.alert('Erreur', `Impossible de sauvegarder: ${error.message}`);
      } else {
        console.log('✅ Suivi sauvegardé:', data);
        Alert.alert('✅ Succès', 'Suivi personnalisé mis à jour !');
        
        // Recharger toutes les données
        await fetchAll();
      }
    } catch (error) {
      console.error('Erreur générale sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      setSaving(false);
    }
  };

  // 🔧 CORRECTION : Fonction de suppression du suivi
  const supprimerSuivi = async () => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce suivi personnalisé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const coachId = sessionData?.session?.user?.id;
            
            if (coachId && utilisateur?.id) {
              const { error } = await supabase
                .from('suivis_personnalises')
                .delete()
                .eq('joueur_id', utilisateur.id) // Toujours l'ID utilisateur
                .eq('coach_id', coachId);
              
              if (error) {
                Alert.alert('Erreur', error.message);
              } else {
                setNewSuivi({ point_fort: '', axe_travail: '' });
                setSuivi(null);
                Alert.alert('✅ Supprimé', 'Suivi personnalisé supprimé');
              }
            }
          }
        }
      ]
    );
  };

  if (loading || !joueur)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../../assets/avatar.png')} style={styles.avatar} />
      <Text style={styles.title}>
        {(utilisateur?.prenom || joueur.prenom) + ' ' + (utilisateur?.nom || joueur.nom)}
      </Text>
      <Text style={styles.subtitle}>Poste : {joueur.poste}</Text>

      <View style={styles.statsBlock}>
        <Text style={styles.statsTitle}>📊 Statistiques</Text>
        <Text style={styles.statLine}>Matchs joués : {joueur.matchs || 0}</Text>
        <Text style={styles.statLine}>Buts : {joueur.buts || 0}</Text>
        <Text style={styles.statLine}>Passes décisives : {joueur.passes || 0}</Text>
      </View>

      <View style={styles.followUpBlock}>
        <Text style={styles.statsTitle}>📘 Suivi personnalisé</Text>

        <Text style={styles.label}>🟢 Point fort</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Très bon positionnement défensif"
          placeholderTextColor="#888"
          value={newSuivi.point_fort}
          onChangeText={(text) => setNewSuivi((prev) => ({ ...prev, point_fort: text }))}
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>🔴 À travailler</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Doit améliorer sa réactivité défensive"
          placeholderTextColor="#888"
          value={newSuivi.axe_travail}
          onChangeText={(text) => setNewSuivi((prev) => ({ ...prev, axe_travail: text }))}
          multiline
          numberOfLines={2}
        />

        {/* 🔧 BOUTONS D'ACTION */}
        <View style={styles.buttonRow}>
          <Pressable onPress={ajouterOuMajSuivi} style={styles.button} disabled={saving}>
            <Text style={styles.buttonText}>
              {saving ? 'Enregistrement...' : suivi ? 'Mettre à jour' : 'Ajouter'}
            </Text>
          </Pressable>

          {suivi && (
            <Pressable onPress={supprimerSuivi} style={[styles.button, styles.deleteButton]}>
              <Text style={[styles.buttonText, { color: '#fff' }]}>🗑️ Supprimer</Text>
            </Pressable>
          )}
        </View>

        {/* 🔧 AFFICHAGE DU SUIVI EXISTANT */}
        {suivi && (
          <View style={styles.suiviCard}>
            <Text style={styles.suiviText}>
              📅 Dernière mise à jour : {suivi.updated_at?.split('T')[0] || suivi.created_at?.split('T')[0] || 'Date inconnue'}
            </Text>
            {suivi.point_fort ? (
              <Text style={[styles.suiviContenu, { color: '#00ff88' }]}>
                🟢 Point fort : {suivi.point_fort}
              </Text>
            ) : null}
            {suivi.axe_travail ? (
              <Text style={[styles.suiviContenu, { color: '#ff5555' }]}>
                🔴 À travailler : {suivi.axe_travail}
              </Text>
            ) : null}
          </View>
        )}

        <Pressable
          style={[styles.button, { backgroundColor: '#222', marginTop: 10 }]}
          onPress={fetchAll}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: '#00ff88' }]}>
            {loading ? 'Chargement...' : '🔄 Actualiser'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: '#003322', alignSelf: 'stretch', marginBottom: 10 }]}
        onPress={() => router.push(`/coach/evaluation-mentale/${id}`)}
      >
        <Text style={[styles.buttonText, { color: '#00ff88', textAlign: 'center' }]}>
          🧠 Évaluer le mental
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: '#220033', alignSelf: 'stretch', marginBottom: 40 }]}
        onPress={() => router.push(`/coach/evaluation-technique/${id}`)}
      >
        <Text style={[styles.buttonText, { color: '#ff00ff', textAlign: 'center' }]}>
          🎯 Évaluer la technique
        </Text>
      </Pressable>

      <Text style={styles.idLine}>ID joueur : #{id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 30,
    alignItems: 'center',
    minHeight: '100%',
  },
  loadingContainer: {
    backgroundColor: '#121212',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  title: {
    fontSize: 26,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 6,
  },
  statsBlock: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  followUpBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  statsTitle: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  statLine: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  idLine: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#444',
    borderWidth: 1,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 14,
  },
  suiviCard: {
    backgroundColor: '#292929',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff88',
  },
  suiviText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  suiviContenu: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 5,
  },
});