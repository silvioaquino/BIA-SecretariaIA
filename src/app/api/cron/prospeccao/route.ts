import { NextResponse, type NextRequest } from "next/server";
import { segredoConfere } from "@/lib/segredo";
import { coletar } from "@/lib/prospeccao/coletar";
import { CIDADES } from "@/lib/prospeccao/config";

// Coleta semanal de clínicas (vercel.json: segunda, 6h em Recife).
//   GET /api/cron/prospeccao                 → todas as cidades
//   GET /api/cron/prospeccao?cidade=Olinda   → só uma (para testar ou dividir)
//   Header: Authorization: Bearer <CRON_SECRET>
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!segredoConfere(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const pedida = request.nextUrl.searchParams.get("cidade");
  const cidades = pedida ? CIDADES.filter((c) => c.toLowerCase() === pedida.toLowerCase()) : undefined;
  if (pedida && !cidades?.length) {
    return NextResponse.json({ erro: `cidade fora da região: ${CIDADES.join(", ")}` }, { status: 400 });
  }

  try {
    return NextResponse.json(await coletar({ cidades }));
  } catch (e) {
    console.error("coleta de prospects", e);
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
