import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../database.types';

// For client-side operations, use the anonymous key instead of service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
