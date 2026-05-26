'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabaseBrowserClient: SupabaseClient | null = null;

export function hasSupabaseBrowserEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseBrowserClient;
}

export async function testSupabaseBrowserConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      message: 'Missing Supabase browser environment variables.',
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
      },
    });

    return {
      ok: response.ok,
      status: response.status,
      message: response.ok
        ? 'Supabase browser connection is reachable.'
        : 'Supabase responded, but the connection test was not successful.',
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Supabase browser connection test failed.',
    };
  }
}
