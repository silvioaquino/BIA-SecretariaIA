import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { diasParaBloqueio, EM_ABERTO, PAGOS } from "@/lib/cobranca";
import { brl, nomePlano, precoMensal } from "@/lib/planos";
import { inicioDoDia } from "@/lib/prospeccao/fila";
import type { StatusClinica } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Administração · Bia", robots: { index: false } };
export const instant = false;

const STATUS: Record<StatusClinica, [string, string]> = {
  CADASTRO: ["Configurando", "bg-slate-100 text-slate-700"],
  AGUARDANDO_PAGAMENTO: ["Aguardando 1º pagamento", "bg-menta-clara text-bia-escuro"],
  ATIVA: ["Ativa", "bg-bia text-white"],
  ATRASADA: ["Atrasada", "bg-orange-100 text-orange-800"],
  BLOQUEADA: ["Bloqueada", "bg-coral text-white"],
  CANCELADA: ["Cancelada", "bg-slate-200 text-slate-700"],
};

const data = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Recife" });

export default async function Administracao() {
  await exigirAdmin();
  await connection(); // números do dia: renderiza a cada acesso

  const agora = new Date();
  const hoje = inicioDoDia(agora);
  const inicioMes = new Date(hoje);
  inicioMes.setUTCDate(1);
  const em30dias = new Date(agora.getTime() - 30 * 86_400_000);

  const [clinicas, recebidoMes, abertos, ultimosPagamentos, funil] = await Promise.all([
    prisma.clinica.findMany({
      orderBy: { criadaEm: "desc" },
      include: {
        config: { select: { completo: true } },
        pagamentos: { where: { status: { in: [...EM_ABERTO] } }, orderBy: { vencimento: "asc" }, take: 1 },
      },
    }),
    prisma.pagamento.aggregate({ _sum: { valor: true }, _count: true, where: { status: { in: [...PAGOS] }, pagoEm: { gte: inicioMes } } }),
    prisma.pagamento.aggregate({ _sum: { valor: true }, _count: true, where: { status: { in: [...EM_ABERTO] } } }),
    prisma.pagamento.findMany({ orderBy: { atualizadoEm: "desc" }, take: 8, include: { clinica: { select: { nome: true } } } }),
    prisma.prospect.groupBy({ by: ["status"], _count: true }),
  ]);

  const conta = (s: StatusClinica[]) => clinicas.filter((c) => s.includes(c.status)).length;
  const pagantes = clinicas.filter((c) => c.status === "ATIVA" || c.status === "ATRASADA");
  const mrr = pagantes.reduce((t, c) => t + precoMensal(c.produto, c.porte), 0);
  const novas30 = clinicas.filter((c) => c.criadaEm >= em30dias).length;
  const doFunil = (s: string) => funil.find((f) => f.status === s)?._count ?? 0;

  const kpis = [
    { rotulo: "Receita mensal (MRR)", valor: brl(mrr, false), nota: `${pagantes.length} clínica(s) pagando` },
    { rotulo: "Recebido este mês", valor: brl(Number(recebidoMes._sum.valor ?? 0), false), nota: `${recebidoMes._count} pagamento(s)` },
    { rotulo: "Em aberto", valor: brl(Number(abertos._sum.valor ?? 0), false), nota: `${abertos._count} cobrança(s)` },
    { rotulo: "Novas em 30 dias", valor: String(novas30), nota: `${clinicas.length} cadastrada(s) no total` },
  ];

  const situacao: { s: StatusClinica[]; rotulo: string }[] = [
    { s: ["ATIVA"], rotulo: "Ativas" },
    { s: ["ATRASADA"], rotulo: "Atrasadas" },
    { s: ["BLOQUEADA"], rotulo: "Bloqueadas" },
    { s: ["AGUARDANDO_PAGAMENTO"], rotulo: "Aguardando pagamento" },
    { s: ["CADASTRO"], rotulo: "Configurando" },
    { s: ["CANCELADA"], rotulo: "Canceladas" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-6 sm:py-10">
      <div>
        <p className="etiqueta text-bia">Administração</p>
        <h1 className="text-3xl font-bold">Visão geral do SaaS</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.rotulo} className="cartao">
            <p className="text-sm text-slate-600">{k.rotulo}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{k.valor}</p>
            <p className="mt-1 text-xs text-slate-500">{k.nota}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="cartao lg:col-span-2">
          <h2 className="font-bold">Clínicas por situação</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {situacao.map(({ s, rotulo }) => (
              <li key={rotulo} className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-600">{rotulo}</span>
                <span className="font-semibold tabular-nums">{conta(s)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cartao">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Prospecção</h2>
            <Link href="/admin/prospeccao" className="text-sm font-semibold text-bia hover:underline">
              Fila do dia →
            </Link>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              ["Na fila (novas)", "novo"],
              ["Abordadas", "abordado"],
              ["Responderam", "respondeu"],
              ["Em conversa", "conversa"],
              ["Proposta enviada", "proposta"],
              ["Em piloto", "piloto"],
              ["Viraram cliente", "cliente"],
            ].map(([rotulo, s]) => (
              <li key={s} className="flex justify-between">
                <span className="text-slate-600">{rotulo}</span>
                <span className="font-semibold tabular-nums">{doFunil(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cartao overflow-x-auto p-0">
        <h2 className="p-5 pb-3 font-bold">Clínicas</h2>
        {clinicas.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">Nenhuma clínica cadastrada ainda.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Clínica</th>
                <th className="px-3 py-2 font-semibold">Plano</th>
                <th className="px-3 py-2 text-right font-semibold">Mensalidade</th>
                <th className="px-3 py-2 font-semibold">Situação</th>
                <th className="px-3 py-2 font-semibold">Próxima cobrança</th>
                <th className="px-5 py-2 font-semibold">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {clinicas.map((c) => {
                const [rotulo, cor] = STATUS[c.status];
                const aberta = c.pagamentos[0];
                const faltam = c.status === "ATRASADA" ? diasParaBloqueio(c.inadimplenteDesde, agora) : null;
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{c.nome}</p>
                      <p className="text-xs text-slate-500">
                        {[c.cidade, c.email].filter(Boolean).join(" · ")}
                        {" · "}
                        <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-bia hover:underline">
                          WhatsApp
                        </a>
                      </p>
                    </td>
                    <td className="px-3 py-3">{nomePlano(c.produto, c.porte)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{brl(precoMensal(c.produto, c.porte), false)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor}`}>{rotulo}</span>
                      {!c.config?.completo && c.status === "CADASTRO" && <p className="mt-1 text-xs text-slate-500">formulário incompleto</p>}
                      {faltam !== null && <p className="mt-1 text-xs text-orange-700">bloqueia em {faltam} dia(s)</p>}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {aberta ? (
                        <>
                          {brl(Number(aberta.valor), false)} · {data(aberta.vencimento)}
                          {aberta.status === "OVERDUE" && <span className="ml-1 text-xs font-semibold text-coral">vencida</span>}
                        </>
                      ) : (
                        <span className="text-slate-400">nenhuma em aberto</span>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{data(c.criadaEm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="cartao">
        <h2 className="font-bold">Últimas movimentações de pagamento</h2>
        {ultimosPagamentos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhuma cobrança ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {ultimosPagamentos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold">{p.clinica.nome}</span>
                  <span className="text-slate-500"> · {p.tipo === "MENSALIDADE" ? "mensalidade" : p.tipo === "IMPLANTACAO" ? "implantação" : "upgrade"}</span>
                </span>
                <span className="tabular-nums">
                  {brl(Number(p.valor))} ·{" "}
                  <span className={PAGOS.has(p.status) ? "font-semibold text-bia" : p.status === "OVERDUE" ? "font-semibold text-coral" : "text-slate-600"}>
                    {PAGOS.has(p.status) ? `pago ${p.pagoEm ? data(p.pagoEm) : ""}` : p.status === "OVERDUE" ? "vencida" : p.status === "PENDING" ? `vence ${data(p.vencimento)}` : p.status.toLowerCase()}
                  </span>
                  {p.invoiceUrl && (
                    <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="ml-2 text-bia hover:underline">
                      fatura
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
