import { Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

// ENREGISTRER
export const saveToCache = (key, data) => {
  if (!key || !data) return;
  const value = JSON.stringify(data);
  const updated_at = Date.now();

  localStorage.setItem(key, JSON.stringify({ value: data, updated_at }));
};

// LIRE
export const getFromCache = (key) =>
  !key
    ? Promise.resolve(null)
    : new Promise((resolve) => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            resolve({ value: parsed.value, updated_at: parsed.updated_at });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });

// SUPPRIMER
export const deleteFromCache = (key) => {
  if (!key) return;
  localStorage.removeItem(key);
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
            saveToCache(key, fresh);
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
    deleteFromCache(key);
    try {
      const fresh = await fetchFunction();
      if (fresh) {
        setData(fresh);
        saveToCache(key, fresh);
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
