import "server-only";
import { prisma } from "@/lib/prisma";
import { CARENCIA_DIAS, PRODUTOS, nomePlano, precoMensal } from "@/lib/planos";
import {
  atualizarValorAssinatura,
  cobranca,
  cobrancasDaAssinatura,
  type AsaasPagamento,
} from "@/lib/asaas";
import type { StatusClinica } from "@/generated/prisma/enums";

// Tipos de cobrança (Pagamento.tipo):
//   MENSALIDADE  · gerada pela assinatura do Asaas
//   IMPLANTACAO  · avulsa: implantação + 1ª mensalidade (quando o produto tem implantação)
//   UPGRADE      · avulsa: taxa para passar do Confirma para a Completa
// O tipo das avulsas vai no externalReference: "<clinicaId>|IMPLANTACAO".

export const PAGOS = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
export const EM_ABERTO = new Set(["PENDING", "OVERDUE"]);
const ESTORNADOS = new Set([
  "REFUNDED",
  "REFUND_REQUESTED",
  "REFUND_IN_PROGRESS",
  "CHARGEBACK_REQUESTED",
  "CHARGEBACK_DISPUTE",
  "AWAITING_CHARGEBACK_REVERSAL",
]);

/** A Bia responde os pacientes apenas nestes status. */
export function biaAtiva(status: StatusClinica) {
  return status === "ATIVA" || status === "ATRASADA";
}

const DIA_MS = 86_400_000;

export function referencia(clinicaId: string, tipo: "IMPLANTACAO" | "UPGRADE") {
  return `${clinicaId}|${tipo}`;
}

function lerReferencia(p: AsaasPagamento) {
  const [id, tipo] = (p.externalReference ?? "").split("|");
  return {
    clinicaId: id || null,
    tipo: p.subscription ? "MENSALIDADE" : tipo === "UPGRADE" ? "UPGRADE" : tipo === "IMPLANTACAO" ? "IMPLANTACAO" : "MENSALIDADE",
  };
}

/** Grava (ou atualiza) uma cobrança do Asaas no banco. Devolve o clinicaId. */
export async function salvarCobranca(p: AsaasPagamento): Promise<string | null> {
  const ref = lerReferencia(p);
  const clinica = await prisma.clinica.findFirst({
    where: {
      OR: [...(ref.clinicaId ? [{ id: ref.clinicaId }] : []), { asaasCustomerId: p.customer }],
    },
    select: { id: true },
  });
  if (!clinica) return null;

  const pago = p.clientPaymentDate ?? p.paymentDate ?? p.confirmedDate;
  const dados = {
    valor: p.value,
    status: p.deleted ? "DELETED" : p.status,
    billingType: p.billingType ?? null,
    vencimento: new Date(`${p.dueDate}T00:00:00Z`),
    pagoEm: pago ? new Date(`${pago.slice(0, 10)}T12:00:00Z`) : null,
    invoiceUrl: p.invoiceUrl ?? null,
  };
  await prisma.pagamento.upsert({
    where: { asaasPaymentId: p.id },
    update: dados,
    create: { ...dados, tipo: ref.tipo, asaasPaymentId: p.id, clinicaId: clinica.id },
  });
  return clinica.id;
}

/**
 * Recalcula o status da clínica a partir das cobranças. Idempotente: pode ser
 * chamado por qualquer webhook, pelo cron diário ou pelo botão "Já paguei".
 * A taxa de UPGRADE não entra na conta: se não for paga, a clínica só continua no Confirma.
 */
