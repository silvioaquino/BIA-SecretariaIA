"use client";

import { createContext, useContext, useRef, useState } from "react";

// As seções da fila viram abas: uma lista horizontal no topo e só a seção
// escolhida aparece. "Todas" mostra a fila inteira numa página só.

const TODAS = "todas";

export type InfoAba = { id: string; rotulo: string; total: number };

const AbaAtiva = createContext<string | null>(null);

export function AbasSecoes({ abas, inicial, children }: { abas: InfoAba[]; inicial?: string; children: React.ReactNode }) {
  const visiveis = abas.filter((a) => a.total > 0 || a.id === inicial);
  const [ativa, setAtiva] = useState(() => visiveis.find((a) => a.id === inicial)?.id ?? visiveis[0]?.id ?? null);
  const topo = useRef<HTMLDivElement>(null);

  function escolher(id: string) {
    setAtiva(id);
    // volta para o começo da seção se a pessoa já tinha rolado a página
    const el = topo.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  }

  return (
    <AbaAtiva.Provider value={ativa}>
      <div ref={topo} className="scroll-mt-0">
        {visiveis.length > 1 && (
          <nav
            aria-label="Seções da fila"
            className="sticky top-0 z-30 -mx-4 mb-4 flex gap-2 overflow-x-auto border-b border-slate-200 bg-gelo/95 px-4 py-2 backdrop-blur [scrollbar-width:none]"
          >
            {[{ id: TODAS, rotulo: "Todas", total: visiveis.reduce((t, a) => t + a.total, 0) }, ...visiveis].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => escolher(a.id)}
                aria-current={ativa === a.id ? "page" : undefined}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  ativa === a.id ? "bg-bia-escuro text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {a.rotulo} <span className={ativa === a.id ? "text-menta" : "text-slate-400"}>{a.total}</span>
              </button>
            ))}
          </nav>
        )}
        <div className="space-y-10">{children}</div>
      </div>
    </AbaAtiva.Provider>
  );
}

/** Conteúdo de uma aba: só aparece se for a escolhida (ou com "Todas"). */
export function Aba({ id, children }: { id: string; children: React.ReactNode }) {
  const ativa = useContext(AbaAtiva);
  return <div className={ativa === id || ativa === TODAS ? "" : "hidden"}>{children}</div>;
}
