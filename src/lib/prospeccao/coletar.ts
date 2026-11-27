import "server-only";
import { prisma } from "@/lib/prisma";
import type { Especialidade } from "@/generated/prisma/enums";
import { evolutionConfigurada, temWhatsapp } from "@/lib/evolution";
import { BUSCAS, CIDADES } from "./config";
import { buscarLugares, cidadeEBairro, type Lugar } from "./places";
import { chave, cidadeAlvo, porteEstimado, telefone } from "./normalizar";
import { pontuar } from "./pontuacao";

// Status que a coleta pode mexer. Daqui para frente, quem manda é a equipe.
const STATUS_AUTOMATICOS = ["novo", "descartado"];

type Opcoes = { cidades?: readonly string[]; tipos?: Especialidade[]; maxPaginas?: number };

/**
 * Coleta semanal: busca no Google Places cada termo × cidade, junta com o que
 * já existe (pelo place_id, telefone ou nome + cidade), confere WhatsApp dos
 * novos e recalcula a pontuação.
 */
export async function coletar(op: Opcoes = {}) {
  if (!process.env.GOOGLE_PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY não configurada");
  const coleta = await prisma.coletaProspeccao.create({ data: {} });
  const erros: string[] = [];
  let buscas = 0;
  const vistos = new Map<string, { lugar: Lugar; tipo: Especialidade }>();

  const cidades = op.cidades ?? CIDADES;
  for (const grupo of BUSCAS) {
    if (op.tipos && !op.tipos.includes(grupo.tipo)) continue;
    for (const cidade of cidades) {
      for (const termo of grupo.termos) {
        try {
          const r = await buscarLugares(`${termo} ${cidade} PE`, op.maxPaginas);
          buscas += r.chamadas;
          for (const l of r.lugares) {
            // o mesmo lugar aparece em buscas diferentes: fica o 1º tipo encontrado
            if (!vistos.has(l.id)) vistos.set(l.id, { lugar: l, tipo: grupo.tipo });
          }
        } catch (e) {
          erros.push(`${termo} ${cidade}: ${(e as Error).message}`);
        }
      }
    }
  }

  let encontrados = 0;
  let novos = 0;
  let atualizados = 0;
  const agora = new Date();

  for (const { lugar, tipo } of vistos.values()) {
    try {
      const { cidade: cidadeBruta, bairro } = cidadeEBairro(lugar);
      const cidade = cidadeAlvo(cidadeBruta) ?? cidadeAlvo(lugar.formattedAddress);
      if (!cidade) continue; // o Google devolve vizinhas (Recife, Goiana…): fora da região
      encontrados++;

      const nome = lugar.displayName?.text ?? "Sem nome";
      const tel = telefone(lugar.nationalPhoneNumber);
      const dados = {
        nome,
        cidade,
        bairro,
        endereco: lugar.formattedAddress ?? null,
        telefone: tel?.numero ?? null,
        tipoTelefone: tel?.tipo ?? null,
        site: lugar.websiteUri ?? null,
        mapsUrl: lugar.googleMapsUri ?? null,
        nota: lugar.rating ?? null,
        avaliacoes: lugar.userRatingCount ?? null,
        porteEstimado: porteEstimado(lugar.userRatingCount),
        fechadaNoGoogle: lugar.businessStatus === "CLOSED_PERMANENTLY",
        vistoNoGoogleEm: agora,
      };

      const existente = await acharExistente(lugar.id, tel?.numero ?? null, nome, cidade);
      if (existente) {
        await prisma.prospect.update({
          where: { id: existente.id },
          // dados digitados à mão (instagram, observações, status) não são tocados
          data: { ...dados, placeId: lugar.id, nome: existente.origem === "google" ? nome : existente.nome },
        });
        atualizados++;
      } else {
        await prisma.prospect.create({ data: { ...dados, tipo, placeId: lugar.id, origem: "google", extras: { tiposGoogle: lugar.types ?? [] } } });
        novos++;
      }
    } catch (e) {
      // um lugar com dado estranho não derruba a coleta inteira
      erros.push(`${lugar.displayName?.text ?? lugar.id}: ${(e as Error).message}`);
    }
  }

  const whatsapp = await verificarWhatsapp(erros);
  await repontuar();

  const resumo = { buscas, encontrados, novos, atualizados, whatsappVerificados: whatsapp, erros };
  await prisma.coletaProspeccao.update({
    where: { id: coleta.id },
    data: { terminouEm: new Date(), buscas, encontrados, novos, atualizados, erros },
  });
  return resumo;
}

async function acharExistente(placeId: string, tel: string | null, nome: string, cidade: string) {
  const porPlace = await prisma.prospect.findUnique({ where: { placeId } });
  if (porPlace) return porPlace;
  if (tel) {
    const porTel = await prisma.prospect.findFirst({ where: { telefone: tel, placeId: null } });
    if (porTel) return porTel;
  }
  // nome igual (sem acento/caixa) na mesma cidade, só entre os que ainda não têm place_id
  const candidatos = await prisma.prospect.findMany({ where: { cidade, placeId: null }, select: { id: true, nome: true, origem: true } });
  const k = chave(nome);
  const achado = candidatos.find((c) => chave(c.nome) === k);
  return achado ? prisma.prospect.findUnique({ where: { id: achado.id } }) : null;
}

/** Confere na Evolution quem ainda não foi verificado. Devolve quantos conferiu. */
export async function verificarWhatsapp(erros: string[] = []) {
  if (!evolutionConfigurada()) return 0;
  const pendentes = await prisma.prospect.findMany({
    where: { telefone: { not: null }, temWhatsapp: null, status: { in: STATUS_AUTOMATICOS } },
    select: { id: true, telefone: true },
    take: 300,
  });
  try {
    const mapa = await temWhatsapp(pendentes.map((p) => p.telefone!));
    const agora = new Date();
    for (const p of pendentes) {
      const tem = mapa.get(p.telefone!);
      if (tem === undefined) continue;
      await prisma.prospect.update({ where: { id: p.id }, data: { temWhatsapp: tem, whatsappVerificadoEm: agora } });
    }
    return mapa.size;
  } catch (e) {
    erros.push(`WhatsApp: ${(e as Error).message}`);
    return 0;
  }
}

/** Recalcula a pontuação de todos. Só muda o status de quem ainda está em "novo"/"descartado". */
export async function repontuar() {
  const todos = await prisma.prospect.findMany();
  for (const p of todos) {
    const tiposGoogle = ((p.extras as { tiposGoogle?: string[] } | null)?.tiposGoogle) ?? [];
    const r = pontuar({ ...p, tiposGoogle });
    // adicionada à mão pela equipe: nunca é descartada automaticamente
    const status = STATUS_AUTOMATICOS.includes(p.status) && p.origem !== "manual" ? (r.descartar ? "descartado" : "novo") : p.status;
    await prisma.prospect.update({
      where: { id: p.id },
      data: { pontuacao: r.pontuacao, faixa: r.faixa, motivos: r.motivos, status },
    });
  }
  return todos.length;
}
