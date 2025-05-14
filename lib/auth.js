import { supabase } from './supabase';

// 🔐 Récupérer l'utilisateur actuellement connecté
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

// 🔑 Connexion de l'utilisateur
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  console.log('🔓 Connexion réussie :', data);
  return data.user;
}

// 🆕 Inscription de l'utilisateur
export async function signup(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  console.log('👤 Utilisateur inscrit :', data);
  return data.user;
}

// 🔒 Déconnexion
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  console.log('🚪 Déconnexion réussie');
}
