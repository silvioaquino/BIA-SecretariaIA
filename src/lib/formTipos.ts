// Tipos e padrões do formulário da Bia, compartilhados entre servidor e cliente.
// (Fica fora do FormBia.tsx porque valores exportados de um arquivo "use client"
// não podem ser usados no servidor.)
import { DIAS } from "@/lib/validacao";

export type Horario = { aberto: boolean; inicio: string; fim: string };
export type Prof = { nome: string; especialidade?: string; atendimento?: string; idAgenda?: string };
export type Proc = { nome: string; descricao?: string; duracaoMin?: string; valor?: string; orientacoes?: string };

export type ProdutoId = "CONFIRMA" | "COMPLETA";
export type PorteId = "PEQUENA" | "MEDIA" | "GRANDE";

export function lerProduto(v: unknown): ProdutoId | null {
  return v === "CONFIRMA" || v === "COMPLETA" ? v : null;
}
export function lerPorte(v: unknown): PorteId | null {
  return v === "PEQUENA" || v === "MEDIA" || v === "GRANDE" ? v : null;
}

export type ValoresFormBia = {
  nome: string;
  cpfCnpj: string;
  email: string;
  whatsapp: string;
  cidade: string;
  produto: ProdutoId;
  porte: PorteId;
  fonteAgenda: string;
  especialidade: string;
  nomeExibicao: string;
  endereco: string;
  linkMaps: string;
  telefoneRecepcao: string;
  modoAgenda: string;
  horarios: Record<string, Horario>;
  profissionais: Prof[];
  procedimentos: Proc[];
  aceitaParticular: boolean;
  convenios: string;
  formasPagamento: string;
  orientacoesGerais: string;
  mensagemBoasVindas: string;
  informacoesExtras: string;
};

export const HORARIOS_PADRAO: Record<string, Horario> = Object.fromEntries(
  DIAS.map(([k]) => [
    k,
    { aberto: k !== "dom", inicio: "08:00", fim: k === "sab" ? "12:00" : "18:00" },
  ]),
);
