export type FichaStatus = "pendente" | "deu_bom" | "deu_ruim";

export interface Ligador {
  id: string;
  username: string;
  password_hash: string;
  nome: string;
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Rifa {
  id: string;
  nome: string;
  premio_descricao: string | null;
  premio_valor: number | null;
  data_sorteio: string | null;
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
}
