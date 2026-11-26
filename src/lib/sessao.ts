import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { criarSupabaseServidor } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Usuário logado (verificado no Supabase) + registro local, ou null. */
export const usuarioAtual = cache(async () => {
  const supabase = await criarSupabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const email = String(data.claims.email ?? "");
  const nome = String(
    (data.claims.user_metadata as { nome?: string } | undefined)?.nome ?? email,
  );

  // cria o registro local na primeira visita depois da confirmação do e-mail
  return prisma.usuario.upsert({
    where: { id },
    update: {},
    create: { id, email, nome },
    include: { clinica: { include: { config: true } } },
  });
});

export async function exigirUsuario() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  return usuario;
}

/** E-mails da equipe interna, separados por vírgula em ADMIN_EMAILS. */
export function ehAdmin(email: string) {
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

/** Área interna: quem não é da equipe recebe 404 (nem fica sabendo que a página existe). */
export async function exigirAdmin() {
  const usuario = await exigirUsuario();
  if (!ehAdmin(usuario.email)) notFound();
  return usuario;
}

/** Exige usuário com clínica cadastrada; devolve a clínica com config. */
export async function exigirClinica() {
  const usuario = await exigirUsuario();
  if (!usuario.clinica) redirect("/onboarding");
  return { usuario, clinica: usuario.clinica };
}
