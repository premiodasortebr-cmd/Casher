/**
 * Lê o arquivo de texto exportado pelo checker (blocos "=== CPF ... ===" com
 * uma ou mais "Compra N" dentro) e devolve uma rifa por Edição encontrada,
 * cada uma com suas fichas (uma ficha = uma compra de um CPF).
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

export interface RifaImportada {
  nome: string; // ex.: "Edição 07 Bolada Pix - R$ 300.000"
  premio_descricao: string | null;
  premio_valor: number | null;
  data_sorteio: string | null; // ISO
  fichas: FichaImportada[];
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

/** Pega o ÚLTIMO valor "R$ ..." do texto — em nomes de rifa tipo "Edição 09 Bolada
 *  Pix - R$ 0,69 - R$ 300.000" o primeiro é o preço do número, o último é o prêmio. */
function ultimoValorReaisComPrefixo(texto: string | undefined | null): number | null {
  if (!texto) return null;
  const ocorrencias = [...texto.matchAll(/R\$\s*([\d.,]+)/g)];
  if (ocorrencias.length === 0) return null;
  return parseValorReais(ocorrencias[ocorrencias.length - 1][1]);
}

/** "01/07/2026 12:15" ou "01/07/2026 às 20:00" -> ISO (America/Sao_Paulo, -03:00). */
function parseDataHoraBr(texto: string | undefined | null): string | null {
  if (!texto) return null;
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(?:às\s+)?(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = "00", min = "00"] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`;
}

function extrairNomeRifa(linhaCompra: string): string | null {
  // "Compra 1 — pedido 121103792 — Edição 07 Bolada Pix - R$ 300.000"
  const partes = linhaCompra.split("—").map((p) => p.trim());
  return partes.length >= 3 ? partes.slice(2).join(" — ") : null;
}

function extrairPedido(linhaCompra: string): string | null {
  const m = linhaCompra.match(/pedido\s+(\S+)/i);
  return m ? m[1] : null;
}

export function parseFichas(conteudo: string): RifaImportada[] {
  const rifasPorNome = new Map<string, RifaImportada>();

  const blocosCpf = conteudo
    .split(/(?=^===\s*CPF)/m)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const bloco of blocosCpf) {
    const linhas = bloco.split(/\r?\n/);

    const cpfMatch = linhas[0]?.match(/CPF\s+(\d+)/i);
    const cpf = cpfMatch ? cpfMatch[1] : null;
    if (!cpf) continue;

    const campo = (label: string): string | null => {
      const linha = linhas.find((l) => l.trim().startsWith(`${label}:`) || l.trim().startsWith(`${label} `));
      if (!linha) return null;
      const idx = linha.indexOf(label) + label.length;
      return linha.slice(idx).replace(/^[:\s]+/, "").trim() || null;
    };

    const nome = campo("Nome") ?? "(sem nome)";
    const telefoneBruto = campo("Telefone");
    // "(19) 98352-9292 (confirmado 19 9**** 9292)" -> fica só o número real, sem máscara.
    const telefoneMatch = telefoneBruto?.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/);
    const telefone = telefoneMatch ? telefoneMatch[0] : null;
    const idadeTexto = campo("Idade");
    const idade = idadeTexto ? Number(idadeTexto.match(/\d+/)?.[0]) : null;
    const profissao = campo("Profissão");
    const renda = parseValorReais(campo("Renda"));

    // Cada "Compra N" dentro do bloco vira uma ficha.
    const blocosCompra = bloco
      .split(/(?=^Compra\s+\d+\s*—)/m)
      .map((b) => b.trim())
      .filter((b) => b.startsWith("Compra"));

    for (const blocoCompra of blocosCompra) {
      const linhaCompra = blocoCompra.split(/\r?\n/)[0];
      const nomeRifa = extrairNomeRifa(linhaCompra);
      if (!nomeRifa) continue;

      const pedido = extrairPedido(linhaCompra);
      const premioMatch = blocoCompra.match(/prêmio:\s*(.+)/i);
      const sorteioMatch = blocoCompra.match(/sorteio:\s*(.+)/i);
      const compradoMatch = blocoCompra.match(/comprado em:\s*(.+)/i);
      const pagamentoMatch = blocoCompra.match(/pagamento:\s*(.+)/i);
      const numerosMatch = blocoCompra.match(/(\d+)\s*número\(s\)/i);

      let pagamentoStatus: string | null = null;
      let pagamentoValor: number | null = null;
      let pagamentoPagoEm: string | null = null;
      if (pagamentoMatch) {
        const partes = pagamentoMatch[1].split("·").map((p) => p.trim());
        // "Pix · concluido · R$ 13,80 (pago em 01/07/2026 12:16)"
        pagamentoStatus = partes[1] ?? null;
        pagamentoValor = parseValorReais(partes[2]);
        const pagoEmMatch = pagamentoMatch[1].match(/pago em\s+([\d/: ]+)/i);
        pagamentoPagoEm = parseDataHoraBr(pagoEmMatch?.[1]);
      }

      if (!rifasPorNome.has(nomeRifa)) {
        rifasPorNome.set(nomeRifa, {
          nome: nomeRifa,
          premio_descricao: premioMatch ? premioMatch[1].trim() : null,
          premio_valor: ultimoValorReaisComPrefixo(nomeRifa),
          data_sorteio: parseDataHoraBr(sorteioMatch?.[1] ?? null),
          fichas: [],
        });
      }

      rifasPorNome.get(nomeRifa)!.fichas.push({
        cpf,
        nome,
        telefone,
        idade: Number.isFinite(idade) ? idade : null,
        profissao,
        renda,
        pedido,
        comprado_em: parseDataHoraBr(compradoMatch?.[1] ?? null),
        pagamento_valor: pagamentoValor,
        pagamento_status: pagamentoStatus,
        pagamento_pago_em: pagamentoPagoEm,
        qtd_numeros: numerosMatch ? Number(numerosMatch[1]) : null,
      });
    }
  }

  return Array.from(rifasPorNome.values());
}
