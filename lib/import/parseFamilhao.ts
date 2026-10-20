/**
 * Parser do .txt do Familhão (fichas exportadas da plataforma).
 *
 * Formato (blocos separados por "====…"):
 *
 *   ==================================================
 *   Nome: SONIA MARIA DA SILVA BESSE
 *   CPF: 039.236.438-70
 *   Nascimento: 22/11/1962 (Idade: 63)
 *   Cidade/UF: PEDERNEIRAS/SP
 *   Endereco: R  FELIPE LEBEIS DE AGUIAR 69 ZN NOR
 *   WhatsApp: (14) 99687-4863
 *
 * Sem compras — `compras: []`. Roda no servidor e no navegador.
 */

import type { FichaImportada, ResultadoParse } from "./parseFichas";

function nomeProprio(nome: string): string {
  const minusculas = new Set(["da", "de", "do", "das", "dos", "e"]);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function parseDataBr(texto: string): string | null {
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function extrairIdade(texto: string): number | null {
  const m = texto.match(/Idade:\s*(\d+)/i);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function parseFamilhao(conteudo: string): ResultadoParse {
  const limpo = conteudo.replace(/^﻿/, "");
  const blocos = limpo.split(/={5,}/).filter((b) => b.trim());

  const porCpf = new Map<string, FichaImportada>();

  for (const bloco of blocos) {
    const linhas = bloco.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const campos: Record<string, string> = {};
    for (const linha of linhas) {
      const sep = linha.indexOf(":");
      if (sep < 1) continue;
      const chave = linha.slice(0, sep).trim().toLowerCase();
      const valor = linha.slice(sep + 1).trim();
      if (valor) campos[chave] = valor;
    }

    const cpfRaw = campos.cpf ?? campos["cpf"] ?? "";
    const cpf = cpfRaw.replace(/\D/g, "");
    if (cpf.length < 8) continue;

    const nomeRaw = campos.nome ?? "";
    const nascLine = campos.nascimento ?? "";
    const cidadeLine = campos["cidade/uf"] ?? "";
    const endereco = campos.endereco ?? null;
    const whatsapp = campos.whatsapp ?? "";

    const telefone = /nao verificado/i.test(whatsapp) ? null : whatsapp.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] ?? null;
    const telefoneConfirmado = telefone !== null && !/nao verificado/i.test(whatsapp);

    const anterior = porCpf.get(cpf);
    const deste: FichaImportada = {
      cpf,
      nome: nomeRaw ? nomeProprio(nomeRaw) : "(sem nome)",
      telefone,
      telefone_confirmado: telefoneConfirmado,
      idade: extrairIdade(nascLine),
      profissao: null,
      renda: null,
      cidade: cidadeLine || null,
      nascimento: parseDataBr(nascLine),
      endereco: endereco,
      pedido: null,
      comprado_em: null,
      pagamento_status: null,
      pagamento_pago_em: null,
      pagamento_valor: null,
      qtd_numeros: null,
      compras: [],
    };

    porCpf.set(
      cpf,
      anterior
        ? {
            ...anterior,
            nome: anterior.nome !== "(sem nome)" ? anterior.nome : deste.nome,
            telefone: anterior.telefone ?? deste.telefone,
            idade: anterior.idade ?? deste.idade,
            cidade: anterior.cidade ?? deste.cidade,
            nascimento: anterior.nascimento ?? deste.nascimento,
            endereco: anterior.endereco ?? deste.endereco,
          }
        : deste,
    );
  }

  return { fichas: Array.from(porCpf.values()), compras: 0 };
}
