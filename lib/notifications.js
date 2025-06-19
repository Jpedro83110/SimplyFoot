import { Platform } from 'react-native';

let Notifications = null;
let AsyncStorage = null;

if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

//
// 🔔 Initialisation des notifications
//
export async function setupNotifications() {
  if (Platform.OS === 'web') {
    console.log('[Web] Notifications non supportées.');
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Notifications refusées par l’utilisateur');
  }
}

//
// 🔔 Envoi d’une notification locale
//
export async function envoyerNotification(titre, corps) {
  if (Platform.OS === 'web') {
    console.log(`[Web] Notification simulée : ${titre} - ${corps}`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titre,
      body: corps,
      sound: true,
    },
    trigger: null,
  });
}

//
// ✅ Récupération des événements vus
//
export async function getVuEvenements() {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem('vu_evenements');
      return data ? JSON.parse(data) : [];
    } else {
      const data = await AsyncStorage.getItem('vu_evenements');
      return data ? JSON.parse(data) : [];
    }
  } catch (e) {
    return [];
  }
}

//
// ✅ Enregistrement des événements vus
//
export async function setVuEvenements(ids) {
  const stringified = JSON.stringify(ids);

  if (Platform.OS === 'web') {
    localStorage.setItem('vu_evenements', stringified);
  } else {
    await AsyncStorage.setItem('vu_evenements', stringified);
  }
}
