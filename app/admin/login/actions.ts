"use server";

import { redirect } from "next/navigation";
import { verificarSegredo } from "@/lib/auth/password";
import { criarSessaoCookie } from "@/lib/auth/session";
import {
  bloqueadoPor,
  ipDoCliente,
  limparFalhas,
  mensagemBloqueio,
  registrarFalha,
  regrasAdmin,
} from "@/lib/auth/rateLimit";

export type EstadoLoginAdmin = { erro?: string; tentativa?: number };

export async function entrarComoAdmin(
  estadoAnterior: EstadoLoginAdmin,
  formData: FormData,
): Promise<EstadoLoginAdmin> {
  // `tentativa` muda a cada erro — a página usa como key pra limpar as caixas do PIN.
  const tentativa = (estadoAnterior.tentativa ?? 0) + 1;
  const pin = String(formData.get("pin") ?? "").trim();

  if (!/^\d{6}$/.test(pin)) {
    return { erro: "Digite os 6 números do PIN.", tentativa };
  }

  const regras = regrasAdmin(await ipDoCliente());
  const espera = bloqueadoPor(regras);
  if (espera > 0) {
    return { erro: mensagemBloqueio(espera), tentativa };
  }

  const hash = process.env.ADMIN_PIN_HASH;
  if (!hash) {
    return { erro: "ADMIN_PIN_HASH não configurado no servidor.", tentativa };
  }

  if (!(await verificarSegredo(pin, hash))) {
    registrarFalha(regras);
    return { erro: "PIN incorreto.", tentativa };
  }

  limparFalhas(regras.filter((r) => !r.chave.endsWith(":global")));
  await criarSessaoCookie({ role: "admin" });
  redirect("/admin");
}
