"use client";

import { useState, useTransition } from "react";
import { registrarAcao } from "../actions";
import type { Acao } from "@/lib/prospeccao/fila";

export type Aguardando = { id: string; nome: string; cidade: string; email: string | null; enviadoEm: string };

const BOTOES: [Acao, string][] = [
  ["virou_conversa", "✓ Respondeu, estamos conversando"],
  ["sem_interesse", "Sem interesse"],
];

/** E-mail enviado e ainda sem resposta: quando a clínica responder, marque aqui. */
export function AguardandoEmail({ c }: { c: Aguardando }) {
  const [feito, setFeito] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  const [pendente, iniciar] = useTransition();

  if (feito) return <li className="rounded-xl bg-menta-clara px-3 py-2 text-sm"><strong>{c.nome}</strong> · {feito}</li>;

  return (
    <li className={`flex flex-wrap items-center justify-between gap-3 py-3 ${pendente ? "opacity-60" : ""}`}>
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{c.nome}</p>
        <p className="text-slate-500">
          {c.cidade}
          {c.email && <> · <a href={`mailto:${c.email}`} className="text-bia hover:underline">{c.email}</a></>} · enviado em {c.enviadoEm}
        </p>
        {erro && <p className="text-coral">Não consegui salvar. Tente de novo.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {BOTOES.map(([acao, rotulo], i) => (
          <button
            key={acao}
            type="button"
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                setErro(false);
                try {
                  await registrarAcao(c.id, acao);
                  setFeito(rotulo.replace("✓ ", ""));
                } catch {
                  setErro(true);
                }
              })
            }
            className={
              i === 0
                ? "rounded-xl bg-bia-escuro px-3 py-2 text-sm font-semibold text-white hover:bg-grafite disabled:opacity-50"
                : "rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-gelo disabled:opacity-50"
            }
          >
            {rotulo}
          </button>
        ))}
      </div>
    </li>
  );
}
