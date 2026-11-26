import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { segredoConfere } from "@/lib/segredo";
import { biaAtiva } from "@/lib/cobranca";

// Consultado pelo n8n antes de a Bia responder (workflow 01).
//   GET /api/bia/clinica?instancia=<instância da Evolution>   (ou ?id=<clinicaId>)
//   Header: x-bia-token: <BIA_API_TOKEN>
// Se "ativa" vier false, o n8n não responde o paciente.
export async function GET(request: NextRequest) {
  if (!segredoConfere(request.headers.get("x-bia-token"), process.env.BIA_API_TOKEN)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const instancia = request.nextUrl.searchParams.get("instancia");
  const id = request.nextUrl.searchParams.get("id");
  if (!instancia && !id) {
    return NextResponse.json({ erro: "informe instancia ou id" }, { status: 400 });
  }

  const clinica = await prisma.clinica.findFirst({
    where: instancia ? { evolutionInstance: instancia } : { id: id! },
    include: { config: true, profissionais: true, procedimentos: true },
  });
  if (!clinica) return NextResponse.json({ ativa: false, motivo: "clinica_nao_encontrada" }, { status: 404 });

  const ativa = biaAtiva(clinica.status) && Boolean(clinica.config?.completo);

  return NextResponse.json({
    ativa,
    status: clinica.status,
    produto: clinica.produto, // CONFIRMA: só confirmação · COMPLETA: atendimento 24h
    clinica: { id: clinica.id, nome: clinica.nome, cidade: clinica.cidade },
    // config só vai quando a Bia pode atender
    ...(ativa && {
      config: clinica.config,
      profissionais: clinica.profissionais.map(({ nome, especialidade, atendimento, idAgenda }) => ({
        nome, especialidade, atendimento, idAgenda,
      })),
      procedimentos: clinica.procedimentos.map(({ nome, descricao, duracaoMin, valor, orientacoes }) => ({
        nome, descricao, duracaoMin, valor: valor ? Number(valor) : null, orientacoes,
      })),
    }),
  });
}
