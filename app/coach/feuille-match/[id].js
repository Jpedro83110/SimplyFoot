import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, useWindowDimensions
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import useCacheData from '../../../lib/cache';

export default function FeuilleMatch() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [customDate, setCustomDate] = useState('');
  const [customLieu, setCustomLieu] = useState('');
  const [customAdversaire, setCustomAdversaire] = useState('');
  const [signCoach, setSignCoach] = useState('');
  const [signArbitre, setSignArbitre] = useState('');
  const [signClubAdv, setSignClubAdv] = useState('');
  const [signDate, setSignDate] = useState('');

  const fetchFeuilleAll = async () => {
    const { data: compos } = await supabase
      .from('compositions')
      .select('*')
      .eq('evenement_id', id)
      .limit(1);
    if (!compos || compos.length === 0) {
      return { error: "Aucune composition validée pour cet événement." };
    }
    const compo = compos[0];
    let joueursRaw = compo.joueurs;
    if (typeof joueursRaw === "string") {
      try { joueursRaw = JSON.parse(joueursRaw); } catch { joueursRaw = {}; }
    }
    const { data: evt } = await supabase
      .from('evenements')
      .select('*')
      .eq('id', id)
      .single();
    if (!evt) return { error: "Événement introuvable." };
    let nomEquipe = 'NC', nomCategorie = 'NC';
    if (evt.equipe_id) {
      const { data: eq } = await supabase
        .from('equipes')
        .select('nom, categorie')
        .eq('id', evt.equipe_id)
        .single();
      if (eq) { nomEquipe = eq.nom; nomCategorie = eq.categorie; }
    }
    let coachName = "NC", coachPrenom = "";
    if (evt.coach_id) {
      const { data: coach } = await supabase
        .from('utilisateurs')
        .select('nom, prenom')
        .eq('id', evt.coach_id)
        .single();
      if (coach) { coachName = coach.nom; coachPrenom = coach.prenom; }
    }
    const { data: participations } = await supabase
      .from('participations_evenement')
      .select('joueur_id')
      .eq('evenement_id', id)
      .eq('reponse', 'present');
    const presentsIds = participations.map(p => p.joueur_id);
    const joueursInfos = await Promise.all(
      presentsIds.map(async (jid) => {
        const { data: j } = await supabase
          .from('joueurs')
          .select('nom, prenom, numero_licence, date_naissance')
          .eq('id', jid)
          .single();
        let age = '';
        if (j?.date_naissance) {
          const birth = new Date(j.date_naissance);
          const now = new Date();
          age = now.getFullYear() - birth.getFullYear();
        }
        return {
          prenom: j?.prenom || '',
          nom: j?.nom || '',
          licence: j?.numero_licence || '',
          age: age || '',
        };
      })
    );
    joueursInfos.sort((a, b) =>
      (a.nom + a.prenom).localeCompare(b.nom + b.prenom)
    );
    const joueursA = joueursInfos.slice(0, 12);
    return {
      joueurs: joueursA,
      infoMatch: {
        titre: evt.titre,
        date: evt.date,
        lieu: evt.lieu,
        equipe: nomEquipe,
        categorie: nomCategorie,
        coach: `${coachPrenom} ${coachName}`,
        adversaire: evt.adversaire || "",
      }
    };
  };

  const [data, refresh, loading] = useCacheData(`feuille-match-${id}`, fetchFeuilleAll, 1800);
  const joueurs = data?.joueurs || [];
  const infoMatch = data?.infoMatch || {};
  const error = data?.error || null;
  const displayDate = customDate || infoMatch?.date || '';
  const displayLieu = customLieu || infoMatch?.lieu || '';
  const displayAdversaire = customAdversaire || infoMatch?.adversaire || '';
  const columns = ['Nom', 'Prénom', 'Âge', 'Licence'];
  const MAX_J = 12;
  const isMobile = width < 700;

  // Impression
  const handlePrint = async () => {
    const myRows = [];
    for (let i = 0; i < MAX_J; i++) {
      const j = joueurs[i] || {};
      myRows.push(`
        <tr>
          <td style="border:1.5px solid #222;padding:14px;min-width:105px;height:32px;font-size:16px;">${j.nom || ''}</td>
          <td style="border:1.5px solid #222;padding:14px;min-width:105px;">${j.prenom || ''}</td>
          <td style="border:1.5px solid #222;padding:14px;min-width:58px;">${j.age || ''}</td>
          <td style="border:1.5px solid #222;padding:14px;min-width:94px;">${j.licence || ''}</td>
        </tr>
      `);
    }
    const myRowsAdv = [];
    for (let i = 0; i < MAX_J; i++) {
      myRowsAdv.push(`
        <tr>
          <td style="border:1.5px solid #222;padding:14px;min-width:105px;height:32px;"></td>
          <td style="border:1.5px solid #222;padding:14px;min-width:105px;"></td>
          <td style="border:1.5px solid #222;padding:14px;min-width:58px;"></td>
          <td style="border:1.5px solid #222;padding:14px;min-width:94px;"></td>
        </tr>
      `);
    }
    const html = `
      <style>
        body { font-family: Arial, sans-serif; color:#222; }
        h2 { color: #005faa; text-align:center; }
        th, td { font-size: 16px; }
        .infoswrap { display: flex; flex-direction: row; justify-content: space-between; margin-bottom:20px; }
        .infos { font-size: 16px; }
        .signatures { font-size: 15px; min-width: 290px; margin-left: 40px; }
        .signLabel { font-weight:bold; margin-top:10px; }
        .signBox { border-bottom:1.4px solid #888; width:80%; height:26px; display:inline-block; margin-bottom:10px; }
        .double { display:flex; flex-direction:row; justify-content:space-between; gap:38px; }
        .tableBlock { width:48%; }
        .tableBlock table { width:100%; border-collapse:collapse; margin-bottom: 16px; }
        .tableBlock th { background:#222; color:#fff; padding:8px; font-size:16px; }
        .tableBlock tr { background:#fff; }
        .tableBlock td { background:#f9f9f9; }
        @media print {
          .infoswrap { flex-direction: row; }
          .double { flex-direction:row; }
        }
      </style>
      <h2>Feuille de Match Officielle</h2>
      <div class="infoswrap">
        <div class="infos">
          <b>Date :</b> ${displayDate} &nbsp; | &nbsp; <b>Lieu :</b> ${displayLieu}<br>
          <b>Équipe :</b> ${infoMatch.equipe} &nbsp; | &nbsp; <b>Catégorie :</b> ${infoMatch.categorie}<br>
          <b>Coach :</b> ${infoMatch.coach}<br>
          <b>Adversaire :</b> ${displayAdversaire || "_________________"}
        </div>
        <div class="signatures">
          <div class="signLabel">Coach : <span class="signBox">${signCoach}</span></div><br>
          <div class="signLabel">Arbitre : <span class="signBox">${signArbitre}</span></div><br>
          <div class="signLabel">Représentant club adverse : <span class="signBox">${signClubAdv}</span></div><br>
          <div class="signLabel">Date : <span class="signBox">${signDate}</span></div>
        </div>
      </div>
      <div class="double">
        <div class="tableBlock">
          <table>
            <tr><th colspan="4">${infoMatch.equipe}</th></tr>
            <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
            ${myRows.join("")}
          </table>
        </div>
        <div class="tableBlock">
          <table>
            <tr><th colspan="4">Adversaire : ${displayAdversaire || "_________"}</th></tr>
            <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
            ${myRowsAdv.join("")}
          </table>
        </div>
      </div>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { }
  };

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
      <View style={[styles.headerWrap, isMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <View style={styles.infosCol}>
          <View style={styles.row}>
            <Text style={styles.detail}>Date :</Text>
            <TextInput value={customDate} onChangeText={setCustomDate}
              placeholder={infoMatch?.date ? infoMatch.date.split('T')[0] : "JJ/MM/AAAA"}
              style={[styles.input, { width: 110, color: '#fff', backgroundColor: isMobile ? "#333" : "#161616" }]}
              placeholderTextColor="#fff" />
            <Text style={styles.detail}>Lieu :</Text>
            <TextInput value={customLieu} onChangeText={setCustomLieu}
              placeholder={infoMatch?.lieu || "Lieu"}
              style={[styles.input, { width: 210, color: '#fff', backgroundColor: isMobile ? "#333" : "#161616" }]}
              placeholderTextColor="#fff" />
          </View>
          <Text style={styles.detail}>Équipe : {infoMatch?.equipe}</Text>
          <Text style={styles.detail}>Catégorie : {infoMatch?.categorie}</Text>
          <Text style={styles.detail}>Coach : {infoMatch?.coach}</Text>
          <View style={styles.row}>
            <Text style={styles.detail}>Adversaire :</Text>
            <TextInput value={customAdversaire} onChangeText={setCustomAdversaire}
              placeholder={infoMatch?.adversaire || "Adversaire"}
              style={[styles.input, { width: 210, color: '#fff', backgroundColor: isMobile ? "#333" : "#161616" }]}
              placeholderTextColor="#fff" />
          </View>
        </View>
        <View style={styles.signaturesCol}>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Coach :</Text>
            <TextInput value={signCoach} onChangeText={setSignCoach} style={[styles.signatureBox, isMobile && { color: '#fff', backgroundColor: "#333" }]} placeholderTextColor="#fff" />
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Arbitre :</Text>
            <TextInput value={signArbitre} onChangeText={setSignArbitre} style={[styles.signatureBox, isMobile && { color: '#fff', backgroundColor: "#333" }]} placeholderTextColor="#fff" />
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Représentant club adverse :</Text>
            <TextInput value={signClubAdv} onChangeText={setSignClubAdv} style={[styles.signatureBox, isMobile && { color: '#fff', backgroundColor: "#333" }]} placeholderTextColor="#fff" />
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>Date :</Text>
            <TextInput value={signDate} onChangeText={setSignDate} style={[styles.signatureBox, isMobile && { color: '#fff', backgroundColor: "#333" }]} placeholderTextColor="#fff" />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handlePrint}>
        <Text style={styles.buttonText}>📄 Imprimer / Télécharger en PDF</Text>
      </TouchableOpacity>
      <View style={[styles.tablesWrap, isMobile && { flexDirection: 'column' }]}>
        <View style={styles.tableBlock}>
          <View style={styles.headerRow}><Text style={styles.headerCell}>{infoMatch.equipe}</Text></View>
          <View style={styles.subHeaderRow}>
            {columns.map((col, i) => (
              <Text key={'colA-'+i} style={styles.cellHeader}>{col}</Text>
            ))}
          </View>
          {Array.from({ length: MAX_J }).map((_, idx) => (
            <View key={'team-'+idx} style={styles.dataRow}>
              <Text style={styles.cell}>{joueurs[idx]?.nom || ""}</Text>
              <Text style={styles.cell}>{joueurs[idx]?.prenom || ""}</Text>
              <Text style={styles.cell}>{joueurs[idx]?.age || ""}</Text>
              <Text style={styles.cell}>{joueurs[idx]?.licence || ""}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tableBlock}>
          <View style={styles.headerRow}><Text style={styles.headerCell}>Adversaire : {displayAdversaire || "_________"}</Text></View>
          <View style={styles.subHeaderRow}>
            {columns.map((col, i) => (
              <Text key={'colAdv-'+i} style={styles.cellHeader}>{col}</Text>
            ))}
          </View>
          {Array.from({ length: MAX_J }).map((_, idx) => (
            <View key={'adv-'+idx} style={styles.dataRow}>
              <Text style={styles.cell}></Text>
              <Text style={styles.cell}></Text>
              <Text style={styles.cell}></Text>
              <Text style={styles.cell}></Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#121212', flex: 1, padding: 20 },
  title: { fontSize: 24, color: '#00ff88', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  headerWrap: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infosCol: { flex: 1, minWidth: 240 },
  signaturesCol: { minWidth: 240, marginLeft: 32 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, flexWrap:'wrap' },
  detail: { color: '#ccc', fontSize: 16, marginRight: 8, marginVertical:2 },
  input: { borderBottomWidth: 1, borderBottomColor: '#aaa', color: '#fff', marginHorizontal: 8, textAlign: 'center', fontSize: 16, backgroundColor: '#161616', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  tablesWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  tableBlock: { flex: 1, borderWidth: 1.5, borderColor: '#00ff88', borderRadius: 8, marginBottom: 24, overflow:'hidden', backgroundColor: '#181818' },
  headerRow: { flexDirection: 'row', backgroundColor: '#222' },
  headerCell: { color: '#fff', fontWeight: 'bold', fontSize: 18, textAlign: 'center', flex:1, paddingVertical: 10 },
  subHeaderRow: { flexDirection: 'row', backgroundColor: '#444' },
  cellHeader: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', flex: 1, paddingVertical: 8 },
  dataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#222', minHeight: 36 },
  cell: { color: '#fff', paddingVertical: 10, paddingHorizontal: 8, fontSize: 16, textAlign: 'center', flex: 1, borderRightWidth: 0.5, borderColor: '#222' },
  signatureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  signatureLabel: { color: '#ccc', minWidth: 100, fontWeight: 'bold', fontSize: 15, marginRight: 8 },
  signatureBox: { borderBottomWidth: 1, borderBottomColor: '#fff', flex: 1, height: 32, color: '#fff', paddingHorizontal: 8, marginLeft: 8, fontSize: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 15 },
});
