import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

export default function ListeFeuillesMatch() {
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('evenements')
        .select('id, titre, date, heure, lieu, compositions(id)')
        .order('date', { ascending: false });

      if (!error) {
        setEvenements(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;
  if (!evenements.length)
    return <Text style={styles.empty}>Aucun événement trouvé.</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📝 Feuilles de match</Text>
      {evenements.map(evt => {
        const hasCompo = evt.compositions && evt.compositions.length > 0;
        return (
          <TouchableOpacity
            key={evt.id}
            style={[styles.card, !hasCompo && { opacity: 0.5 }]}
            onPress={() => router.push(`/coach/feuille-match/${evt.id}`)}
          >
            <Text style={styles.label}>{evt.titre}</Text>
            <Text style={styles.detail}>📅 {evt.date} {evt.heure}</Text>
            <Text style={styles.detail}>📍 {evt.lieu}</Text>
            <Text style={[styles.detail, { fontWeight: 'bold', marginTop: 8 }]}>
              {hasCompo ? "✅ Composition validée" : "⏳ En attente de validation de compo"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#121212", flex: 1, padding: 20 },
  title: { color: "#00ff88", fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#00ff88",
  },
  label: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  detail: { color: "#ccc", fontSize: 14, marginTop: 2 },
  empty: { color: "#888", textAlign: "center", marginTop: 40, fontStyle: "italic", fontSize: 15 },
});
