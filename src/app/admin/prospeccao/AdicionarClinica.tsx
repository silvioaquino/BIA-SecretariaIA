"use client";

import { useState, useTransition } from "react";
import type { Especialidade } from "@/generated/prisma/enums";
import type { ResultadoBusca } from "@/lib/prospeccao/adicionar";
import { adicionarClinicaAcao, buscarClinicaAcao } from "./actions";

const TIPOS: [Especialidade, string][] = [
  ["ODONTOLOGIA", "🦷 Odontologia"],
  ["MEDICINA", "🩺 Clínica médica"],
  ["OFTALMOLOGIA", "👁️ Oftalmologia"],
  ["OUTRA", "🏥 Outra"],
];

const STATUS: Record<string, string> = {
  novo: "na fila, ainda não abordada",
  abordado: "já abordada",
  respondeu: "já respondeu",
  conversa: "em conversa",
  proposta: "proposta enviada",
  piloto: "em piloto",
  cliente: "já é cliente",
  perdido: "marcada sem interesse",
  sem_resposta: "não respondeu",
  descartado: "descartada pela pontuação",
};

/** Pesquisa uma clínica pelo nome no Google e adiciona na lista (seção "Indicações"). */
export function AdicionarClinica() {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null);
  const [tipos, setTipos] = useState<Record<string, Especialidade>>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [manual, setManual] = useState(false);
  const [pendente, iniciar] = useTransition();

  function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    iniciar(async () => {
      const r = await buscarClinicaAcao(busca);
      if (r.erro) return setAviso({ ok: false, texto: r.erro });
      setResultados(r.resultados ?? []);
      setTipos(Object.fromEntries((r.resultados ?? []).map((x) => [x.placeId, x.tipoSugerido])));
    });
  }

  function adicionar(x: ResultadoBusca) {
    setAviso(null);
    iniciar(async () => {
      const r = await adicionarClinicaAcao({
        placeId: x.placeId,
        nome: x.nome,
        tipo: tipos[x.placeId] ?? x.tipoSugerido,
        cidade: x.cidade ?? "Pernambuco",
        telefone: x.telefone,
        endereco: x.endereco,
        nota: x.nota,
        avaliacoes: x.avaliacoes,
      });
      if (r.erro) return setAviso({ ok: false, texto: r.erro });
      setAviso({ ok: true, texto: `${r.nome} ${r.jaExistia ? "já estava na lista" : "foi adicionada"}. Ela está em "Indicações", logo abaixo.` });
      setResultados(null);
      setBusca("");
    });
  }

  function adicionarManual(form: FormData) {
    setAviso(null);
    iniciar(async () => {
      const r = await adicionarClinicaAcao({
        nome: String(form.get("nome") ?? ""),
        tipo: String(form.get("tipo") ?? "OUTRA") as Especialidade,
        cidade: String(form.get("cidade") ?? ""),
        telefone: String(form.get("telefone") ?? "") || null,
        observacoes: String(form.get("observacoes") ?? "") || null,
      });
      if (r.erro) return setAviso({ ok: false, texto: r.erro });
      setAviso({ ok: true, texto: `${r.nome} ${r.jaExistia ? "já estava na lista" : "foi adicionada"}. Ela está em "Indicações", logo abaixo.` });
      setManual(false);
    });
  }

  if (!aberto) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="botao-secundario" onClick={() => setAberto(true)}>
          + Adicionar clínica
        </button>
        {aviso && <p className={`text-sm font-semibold ${aviso.ok ? "text-bia" : "text-coral"}`}>{aviso.texto}</p>}
      </div>
    );
  }

  return (
    <section className={`cartao space-y-4 ${pendente ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Adicionar clínica</h2>
          <p className="text-sm text-slate-500">Uma indicação ou uma clínica que vocês conhecem. Ela entra em &quot;Indicações&quot;, fora da meta do dia.</p>
        </div>
        <button type="button" className="text-sm text-slate-500 hover:text-coral" onClick={() => setAberto(false)}>
          Fechar
        </button>
      </div>

      <form onSubmit={pesquisar} className="flex flex-col gap-2 sm:flex-row">
        <input
          className="campo flex-1"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome da clínica e cidade. Ex.: LP Saúde Paulista"
          aria-label="Nome da clínica"
        />
        <button className="botao px-5" disabled={pendente}>
          {pendente ? "Buscando…" : "Pesquisar no Google"}
        </button>
      </form>

      {aviso && <p className={`text-sm font-semibold ${aviso.ok ? "text-bia" : "text-coral"}`}>{aviso.texto}</p>}

      {resultados && resultados.length === 0 && (
        <p className="text-sm text-slate-600">Nada encontrado no Google. Tente outro nome, ou adicione à mão abaixo.</p>
      )}
      {resultados && resultados.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
          {resultados.map((x) => (
            <li key={x.placeId} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{x.nome}</p>
                <p className="text-slate-500">
                  {x.endereco ?? x.cidade}
                  {x.nota != null && ` · ⭐ ${x.nota.toLocaleString("pt-BR")} (${x.avaliacoes ?? 0})`}
                </p>
                <p className="text-slate-500">{x.telefone ?? "sem telefone no Google"}</p>
              </div>
              {x.jaNaLista && x.jaNaLista !== "novo" && x.jaNaLista !== "descartado" ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Na lista: {STATUS[x.jaNaLista] ?? x.jaNaLista}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    className="campo w-auto py-2 text-sm"
                    aria-label={`Tipo de ${x.nome}`}
                    value={tipos[x.placeId] ?? x.tipoSugerido}
                    onChange={(e) => setTipos({ ...tipos, [x.placeId]: e.target.value as Especialidade })}
                  >
                    {TIPOS.map(([v, r]) => (
                      <option key={v} value={v}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="botao px-4 py-2" disabled={pendente} onClick={() => adicionar(x)}>
                    {x.jaNaLista ? "Trazer para Indicações" : "Adicionar"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!manual ? (
        <button type="button" className="text-sm font-semibold text-bia hover:underline" onClick={() => setManual(true)}>
          Não achou no Google? Adicionar à mão
        </button>
      ) : (
        <form action={adicionarManual} className="grid gap-3 rounded-2xl bg-gelo p-3 sm:grid-cols-2">
          <input name="nome" required className="campo bg-white" placeholder="Nome da clínica" aria-label="Nome" />
          <input name="telefone" className="campo bg-white" placeholder="WhatsApp ou telefone, com DDD" aria-label="Telefone" />
          <input name="cidade" required className="campo bg-white" placeholder="Cidade" aria-label="Cidade" />
          <select name="tipo" className="campo bg-white" aria-label="Tipo de clínica" defaultValue="MEDICINA">
            {TIPOS.map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
          <input name="observacoes" className="campo bg-white sm:col-span-2" placeholder="Observação (ex.: indicação da esposa, não tem automação)" aria-label="Observação" />
          <button className="botao sm:col-span-2" disabled={pendente}>
            Adicionar à lista
          </button>
        </form>
      )}
    </section>
  );
}
