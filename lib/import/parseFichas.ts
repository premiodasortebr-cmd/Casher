/**
 * Lê o .txt exportado pelo checker e devolve UMA ficha por CPF, com todas as
 * compras dela. Formato de um bloco:
 *
 *   === CPF 00201607557 ===
 *   Nome: rosilene Ferreira da Silva
 *   Telefone: (19) 98352-9292 (confirmado 19 9**** 9292)
 *   Compras: 2
 *   Idade 50
 *   Profissão Comerciante atacadista
 *   Renda R$ 1.403,02
 *
 *   Compra 1 — pedido 121103792 — Edição 07 Bolada Pix - R$ 300.000
 *       prêmio: Trezentos Mil Reais
 *       sorteio: 01/07/2026 às 20:00
 *       comprado em: 01/07/2026 12:15
 *       pagamento: Pix · concluido · R$ 13,80 (pago em 01/07/2026 12:16)
 *       24 número(s)
 *
 * Roda no servidor (importação) e no navegador (prévia antes de importar).
 */

export interface Compra {
  pedido: string | null;
  /** Linha da compra depois do pedido, ex. "Edição 07 Bolada Pix - R$ 300.000". */
  titulo: string | null;
  premio: string | null;
  sorteio_em: string | null; // ISO
  comprado_em: string | null; // ISO
  pagamento_metodo: string | null;
  pagamento_status: string | null;
  pagamento_valor: number | null;
  pagamento_pago_em: string | null; // ISO
  qtd_numeros: number | null;
}

export interface FichaImportada {
  cpf: string;
  nome: string;
  telefone: string | null;
  telefone_confirmado: boolean;
  idade: number | null;
  profissao: string | null;
  renda: number | null;
  /** Da compra mais recente. */
  pedido: string | null;
  comprado_em: string | null;
  pagamento_status: string | null;
  pagamento_pago_em: string | null;
  /** Somados de todas as compras. */
  pagamento_valor: number | null;
  qtd_numeros: number | null;
  /** Todas as compras, mais recente primeiro. */
  compras: Compra[];
}

export interface ResultadoParse {
  fichas: FichaImportada[];
  /** Compras lidas no arquivo (≥ fichas: compras da mesma pessoa viram uma ficha). */
  compras: number;
}

// Números em pt-BR: "." separa milhar, "," separa decimal (ex.: "1.403,02", "300.000", "0,69").
function parseValorReais(texto: string | undefined | null): number | null {
  if (!texto) return null;
  const m = texto.match(/(\d{1,3}(?:\.\d{3})*|\d+)(,\d{2})?/);
  if (!m) return null;
  const inteiro = m[1].replace(/\./g, "");
  const decimal = m[2] ? m[2].slice(1) : "00";
  const n = Number(`${inteiro}.${decimal}`);
  return Number.isFinite(n) ? n : null;
}

