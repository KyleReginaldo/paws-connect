import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRole = process.env.NEXT_SUPABASE_SERVICE_ROLE!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceRole!
);
