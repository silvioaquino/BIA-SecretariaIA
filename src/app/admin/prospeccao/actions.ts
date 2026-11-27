"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { ACOES, registrar, type Acao } from "@/lib/prospeccao/fila";

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