/** "01/07/2026 12:15" ou "01/07/2026 às 20:00" -> ISO (America/Sao_Paulo, -03:00). */
function parseDataHoraBr(texto: string | undefined | null): string | null {
  if (!texto) return null;
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(?:às\s+)?(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = "00", min = "00"] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`;
}

function lerCompra(blocoCompra: string): Compra {
  const linhaCompra = blocoCompra.split(/\r?\n/)[0];
  // "Compra 1 — pedido 121103792 — Edição 07 Bolada Pix - R$ 300.000"
  const partes = linhaCompra.split("—").map((p) => p.trim());
  const pagamento = blocoCompra.match(/pagamento:\s*(.+)/i)?.[1] ?? null;
  // "Pix · concluido · R$ 13,80 (pago em 01/07/2026 12:16)"
  const partesPagamento = pagamento?.split("·").map((p) => p.trim()) ?? [];
  const numeros = blocoCompra.match(/(\d+)\s*número\(s\)/i)?.[1];

  return {
    pedido: linhaCompra.match(/pedido\s+(\S+)/i)?.[1] ?? null,
    titulo: partes.length >= 3 ? partes.slice(2).join(" — ") : null,
    premio: blocoCompra.match(/prêmio:\s*(.+)/i)?.[1].trim() ?? null,
    sorteio_em: parseDataHoraBr(blocoCompra.match(/sorteio:\s*(.+)/i)?.[1]),
    comprado_em: parseDataHoraBr(blocoCompra.match(/comprado em:\s*(.+)/i)?.[1]),
    pagamento_metodo: partesPagamento[0] || null,
    pagamento_status: partesPagamento[1] || null,
    pagamento_valor: parseValorReais(partesPagamento[2]),
    pagamento_pago_em: parseDataHoraBr(pagamento?.match(/pago em\s+([\d/: ]+)/i)?.[1]),
    qtd_numeros: numeros ? Number(numeros) : null,
  };
}

function somar(valores: (number | null)[]): number | null {
  const presentes = valores.filter((v): v is number => v != null);
  return presentes.length ? presentes.reduce((a, b) => a + b, 0) : null;
}

/**
 * Junta listas de compras sem repetir pedido (a primeira lista vence) e ordena da
 * mais recente pra mais antiga. Compras sem número de pedido nunca se fundem.
 */
export function juntarCompras(...listas: Compra[][]): Compra[] {
  const vistas = new Set<string>();
  const saida: Compra[] = [];
  for (const lista of listas) {
    for (const c of lista) {
      if (c.pedido) {
        if (vistas.has(c.pedido)) continue;
        vistas.add(c.pedido);
      }
      saida.push(c);
    }
  }
  return saida.sort((a, b) => (b.comprado_em ?? "").localeCompare(a.comprado_em ?? ""));
}

/** Campos de compra da ficha (mais recente + somas) a partir da lista completa. */
export function resumoCompras(compras: Compra[]) {
  const recente = compras[0];
  return {
    pedido: recente?.pedido ?? null,
    comprado_em: recente?.comprado_em ?? null,
    pagamento_status: recente?.pagamento_status ?? null,
    pagamento_pago_em: recente?.pagamento_pago_em ?? null,
    pagamento_valor: somar(compras.map((c) => c.pagamento_valor)),
    qtd_numeros: somar(compras.map((c) => c.qtd_numeros)),
  };
}

export function parseFichas(conteudo: string): ResultadoParse {
  const porCpf = new Map<string, FichaImportada>();
  let totalCompras = 0;

  const blocosCpf = conteudo
    .replace(/^﻿/, "")
    .split(/(?=^===\s*CPF)/m)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const bloco of blocosCpf) {
    const linhas = bloco.split(/\r?\n/);
    const cpf = linhas[0]?.match(/CPF\s+(\d+)/i)?.[1];
    if (!cpf) continue;

    // Cada "Compra N — ..." do bloco; CPF sem compra não vira ficha.
    const compras = bloco
      .split(/(?=^Compra\s+\d+\s*—)/m)
      .map((b) => b.trim())
      .filter((b) => b.startsWith("Compra"))
      .map(lerCompra);
    if (compras.length === 0) continue;
    totalCompras += compras.length;

    const campo = (label: string): string | null => {
      const linha = linhas.find((l) => l.trim().startsWith(`${label}:`) || l.trim().startsWith(`${label} `));
      if (!linha) return null;
      const idx = linha.indexOf(label) + label.length;
      return linha.slice(idx).replace(/^[:\s]+/, "").trim() || null;
    };

    const telefoneBruto = campo("Telefone");
    // "(19) 98352-9292 (confirmado 19 9**** 9292)" -> fica só o número real, sem máscara.
    const telefone = telefoneBruto?.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] ?? null;
    const idade = Number(campo("Idade")?.match(/\d+/)?.[0]);

    const deste: Omit<FichaImportada, keyof ReturnType<typeof resumoCompras>> = {
      cpf,
      nome: campo("Nome") ?? "(sem nome)",
      telefone,
      telefone_confirmado: Boolean(telefone && /confirmado/i.test(telefoneBruto ?? "")),
      idade: Number.isFinite(idade) ? idade : null,
      profissao: campo("Profissão"),
      renda: parseValorReais(campo("Renda")),
      compras,
    };

    // O mesmo CPF pode aparecer em mais de um bloco do arquivo: o primeiro manda nos
    // dados da pessoa (completando o que faltar), as compras se somam.
    const anterior = porCpf.get(cpf);
    const pessoa = anterior
      ? {
          cpf,
          nome: anterior.nome !== "(sem nome)" ? anterior.nome : deste.nome,
          telefone: anterior.telefone ?? deste.telefone,
          telefone_confirmado: anterior.telefone ? anterior.telefone_confirmado : deste.telefone_confirmado,
          idade: anterior.idade ?? deste.idade,
          profissao: anterior.profissao ?? deste.profissao,
          renda: anterior.renda ?? deste.renda,
          compras: juntarCompras(anterior.compras, deste.compras),
        }
      : { ...deste, compras: juntarCompras(deste.compras) };

    porCpf.set(cpf, { ...pessoa, ...resumoCompras(pessoa.compras) });
  }

  return { fichas: Array.from(porCpf.values()), compras: totalCompras };
}
