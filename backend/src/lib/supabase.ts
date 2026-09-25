import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PLACEHOLDER = /(\[YOUR-|your-(anon|service)-key|your-[\w-]+\.supabase\.co|example\.supabase\.co|mock-)/i;

function configured(value: string | undefined): value is string {
  return Boolean(value && !PLACEHOLDER.test(value));
}

function requireConfig(name: string): string | null {
  const value = process.env[name];
  if (configured(value)) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is not configured with a real value`);
  }
  return null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const url = requireConfig('SUPABASE_URL');
  const key = requireConfig('SUPABASE_ANON_KEY');
  return url && key ? createClient(url, key) : null;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = requireConfig('SUPABASE_URL');
  const key = requireConfig('SUPABASE_SERVICE_ROLE_KEY');
  return url && key ? createClient(url, key) : null;
}
