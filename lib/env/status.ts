/** As 4 env vars sem as quais o app não funciona (DB + sessão + PIN do admin). */
export function envConfigurado(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SESSION_SECRET &&
      process.env.ADMIN_PIN_HASH,
  );
}

/**
 * Gravar `.env.local` só faz sentido rodando `next dev` na própria máquina. Em
 * produção (Render, Vercel, `next start`) o filesystem é descartável e o
 * formulário de setup ficaria exposto na internet — lá as envs vêm do painel
 * da hospedagem.
 */
export function podeEscreverEnvLocal(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.RENDER && !process.env.VERCEL;
}
