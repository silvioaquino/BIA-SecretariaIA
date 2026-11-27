import type { Metadata } from "next";
import { headers } from "next/headers";
import { exigirAdmin } from "@/lib/sessao";
import { CIDADES } from "@/lib/prospeccao/config";
import { EmailAbordagem } from "./EmailAbordagem";

export const metadata: Metadata = { title: "Abordagem por e-mail · Bia", robots: { index: false } };
export const instant = false;

export default async function AbordagemEmail() {
  const admin = await exigirAdmin();
  const remetente = admin.nome.includes("@") ? "a equipe" : admin.nome.trim() || "a equipe";
  // endereço do site como a pessoa está vendo (vai na assinatura do e-mail)
  const site = (await headers()).get("host") ?? "biasecretariaia.vercel.app";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-10">
      <div className="mb-8">
        <p className="etiqueta text-bia">Prospecção</p>
        <h1 className="text-3xl font-bold">Abordagem por e-mail</h1>
        <p className="mt-1 text-slate-600">
          Preencha a clínica, confira o texto, copie e envie do seu e-mail. Um e-mail por vez, sempre para o endereço que a
          própria clínica divulga (site, Instagram, Google).
        </p>
      </div>
      <EmailAbordagem remetente={remetente} site={site} cidades={[...CIDADES]} />
    </main>
  );
}
