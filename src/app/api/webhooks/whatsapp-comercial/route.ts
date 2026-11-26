import { NextResponse, after, type NextRequest } from "next/server";
import { segredoConfere } from "@/lib/segredo";
import { processarMensagem, type EventoMensagem, type ResultadoMensagem } from "@/lib/prospeccao/respostas";

// Webhook da instância da Evolution ligada ao WhatsApp COMERCIAL.
// Configure na Evolution (evento MESSAGES_UPSERT):
//   https://SEU_DOMINIO/api/webhooks/whatsapp-comercial?token=<EVOLUTION_WEBHOOK_TOKEN>
// O token vai na URL porque a Evolution não deixa escolher header em todas as versões.
//
// A Evolution só aceita UM webhook por instância. Se o mesmo número também
// alimenta outro fluxo (ex.: a demo da Bia no n8n), defina EVOLUTION_REPASSAR_URL
// e os eventos que NÃO são da prospecção (pacientes da demo etc.) são repassados
// para lá, igualzinhos, depois de responder à Evolution.
export async function POST(request: NextRequest) {
  if (!segredoConfere(request.nextUrl.searchParams.get("token"), process.env.EVOLUTION_WEBHOOK_TOKEN)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const bruto = await request.text();
  let corpo: EventoMensagem | EventoMensagem[] | null = null;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }
  if (!corpo) return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });

  // só a instância comercial (se outra instância apontar para cá por engano, ignora)
  const esperada = process.env.EVOLUTION_INSTANCIA_COMERCIAL;
  const eventos = Array.isArray(corpo) ? corpo : [corpo];
  const resultados: ResultadoMensagem[] = [];
  const repassar: EventoMensagem[] = [];
  for (const ev of eventos) {
    if (esperada && ev.instance && ev.instance !== esperada) {
      resultados.push({ ignorada: "outra instância" });
      continue;
    }
    const r = await processarMensagem(ev);
    resultados.push(r);
    // Conversa com clínica da prospecção NUNCA vai para o outro fluxo:
    // senão a IA da demo poderia responder a clínica sozinha.
    if ("ignorada" in r && r.ignorada !== "repetida" && !r.ignorada.startsWith("envio da equipe")) repassar.push(ev);
  }

  const destino = process.env.EVOLUTION_REPASSAR_URL;
  if (destino && repassar.length) {
    const corpoRepasse = Array.isArray(corpo) ? JSON.stringify(repassar) : bruto;
    after(async () => {
      try {
        const r = await fetch(destino, { method: "POST", headers: { "Content-Type": "application/json" }, body: corpoRepasse });
        if (!r.ok) console.error("repasse do webhook", r.status);
      } catch (e) {
        console.error("repasse do webhook", e);
      }
    });
  }
  return NextResponse.json({ ok: true, resultados, repassados: repassar.length });
}
