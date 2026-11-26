import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { segredoConfere } from "@/lib/segredo";
import { recalcularStatus, sincronizarClinica } from "@/lib/cobranca";

// Roda 1x por dia (vercel.json, ou um Schedule no n8n chamando com o header).
// 1) passa ATRASADA → BLOQUEADA quando a carência acaba (isso depende do tempo,
//    não de um webhook); 2) confere no Asaas quem está pendente, caso algum
//    webhook tenha se perdido.
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!segredoConfere(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const clinicas = await prisma.clinica.findMany({
    where: {
      asaasSubscriptionId: { not: null },
      status: { in: ["AGUARDANDO_PAGAMENTO", "ATIVA", "ATRASADA", "BLOQUEADA"] },
    },
    select: { id: true, status: true },
  });

  const mudancas: { id: string; de: string; para: string | null }[] = [];
  const erros: string[] = [];
  for (const c of clinicas) {
    let novo: string | null;
    try {
      novo = await sincronizarClinica(c.id);
    } catch (e) {
      // Asaas fora do ar: ainda assim aplica a carência com o que já temos no banco
      erros.push(c.id);
      console.error("cron cobrança", c.id, e);
      novo = await recalcularStatus(c.id);
    }
    if (novo !== c.status) mudancas.push({ id: c.id, de: c.status, para: novo });
  }

  return NextResponse.json({ verificadas: clinicas.length, mudancas, erros });
}
