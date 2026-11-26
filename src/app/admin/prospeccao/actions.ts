"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/sessao";
import { ACOES, registrar, type Acao } from "@/lib/prospeccao/fila";

export async function registrarAcao(prospectId: string, acao: Acao) {
  const admin = await exigirAdmin();
  if (!(acao in ACOES)) throw new Error("Ação inválida");
  await registrar(prospectId, acao, admin.email);
  revalidatePath("/admin/prospeccao");
}
