/**
 * Lê o .csv exportado do Serasa (uma linha por pessoa, separado por ";"):
 *
 *   CPF;NOME COMPLETO;DATA DE NASCIMENTO;IDADE ANOS;TELEFONE MAIS RECENTE;CIDADE E ESTADO;RENDA;SCORE
 *   02509972073;JULIELE DE MOURA;11/06/1991;35;(51) 98565-2800;IMBE - RS;;
 *
 * Não tem compra: a ficha fica com `compras: []`. Roda no servidor e no navegador.
 */

import type { FichaImportada, ResultadoParse } from "./parseFichas";

/** "JULIELE DE MOURA" -> "Juliele de Moura" (mesma regra de lib/format nomeProprio; sem import pra rodar solto). */
function nomeProprio(nome: string): string {
  const minusculas = new Set(["da", "de", "do", "das", "dos", "e"]);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function parseValorReais(texto: string): number | null {
  const m = texto.match(/(\d{1,3}(?:\.\d{3})*|\d+)(,\d{2})?/);
  if (!m) return null;
  const n = Number(`${m[1].replace(/\./g, "")}.${m[2] ? m[2].slice(1) : "00"}`);
  return Number.isFinite(n) ? n : null;
}

/** "11/06/1991" -> "1991-06-11" */
function parseDataBr(texto: string): string | null {
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function acharColuna(cabecalho: string[], ...pistas: string[]): number {
  return cabecalho.findIndex((c) => pistas.some((p) => c.includes(p)));
}

export function parseSerasa(conteudo: string): ResultadoParse {
  const linhas = conteudo
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length < 2) return { fichas: [], compras: 0 };

  const cabecalho = linhas[0].split(";").map((c) => c.trim().toUpperCase());
  const col = {
    cpf: acharColuna(cabecalho, "CPF"),
    nome: acharColuna(cabecalho, "NOME"),
    nascimento: acharColuna(cabecalho, "NASCIMENTO"),
    idade: acharColuna(cabecalho, "IDADE"),
    telefone: acharColuna(cabecalho, "TELEFONE", "CELULAR"),
    cidade: acharColuna(cabecalho, "CIDADE"),
    renda: acharColuna(cabecalho, "RENDA"),
  };
  if (col.cpf < 0 || col.nome < 0) return { fichas: [], compras: 0 };

  const porCpf = new Map<string, FichaImportada>();
  for (const linha of linhas.slice(1)) {
    const c = linha.split(";").map((v) => v.trim());
    const pega = (i: number) => (i >= 0 ? c[i] ?? "" : "");
    const cpf = pega(col.cpf).replace(/\D/g, "");
    if (cpf.length < 8) continue;

    const telefone = pega(col.telefone).match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] ?? null;
    const idade = Number.parseInt(pega(col.idade), 10);
    const nomeBruto = pega(col.nome);

    // Mesmo CPF repetido: a primeira linha manda, as outras só completam.
    const anterior = porCpf.get(cpf);
    const deste: FichaImportada = {
      cpf,
      nome: nomeBruto ? nomeProprio(nomeBruto) : "(sem nome)",
      telefone,
      telefone_confirmado: false,
      idade: Number.isFinite(idade) ? idade : null,
      profissao: null,
      renda: parseValorReais(pega(col.renda)),
      cidade: pega(col.cidade) || null,
      nascimento: parseDataBr(pega(col.nascimento)),
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
            renda: anterior.renda ?? deste.renda,
            cidade: anterior.cidade ?? deste.cidade,
            nascimento: anterior.nascimento ?? deste.nascimento,
          }
        : deste,
    );
  }

  return { fichas: Array.from(porCpf.values()), compras: 0 };
}
