import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import useCacheData from '../../../lib/cache';

export default function FeuilleMatch() {
  const { id } = useLocalSearchParams();

  // Fonction pour fetch la feuille complète (infos + joueurs)
  const fetchFeuilleAll = async () => {
    // Composition
    const { data: compo, error: errCompo } = await supabase
      .from('compositions')
      .select('*')
      .eq('evenement_id', id)
      .single();

    if (errCompo || !compo) throw new Error("Aucune composition trouvée pour cet événement.");

    // Infos event (club/catégorie/coach)
    const { data: evt, error: errEvt } = await supabase
      .from('evenements')
      .select('*, clubs(nom), equipes(nom, categorie), utilisateurs(nom, prenom)')
      .eq('id', id)
      .single();

    if (errEvt || !evt) throw new Error("Événement introuvable.");

    const infoMatch = {
      titre: evt.titre,
      date: evt.date,
      club: evt.clubs?.nom || 'NC',
      categorie: evt.equipes?.categorie || 'NC',
      equipe: evt.equipes?.nom || 'NC',
      coach: evt.utilisateurs ? `${evt.utilisateurs.prenom} ${evt.utilisateurs.nom}` : 'NC',
      meteo: evt.meteo || null,
    };

    // Joueurs dans la compo
    const joueursIds = compo.joueurs ? Object.keys(compo.joueurs) : [];
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

  // Gestion erreur (via cache/hook)
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!loading && !data && !err) setErr("Erreur de chargement ou aucune donnée trouvée.");
  }, [loading, data]);

  const generateHtml = () => {
    if (!joueurs || joueurs.length === 0) {
      return `<p>Aucun joueur dans la composition.</p>`;
    }
    const rows = joueurs.map(
      (j) =>
        `<tr><td>${j.prenom} ${j.nom}</td><td>${j.categorie}</td><td>${j.licence}</td><td>${j.autorise ? '✅' : '❌'}</td></tr>`
    ).join('');

    return `
      <html>
        <body style="font-family: Arial;">
          <h2>Feuille de match - ${infoMatch?.titre}</h2>
          <p><strong>Date :</strong> ${infoMatch?.date}</p>
          <p><strong>Club :</strong> ${infoMatch?.club}</p>
          <p><strong>Catégorie :</strong> ${infoMatch?.categorie}</p>
          <p><strong>Équipe :</strong> ${infoMatch?.equipe}</p>
          <p><strong>Coach :</strong> ${infoMatch?.coach}</p>
          ${infoMatch?.meteo ? `<p><strong>Météo :</strong> ${infoMatch?.meteo}</p>` : ''}
          <br />
          <table border="1" cellspacing="0" cellpadding="5" style="width: 100%;">
            <thead>
              <tr><th>Joueur</th><th>Catégorie</th><th>Licence</th><th>Décharge</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
  };

  const imprimerFeuille = async () => {
    const html = generateHtml();
    const { uri } = await Print.printToFileAsync({
      html,
      orientation: 'landscape',
    });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
  if (err) return (
    <View style={styles.container}>
      <Text style={styles.empty}>{err}</Text>
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

      <TouchableOpacity style={styles.button} onPress={imprimerFeuille}>
        <Text style={styles.buttonText}>📄 Imprimer / Télécharger en PDF</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { marginTop: 10, backgroundColor: '#222' }]} onPress={refresh}>
        <Text style={[styles.buttonText, { color: '#00ff88' }]}>🔄 Actualiser les données</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 4,
  },
  date: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  detail: {
    color: '#ccc',
    fontSize: 14,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
