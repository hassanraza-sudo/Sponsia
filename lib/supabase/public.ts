import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// For anonymous public reads (published profiles, settings). No cookies needed,
// so it is safe to call from any Server Component or static context.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
