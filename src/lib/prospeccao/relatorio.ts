import "server-only";
import { prisma } from "@/lib/prisma";
import type { Especialidade } from "@/generated/prisma/enums";
import { META_LIGACOES, META_WHATSAPP } from "./config";
import { inicioDoDia } from "./fila";

const DIA_MS = 86_400_000;

/** Segunda-feira 00:00 (Recife) da semana de `agora`. */
export function inicioDaSemana(agora = new Date()) {
  const hoje = inicioDoDia(agora);
  const diaSemana = new Date(hoje.getTime() + 3 * 3_600_000).getUTCDay(); // 0 = domingo, no fuso de Recife
  const voltar = (diaSemana + 6) % 7; // segunda = 0
  return new Date(hoje.getTime() - voltar * DIA_MS);
}

// Etapas do funil, em ordem. Cada clínica abordada chega até a etapa mais funda que já alcançou,
// mesmo que depois tenha virado "perdido" (senão quem disse não depois da proposta sumiria do funil).
export const ETAPAS = ["abordadas", "responderam", "conversaram", "proposta", "piloto", "cliente"] as const;
export type Etapa = (typeof ETAPAS)[number];

const PROFUNDIDADE_STATUS: Record<string, number> = { abordado: 0, sem_resposta: 0, respondeu: 1, conversa: 2, proposta: 3, piloto: 4, cliente: 5 };
const PROFUNDIDADE_ACAO: Record<string, number> = {
  whatsapp_enviado: 0, follow_up_enviado: 0, ligou_nao_atendeu: 0,
  respondeu: 1,
  virou_conversa: 2, ligou_falou: 2, visitou_conversou: 2,
  proposta_enviada: 3, fechou_piloto: 4, virou_cliente: 5,
};

type Linha = Record<Etapa, number>;
const vazia = (): Linha => ({ abordadas: 0, responderam: 0, conversaram: 0, proposta: 0, piloto: 0, cliente: 0 });

export const NOME_TIPO: Record<Especialidade, string> = {
  ODONTOLOGIA: "Odontologia",
  MEDICINA: "Clínicas médicas",
  OFTALMOLOGIA: "Oftalmologia",
  OUTRA: "Outras",
};
const NOME_CANAL: Record<string, string> = { whatsapp: "WhatsApp", ligacao: "Ligação", visita: "Visita" };

export async function gerarRelatorio(agora = new Date()) {
  const semana = inicioDaSemana(agora);
  const semanaPassada = new Date(semana.getTime() - 7 * DIA_MS);

  // ── atividade (o que vocês fizeram) ──
  const contar = async (de: Date, ate: Date) => {
    const g = await prisma.interacaoProspect.groupBy({ by: ["acao"], where: { em: { gte: de, lt: ate } }, _count: true });
    const n = (...acoes: string[]) => g.filter((x) => acoes.includes(x.acao)).reduce((s, x) => s + x._count, 0);
    return {
      mensagens: n("whatsapp_enviado"),
      followUps: n("follow_up_enviado"),
      ligacoes: n("ligou_falou", "ligou_nao_atendeu"),
      visitas: n("visitou_conversou", "visitou_voltar"),
      respostas: n("respondeu"),
      conversas: n("virou_conversa", "ligou_falou", "visitou_conversou"),
      propostas: n("proposta_enviada"),
      pilotos: n("fechou_piloto"),
      clientes: n("virou_cliente"),
      perdidos: n("sem_interesse"),
      semResposta: n("encerrado_sem_resposta"),
    };
  };
  const [atividade, atividadeAnterior] = await Promise.all([contar(semana, agora), contar(semanaPassada, semana)]);
  const diasUteis = Math.min(5, Math.max(1, Math.ceil((agora.getTime() - semana.getTime()) / DIA_MS)));
  const metas = { mensagens: META_WHATSAPP * diasUteis, ligacoes: META_LIGACOES * diasUteis, diasUteis };

  // ── funil acumulado (desde o começo) ──
  const abordadas = await prisma.prospect.findMany({
    where: { primeiroContatoEm: { not: null } },
    select: { tipo: true, cidade: true, canal: true, status: true, interacoes: { select: { acao: true } } },
  });

  const total = vazia();
  const porTipo = new Map<Especialidade, Linha>();
  const porCidade = new Map<string, Linha>();
  const porCanal = new Map<string, Linha>();
  for (const p of abordadas) {
    const fundo = Math.max(PROFUNDIDADE_STATUS[p.status] ?? 0, ...p.interacoes.map((i) => PROFUNDIDADE_ACAO[i.acao] ?? 0));
    for (const [mapa, chave] of [[porTipo, p.tipo], [porCidade, p.cidade], [porCanal, NOME_CANAL[p.canal ?? ""] ?? "Outro"]] as const) {
      const m = mapa as Map<string, Linha>;
      if (!m.has(chave)) m.set(chave, vazia());
    }
    for (const linha of [total, porTipo.get(p.tipo)!, porCidade.get(p.cidade)!, porCanal.get(NOME_CANAL[p.canal ?? ""] ?? "Outro")!]) {
      ETAPAS.forEach((e, i) => {
        if (fundo >= i) linha[e]++;
      });
    }
  }

  // ── leitura: qual tipo de clínica está ganhando (regra do plano: mais pilotos; empate → taxa de conversa) ──
  const tipos = [...porTipo.entries()].map(([tipo, l]) => ({
    tipo,
    nome: NOME_TIPO[tipo],
    ...l,
    taxaResposta: taxa(l.responderam, l.abordadas),
    taxaConversa: taxa(l.conversaram, l.abordadas),
  }));
  const comBase = tipos.filter((t) => t.abordadas >= 5);
  const lider = [...comBase].sort((a, b) => b.piloto - a.piloto || b.taxaConversa - a.taxaConversa)[0] ?? null;

  const ordenar = (m: Map<string, Linha>) =>
    [...m.entries()]
      .map(([nome, l]) => ({ nome, ...l, taxaResposta: taxa(l.responderam, l.abordadas) }))
      .sort((a, b) => b.abordadas - a.abordadas);

  return {
    semana: { de: semana, ate: agora },
    atividade,
    atividadeAnterior,
    metas,
    funil: total,
    porTipo: tipos.sort((a, b) => b.abordadas - a.abordadas),
    porCidade: ordenar(porCidade),
    porCanal: ordenar(porCanal),
    lider,
    naFila: await prisma.prospect.count({ where: { status: "novo" } }),
  };
}

