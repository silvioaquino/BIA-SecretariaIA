"use client";

import { startTransition, useActionState } from "react";
import type { EstadoForm } from "./actions";

type Campo = { nome: string; rotulo: string; tipo?: string; autoComplete?: string };

export function FormAuth({
  acao,
  campos,
  botao,
  ocultos = {},
}: {
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
  campos: Campo[];
  botao: string;
  ocultos?: Record<string, string>;
}) {
  const [estado, enviar, pendente] = useActionState(acao, undefined);

  if (estado?.ok) {
    return <p className="rounded-xl bg-menta-clara p-4 text-sm">{estado.ok}</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        // envio manual: com action={...} o React limpa os campos mesmo quando dá erro
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => enviar(dados));
      }}
      className="space-y-4"
    >
      {Object.entries(ocultos).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {campos.map((c) => (
        <div key={c.nome}>
          <label htmlFor={c.nome} className="rotulo">
            {c.rotulo}
          </label>
          <input
            id={c.nome}
            name={c.nome}
            type={c.tipo ?? "text"}
            autoComplete={c.autoComplete}
            required
            className="campo"
          />
        </div>
      ))}
      {estado?.erro && <p className="text-sm text-coral">{estado.erro}</p>}
      <button type="submit" disabled={pendente} className="botao w-full">
        {pendente ? "Aguarde…" : botao}
      </button>
    </form>
  );
}
