import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import useCacheData from '../../../lib/cache';

export default function FeuilleMatch() {
  const { id } = useLocalSearchParams();

  // Nouvelle version : message UX si pas de compo
  const fetchFeuilleAll = async () => {
    // 1. Composition
    const { data: compo, error: errCompo } = await supabase
      .from('compositions')
      .select('*')
      .eq('evenement_id', id)
      .single();

    if (errCompo || !compo) return { error: "Aucune composition validée pour cet événement." };

    // 2. Parse joueurs
    let joueursRaw = compo.joueurs;
    if (typeof joueursRaw === "string") {
      try {
        joueursRaw = JSON.parse(joueursRaw);
      } catch { joueursRaw = {}; }
    }
    const joueursIds = joueursRaw ? Object.keys(joueursRaw) : [];

    // 3. Infos event
    const { data: evt, error: errEvt } = await supabase
      .from('evenements')
      .select('*, clubs(nom), equipes(nom, categorie)')
      .eq('id', id)
      .single();

    if (errEvt || !evt) return { error: "Événement introuvable." };

    // 4. Coach
    let coachName = "NC";
    if (evt.coach_id) {
      const { data: coach } = await supabase
        .from('utilisateurs')
        .select('nom, prenom')
        .eq('id', evt.coach_id)
        .single();
      if (coach) coachName = `${coach.prenom} ${coach.nom}`;
    }

    const infoMatch = {
      titre: evt.titre,
      date: evt.date,
      club: evt.clubs?.nom || 'NC',
      categorie: evt.equipes?.categorie || 'NC',
      equipe: evt.equipes?.nom || 'NC',
      coach: coachName,
      meteo: evt.meteo || null,
    };

    // 5. Joueurs de la compo
    const joueursInfos = await Promise.all(
      joueursIds.map(async (jid) => {
        const { data: j } = await supabase
          .from('joueurs')
          .select('nom, prenom, categorie, numero_licence')
          .eq('id', jid)
          .single();

        const { data: d } = await supabase
          .from('decharges_generales')
          .select('accepte_transport')
          .eq('joueur_id', jid)
          .single();

        return {
          prenom: j?.prenom || '',
          nom: j?.nom || '',
          categorie: j?.categorie || '',
          licence: j?.numero_licence || '',
          autorise: d?.accepte_transport ?? false,
        };
      })
    );
    return { joueurs: joueursInfos, infoMatch };
  };

  // --- CACHE ---
  const [data, refresh, loading] = useCacheData(`feuille-match-${id}`, fetchFeuilleAll, 1800); // TTL 30min
  const joueurs = data?.joueurs || [];
  const infoMatch = data?.infoMatch || {};
  const error = data?.error || null;

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
  if (error) return (
    <View style={styles.container}>
      <Text style={styles.empty}>{error}</Text>
      <TouchableOpacity style={styles.button} onPress={refresh}>
        <Text style={styles.buttonText}>🔄 Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📝 Feuille de match</Text>
      <Text style={styles.subtitle}>{infoMatch?.titre}</Text>
      <Text style={styles.date}>{infoMatch?.date}</Text>
      {infoMatch?.meteo && (
        <Text style={styles.date}>☀️ Météo prévue : {infoMatch.meteo}</Text>
      )}
      <Text style={styles.detail}>Club : {infoMatch?.club}</Text>
      <Text style={styles.detail}>Catégorie : {infoMatch?.categorie}</Text>
      <Text style={styles.detail}>Équipe : {infoMatch?.equipe}</Text>
      <Text style={styles.detail}>Coach : {infoMatch?.coach}</Text>

      {joueurs.map((j, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>{j.prenom} {j.nom}</Text>
          <Text style={styles.detail}>Catégorie : {j.categorie}</Text>
          <Text style={styles.detail}>N° Licence : {j.licence}</Text>
          <Text style={[styles.detail, { color: j.autorise ? '#0f0' : '#ff4d4d' }]}>
            Décharge transport : {j.autorise ? '✅ Oui' : '❌ Non'}
          </Text>
        </View>
      ))}

      {joueurs.length === 0 && (
        <Text style={styles.empty}>Aucun joueur dans la composition.</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={refresh}>
        <Text style={styles.buttonText}>📄 Imprimer / Télécharger en PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#121212', flex: 1, padding: 20 },
  title: { fontSize: 24, color: '#00ff88', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#fff', textAlign: 'center', fontSize: 18, marginBottom: 4 },
  date: { color: '#ccc', textAlign: 'center', marginBottom: 10 },
  card: {
    backgroundColor: '#1e1e1e', padding: 15, borderRadius: 10, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#00ff88',
  },
  label: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  detail: { color: '#ccc', fontSize: 14 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
