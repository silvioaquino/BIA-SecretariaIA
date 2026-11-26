import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { segredoConfere } from "@/lib/segredo";
import { processarCobranca, salvarCobranca } from "@/lib/cobranca";
import type { AsaasPagamento } from "@/lib/asaas";

// Webhook do Asaas. Configure em Integrações → Webhooks:
//   URL: https://SEU_DOMINIO/api/webhooks/asaas
//   Token de autenticação: o mesmo valor de ASAAS_WEBHOOK_TOKEN
//   Eventos: cobranças (PAYMENT_*) e assinaturas (SUBSCRIPTION_*)
// O Asaas entrega "pelo menos uma vez": o id do evento é guardado para não repetir.

type Evento = {
  id: string;
  event: string;
  payment?: AsaasPagamento;
  subscription?: { id: string; externalReference?: string | null; customer?: string };
};

export async function POST(request: NextRequest) {
  if (!segredoConfere(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const evento = (await request.json().catch(() => null)) as Evento | null;
  if (!evento?.id || !evento.event) {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  if (await prisma.webhookEvento.findUnique({ where: { id: evento.id }, select: { id: true } })) {
    return NextResponse.json({ ok: true, repetido: true });
  }

  // Tudo abaixo é idempotente; se falhar, devolvemos 500 e o Asaas tenta de novo.
  let clinicaId: string | null = null;

  if (evento.payment) {
    clinicaId = await salvarCobranca(evento.payment);
    if (clinicaId) await processarCobranca(clinicaId);
  } else if (evento.subscription) {
    const s = evento.subscription;
    const clinica = await prisma.clinica.findFirst({
      where: { OR: [{ asaasSubscriptionId: s.id }, ...(s.externalReference ? [{ id: s.externalReference }] : [])] },
      select: { id: true },
    });
    clinicaId = clinica?.id ?? null;
    if (clinica && (evento.event === "SUBSCRIPTION_DELETED" || evento.event === "SUBSCRIPTION_INACTIVATED")) {
      await prisma.clinica.update({ where: { id: clinica.id }, data: { status: "CANCELADA" } });
    }
  }

  try {
    await prisma.webhookEvento.create({
      data: { id: evento.id, tipo: evento.event, payload: evento as unknown as Prisma.InputJsonValue },
    });
  } catch (e) {
    // corrida entre duas entregas do mesmo evento: tudo bem, o processamento é idempotente
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }

  if (!clinicaId) console.warn(`Webhook Asaas ${evento.event} (${evento.id}) sem clínica correspondente`);
  return NextResponse.json({ ok: true });
}
