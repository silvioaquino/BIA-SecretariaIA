import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { CIDADES_VISITA, DIAS_FOLLOW_UP, META_LIGACOES, META_WHATSAPP } from "./config";

const DIA_MS = 86_400_000;

/** 00:00 de hoje em Recife (UTC-3, sem horário de verão). */
export function inicioDoDia(agora = new Date()) {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(agora);
  return new Date(`${d}T00:00:00-03:00`);
}

// ───────────────────────── Ações ─────────────────────────

export const ACOES = {
  whatsapp_enviado: "Enviei a mensagem",
  follow_up_enviado: "Enviei o follow-up",
  respondeu: "Respondeu",
  virou_conversa: "Conversa em andamento",
  proposta_enviada: "Proposta enviada",
  fechou_piloto: "Fechou o piloto",
  virou_cliente: "Virou cliente",
  ligou_falou: "Falei com a pessoa certa",
  ligou_nao_atendeu: "Não atendeu",
  visitou_conversou: "Conversei na visita",
  visitou_voltar: "Voltar outro dia",
  sem_interesse: "Sem interesse",
  numero_errado: "Número errado / não existe",
  pular: "Pular hoje",
} as const;
export type Acao = keyof typeof ACOES;

/** Ações que contam como "feito hoje" na meta do dia. */
const CONTA_WHATSAPP: Acao[] = ["whatsapp_enviado"];
const CONTA_LIGACAO: Acao[] = ["ligou_falou", "ligou_nao_atendeu"];

/** Registra o que aconteceu com uma clínica e calcula o próximo passo. */
export async function registrar(
  prospectId: string,
  acao: Acao,
  por: string,
  agora = new Date(),
  extra: { detalhe?: string; mensagemId?: string } = {},
) {
  const p = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!p) throw new Error("Clínica não encontrada");

  // O webhook e o botão podem registrar o mesmo envio: o 2º não reinicia a contagem.
  if (acao === "whatsapp_enviado" && p.status !== "novo") return p;

  const em = (dias: number) => new Date(inicioDoDia(agora).getTime() + dias * DIA_MS);
  const contato = { ultimoContatoEm: agora, primeiroContatoEm: p.primeiroContatoEm ?? agora };
  let data: Prisma.ProspectUpdateInput;

  switch (acao) {
    case "whatsapp_enviado":
      data = { ...contato, status: "abordado", canal: "whatsapp", tentativas: 1, proximoContatoEm: em(DIAS_FOLLOW_UP[0]) };
      break;
    case "follow_up_enviado": {
      const t = p.tentativas + 1;
      data = { ...contato, tentativas: t, proximoContatoEm: em(DIAS_FOLLOW_UP[Math.min(t - 1, DIAS_FOLLOW_UP.length - 1)]) };
      break;
    }
    case "respondeu":
      data = { ...contato, status: "respondeu", proximoContatoEm: null };
      break;
    case "virou_conversa":
      data = { ...contato, status: "conversa", proximoContatoEm: null };
      break;
    case "proposta_enviada":
      data = { ...contato, status: "proposta", proximoContatoEm: null };
      break;
    case "fechou_piloto":
      data = { ...contato, status: "piloto", proximoContatoEm: null };
      break;
    case "virou_cliente":
      data = { ...contato, status: "cliente", proximoContatoEm: null };
      break;
    case "ligou_falou":
      data = { ...contato, status: "conversa", canal: "ligacao", tentativas: p.tentativas + 1, proximoContatoEm: null };
      break;
    case "ligou_nao_atendeu": {
      const t = p.tentativas + 1;
      // 3 ligações sem atender: sai da fila
      data = t >= 3
        ? { ...contato, status: "sem_resposta", canal: "ligacao", tentativas: t, proximoContatoEm: null }
        : { ...contato, canal: "ligacao", tentativas: t, proximoContatoEm: em(1) };
      break;
    }
    case "visitou_conversou":
      data = { ...contato, status: "conversa", canal: "visita", proximoContatoEm: null };
      break;
    case "visitou_voltar":
      data = { proximoContatoEm: em(7) };
      break;
    case "sem_interesse":
      data = { ...contato, status: "perdido", proximoContatoEm: null };
      break;
    case "numero_errado":
      data = { status: "descartado", telefone: null, temWhatsapp: null, proximoContatoEm: null };
      break;
    case "pular":
      data = { proximoContatoEm: em(1) };
      break;
  }

  const atualizado = await prisma.prospect.update({ where: { id: p.id }, data });
  await prisma.interacaoProspect.create({
    data: { prospectId: p.id, acao, statusDe: p.status, statusPara: atualizado.status, por, ...extra },
  });
  return atualizado;
}

// ───────────────────────── Fila ─────────────────────────

const SELECAO = {
  id: true, nome: true, tipo: true, cidade: true, bairro: true, endereco: true, telefone: true,
  tipoTelefone: true, temWhatsapp: true, mapsUrl: true, site: true, instagram: true, nota: true,
  avaliacoes: true, porteEstimado: true, pontuacao: true, faixa: true, motivos: true, status: true,
  tentativas: true, observacoes: true, ultimoContatoEm: true,
} satisfies Prisma.ProspectSelect;

