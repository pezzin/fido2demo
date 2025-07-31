import { createClient } from '@supabase/supabase-js';

type AuthenticatorTransport = 'ble' | 'hybrid' | 'internal' | 'nfc' | 'usb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Tipi per il database
export interface DatabaseUser {
  email: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: AuthenticatorTransport[];
  created_at?: string;
  updated_at?: string;
}

// Funzioni helper per gestire gli utenti
export async function getUserByEmail(email: string): Promise<DatabaseUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Utente non trovato
      return null;
    }
    throw error;
  }

  return data;
}

export async function createUser(userData: {
  email: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: AuthenticatorTransport[];
}): Promise<DatabaseUser> {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: userData.email,
      credential_id: userData.credential_id,
      public_key: userData.public_key,
      counter: userData.counter,
      transports: userData.transports ? JSON.stringify(userData.transports) : null,
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserCounter(email: string, newCounter: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ counter: newCounter })
    .eq('email', email);

  if (error) {
    throw error;
  }
}

export async function deleteUser(email: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);

  if (error) {
    throw error;
  }
}
