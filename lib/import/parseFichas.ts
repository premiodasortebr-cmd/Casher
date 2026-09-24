/**
 * Lê o .txt exportado pelo checker (blocos "=== CPF ... ===" com uma ou mais
 * "Compra N — pedido X — Edição ..." dentro) e devolve UMA ficha por CPF: a mesma
 * pessoa com várias compras (ou em edições diferentes) é uma ligação só.
 * Roda no servidor (importação) e no navegador (prévia antes de importar).
 */

export interface FichaImportada {
  cpf: string;
  nome: string;
  telefone: string | null;
  idade: number | null;
  profissao: string | null;
  renda: number | null;
  pedido: string | null;
  comprado_em: string | null; // ISO
  pagamento_valor: number | null;
  pagamento_status: string | null;
  pagamento_pago_em: string | null; // ISO
  qtd_numeros: number | null;
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

function somar(a: number | null, b: number | null): number | null {
  return a == null ? b : b == null ? a : a + b;
}

interface Compra {
  pedido: string | null;
  comprado_em: string | null;
  pagamento_valor: number | null;
  pagamento_status: string | null;
  pagamento_pago_em: string | null;
  qtd_numeros: number | null;
}

function lerCompra(blocoCompra: string): Compra {
  const linhaCompra = blocoCompra.split(/\r?\n/)[0];
  const pedido = linhaCompra.match(/pedido\s+(\S+)/i)?.[1] ?? null;
  const compradoMatch = blocoCompra.match(/comprado em:\s*(.+)/i);
  const pagamentoMatch = blocoCompra.match(/pagamento:\s*(.+)/i);
  const numerosMatch = blocoCompra.match(/(\d+)\s*número\(s\)/i);

  let pagamento_status: string | null = null;
  let pagamento_valor: number | null = null;
  let pagamento_pago_em: string | null = null;
  if (pagamentoMatch) {
    // "Pix · concluido · R$ 13,80 (pago em 01/07/2026 12:16)"
    const partes = pagamentoMatch[1].split("·").map((p) => p.trim());
    pagamento_status = partes[1] ?? null;
    pagamento_valor = parseValorReais(partes[2]);
    pagamento_pago_em = parseDataHoraBr(pagamentoMatch[1].match(/pago em\s+([\d/: ]+)/i)?.[1]);
  }

  return {
    pedido,
    comprado_em: parseDataHoraBr(compradoMatch?.[1] ?? null),
    pagamento_valor,
    pagamento_status,
    pagamento_pago_em,
    qtd_numeros: numerosMatch ? Number(numerosMatch[1]) : null,
  };
}

export function parseFichas(conteudo: string): ResultadoParse {
  const porCpf = new Map<string, FichaImportada>();
  let compras = 0;

  const blocosCpf = conteudo
    .split(/(?=^===\s*CPF)/m)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const bloco of blocosCpf) {
    const linhas = bloco.split(/\r?\n/);
    const cpf = linhas[0]?.match(/CPF\s+(\d+)/i)?.[1];
    if (!cpf) continue;

    // Cada "Compra N — ..." do bloco; CPF sem compra não vira ficha.
    const comprasDoBloco = bloco
      .split(/(?=^Compra\s+\d+\s*—)/m)
      .map((b) => b.trim())
      .filter((b) => b.startsWith("Compra"))
      .map(lerCompra);
    if (comprasDoBloco.length === 0) continue;
    compras += comprasDoBloco.length;

    const campo = (label: string): string | null => {
      const linha = linhas.find((l) => l.trim().startsWith(`${label}:`) || l.trim().startsWith(`${label} `));
      if (!linha) return null;
      const idx = linha.indexOf(label) + label.length;
      return linha.slice(idx).replace(/^[:\s]+/, "").trim() || null;
    };

    // "(19) 98352-9292 (confirmado 19 9**** 9292)" -> fica só o número real, sem máscara.
    const telefone = campo("Telefone")?.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] ?? null;
    const idade = Number(campo("Idade")?.match(/\d+/)?.[0]);

    // A compra mais recente dá pedido/data/pagamento; números e valor são somados.
    const recente = [...comprasDoBloco].sort((a, b) => (b.comprado_em ?? "").localeCompare(a.comprado_em ?? ""))[0];
    const deste: FichaImportada = {
      cpf,
      nome: campo("Nome") ?? "(sem nome)",
      telefone,
      idade: Number.isFinite(idade) ? idade : null,
      profissao: campo("Profissão"),
      renda: parseValorReais(campo("Renda")),
      pedido: recente.pedido,
      comprado_em: recente.comprado_em,
      pagamento_status: recente.pagamento_status,
      pagamento_pago_em: recente.pagamento_pago_em,
      pagamento_valor: comprasDoBloco.reduce<number | null>((s, c) => somar(s, c.pagamento_valor), null),
      qtd_numeros: comprasDoBloco.reduce<number | null>((s, c) => somar(s, c.qtd_numeros), null),
    };

    // O mesmo CPF pode aparecer em mais de um bloco do arquivo.
    const anterior = porCpf.get(cpf);
    if (!anterior) {
      porCpf.set(cpf, deste);
      continue;
    }
    const maisRecente = (deste.comprado_em ?? "") > (anterior.comprado_em ?? "") ? deste : anterior;
    porCpf.set(cpf, {
      cpf,
      nome: anterior.nome !== "(sem nome)" ? anterior.nome : deste.nome,
      telefone: anterior.telefone ?? deste.telefone,
      idade: anterior.idade ?? deste.idade,
      profissao: anterior.profissao ?? deste.profissao,
      renda: anterior.renda ?? deste.renda,
      pedido: maisRecente.pedido,
      comprado_em: maisRecente.comprado_em,
      pagamento_status: maisRecente.pagamento_status,
      pagamento_pago_em: maisRecente.pagamento_pago_em,
      pagamento_valor: somar(anterior.pagamento_valor, deste.pagamento_valor),
      qtd_numeros: somar(anterior.qtd_numeros, deste.qtd_numeros),
    });
  }

  return { fichas: Array.from(porCpf.values()), compras };
}
