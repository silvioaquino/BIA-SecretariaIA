import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { FilaDoDia } from "./FilaDoDia";

export const metadata: Metadata = { title: "Prospecção · Bia", robots: { index: false } };

// área interna: depende de quem está logado
export const instant = false;

export default async function Prospeccao() {
  const admin = await exigirAdmin();
  await connection(); // usa a data de hoje: renderiza a cada acesso
  // nome completo (ex.: "Silvio Aquino"); se o cadastro não tiver nome, cai no e-mail: aí usa "a equipe"
  const remetente = admin.nome.includes("@") ? "a equipe" : admin.nome.trim() || "a equipe";
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Recife" });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fila do dia</h1>
          <p className="capitalize text-slate-600">{hoje}</p>
        </div>
        <Link href="/admin/prospeccao/relatorio" className="botao-secundario">
          Relatório da semana →
        </Link>
        <p className="max-w-sm text-xs text-slate-500 sm:basis-full sm:text-right">
          Tudo é enviado à mão, uma mensagem por vez, do WhatsApp comercial. Quem pedir para não receber mais: marque
          &quot;Sem interesse&quot;.
        </p>
      </div>
      <FilaDoDia remetente={remetente} />
    </main>
  );
}
