"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { criarSupabaseServidor } from "@/lib/supabase/server";
import { lerPorte, lerProduto } from "@/lib/formTipos";
import { ehAdmin, INICIO_EQUIPE } from "@/lib/sessao";

export type EstadoForm = { erro?: string; ok?: string } | undefined;

const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome"),
  email: z.email("E-mail inválido"),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const dados = cadastroSchema.safeParse({
    nome: form.get("nome"),
    email: form.get("email"),
    senha: form.get("senha"),
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };

  // plano escolhido na landing page segue até o formulário
  const plano = new URLSearchParams();
  const produto = lerProduto(form.get("produto"));
  const porte = lerPorte(form.get("porte"));
  if (produto) plano.set("produto", produto);
  if (porte) plano.set("porte", porte);
  // a equipe (ADMIN_EMAILS) não cadastra clínica: vai direto para a prospecção
  const destino = ehAdmin(dados.data.email) ? INICIO_EQUIPE : `/onboarding${plano.size ? `?${plano}` : ""}`;

  const origem = (await headers()).get("origin") ?? process.env.APP_URL;
  const supabase = await criarSupabaseServidor();
  const { data, error } = await supabase.auth.signUp({
    email: dados.data.email,
    password: dados.data.senha,
    options: {
      data: { nome: dados.data.nome },
      emailRedirectTo: `${origem}/auth/confirmar?next=${encodeURIComponent(destino)}`,
    },
  });
  if (error) return { erro: traduzirErro(error.message) };

  // Se a confirmação de e-mail estiver desligada no Supabase, já vem a sessão.
  if (data.session) redirect(destino);
  return { ok: "Enviamos um link de confirmação para o seu e-mail." };
}

const entrarSchema = z.object({
  email: z.email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const dados = entrarSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const supabase = await criarSupabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: dados.data.email,
    password: dados.data.senha,
  });
  if (error) return { erro: traduzirErro(error.message) };
  redirect(ehAdmin(dados.data.email) ? INICIO_EQUIPE : "/painel");
}

export async function sair() {
  const supabase = await criarSupabaseServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}

function traduzirErro(msg: string) {
  if (/invalid login/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar.";
  if (/already registered/i.test(msg)) return "Este e-mail já tem cadastro. Faça login.";
  return "Não foi possível concluir agora. Tente de novo.";
}
