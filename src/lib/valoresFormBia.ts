import "server-only";
import { prisma } from "@/lib/prisma";
import { HORARIOS_PADRAO, type PorteId, type ProdutoId, type ValoresFormBia } from "@/lib/formTipos";

/** Monta os valores iniciais do formulário a partir do banco (ou vazios). */
export async function valoresFormBia(
  clinicaId: string | null,
  emailUsuario: string,
  sugestao: { produto?: ProdutoId | null; porte?: PorteId | null } = {},
): Promise<ValoresFormBia> {
  const c = clinicaId
    ? await prisma.clinica.findUnique({
        where: { id: clinicaId },
        include: { config: true, profissionais: true, procedimentos: true },
      })
    : null;
  const cfg = c?.config;

  return {
    nome: c?.nome ?? "",
    cpfCnpj: c?.cpfCnpj ?? "",
    email: c?.email ?? emailUsuario,
    whatsapp: c?.whatsapp ?? "",
    cidade: c?.cidade ?? "",
    produto: c?.produto ?? sugestao.produto ?? "CONFIRMA",
    porte: c?.porte ?? sugestao.porte ?? "PEQUENA",
    fonteAgenda: cfg?.fonteAgenda ?? "PLANILHA",
    especialidade: cfg?.especialidade ?? "ODONTOLOGIA",
    nomeExibicao: cfg?.nomeExibicao ?? "",
    endereco: cfg?.endereco ?? "",
    linkMaps: cfg?.linkMaps ?? "",
    telefoneRecepcao: cfg?.telefoneRecepcao ?? "",
    modoAgenda: cfg?.modoAgenda ?? "PRE",
    horarios: { ...HORARIOS_PADRAO, ...((cfg?.horarios as ValoresFormBia["horarios"]) ?? {}) },
    profissionais: (c?.profissionais ?? []).map((p) => ({
      nome: p.nome,
      especialidade: p.especialidade ?? "",
      atendimento: p.atendimento ?? "",
      idAgenda: p.idAgenda ?? "",
    })),
    procedimentos: (c?.procedimentos ?? []).map((p) => ({
      nome: p.nome,
      descricao: p.descricao ?? "",
      duracaoMin: p.duracaoMin?.toString() ?? "",
      valor: p.valor?.toString() ?? "",
      orientacoes: p.orientacoes ?? "",
    })),
    aceitaParticular: cfg?.aceitaParticular ?? true,
    convenios: (cfg?.convenios ?? []).join(", "),
    formasPagamento: (cfg?.formasPagamento ?? []).join(", "),
    orientacoesGerais: cfg?.orientacoesGerais ?? "",
    mensagemBoasVindas: cfg?.mensagemBoasVindas ?? "",
    informacoesExtras: cfg?.informacoesExtras ?? "",
  };
}
