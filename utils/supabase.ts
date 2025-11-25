import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Preia cheile din .env (Asigură-te că le ai acolo!)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Verificăm dacă variabilele de mediu au fost încărcate corect
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Make sure you have a .env file and have restarted the server.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Aici configurăm persistența
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important pentru React Native
  },
});