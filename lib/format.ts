// O servidor (Render) roda em UTC — toda data exibida precisa do fuso explícito.
const TZ = "America/Sao_Paulo";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompacto = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const inteiro = new Intl.NumberFormat("pt-BR");
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});
const relativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatBRL(valor: number | null | undefined): string {
  return valor == null ? "—" : brl.format(valor);
}

export function formatBRLCompacto(valor: number | null | undefined): string {
  return valor == null ? "—" : brlCompacto.format(valor);
}

export function formatNumero(valor: number | null | undefined): string {
  return valor == null ? "—" : inteiro.format(valor);
}

export function formatDataHora(iso: string | null | undefined): string {
  return iso ? dataHora.format(new Date(iso)) : "—";
}

export function formatDataCurta(iso: string | null | undefined): string {
  return iso ? dataCurta.format(new Date(iso)).replace(".", "") : "—";
}

/** "há 5 minutos", "ontem", "em 3 dias". */
export function formatRelativo(iso: string | null | undefined, agora: Date = new Date()): string {
  if (!iso) return "—";
  const diffSeg = Math.round((new Date(iso).getTime() - agora.getTime()) / 1000);
  const abs = Math.abs(diffSeg);
  if (abs < 45) return "agora";
  if (abs < 3600) return relativo.format(Math.round(diffSeg / 60), "minute");
  if (abs < 86400) return relativo.format(Math.round(diffSeg / 3600), "hour");
  if (abs < 86400 * 30) return relativo.format(Math.round(diffSeg / 86400), "day");
  return formatDataHora(iso);
}

export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "").padStart(11, "0");
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function digitosTelefoneBR(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  return d.startsWith("55") && d.length > 11 ? d : `55${d}`;
}

/** Link pro discador do celular: tel:+5519983529292 */
export function telHref(telefone: string | null | undefined): string | null {
  return telefone ? `tel:+${digitosTelefoneBR(telefone)}` : null;
}

/** Link pro WhatsApp (abre o app no celular, web no desktop). */
export function whatsappHref(telefone: string | null | undefined): string | null {
  return telefone ? `https://wa.me/${digitosTelefoneBR(telefone)}` : null;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** "rosilene Ferreira da silva" -> "Rosilene Ferreira da Silva" (o checker manda caixa bagunçada). */
export function nomeProprio(nome: string): string {
  const minusculas = new Set(["da", "de", "do", "das", "dos", "e"]);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

export function porcentagem(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}
