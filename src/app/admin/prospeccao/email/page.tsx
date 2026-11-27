import type { Metadata } from "next";
import { headers } from "next/headers";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { CIDADES } from "@/lib/prospeccao/config";
import { EmailAbordagem } from "./EmailAbordagem";
import { AguardandoEmail } from "./AguardandoEmail";

export const metadata: Metadata = { title: "Abordagem por e-mail · Bia", robots: { index: false } };
export const instant = false;

export default async function AbordagemEmail({ searchParams }: PageProps<"/admin/prospeccao/email">) {
  const admin = await exigirAdmin();
  const remetente = admin.nome.includes("@") ? "a equipe" : admin.nome.trim() || "a equipe";
  // endereço do site como a pessoa está vendo (vai na assinatura do e-mail)
  const site = (await headers()).get("host") ?? "biasecretariaia.vercel.app";
  const { id } = await searchParams;

  const [clinicas, aguardando] = await Promise.all([
    // quem ainda pode ser abordado (novo) ou já foi por outro canal e não respondeu
    prisma.prospect.findMany({
      where: { status: { in: ["novo", "abordado", "sem_resposta"] } },
      orderBy: [{ pontuacao: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true, cidade: true, tipo: true, email: true, status: true },
    }),
    prisma.prospect.findMany({
      where: { status: "abordado", canal: "email" },
      orderBy: { ultimoContatoEm: "desc" },
      select: { id: true, nome: true, cidade: true, email: true, ultimoContatoEm: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 sm:py-10">
      <div>
        <p className="etiqueta text-bia">Prospecção</p>
        <h1 className="text-3xl font-bold">Abordagem por e-mail</h1>
        <p className="mt-1 text-slate-600">
          Escolha a clínica, confira o texto, copie e envie do seu e-mail. Depois, clique em &quot;Enviei o e-mail&quot;.
          Um por vez, sempre para o endereço que a própria clínica divulga (site, Instagram, Google).
        </p>
      </div>

      <EmailAbordagem
        remetente={remetente}
        site={site}
        cidades={[...CIDADES]}
        clinicas={clinicas}
        inicialId={typeof id === "string" ? id : undefined}
      />

      <section className="cartao">
        <h2 className="text-xl font-bold">
          E-mails aguardando resposta <span className="text-base font-normal text-slate-400">({aguardando.length})</span>
        </h2>
        <p className="text-sm text-slate-500">Quando a clínica responder o e-mail, marque aqui para ela seguir no funil.</p>
        {aguardando.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nenhum por enquanto.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {aguardando.map((c) => (
              <AguardandoEmail
                key={c.id}
                c={{
                  id: c.id,
                  nome: c.nome,
                  cidade: c.cidade,
                  email: c.email,
                  enviadoEm: (c.ultimoContatoEm ?? new Date()).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Recife" }),
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
