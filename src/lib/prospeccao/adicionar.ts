import "server-only";
import { prisma } from "@/lib/prisma";
import type { Especialidade } from "@/generated/prisma/enums";
import { temWhatsapp } from "@/lib/evolution";
import { buscarLugares, cidadeEBairro, type Lugar } from "./places";
import { cidadeAlvo, porteEstimado, telefone } from "./normalizar";
import { pontuar } from "./pontuacao";

// Clínica adicionada à mão pela equipe (indicação, cliente que conhecem…).
// Fica com origem "manual": aparece na seção "Indicações" da fila, fora da meta do dia.

export type ResultadoBusca = {
  placeId: string;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  telefone: string | null;
  nota: number | null;
  avaliacoes: number | null;
  tipoSugerido: Especialidade;
  /** já está na lista: status atual */
  jaNaLista: string | null;
};

/** Tipo de clínica pelo que o Google diz (só um palpite: a equipe confere antes de adicionar). */
function tipoPeloGoogle(l: Lugar): Especialidade {
  const t = l.types ?? [];
  const nome = (l.displayName?.text ?? "").toLowerCase();
  if (t.includes("dentist") || /odonto|dent|sorriso|oral/.test(nome)) return "ODONTOLOGIA";
  if (/oftalmo|olho|vis[ãa]o|oculi/.test(nome)) return "OFTALMOLOGIA";
  if (t.includes("doctor") || t.includes("medical_clinic") || /cl[ií]nica|sa[úu]de|m[ée]dic/.test(nome)) return "MEDICINA";
  return "OUTRA";
}

/** Busca pelo nome no Google (1 chamada, até 20 resultados em Pernambuco). */
export async function buscarClinica(texto: string): Promise<ResultadoBusca[]> {
  const { lugares } = await buscarLugares(`${texto} Pernambuco`, 1);
  const ids = lugares.map((l) => l.id);
  const existentes = await prisma.prospect.findMany({ where: { placeId: { in: ids } }, select: { placeId: true, status: true } });
  return lugares.slice(0, 8).map((l) => {
    const { cidade } = cidadeEBairro(l);
    return {
      placeId: l.id,
      nome: l.displayName?.text ?? "Sem nome",
      endereco: l.formattedAddress ?? null,
      cidade: cidadeAlvo(cidade) ?? cidade,
      telefone: l.nationalPhoneNumber ?? null,
      nota: l.rating ?? null,
      avaliacoes: l.userRatingCount ?? null,
      tipoSugerido: tipoPeloGoogle(l),
      jaNaLista: existentes.find((e) => e.placeId === l.id)?.status ?? null,
    };
  });
}

export type NovaClinica = {
  placeId?: string | null;
  nome: string;
  tipo: Especialidade;
  cidade: string;
  telefone?: string | null;
  endereco?: string | null;
  nota?: number | null;
  avaliacoes?: number | null;
  observacoes?: string | null;
};

/** Cria (ou traz de volta) a clínica na lista. Confere o WhatsApp na hora. */
export async function adicionarClinica(d: NovaClinica, por: string) {
  const tel = telefone(d.telefone);
  const existente =
    (d.placeId ? await prisma.prospect.findUnique({ where: { placeId: d.placeId } }) : null) ??
    (tel ? await prisma.prospect.findFirst({ where: { telefone: tel.numero } }) : null);
  if (existente) return { prospect: existente, novo: false };

  let whats: boolean | null = null;
  if (tel) {
    try {
      whats = (await temWhatsapp([tel.numero])).get(tel.numero) ?? null;
    } catch {
      // Evolution fora do ar: fica para a conferência da próxima coleta
    }
  }

  const r = pontuar({
    nome: d.nome,
    tipo: d.tipo,
    nota: d.nota ?? null,
    avaliacoes: d.avaliacoes ?? null,
    tipoTelefone: tel?.tipo ?? null,
    temWhatsapp: whats,
  });
  const prospect = await prisma.prospect.create({
    data: {
      origem: "manual",
      placeId: d.placeId || null,
      nome: d.nome.trim(),
      tipo: d.tipo,
      cidade: cidadeAlvo(d.cidade) ?? d.cidade.trim(),
      endereco: d.endereco ?? null,
      telefone: tel?.numero ?? null,
      tipoTelefone: tel?.tipo ?? null,
      temWhatsapp: whats,
      whatsappVerificadoEm: whats == null ? null : new Date(),
      nota: d.nota ?? null,
      avaliacoes: d.avaliacoes ?? null,
      porteEstimado: porteEstimado(d.avaliacoes),
      mapsUrl: d.placeId ? `https://www.google.com/maps/place/?q=place_id:${d.placeId}` : null,
      pontuacao: r.pontuacao,
      faixa: r.faixa,
      motivos: ["Adicionada à mão pela equipe", ...r.motivos],
      observacoes: d.observacoes?.trim() || null,
      status: "novo", // escolhida pela equipe: nunca é descartada automaticamente
    },
  });
  await prisma.interacaoProspect.create({
    data: { prospectId: prospect.id, acao: "adicionada", statusDe: "novo", statusPara: "novo", por },
  });
  return { prospect, novo: true };
}

/** Já na lista e ainda não abordada: passa a aparecer em "Indicações" (guarda a origem antiga). */
export async function trazerParaIndicacoes(id: string) {
  const p = await prisma.prospect.findUnique({ where: { id }, select: { origem: true, extras: true, status: true } });
  if (!p || p.origem === "manual") return;
  const extras = { ...((p.extras as Record<string, unknown> | null) ?? {}), origemAnterior: p.origem };
  await prisma.prospect.update({
    where: { id },
    data: { origem: "manual", extras, proximoContatoEm: null, ...(p.status === "descartado" && { status: "novo" }) },
  });
}
