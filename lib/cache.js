import { Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

let SQLite, DB;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  DB = SQLite.openDatabase('simplyfoot_cache.db');
  DB.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)`
    );
  });
}

// ENREGISTRER
export const saveToCache = (key, data) => {
  const value = JSON.stringify(data);
  const updated_at = Date.now();

  if (Platform.OS === 'web') {
    localStorage.setItem(key, JSON.stringify({ value: data, updated_at }));
  } else {
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
  new Promise((resolve) => {
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
    } else {
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
    }
  });

// SUPPRIMER
export const deleteFromCache = (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
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

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const cached = await getFromCache(key);
      if (cached && !hasExpired(cached.updated_at, ttl)) {
        if (isMounted) setData(cached.value);
        setLoading(false);
      } else {
        const fresh = await fetchFunction();
        if (isMounted) setData(fresh);
        saveToCache(key, fresh);
        setLoading(false);
      }
    }
    if (key) load();
    return () => { isMounted = false; };
  }, [key]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchFunction();
    setData(fresh);
    saveToCache(key, fresh);
    setLoading(false);
  }, [key, fetchFunction]);

  return [data, refresh, loading];
}
