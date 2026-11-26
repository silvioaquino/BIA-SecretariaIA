import type { Porte, Produto } from "@/generated/prisma/enums";

// Tabela de preços (PLANO-DE-EXECUCAO.md, seção "Preços", 22/11/2026).

export const PORTES: Record<Porte, { nome: string; descricao: string }> = {
  PEQUENA: { nome: "Pequena", descricao: "1 a 2 profissionais" },
  MEDIA: { nome: "Média", descricao: "3 a 5 profissionais" },
  GRANDE: { nome: "Grande", descricao: "6 ou mais profissionais" },
};

export type InfoProduto = {
  nome: string;
  slogan: string;
  resumo: string;
  recursos: string[];
  precos: Record<Porte, number>;
  /** Taxa única cobrada junto com a 1ª mensalidade (0 = sem taxa). */
  implantacao: number;
};

export const PRODUTOS: Record<Produto, InfoProduto> = {
  CONFIRMA: {
    nome: "Bia Confirma",
    slogan: "Acaba com as faltas",
    resumo: "Confirma cada consulta no WhatsApp, avisa a recepção quando alguém precisa remarcar e mostra quanto você recuperou.",
    recursos: [
      "Confirmação na véspera: “1 confirma · 2 remarca”",
      "Lembrete no dia, com a orientação da clínica",
      "Alerta para a recepção quando o paciente quer remarcar",
      "A recepção assume a conversa quando quiser",
      "Relatório semanal: confirmados, faltas e valor recuperado",
    ],
    precos: { PEQUENA: 197, MEDIA: 397, GRANDE: 697 },
    implantacao: 0,
  },
  COMPLETA: {
    nome: "Bia Completa",
    slogan: "Uma secretária 24h no WhatsApp",
    resumo: "Tudo do Confirma, mais uma secretária que responde, agenda e remarca a qualquer hora, inclusive de madrugada e no fim de semana.",
    recursos: [
      "Tudo do Bia Confirma",
      "Atendimento 24h: endereço, convênios, valores e preparo de exames",
      "Entende áudio e foto",
      "Agenda, remarca e cancela (Google Agenda ou pré-agendamento)",
      "Lista de espera: vaga desmarcada vira consulta",
      "Reativação de pacientes sumidos há mais de 6 meses",
      "Passa para a recepção com o resumo da conversa",
    ],
    precos: { PEQUENA: 397, MEDIA: 797, GRANDE: 997 },
    implantacao: 499,
  },
};

/** Clientes do Confirma há pelo menos este tempo não pagam implantação no upgrade. */
export const DIAS_UPGRADE_SEM_IMPLANTACAO = 60;

export function precoMensal(produto: Produto, porte: Porte) {
  return PRODUTOS[produto].precos[porte];
}

export function nomePlano(produto: Produto, porte: Porte) {
  return `${PRODUTOS[produto].nome} · ${PORTES[porte].nome}`;
}

/** Dias de tolerância depois do vencimento antes de pausar a Bia. */
export const CARENCIA_DIAS = Number(process.env.CARENCIA_DIAS ?? 5);

/** Custo de referência de uma recepcionista com encargos (para comparação). */
export const CUSTO_RECEPCIONISTA = 2500;

export function brl(valor: number, centavos = true) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos ? 2 : 0,
    maximumFractionDigits: centavos ? 2 : 0,
  });
}
