import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirClinica } from "@/lib/sessao";
import { biaAtiva } from "@/lib/cobranca";
import { PORTES, PRODUTOS, brl, precoMensal } from "@/lib/planos";

const ROTULO_STATUS = {
  CADASTRO: ["Configurando", "bg-slate-100 text-slate-700"],
  AGUARDANDO_PAGAMENTO: ["Aguardando pagamento", "bg-menta-clara text-bia-escuro"],
  ATIVA: ["Ativa", "bg-bia text-white"],
  ATRASADA: ["Ativa · pagamento vencido", "bg-orange-100 text-orange-800"],
  BLOQUEADA: ["Pausada", "bg-coral text-white"],
  CANCELADA: ["Cancelada", "bg-slate-200 text-slate-700"],
} as const;

export default async function Painel({ searchParams }: PageProps<"/painel">) {
  const { clinica } = await exigirClinica();
  if (!clinica.config?.completo) redirect("/onboarding");
  const { salvo } = await searchParams;

  const [rotulo, cor] = ROTULO_STATUS[clinica.status];
  const produto = PRODUTOS[clinica.produto];
  const pago = clinica.status !== "CADASTRO" && clinica.status !== "AGUARDANDO_PAGAMENTO";

  const passos = [
    { feito: true, titulo: "Personalizar a Bia", href: "/painel/bia", acao: "Editar" },
    { feito: pago, titulo: "Pagar a primeira mensalidade", href: "/painel/assinatura", acao: "Pagar" },
    { feito: Boolean(clinica.evolutionInstance), titulo: "Conectar o WhatsApp da clínica", href: null, acao: "Em breve" },
  ];

  return (
    <div className="space-y-6">
      {salvo && <p className="rounded-xl bg-menta-clara p-3 text-sm">Alterações salvas. A Bia já usa as informações novas.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="etiqueta text-bia">Sua clínica</p>
          <h1 className="text-3xl font-bold">{clinica.nome}</h1>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cor}`}>Bia: {rotulo}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="cartao">
          <p className="etiqueta text-slate-500">Plano</p>
          <p className="mt-2 text-xl font-bold">{produto.nome}</p>
          <p className="text-sm text-slate-600">{PORTES[clinica.porte].nome} · {brl(precoMensal(clinica.produto, clinica.porte))}/mês</p>
        </div>
        <div className="cartao">
          <p className="etiqueta text-slate-500">Atendendo pacientes</p>
          <p className="mt-2 text-xl font-bold">{biaAtiva(clinica.status) ? "Sim" : "Não"}</p>
          <p className="text-sm text-slate-600">
            {biaAtiva(clinica.status) ? "A Bia está respondendo no WhatsApp." : "A Bia não responde até o pagamento."}
          </p>
        </div>
        <div className="cartao">
          <p className="etiqueta text-slate-500">Agenda</p>
          <p className="mt-2 text-xl font-bold">
            {clinica.config.fonteAgenda === "GOOGLE" ? "Google Agenda" : "Planilha diária"}
          </p>
          <p className="text-sm text-slate-600">
            {clinica.produto === "COMPLETA"
              ? clinica.config.modoAgenda === "DIRETO"
                ? "A Bia marca direto na agenda"
                : "A Bia faz o pré-agendamento"
              : "De onde a Bia lê as consultas"}
          </p>
        </div>
      </div>

      <div className="cartao">
        <h2 className="text-lg font-bold">Próximos passos</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {passos.map((p) => (
            <li key={p.titulo} className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${p.feito ? "bg-bia text-white" : "bg-slate-100 text-slate-400"}`}>
                  {p.feito ? "✓" : ""}
                </span>
                {p.titulo}
              </span>
              {p.href ? (
                <Link href={p.href} className="text-sm font-semibold text-bia">{p.acao}</Link>
              ) : (
                <span className="text-sm text-slate-400">{p.acao}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
