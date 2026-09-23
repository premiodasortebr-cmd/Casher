"use server";

import { redirect } from "next/navigation";
import { verificarSegredo } from "@/lib/auth/password";
import { criarSessaoCookie } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bloqueadoPor,
  ipDoCliente,
  limparFalhas,
  mensagemBloqueio,
  registrarFalha,
  regrasLigador,
} from "@/lib/auth/rateLimit";
import type { Ligador } from "@/lib/types";

export type EstadoLoginLigador = { erro?: string; username?: string };

export async function entrarComoLigador(
  _estadoAnterior: EstadoLoginLigador,
  formData: FormData,
): Promise<EstadoLoginLigador> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!username || !senha) {
    return { erro: "Preencha usuário e senha.", username };
  }

  const regras = regrasLigador(await ipDoCliente(), username);
  const espera = bloqueadoPor(regras);
  if (espera > 0) {
    return { erro: mensagemBloqueio(espera), username };
  }

  const supabase = createAdminClient();
  const { data: ligador } = await supabase
    .from("ligadores")
    .select("id, username, password_hash, nome, ativo")
    .eq("username", username)
    .maybeSingle<Pick<Ligador, "id" | "username" | "password_hash" | "nome" | "ativo">>();

  const valido =
    ligador && ligador.ativo ? await verificarSegredo(senha, ligador.password_hash) : false;

  if (!ligador || !valido) {
    registrarFalha(regras);
    return { erro: "Usuário ou senha incorretos.", username };
  }

  limparFalhas(regras);
  await criarSessaoCookie({
    role: "ligador",
    ligadorId: ligador.id,
    username: ligador.username,
    nome: ligador.nome,
  });
  redirect("/ligador");
}
