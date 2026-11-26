import "server-only";
import { prisma } from "@/lib/prisma";
import { avisarEquipe, variacoesNumero } from "@/lib/evolution";
import { registrar } from "./fila";
import { nomeCurto } from "./mensagens";

// Evento "messages.upsert" da Evolution API v2 (o que interessa dele).
export type EventoMensagem = {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; remoteJidAlt?: string; senderPn?: string; fromMe?: boolean; id?: string };
    pushName?: string;
    message?: Record<string, unknown> & {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string };
      videoMessage?: { caption?: string };
    };
    messageType?: string;
  };
};

// Status em que uma resposta da clínica muda o funil para "respondeu".
const AGUARDANDO_RESPOSTA = ["novo", "abordado", "sem_resposta"];

// Pista de pedido para não receber mais. Só AVISA: quem decide é a equipe.
const PARECE_OPT_OUT = /(^|[^\p{L}])(n[ãa]o (tenho|temos) interesse|sem interesse|n[ãa]o quero|n[ãa]o queremos|pare|parem|parar|remover|remova|n[ãa]o mand(e|em|a)|descadastr\p{L}*)($|[^\p{L}])/iu;

/** Texto legível da mensagem (ou o tipo, quando é mídia). */
export function textoDaMensagem(m: NonNullable<EventoMensagem["data"]>["message"]) {
  if (!m) return "";
  const texto = m.conversation ?? m.extendedTextMessage?.text ?? m.imageMessage?.caption ?? m.videoMessage?.caption;
  if (texto) return texto;
  if ("audioMessage" in m) return "[áudio]";
  if ("imageMessage" in m) return "[foto]";
  if ("videoMessage" in m) return "[vídeo]";
  if ("documentMessage" in m) return "[documento]";
  if ("stickerMessage" in m) return "[figurinha]";
  return "[mensagem]";
}

/** Número do contato: o JID normal, ou o alternativo quando vem no formato @lid. */
function numeroDoContato(key: NonNullable<NonNullable<EventoMensagem["data"]>["key"]>) {
  const candidatos = [key.remoteJid, key.remoteJidAlt, key.senderPn].filter(Boolean) as string[];
  const jid = candidatos.find((j) => j.endsWith("@s.whatsapp.net"));
  return jid ? jid.split("@")[0].replace(/\D/g, "") : null;
}

export type ResultadoMensagem =
  | { ignorada: string }
  | { prospect: string; acao: "respondeu" | "envio_registrado" | "nova_mensagem"; avisos?: number };

/**
 * Trata uma mensagem do WhatsApp comercial:
 * - a clínica respondeu → status "respondeu", histórico com o trecho e aviso para a equipe;
 * - a equipe mandou (fromMe) para uma clínica "novo" → registra o envio (caso esqueçam o botão).
 */
export async function processarMensagem(ev: EventoMensagem): Promise<ResultadoMensagem> {
  if (ev.event && ev.event.toLowerCase().replace("_", ".") !== "messages.upsert") return { ignorada: "evento" };
  const key = ev.data?.key;
  if (!key?.remoteJid) return { ignorada: "sem remetente" };
  if (key.remoteJid.endsWith("@g.us") || key.remoteJid.includes("broadcast")) return { ignorada: "grupo ou status" };

  const numero = numeroDoContato(key);
  if (!numero) return { ignorada: "número não identificado" };

  const p = await prisma.prospect.findFirst({ where: { telefone: { in: variacoesNumero(numero) } } });
  if (!p) return { ignorada: "não é clínica da lista" };

  const mensagemId = key.id;
  if (mensagemId && (await prisma.interacaoProspect.findUnique({ where: { mensagemId } }))) {
    return { ignorada: "repetida" };
  }
  const texto = textoDaMensagem(ev.data?.message).slice(0, 500);

  if (key.fromMe) {
    if (p.status !== "novo") return { ignorada: "envio da equipe para clínica já abordada" };
    await registrar(p.id, "whatsapp_enviado", "whatsapp", new Date(), { detalhe: texto, mensagemId });
    return { prospect: p.id, acao: "envio_registrado" };
  }

  if (!AGUARDANDO_RESPOSTA.includes(p.status)) {
    // já está em conversa: só guarda no histórico, sem avisar de novo
    await prisma.interacaoProspect.create({
      data: { prospectId: p.id, acao: "mensagem_recebida", statusDe: p.status, statusPara: p.status, por: "whatsapp", detalhe: texto, mensagemId },
    });
    return { prospect: p.id, acao: "nova_mensagem" };
  }

  await registrar(p.id, "respondeu", "whatsapp", new Date(), { detalhe: texto, mensagemId });

  const optOut = PARECE_OPT_OUT.test(texto);
  const aviso = [
    `📩 *${nomeCurto(p.nome)}* (${p.cidade}) respondeu${ev.data?.pushName ? `, ${ev.data.pushName}` : ""}:`,
    `"${texto.slice(0, 300)}"`,
    optOut ? "⚠️ Parece pedido para não receber mais. Se for, marque *Sem interesse* e não envie mais nada." : "Responda pelo WhatsApp comercial.",
    `${process.env.APP_URL ?? ""}/admin/prospeccao`,
  ].join("\n\n");
  const { enviados } = await avisarEquipe(aviso);
  return { prospect: p.id, acao: "respondeu", avisos: enviados };
}
