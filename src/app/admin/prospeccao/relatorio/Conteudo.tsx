import Link from "next/link";
import { connection } from "next/server";
import { ETAPAS, gerarRelatorio, type Etapa } from "@/lib/prospeccao/relatorio";


const NOME_ETAPA: Record<Etapa, string> = {
  abordadas: "Abordadas",
  responderam: "Responderam",
  conversaram: "Conversaram",
  proposta: "Proposta",
  piloto: "Piloto",
  cliente: "Cliente",
};

/** Conteúdo do relatório (a checagem de acesso fica no page.tsx). */
export async function ConteudoRelatorio() {
  await connection();
  const r = await gerarRelatorio();
  const a = r.atividade;
  const ant = r.atividadeAnterior;
  const data = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Recife" });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatório da semana</h1>
          <p className="text-slate-600">
            {data(r.semana.de)} até hoje · {r.metas.diasUteis} dia(s) útil(eis)
          </p>
        </div>
        <Link href="/admin/prospeccao" className="botao-secundario">
          ← Fila do dia
        </Link>
      </div>

      {/* ── o que fizemos / o que voltou ── */}
      <section aria-labelledby="t-semana">
        <h2 id="t-semana" className="sr-only">Esta semana</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Numero rotulo="Mensagens" valor={a.mensagens} meta={r.metas.mensagens} antes={ant.mensagens} />
          <Numero rotulo="Ligações" valor={a.ligacoes} meta={r.metas.ligacoes} antes={ant.ligacoes} />
          <Numero rotulo="Follow-ups" valor={a.followUps} antes={ant.followUps} />
          <Numero rotulo="E-mails" valor={a.emails} antes={ant.emails} />
          <Numero rotulo="Respostas" valor={a.respostas} antes={ant.respostas} destaque />
          <Numero rotulo="Conversas" valor={a.conversas} antes={ant.conversas} destaque />
          <Numero rotulo="Pilotos" valor={a.pilotos} antes={ant.pilotos} destaque />
        </div>
        {(a.perdidos > 0 || a.semResposta > 0) && (
          <p className="mt-3 text-sm text-slate-500">
            Saíram da fila esta semana: {a.perdidos} sem interesse · {a.semResposta} sem resposta depois dos 2 follow-ups.
          </p>
        )}
      </section>

      {r.funil.abordadas === 0 ? (
        <p className="mt-10 rounded-3xl bg-menta-clara p-8 text-center">
          Nenhuma clínica abordada ainda. O funil aparece aqui assim que a primeira mensagem for marcada como enviada.
        </p>
      ) : (
        <>
          {/* ── funil ── */}
          <section className="cartao mt-10" aria-labelledby="t-funil">
            <h2 id="t-funil" className="text-xl font-bold">Funil desde o começo</h2>
            <p className="text-sm text-slate-500">Cada clínica conta até a etapa mais funda que já alcançou.</p>
            <ol className="mt-6 space-y-3">
              {ETAPAS.map((e, i) => {
                const v = r.funil[e];
                const pct = Math.round((v / r.funil.abordadas) * 100);
                const anterior = i > 0 ? r.funil[ETAPAS[i - 1]] : null;
                const passagem = anterior ? Math.round((v / Math.max(anterior, 1)) * 100) : null;
                return (
                  <li key={e} className="grid grid-cols-[7rem_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr_7rem]">
                    <span className="text-sm font-semibold">{NOME_ETAPA[e]}</span>
                    <div
                      className="h-7 rounded-md bg-slate-100"
                      title={`${NOME_ETAPA[e]}: ${v} clínicas (${pct}% das abordadas)`}
                      role="img"
                      aria-label={`${NOME_ETAPA[e]}: ${v} clínicas, ${pct}% das abordadas`}
                    >
                      {v > 0 && (
                        <div
                          className="flex h-7 items-center justify-end rounded-md bg-bia pr-2 text-xs font-bold text-white"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        >
                          {pct >= 15 && v}
                        </div>
                      )}
                    </div>
                    <span className="col-start-2 text-xs text-slate-500 sm:col-start-auto">
                      <strong className="text-grafite">{v}</strong> · {pct}% do total{passagem !== null && ` · ${passagem}% da etapa anterior`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ── por tipo ── */}
          <section className="cartao mt-6" aria-labelledby="t-tipo">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="t-tipo" className="text-xl font-bold">Por tipo de clínica</h2>
              <p className="text-sm text-slate-500">Regra do plano: ganha quem tem mais pilotos; no empate, a melhor taxa de conversa.</p>
            </div>
            {r.lider ? (
              <p className="mt-3 rounded-2xl bg-menta-clara px-4 py-3 text-sm">
                🏆 Na frente: <strong>{r.lider.nome}</strong>, com {r.lider.piloto} piloto(s) e {r.lider.taxaConversa}% das abordadas virando conversa.
              </p>
            ) : (
              <p className="mt-3 rounded-2xl bg-gelo px-4 py-3 text-sm text-slate-600">
                Ainda pouco dado para comparar: cada tipo precisa de pelo menos 5 abordadas.
              </p>
            )}
            <Tabela
              cabecalho={["Tipo", "Abordadas", "Responderam", "Conversaram", "Propostas", "Pilotos", "Clientes"]}
              linhas={r.porTipo.map((t) => [
                <span key="n" className="font-semibold">
                  {t.nome}
                  {r.lider?.tipo === t.tipo && <span className="ml-2 text-xs text-bia">🏆 na frente</span>}
                </span>,
                t.abordadas,
                <Taxa key="r" n={t.responderam} pct={t.taxaResposta} />,
                <Taxa key="c" n={t.conversaram} pct={t.taxaConversa} />,
                t.proposta,
                t.piloto,
                t.cliente,
              ])}
            />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="cartao" aria-labelledby="t-cidade">
              <h2 id="t-cidade" className="text-xl font-bold">Por cidade</h2>
              <Tabela
                cabecalho={["Cidade", "Abordadas", "Responderam", "Conversaram"]}
                linhas={r.porCidade.map((c) => [<span key="n" className="font-semibold">{c.nome}</span>, c.abordadas, <Taxa key="r" n={c.responderam} pct={c.taxaResposta} />, c.conversaram])}
              />
            </section>
            <section className="cartao" aria-labelledby="t-canal">
              <h2 id="t-canal" className="text-xl font-bold">Por canal</h2>
              <Tabela
                cabecalho={["Canal", "Abordadas", "Responderam", "Conversaram"]}
                linhas={r.porCanal.map((c) => [<span key="n" className="font-semibold">{c.nome}</span>, c.abordadas, <Taxa key="r" n={c.responderam} pct={c.taxaResposta} />, c.conversaram])}
              />
            </section>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        Na fila para a próxima semana: <strong>{r.naFila}</strong> clínicas. Este relatório também chega no WhatsApp de vocês toda sexta às 17h.
      </p>
    </main>
  );
}

function Numero({ rotulo, valor, meta, antes, destaque }: { rotulo: string; valor: number; meta?: number; antes: number; destaque?: boolean }) {
  const diff = valor - antes;
  return (
    <div className={`rounded-2xl px-4 py-3 ring-1 ${destaque ? "bg-white ring-bia/30" : "bg-white ring-slate-200"}`}>
      <p className="etiqueta text-[10px] text-slate-500">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold text-grafite">
        {valor}
        {meta !== undefined && <span className="text-base font-normal text-slate-400">/{meta}</span>}
      </p>
      <p className="text-xs text-slate-500">
        {diff > 0 ? "▲" : diff < 0 ? "▼" : "="} semana passada: {antes}
      </p>
    </div>
  );
}

function Taxa({ n, pct }: { n: number; pct: number }) {
  return (
    <span className="flex items-center gap-2" title={`${n} (${pct}%)`}>
      <span className="w-6 text-right">{n}</span>
      <span className="hidden h-2 w-16 rounded bg-slate-100 sm:block" aria-hidden>
        <span className="block h-2 rounded bg-bia" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-slate-500">{pct}%</span>
    </span>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: React.ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            {cabecalho.map((c) => (
              <th key={c} className="whitespace-nowrap py-2 pr-4 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {linhas.map((l, i) => (
            <tr key={i}>
              {l.map((cel, j) => (
                <td key={j} className="whitespace-nowrap py-2 pr-4">{cel}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
