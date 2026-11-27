import Link from "next/link";
import { Marca } from "@/components/Marca";
import { exigirAdmin } from "@/lib/sessao";
import { sair } from "@/app/(auth)/actions";

// área interna: depende de quem está logado
export const instant = false;

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Marca href="/admin" />
          <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold">
            <Link href="/admin" className="hover:text-bia">Visão geral</Link>
            <Link href="/admin/prospeccao" className="hover:text-bia">Prospecção</Link>
            <Link href="/admin/prospeccao/email" className="hover:text-bia">E-mail</Link>
            <Link href="/admin/prospeccao/relatorio" className="hover:text-bia">Relatório</Link>
            <form action={sair}>
              <button className="text-slate-500 hover:text-coral">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
