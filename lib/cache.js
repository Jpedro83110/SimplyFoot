import { Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

let SQLite = null;
let DB = null;

if (Platform.OS !== 'web') {
  try {
    SQLite = require('expo-sqlite');
    if (SQLite?.openDatabase) {
      DB = SQLite.openDatabase('simplyfoot_cache.db');
      DB.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`
        );
      });
    } else {
      console.warn('⚠️ SQLite.openDatabase est introuvable (peut-être mal lié ou manquant).');
    }
  } catch (e) {
    console.warn('⚠️ Erreur d’importation de expo-sqlite :', e);
  }
}

// ENREGISTRER
export const saveToCache = (key, data) => {
  if (!key) return; // <-- SECURITE CLE
  if (!data) return;
  const value = JSON.stringify(data);
  const updated_at = Date.now();

  if (Platform.OS === 'web') {
    localStorage.setItem(key, JSON.stringify({ value: data, updated_at }));
  } else if (DB) {
    DB.transaction(tx => {
      tx.executeSql(
        `REPLACE INTO cache (key, value, updated_at) VALUES (?, ?, ?)`,
        [key, value, updated_at]
      );
    });
  }
};

// LIRE
export const getFromCache = (key) =>
  !key
    ? Promise.resolve(null) // <-- SECURITE CLE
    : new Promise((resolve) => {
        if (Platform.OS === 'web') {
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
        } else if (DB) {
          DB.transaction(tx => {
            tx.executeSql(
              `SELECT value, updated_at FROM cache WHERE key = ?`,
              [key],
              (_, { rows }) => {
                if (rows.length > 0) {
                  try {
                    resolve({
                      value: JSON.parse(rows.item(0).value),
                      updated_at: rows.item(0).updated_at,
                    });
                  } catch {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              }
            );
          });
        } else {
          resolve(null);
        }
      });

// SUPPRIMER
export const deleteFromCache = (key) => {
  if (!key) return; // <-- SECURITE CLE
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else if (DB) {
    DB.transaction(tx => {
      tx.executeSql(`DELETE FROM cache WHERE key = ?`, [key]);
    });
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
    return () => { isMounted = false; };
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
