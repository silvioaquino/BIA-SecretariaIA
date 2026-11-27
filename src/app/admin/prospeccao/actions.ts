"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { ACOES, registrar, type Acao } from "@/lib/prospeccao/fila";
import { adicionarClinica, buscarClinica, trazerParaIndicacoes, type NovaClinica, type ResultadoBusca } from "@/lib/prospeccao/adicionar";

export async function registrarAcao(prospectId: string, acao: Acao) {
  const admin = await exigirAdmin();
  if (!(acao in ACOES)) throw new Error("Ação inválida");
  await registrar(prospectId, acao, admin.email);
  revalidatePath("/admin/prospeccao");
}

/** Abordagem por e-mail: guarda o endereço na clínica e registra o envio. */
export async function registrarEmail(prospectId: string, email: string): Promise<{ erro?: string }> {
  const admin = await exigirAdmin();
  const endereco = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(endereco)) return { erro: "E-mail inválido." };
  try {
    await prisma.prospect.update({ where: { id: prospectId }, data: { email: endereco } });
    await registrar(prospectId, "email_enviado", admin.email);
  } catch {
    return { erro: "Não consegui salvar. Tente de novo." };
  }
  revalidatePath("/admin/prospeccao", "layout");
  return {};
}

// ── Adicionar clínica à mão (indicação) ──

const TIPOS_OK = ["ODONTOLOGIA", "MEDICINA", "OFTALMOLOGIA", "OUTRA"] as const;

export async function buscarClinicaAcao(texto: string): Promise<{ erro?: string; resultados?: ResultadoBusca[] }> {
  await exigirAdmin();
  const t = texto.trim();
  if (t.length < 3) return { erro: "Digite pelo menos 3 letras do nome." };
  try {
    return { resultados: await buscarClinica(t.slice(0, 120)) };
  } catch (e) {
    console.error("busca de clínica", e);
    return { erro: "A busca no Google falhou. Tente de novo ou adicione à mão." };
  }
}

export async function adicionarClinicaAcao(d: NovaClinica): Promise<{ erro?: string; nome?: string; jaExistia?: boolean }> {
  const admin = await exigirAdmin();
  if (!d.nome?.trim() || !d.cidade?.trim()) return { erro: "Informe o nome e a cidade." };
  if (!TIPOS_OK.includes(d.tipo)) return { erro: "Tipo de clínica inválido." };
  try {
    const r = await adicionarClinica(
      {
        placeId: d.placeId ?? null,
        nome: d.nome.slice(0, 150),
        tipo: d.tipo,
        cidade: d.cidade.slice(0, 80),
        telefone: d.telefone ?? null,
        endereco: d.endereco?.slice(0, 300) ?? null,
        nota: typeof d.nota === "number" ? d.nota : null,
        avaliacoes: typeof d.avaliacoes === "number" ? d.avaliacoes : null,
        observacoes: d.observacoes?.slice(0, 500) ?? null,
      },
      admin.email,
    );
    // já estava na lista e ninguém abordou ainda: passa para "Indicações"
    if (!r.novo && ["novo", "descartado"].includes(r.prospect.status)) await trazerParaIndicacoes(r.prospect.id);
    revalidatePath("/admin/prospeccao");
    return { nome: r.prospect.nome, jaExistia: !r.novo };
  } catch (e) {
    console.error("adicionar clínica", e);
    return { erro: "Não consegui adicionar. Tente de novo." };
  }
}
