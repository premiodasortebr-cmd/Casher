import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service role key — ignora RLS. Só pode ser usado no
 * servidor (Server Actions, Route Handlers), nunca importado em código de
 * cliente. A autorização (quem pode fazer o quê) é feita na aplicação, lendo
 * a sessão em `lib/auth/session.ts`, não pelo Postgres.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas.");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
