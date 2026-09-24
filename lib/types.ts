/** `retornar` = não atendeu, ligar de novo (continua na fila do ligador). */
export type FichaStatus = "pendente" | "retornar" | "deu_bom" | "deu_ruim";
/** O que ainda está na fila (não resolvido). */
export const STATUS_NA_FILA: FichaStatus[] = ["pendente", "retornar"];
/** O que já foi resolvido (histórico). */
export const STATUS_RESOLVIDOS: FichaStatus[] = ["deu_bom", "deu_ruim"];
export type { Compra } from "./import/parseFichas";
import type { Compra } from "./import/parseFichas";

export interface Ligador {
  id: string;
  username: string;
  password_hash: string;
  nome: string;
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
}

/** A rifa (ex.: "Bolada Pix"). A edição que vem no .txt não é guardada. */
export interface Rifa {
  id: string;
  nome: string;
  created_at: string;
}

export interface Ficha {
  id: string;
  rifa_id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  idade: number | null;
  profissao: string | null;
  renda: number | null;
  pedido: string | null;
  comprado_em: string | null;
  pagamento_valor: number | null;
  pagamento_status: string | null;
  pagamento_pago_em: string | null;
  qtd_numeros: number | null;
  status: FichaStatus;
  status_atualizado_por: string | null;
  status_atualizado_em: string | null;
  observacao: string | null;
  created_at: string;
  telefone_confirmado: boolean;
  /** Todas as compras do .txt, mais recente primeiro (jsonb). */
  compras: Compra[];
}

/** view rifas_resumo */
export interface RifaResumo extends Rifa {
  total: number;
  pendente: number;
  deu_bom: number;
  deu_ruim: number;
  sem_ligador: number;
  disponiveis: number;
}

/** view ligadores_resumo (nunca traz password_hash) */
export interface LigadorResumo extends Omit<Ligador, "password_hash"> {
  atribuidas: number;
  pendentes: number;
  deu_bom: number;
  deu_ruim: number;
  ultima_atividade: string | null;
}

/** view fichas_lista */
export interface FichaLista {
  id: string;
  rifa_id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  status: FichaStatus;
  observacao: string | null;
  status_atualizado_em: string | null;
  created_at: string;
  ligador_id: string | null;
  ligador_nome: string | null;
  rifa_nome: string;
  busca: string;
  // Opcionais: só existem depois da migration 0007 (podem vir undefined antes dela).
  telefone_confirmado?: boolean;
  idade?: number | null;
  profissao?: string | null;
  renda?: number | null;
  qtd_numeros?: number | null;
  pagamento_valor?: number | null;
  qtd_compras?: number;
}

/** view rifa_ligadores_resumo */
export interface RifaLigadorResumo {
  rifa_id: string;
  ligador_id: string;
  nome: string;
  foto_url: string | null;
  ativo: boolean;
  atribuidas: number;
  pendentes: number;
  deu_bom: number;
  deu_ruim: number;
}