export type Relatorio = Awaited<ReturnType<typeof gerarRelatorio>>;

function taxa(parte: number, todo: number) {
  return todo ? Math.round((parte / todo) * 100) : 0;
}

/** Versão curta para o WhatsApp de sexta. */
export function textoRelatorio(r: Relatorio) {
  const a = r.atividade;
  const ant = r.atividadeAnterior;
  const pl = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  const seta = (agora: number, antes: number) => (agora > antes ? "↑" : agora < antes ? "↓" : "=");
  const data = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Recife" });

  const linhas = [
    `📊 *Relatório da semana* (${data(r.semana.de)} a ${data(r.semana.ate)})`,
    "",
    "*O que fizemos*",
    `💬 ${a.mensagens}/${r.metas.mensagens} mensagens (${seta(a.mensagens, ant.mensagens)} semana passada: ${ant.mensagens})`,
    `📞 ${a.ligacoes}/${r.metas.ligacoes} ligações · 🔁 ${a.followUps} follow-ups · 🚗 ${a.visitas} visitas`,
    "",
    "*O que voltou*",
    `📩 ${pl(a.respostas, "resposta", "respostas")} (${seta(a.respostas, ant.respostas)} semana passada: ${ant.respostas}) · 🗣️ ${pl(a.conversas, "conversa", "conversas")}`,
    `📝 ${pl(a.propostas, "proposta", "propostas")} · 🚀 ${pl(a.pilotos, "piloto", "pilotos")} · ⭐ ${pl(a.clientes, "cliente", "clientes")}`,
    a.perdidos || a.semResposta ? `Saíram da fila: ${a.perdidos} sem interesse, ${a.semResposta} sem resposta` : null,
    "",
    "*Funil desde o começo*",
    `${r.funil.abordadas} abordadas → ${r.funil.responderam} responderam → ${r.funil.conversaram} conversaram → ${r.funil.proposta} propostas → ${r.funil.piloto} pilotos → ${r.funil.cliente} clientes`,
    "",
    "*Por tipo de clínica*",
    ...r.porTipo.map((t) => `${t.nome}: ${t.abordadas} abordadas · ${t.taxaResposta}% responderam · ${pl(t.piloto, "piloto", "pilotos")}`),
    r.lider ? `🏆 Na frente: *${r.lider.nome}* (${pl(r.lider.piloto, "piloto", "pilotos")}, ${r.lider.taxaConversa}% viram conversa)` : "Ainda pouco dado para comparar os tipos (mínimo de 5 abordadas em cada).",
    "",
    `Na fila para a próxima semana: ${r.naFila} clínicas.`,
    `${process.env.APP_URL ?? ""}/admin/prospeccao/relatorio`,
  ];
  return linhas.filter((l) => l !== null).join("\n");
}
