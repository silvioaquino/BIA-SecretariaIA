import Link from "next/link";
import { connection } from "next/server";
import { Marca } from "@/components/Marca";
import { exigirClinica } from "@/lib/sessao";
import { diasParaBloqueio } from "@/lib/cobranca";
import { sair } from "@/app/(auth)/actions";

// Páginas da clínica logada: dependem da sessão, não têm versão estática.
export const instant = false;

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const { clinica } = await exigirClinica();
  await connection(); // dias para o bloqueio e taxa de upgrade dependem da data de hoje
  const faltam = diasParaBloqueio(clinica.inadimplenteDesde);

  const aviso = {
    CADASTRO: clinica.config?.completo
      ? { cor: "bg-menta-clara", texto: "Falta só escolher o pagamento para ativar a Bia.", link: true }
      : null,
    AGUARDANDO_PAGAMENTO: { cor: "bg-menta-clara", texto: "Assim que o Pix for pago, a Bia é ativada.", link: true },
    ATIVA: null,
    ATRASADA: {
      cor: "bg-orange-100",
      texto: `Mensalidade vencida. ${faltam ? `A Bia será pausada em ${faltam} dia(s)` : "A Bia será pausada hoje"} se o pagamento não for feito.`,
      link: true,
    },
    BLOQUEADA: { cor: "bg-orange-200", texto: "A Bia está pausada por falta de pagamento. Pague para reativar na hora.", link: true },
    CANCELADA: { cor: "bg-slate-200", texto: "Assinatura cancelada. Fale com o suporte para reativar.", link: false },
  }[clinica.status];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Marca href="/painel" />
          <nav className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/painel" className="hover:text-bia">Visão geral</Link>
            <Link href="/painel/bia" className="hover:text-bia">Personalizar Bia</Link>
            <Link href="/painel/assinatura" className="hover:text-bia">Assinatura</Link>
            <form action={sair}>
              <button className="text-slate-500 hover:text-coral">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      {aviso && (
        <div className={`${aviso.cor} text-sm`}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span>{aviso.texto}</span>
            {aviso.link && (
              <Link href="/painel/assinatura" className="font-semibold text-bia-escuro underline">
                Ver pagamento
              </Link>
            )}
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
