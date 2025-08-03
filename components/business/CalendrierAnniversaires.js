import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Dimensions, ScrollView, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import vacancesScolaires from '../../lib/vacancesScolaires';

LocaleConfig.locales['fr'] = {
  monthNames: [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ],
  monthNamesShort: [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
  ],
  dayNames: [
    'dimanche', 'lundi', 'mardi', 'mercredi',
    'jeudi', 'vendredi', 'samedi'
  ],
  dayNamesShort: [
    'di', 'lu', 'ma', 'me', 'je', 've', 'sa'
  ],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

const ZONES = ['A', 'B', 'C'];
const VACANCES_COLORS = { A: '#00ffd055', B: '#00bfff55', C: '#ff00cc55' };
const DOT_COLOR = '#00ff88';

export default function CalendrierAnniversaires({ membres, zoneInitiale = 'B' }) {
  const [zone, setZone] = useState(zoneInitiale);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [annivList, setAnnivList] = useState([]);
  const [selectedAnniv, setSelectedAnniv] = useState(null);

  useEffect(() => {
    setLoading(true);
    const now = new Date();
    const year = now.getFullYear();
    let annivs = {};
    let annivTab = [];

    membres.forEach(m => {
      if (!m.date_naissance) return;
      const date = new Date(m.date_naissance);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      annivs[key] = {
        selected: true,
        selectedColor: '#00ff88',
        marked: true,
        disableTouchEvent: false
      };
      let annivDate = new Date(year, date.getMonth(), date.getDate());
      if (annivDate < now) annivDate.setFullYear(year + 1);
      const joursRestants = Math.ceil((annivDate - now) / (1000 * 3600 * 24));
      annivTab.push({
        ...m,
        date: key,
        joursRestants,
      });
    });
    annivTab = annivTab.sort((a, b) => a.joursRestants - b.joursRestants);

    // Vacances scolaires
    const vacances = vacancesScolaires[zone];
    let vacancesMap = {};
    vacances.forEach(v => {
      let start = new Date(v.debut);
      let end = new Date(v.fin);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        vacancesMap[key] = {
          ...(vacancesMap[key] || {}),
          customStyles: {
            container: {
              backgroundColor: VACANCES_COLORS[zone],
              borderRadius: 16,
              borderWidth: 0,
              margin: 0.5,
            },
            text: { color: '#181f22', fontWeight: 'bold' },
          }
        };
      }
    });

    // Fusion anniversaires + vacances
    let allMarked = { ...vacancesMap };
    Object.entries(annivs).forEach(([key, value]) => {
      allMarked[key] = {
        ...(allMarked[key] || {}),
        ...value,
      };
    });

    setMarkedDates(allMarked);
    setAnnivList(annivTab);
    setLoading(false);
  }, [membres, zone]);

  // Sélection jour anniversaire sur calendrier
  const handleDayPress = (day) => {
    const found = annivList.find(m => m.date === day.dateString);
    setSelectedAnniv(found || null);
  };

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth < 600 ? '98%' : 520;

  if (loading) return <ActivityIndicator color={DOT_COLOR} style={{ margin: 40 }} />;

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: 30, paddingBottom: 60, backgroundColor: '#111417', minHeight: '100%' }}>
      <View style={[styles.container, { maxWidth: containerWidth }]}>
        {/* Sélecteur de zone chromé */}
        <View style={styles.zoneRow}>
          <Text style={styles.zoneLabel}>Zone scolaire :</Text>
          {ZONES.map(z => (
            <TouchableOpacity
              key={z}
              style={[styles.zoneBtn, zone === z && styles.zoneBtnActive]}
              onPress={() => setZone(z)}
            >
              <Text style={zone === z ? styles.zoneBtnActiveTxt : styles.zoneBtnTxt}>{z}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Calendrier */}
        <Calendar
          style={styles.calendar}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#15181c',
            calendarBackground: '#15181c',
            textSectionTitleColor: '#70ffb8',
            selectedDayBackgroundColor: '#00ffcc',
            selectedDayTextColor: '#111',
            todayTextColor: '#00ff88',
            dayTextColor: '#fff',
            monthTextColor: '#80f2ff',
            arrowColor: '#00ff88',
            textDayFontWeight: '600',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '700',
            textDayFontSize: 17,
            textMonthFontSize: 21,
            textDayHeaderFontSize: 15,
            'stylesheet.calendar.header': {
              monthText: { color: '#00ff88', fontSize: 22, fontWeight: '700' }
            }
          }}
          onDayPress={handleDayPress}
        />

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: DOT_COLOR, shadowColor: DOT_COLOR, shadowOpacity: 0.6, shadowRadius: 8 }]} />
            <Text style={styles.legendText}>Anniversaire</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.square, { backgroundColor: VACANCES_COLORS[zone], borderColor: '#00ff88' }]} />
            <Text style={styles.legendText}>Vacances zone {zone}</Text>
          </View>
        </View>

        <View style={{ borderTopWidth: 1.5, borderTopColor: '#222d', marginVertical: 12, width: '98%', alignSelf: 'center' }} />

        {/* Popup anniversaire sélectionné */}
        {selectedAnniv && (
          <Pressable style={{ marginBottom: 8, width: '100%' }} onPress={() => setSelectedAnniv(null)}>
            <View style={[styles.card, { borderWidth: 2, borderColor: '#00ff88', backgroundColor: '#172023', marginBottom: 12 }]}>
              <Image
                source={{
                  uri:
                    selectedAnniv.photo_url && selectedAnniv.photo_url.trim() !== ''
                      ? selectedAnniv.photo_url
                      : 'https://ui-avatars.com/api/?name=' +
                        encodeURIComponent(`${selectedAnniv.prenom || ''} ${selectedAnniv.nom || ''}`) +
                        '&background=222&color=fff&rounded=true'
                }}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>
                  {selectedAnniv.prenom} {selectedAnniv.nom} <Text style={styles.role}>({selectedAnniv.role})</Text>
                </Text>
                <Text style={styles.date}>
                  🎂 {selectedAnniv.date.slice(8, 10)}/{selectedAnniv.date.slice(5, 7)} — dans {selectedAnniv.joursRestants} jour{selectedAnniv.joursRestants > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Liste anniversaire défilante */}
        <Text style={styles.listTitle}>🎉 Anniversaires à venir</Text>
        <View style={{ width: '100%' }}>
          {annivList.length === 0
            ? <Text style={{ color: '#fff', margin: 10 }}>Aucun anniversaire à venir.</Text>
            : annivList.map(m => (
                <View style={styles.card} key={m.id}>
                  <Image
                    source={{
                      uri:
                        m.photo_url && m.photo_url.trim() !== ''
                          ? m.photo_url
                          : 'https://ui-avatars.com/api/?name=' +
                            encodeURIComponent(`${m.prenom || ''} ${m.nom || ''}`) +
                            '&background=222&color=fff&rounded=true'
                    }}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nom}>
                      {m.prenom} {m.nom} <Text style={styles.role}>({m.role})</Text>
                    </Text>
                    <Text style={styles.date}>
                      🎂 {m.date.slice(8, 10)}/{m.date.slice(5, 7)} — dans {m.joursRestants} jour{m.joursRestants > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              ))
          }
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: {
    minHeight: '100%',
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#111417',
    paddingVertical: 12,
  },
  container: {
    backgroundColor: 'rgba(18,22,27,0.97)',
    borderRadius: 26,
    padding: 14,
    shadowColor: '#00ff88',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    marginBottom: 30,
    marginTop: 4,
    width: '98%',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1c2330',
    ...Platform.select({
      web: { backdropFilter: 'blur(3.5px)' },
      default: {}
    })
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    marginTop: 3,
    justifyContent: 'center',
    width: '100%'
  },
  zoneLabel: {
    color: '#80f2ff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 11,
    letterSpacing: 1
  },
  zoneBtn: {
    backgroundColor: '#1b2226',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 42
  },
  zoneBtnActive: {
    borderColor: '#00ff88',
    backgroundColor: '#111c18',
    shadowColor: '#00ff88',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2
  },
  zoneBtnTxt: { color: '#00ffcc', fontWeight: '600', fontSize: 17, textAlign: 'center' },
  zoneBtnActiveTxt: { color: '#fff', fontWeight: '700', fontSize: 18, textAlign: 'center' },

  calendar: {
    borderRadius: 23,
    overflow: 'hidden',
    marginBottom: 10,
    marginTop: 3,
    boxShadow: '0 4px 22px #00ff8840',
    width: '100%',
    minWidth: 270,
    maxWidth: '100%'
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 25,
    width: '98%'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  dot: {
    width: 15, height: 15, borderRadius: 8, marginRight: 9,
    borderWidth: 2, borderColor: '#333', backgroundColor: DOT_COLOR
  },
  square: {
    width: 17, height: 17, borderRadius: 4, marginRight: 8,
    borderWidth: 2, borderColor: '#333'
  },
  legendText: { color: '#b8ffeb', fontWeight: '700', fontSize: 16 },

  listTitle: {
    color: '#00ffcc',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 7,
    marginLeft: 8,
    alignSelf: 'flex-start'
  },
  list: { paddingBottom: 45, width: '100%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1e24e8',
    borderRadius: 17,
    marginVertical: 6,
    padding: 13,
    marginHorizontal: 2,
    shadowColor: '#00ff88',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    width: '99%'
  },
  avatar: {
    width: 58, height: 58, borderRadius: 30, marginRight: 18, borderWidth: 2.2, borderColor: '#00ffcc'
  },
  nom: { color: '#fff', fontWeight: '700', fontSize: 19 },
  role: { color: '#6df', fontWeight: '600', fontSize: 16 },
  date: { color: '#80f2ff', fontWeight: '600', fontSize: 15, marginTop: 3 }
});
