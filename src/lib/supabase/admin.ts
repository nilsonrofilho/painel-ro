import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a SERVICE ROLE — ignora RLS.
 *
 * Use SOMENTE em código de servidor que roda sem usuário logado (ex: o cron de
 * sincronização do Drive). NUNCA importe isto em componentes client nem exponha
 * a chave ao navegador: ela dá acesso total ao banco.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para o cron de sincronização do Drive.",
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