export type ItemFila = Prisma.ProspectGetPayload<{ select: typeof SELECAO }>;

/** Encerra quem já recebeu os 2 follow-ups e não respondeu (roteiro: "não insista mais"). */
async function encerrarSemResposta(agora: Date) {
  const vencidos = await prisma.prospect.findMany({
    where: { status: "abordado", tentativas: { gte: DIAS_FOLLOW_UP.length }, proximoContatoEm: { lte: agora } },
    select: { id: true },
  });
  for (const v of vencidos) {
    await prisma.prospect.update({ where: { id: v.id }, data: { status: "sem_resposta", proximoContatoEm: null } });
    await prisma.interacaoProspect.create({
      data: { prospectId: v.id, acao: "encerrado_sem_resposta", statusDe: "abordado", statusPara: "sem_resposta", por: "sistema" },
    });
  }
}

/**
 * `alvoWhatsapp`: quantas 1ªs mensagens a fila deve completar hoje. Começa na meta (10);
 * o botão "carregar mais 10" da página sobe esse número.
 */
export async function montarFila(agora = new Date(), alvoWhatsapp = META_WHATSAPP) {
  await encerrarSemResposta(agora);
  const hoje = inicioDoDia(agora);

  const feitosHoje = await prisma.interacaoProspect.groupBy({
    by: ["acao"],
    where: { em: { gte: hoje } },
    _count: true,
  });
  const contar = (acoes: Acao[]) => feitosHoje.filter((f) => acoes.includes(f.acao as Acao)).reduce((s, f) => s + f._count, 0);
  const whatsFeitos = contar(CONTA_WHATSAPP);
  const ligFeitas = contar(CONTA_LIGACAO);

  const disponivel: Prisma.ProspectWhereInput = {
    status: "novo",
    OR: [{ proximoContatoEm: null }, { proximoContatoEm: { lte: agora } }],
  };
  const paraWhatsapp: Prisma.ProspectWhereInput = {
    ...disponivel,
    cidade: { notIn: CIDADES_VISITA },
    telefone: { not: null },
    AND: [
      { OR: [{ temWhatsapp: true }, { temWhatsapp: null, tipoTelefone: "CELULAR" }] },
      { OR: [{ canal: null }, { canal: { not: "ligacao" } }] }, // já entrou na fila de ligações
    ],
  };
  const ordem: Prisma.ProspectOrderByWithRelationInput[] = [{ pontuacao: "desc" }, { avaliacoes: { sort: "desc", nulls: "last" } }];

  const [negociacao, respostas, whatsapp, ligacoes, visitas, followUps, funil] = await Promise.all([
    // já conversando: avançar no funil (proposta → piloto → cliente)
    prisma.prospect.findMany({
      where: { status: { in: ["conversa", "proposta", "piloto"] } },
      orderBy: { ultimoContatoEm: "desc" },
      select: SELECAO,
    }),
    // responderam e ainda ninguém tratou: o mais importante do dia
    prisma.prospect.findMany({
      where: { status: "respondeu" },
      orderBy: { ultimoContatoEm: "desc" },
      select: {
        ...SELECAO,
        interacoes: { where: { detalhe: { not: null }, por: "whatsapp" }, orderBy: { em: "desc" }, take: 1, select: { detalhe: true, em: true } },
      },
    }),
    prisma.prospect.findMany({
      where: paraWhatsapp,
      orderBy: ordem,
      take: Math.max(0, Math.max(alvoWhatsapp, META_WHATSAPP) - whatsFeitos),
      select: SELECAO,
    }),
    prisma.prospect.findMany({
      where: {
        ...disponivel,
        cidade: { notIn: CIDADES_VISITA },
        telefone: { not: null },
        AND: [{ OR: [{ temWhatsapp: false }, { temWhatsapp: null, tipoTelefone: "FIXO" }, { canal: "ligacao" }] }],
      },
      orderBy: ordem,
      take: Math.max(0, META_LIGACOES - ligFeitas),
      select: SELECAO,
    }),
    prisma.prospect.findMany({
      where: { ...disponivel, cidade: { in: CIDADES_VISITA } },
      orderBy: ordem,
      select: SELECAO,
    }),
    prisma.prospect.findMany({
      where: { status: "abordado", canal: "whatsapp", proximoContatoEm: { lte: agora } },
      orderBy: { proximoContatoEm: "asc" },
      select: SELECAO,
    }),
    prisma.prospect.groupBy({ by: ["status"], _count: true }),
  ]);
  // quantas ainda podem receber a 1ª mensagem (para mostrar o botão "mais 10")
  const whatsappDisponiveis = await prisma.prospect.count({ where: paraWhatsapp });

  return {
    negociacao,
    respostas,
    whatsapp,
    ligacoes,
    visitas,
    followUps,
    whatsappDisponiveis,
    metas: { whatsapp: { feitos: whatsFeitos, meta: META_WHATSAPP }, ligacoes: { feitos: ligFeitas, meta: META_LIGACOES } },
    funil: Object.fromEntries(funil.map((f) => [f.status, f._count])) as Record<string, number>,
  };
}
