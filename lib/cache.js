import { Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

let AsyncStorage = null;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// ENREGISTRER
export const saveToCache = async (key, data) => {
  if (!key || !data) return;
  const value = JSON.stringify(data);
  const updated_at = Date.now();
  const item = JSON.stringify({ value: data, updated_at });

  if (Platform.OS === 'web') {
    localStorage.setItem(key, item);
  } else {
    await AsyncStorage.setItem(key, item);
  }
};

// LIRE
export const getFromCache = async (key) => {
  if (!key) return null;
  let item;
  if (Platform.OS === 'web') {
    item = localStorage.getItem(key);
  } else {
    item = await AsyncStorage.getItem(key);
  }
  if (item) {
    try {
      const parsed = JSON.parse(item);
      return { value: parsed.value, updated_at: parsed.updated_at };
    } catch {
      return null;
    }
  }
  return null;
};

// SUPPRIMER
export const deleteFromCache = async (key) => {
  if (!key) return;
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

// EXPIRE ?
export const hasExpired = (updated_at, ttl = 3600) => {
  const now = Date.now();
  return now - updated_at > ttl * 1000;
};

// HOOK
export default function useCacheData(key, fetchFunction, ttl = 3600) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearCache = useCallback(() => deleteFromCache(key), [key]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      const cached = await getFromCache(key);

      if (cached && !hasExpired(cached.updated_at, ttl)) {
        if (isMounted) setData(cached.value);
        setLoading(false);
      } else {
        try {
          const fresh = await fetchFunction();
          if (fresh) {
            if (isMounted) setData(fresh);
            await saveToCache(key, fresh);
          } else {
            if (isMounted) setData(null);
            setError("Aucune donnée disponible.");
          }
        } catch (e) {
          setError(e.message || "Erreur lors du chargement des données.");
        }
        setLoading(false);
      }
    }

    if (key) load();
    return () => {
      isMounted = false;
    };
  }, [key]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    await deleteFromCache(key);
    try {
      const fresh = await fetchFunction();
      if (fresh) {
        setData(fresh);
        await saveToCache(key, fresh);
      } else {
        setData(null);
        setError("Aucune donnée disponible (refresh).");
      }
    } catch (e) {
      setError(e.message || "Erreur lors du refresh.");
    }
    setLoading(false);
  }, [key, fetchFunction]);

  return [data, refresh, loading, error, clearCache];
}
