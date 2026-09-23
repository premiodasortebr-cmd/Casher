"use server";

import { randomBytes } from "node:crypto";
import { hashSegredo } from "@/lib/auth/password";
import { getSessaoAdmin } from "@/lib/auth/session";
import { bloqueadoPor, ipDoCliente, mensagemBloqueio, registrarFalha } from "@/lib/auth/rateLimit";
import { envConfigurado, podeEscreverEnvLocal } from "@/lib/env/status";
import { upsertEnvLocal } from "@/lib/env/writeLocalEnv";
import { rodarMigrations, type ResultadoMigracao } from "@/lib/db/migrate.mjs";

export type EstadoSetup = {
  erro?: string;
  sucesso?: boolean;
  migracoes?: ResultadoMigracao[];
};

/**
 * Setup local: grava `.env.local` e (se veio a connection string) aplica as
 * migrations. Primeira vez: aberto. Depois de configurado: só com sessão de
 * admin — senão qualquer um trocava o PIN. Em produção nunca roda.
 */
export async function salvarConfiguracao(
  _estadoAnterior: EstadoSetup,
  formData: FormData,
): Promise<EstadoSetup> {
  if (!podeEscreverEnvLocal()) {
    return { erro: "Em produção as variáveis são configuradas no painel da hospedagem." };
  }
  const jaConfigurado = envConfigurado();
  if (jaConfigurado && !(await getSessaoAdmin())) {
    return { erro: "O Casher já está configurado. Entre como admin pra alterar." };
  }

  // Configurado: campo vazio = manter o valor atual.
  const url = String(formData.get("supabaseUrl") ?? "").trim() || (jaConfigurado ? process.env.SUPABASE_URL ?? "" : "");
  const serviceRoleKey =
    String(formData.get("serviceRoleKey") ?? "").trim() ||
    (jaConfigurado ? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "" : "");
  const databaseUrl = String(formData.get("databaseUrl") ?? "").trim() || process.env.DATABASE_URL || "";
  const pin = String(formData.get("pin") ?? "").trim();

  if (!/^https:\/\/\S+$/.test(url)) {
    return { erro: "Project URL inválida — copie de Project Settings → API (começa com https://)." };
  }
  if (serviceRoleKey.length < 30) {
    return { erro: "Service role key curta demais — confira se colou a chave service_role inteira." };
  }
  if (databaseUrl && !/^postgres(ql)?:\/\/\S+$/.test(databaseUrl)) {
    return { erro: "Connection string inválida — deve começar com postgresql://" };
  }
  if (pin && !/^\d{6}$/.test(pin)) {
    return { erro: "O PIN precisa ter exatamente 6 números." };
  }
  if (!pin && !jaConfigurado) {
    return { erro: "Escolha o PIN de 6 números do /admin." };
  }

  let migracoes: ResultadoMigracao[] | undefined;
  if (databaseUrl) {
    try {
      migracoes = await rodarMigrations(databaseUrl);
    } catch (e) {
      return {
        erro:
          "Não consegui conectar no Postgres: " +
          (e instanceof Error ? e.message : String(e)) +
          ". Use a connection string do Session pooler.",
      };
    }
    const falhou = migracoes.find((m) => m.status === "erro");
    if (falhou) return { erro: `A migration ${falhou.arquivo} falhou: ${falhou.erro}`, migracoes };
  }

  const valores: Record<string, string> = {
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    SESSION_SECRET: process.env.SESSION_SECRET || randomBytes(32).toString("base64"),
    ADMIN_PIN_HASH: pin ? await hashSegredo(pin) : (process.env.ADMIN_PIN_HASH ?? ""),
  };
  if (databaseUrl) valores.DATABASE_URL = databaseUrl;

  try {
    await upsertEnvLocal(valores);
  } catch (e) {
    return { erro: "Não consegui gravar .env.local: " + (e instanceof Error ? e.message : String(e)) };
  }

  return { sucesso: true, migracoes };
}

export type EstadoGerador = { erro?: string; adminPinHash?: string; sessionSecret?: string };

/**
 * Produção ainda sem configurar: só calcula os valores pra colar no Render.
 * Não grava nada nem acessa rede. Limitado por IP porque scrypt custa CPU.
 */
export async function gerarValoresHospedagem(
  _estadoAnterior: EstadoGerador,
  formData: FormData,
): Promise<EstadoGerador> {
  if (envConfigurado()) return { erro: "O Casher já está configurado." };

  const regras = [{ chave: `setup:ip:${await ipDoCliente()}`, maxFalhas: 20, janelaMs: 15 * 60 * 1000 }];
  const espera = bloqueadoPor(regras);
  if (espera > 0) return { erro: mensagemBloqueio(espera) };
  registrarFalha(regras);

  const pin = String(formData.get("pin") ?? "").trim();
  if (!/^\d{6}$/.test(pin)) return { erro: "Digite os 6 números do PIN." };

  return {
    adminPinHash: await hashSegredo(pin),
    sessionSecret: randomBytes(32).toString("base64"),
  };
}
