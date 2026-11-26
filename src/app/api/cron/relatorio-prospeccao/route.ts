import { NextResponse, type NextRequest } from "next/server";
import { segredoConfere } from "@/lib/segredo";
import { avisarEquipe } from "@/lib/evolution";
import { gerarRelatorio, textoRelatorio } from "@/lib/prospeccao/relatorio";

// Relatório de sexta no WhatsApp da equipe (vercel.json: sexta, 17h em Recife),
// a tempo da revisão de 30 minutos do plano.
//   Header: Authorization: Bearer <CRON_SECRET>   ·   ?previa=1 só devolve o texto
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!segredoConfere(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const texto = textoRelatorio(await gerarRelatorio());
  if (request.nextUrl.searchParams.get("previa")) return NextResponse.json({ texto });
  return NextResponse.json({ texto, ...(await avisarEquipe(texto)) });
}
