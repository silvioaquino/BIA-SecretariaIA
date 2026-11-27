import { NextResponse, type NextRequest } from "next/server";
import { segredoConfere } from "@/lib/segredo";
import { prisma } from "@/lib/prisma";
import { avisarEquipe } from "@/lib/evolution";
import { inicioDoDia, montarFila } from "@/lib/prospeccao/fila";

// Resumo da manhã no WhatsApp da equipe (vercel.json: seg a sex, 8h em Recife).
//   Header: Authorization: Bearer <CRON_SECRET>   ·   ?previa=1 só devolve o texto, sem enviar
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!segredoConfere(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const f = await montarFila(agora);
  const hoje = inicioDoDia(agora);
  const ontem = new Date(hoje.getTime() - 86_400_000);
  const acoesOntem = await prisma.interacaoProspect.groupBy({
    by: ["acao"],
    where: { em: { gte: ontem, lt: hoje } },
    _count: true,
  });
  const n = (acao: string) => acoesOntem.find((a) => a.acao === acao)?._count ?? 0;

  const linhas = [
    "Bom dia! ☀️ Fila de prospecção de hoje:",
    "",
    f.respostas.length ? `📩 *${f.respostas.length} responderam* e esperam resposta. Comece por elas!` : null,
    f.followUps.length ? `🔁 ${f.followUps.length} follow-up(s)` : null,
    `💬 ${f.whatsapp.length} WhatsApp novos`,
    `📞 ${f.ligacoes.length} ligações`,
    f.visitas.length ? `🚗 ${f.visitas.length} visitas na Rota 3 (quando for dia de rota)` : null,
    "",
    `Ontem: ${n("whatsapp_enviado")} mensagens, ${n("follow_up_enviado")} follow-ups, ${n("ligou_falou") + n("ligou_nao_atendeu")} ligações, ${Math.max(0, n("respondeu") - n("sem_resposta_concreta"))} respostas.`,
    "",
    `${process.env.APP_URL ?? ""}/admin/prospeccao`,
  ].filter((l) => l !== null);
  const texto = linhas.join("\n");

  if (request.nextUrl.searchParams.get("previa")) return NextResponse.json({ texto });
  const envio = await avisarEquipe(texto);
  return NextResponse.json({ texto, ...envio });
}
