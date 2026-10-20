import { parseFichas, type ResultadoParse } from "./parseFichas";
import { parseSerasa } from "./parseSerasa";
import { parseFamilhao } from "./parseFamilhao";

/** Cada rifa vem de uma fonte com um arquivo diferente; a aba de importação escolhe o leitor. */
export const FORMATOS = {
  familhao: {
    rotulo: "Familhão",
    arquivo: ".txt das fichas",
    extensoes: ".txt,text/plain",
    descricao: "Blocos separados por \"======\" com Nome, CPF, Nascimento, Cidade/UF, Endereço, WhatsApp.",
    dica: "Arraste o .txt aqui ou clique pra escolher",
    ler: (conteudo: string): ResultadoParse => parseFamilhao(conteudo),
  },
  checker: {
    rotulo: "Bolada Pix",
    arquivo: ".txt do checker",
    extensoes: ".txt,text/plain",
    descricao: "Blocos \"=== CPF … ===\" com as compras de cada pessoa.",
    dica: "Arraste o .txt aqui ou clique pra escolher",
    ler: (conteudo: string): ResultadoParse => parseFichas(conteudo),
  },
  serasa: {
    rotulo: "Pix do Milhão",
    arquivo: ".csv do Serasa",
    extensoes: ".csv,text/csv,text/plain",
    descricao: "Uma linha por pessoa: CPF; nome; nascimento; idade; telefone; cidade; renda; score.",
    dica: "Arraste o .csv aqui ou clique pra escolher",
    ler: (conteudo: string): ResultadoParse => parseSerasa(conteudo),
  },
} as const;

export type Formato = keyof typeof FORMATOS;

export function ehFormato(v: string): v is Formato {
  return v in FORMATOS;
}
