"use client";

import Link from "next/link";
import { useState } from "react";
import { PORTES, PRODUTOS, brl } from "@/lib/planos";
import type { PorteId, ProdutoId } from "@/lib/formTipos";

export function Precos() {
  const [porte, setPorte] = useState<PorteId>("PEQUENA");

  return (
    <div>
      <div role="tablist" aria-label="Tamanho da clínica" className="mx-auto mb-10 flex w-fit flex-wrap justify-center gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        {(Object.keys(PORTES) as PorteId[]).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={porte === id}
            onClick={() => setPorte(id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${porte === id ? "bg-bia text-white" : "text-slate-600 hover:bg-gelo"}`}
          >
            {PORTES[id].nome}
            <span className={`block text-[11px] font-normal ${porte === id ? "text-menta-clara" : "text-slate-400"}`}>{PORTES[id].descricao}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {(Object.keys(PRODUTOS) as ProdutoId[]).map((id) => {
          const p = PRODUTOS[id];
          const destaque = id === "COMPLETA";
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-3xl p-7 sm:p-8 ${
                destaque ? "bg-gradient-to-br from-bia to-bia-escuro text-white shadow-xl md:-translate-y-3" : "bg-white shadow-sm ring-1 ring-slate-200"
              }`}
            >
              {destaque && (
                <span className="absolute -top-3 left-8 rounded-full bg-menta px-3 py-1 text-xs font-bold text-bia-escuro">
                  Atendimento 24h
                </span>
              )}
              <p className={`etiqueta ${destaque ? "text-menta" : "text-bia"}`}>{p.slogan}</p>
              <h3 className="mt-1 text-2xl font-bold">{p.nome}</h3>
              <p className={`mt-2 text-sm ${destaque ? "text-menta-clara" : "text-slate-600"}`}>{p.resumo}</p>

              <p className="mt-6 text-5xl font-bold tracking-tight">
                {brl(p.precos[porte], false)}
                <span className={`text-base font-normal ${destaque ? "text-menta-clara" : "text-slate-500"}`}>/mês</span>
              </p>
              <p className={`mt-1 text-xs ${destaque ? "text-menta-clara" : "text-slate-500"}`}>
                {p.implantacao > 0
                  ? `+ implantação única de ${brl(p.implantacao, false)} · grátis para quem já usa o Confirma há 2 meses`
                  : "Sem taxa de implantação"}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.recursos.map((r) => (
                  <li key={r} className="flex gap-2">
                    <Check claro={destaque} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/cadastro?produto=${id}&porte=${porte}`}
                className={`mt-8 inline-flex justify-center rounded-xl px-6 py-3.5 font-bold transition ${
                  destaque ? "bg-white text-bia-escuro hover:bg-menta-clara" : "bg-bia text-white hover:bg-bia-escuro"
                }`}
              >
                {destaque ? "Começar com a Completa" : "Começar com o Confirma"}
              </Link>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-slate-600">
        Pix ou cartão · Sem fidelidade · Cancele quando quiser · <strong>7 dias de garantia</strong>
      </p>
    </div>
  );
}

export function Check({ claro = false }: { claro?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`mt-0.5 h-5 w-5 shrink-0 ${claro ? "text-menta" : "text-bia"}`} fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clipRule="evenodd" />
    </svg>
  );
}