export async function recalcularStatus(clinicaId: string, agora = new Date()) {
  const clinica = await prisma.clinica.findUnique({
    where: { id: clinicaId },
    include: {
      pagamentos: {
        where: { status: { not: "DELETED" }, tipo: { in: ["MENSALIDADE", "IMPLANTACAO"] } },
        orderBy: { vencimento: "asc" },
      },
    },
  });
  if (!clinica || clinica.status === "CANCELADA") return clinica?.status ?? null;

  const pags = clinica.pagamentos;
  const algumPago = pags.some((p) => PAGOS.has(p.status));
  const ultima = pags.at(-1);
  const vencidas = pags.filter((p) => p.status === "OVERDUE");

  let status: StatusClinica;
  let inadimplenteDesde: Date | null = null;

  if (ultima && ESTORNADOS.has(ultima.status)) {
    status = "BLOQUEADA";
  } else if (!algumPago) {
    // nunca pagou: segue esperando a 1ª cobrança (a Bia nunca chegou a ligar)
    status = clinica.asaasSubscriptionId ? "AGUARDANDO_PAGAMENTO" : "CADASTRO";
  } else if (vencidas.length) {
    inadimplenteDesde = vencidas[0].vencimento;
    const dias = Math.floor((agora.getTime() - inadimplenteDesde.getTime()) / DIA_MS);
    status = dias > CARENCIA_DIAS ? "BLOQUEADA" : "ATRASADA";
  } else {
    status = "ATIVA";
  }

  if (status !== clinica.status || +(inadimplenteDesde ?? 0) !== +(clinica.inadimplenteDesde ?? 0)) {
    await prisma.clinica.update({
      where: { id: clinicaId },
      data: {
        status,
        inadimplenteDesde,
        bloqueadaEm: status === "BLOQUEADA" ? (clinica.bloqueadaEm ?? agora) : null,
      },
    });
  }
  return status;
}

/**
 * Aplica o upgrade para a Completa: muda o valor da assinatura no Asaas e o
 * produto no banco. Idempotente (não faz nada se já estiver na Completa).
 */
export async function aplicarUpgrade(clinicaId: string) {
  const clinica = await prisma.clinica.findUnique({ where: { id: clinicaId } });
  if (!clinica || clinica.produto === "COMPLETA" || !clinica.asaasSubscriptionId) return false;

  await atualizarValorAssinatura(
    clinica.asaasSubscriptionId,
    precoMensal("COMPLETA", clinica.porte),
    `Bia · Secretária IA · ${nomePlano("COMPLETA", clinica.porte)}`,
  );
  await prisma.clinica.update({ where: { id: clinicaId }, data: { produto: "COMPLETA" } });
  return true;
}

/** Depois de gravar uma cobrança: recalcula e aplica o upgrade, se for o caso. */
export async function processarCobranca(clinicaId: string) {
  const upgradePago = await prisma.pagamento.findFirst({
    where: { clinicaId, tipo: "UPGRADE", status: { in: [...PAGOS] } },
    select: { id: true },
  });
  if (upgradePago) await aplicarUpgrade(clinicaId);
  return recalcularStatus(clinicaId);
}

/** Busca no Asaas as cobranças da clínica e recalcula (rede de segurança). */
export async function sincronizarClinica(clinicaId: string) {
  const clinica = await prisma.clinica.findUnique({
    where: { id: clinicaId },
    select: { asaasSubscriptionId: true },
  });
  if (clinica?.asaasSubscriptionId) {
    for (const p of await cobrancasDaAssinatura(clinica.asaasSubscriptionId)) {
      await salvarCobranca(p);
    }
  }
  // avulsas (implantação e upgrade) não aparecem na lista da assinatura
  const avulsasAbertas = await prisma.pagamento.findMany({
    where: { clinicaId, tipo: { in: ["IMPLANTACAO", "UPGRADE"] }, status: { in: [...EM_ABERTO] } },
    select: { asaasPaymentId: true },
  });
  for (const a of avulsasAbertas) await salvarCobranca(await cobranca(a.asaasPaymentId));

  return processarCobranca(clinicaId);
}

/** Dias que faltam para o bloqueio de uma clínica ATRASADA. */
export function diasParaBloqueio(inadimplenteDesde: Date | null, agora = new Date()) {
  if (!inadimplenteDesde) return null;
  const dias = Math.floor((agora.getTime() - inadimplenteDesde.getTime()) / DIA_MS);
  return Math.max(0, CARENCIA_DIAS - dias);
}

/** Taxa de upgrade para a Completa (grátis para quem é cliente há tempo suficiente). */
export async function taxaUpgrade(clinicaId: string, diasMinimos: number) {
  const primeira = await prisma.pagamento.findFirst({
    where: { clinicaId, tipo: { in: ["MENSALIDADE", "IMPLANTACAO"] }, status: { in: [...PAGOS] } },
    orderBy: { pagoEm: "asc" },
    select: { pagoEm: true },
  });
  const desde = primeira?.pagoEm;
  const dias = desde ? Math.floor((Date.now() - desde.getTime()) / DIA_MS) : 0;
  return dias >= diasMinimos ? 0 : PRODUTOS.COMPLETA.implantacao;
}
