import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../database.types';

// Prefer server-only env vars for service role keys. Fall back to NEXT_PUBLIC names if present
// but ensure a value exists at runtime. Adjust your environment vars if you see a runtime error here.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole =
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE are set.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceRole);
