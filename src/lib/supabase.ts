import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
}

// Cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Acceso directo a auth
export const auth = supabase.auth;

// Tipos comunes
export type UserRole = 'admin' | 'operador' | 'productor';

// Helpers mínimos de auth
export async function signIn(email: string, password: string) {
  return auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, meta?: { full_name?: string; phone?: string }) {
  return auth.signUp({
    email,
    password,
    options: {
      data: { full_name: meta?.full_name || '', phone: meta?.phone || '' },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
}

export async function signOut() {
  return auth.signOut();
}

export async function getSession() {
  return auth.getSession();
}

export function onAuthStateChange(callback: Parameters<typeof auth.onAuthStateChange>[0]) {
  return auth.onAuthStateChange(callback);
}

// Perfil de usuario (tabla user_profiles)
export async function getUserProfile(userId: string) {
  return supabase.from('user_profiles').select('*').eq('id', userId).single();
}