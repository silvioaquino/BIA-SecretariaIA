"use client";

import { useState } from "react";

// Exemplos baseados em marca.json ("nichos") e no plano ("Ajustes por tipo de clínica").
const TIPOS = {
  odonto: {
    nome: "Odontologia",
    emoji: "🦷",
    mensagem: "Sua avaliação com a Dra. Ana é amanhã às 9h. Chegue 10 minutos antes, tá? Responda 1 para confirmar ou 2 para remarcar.",
    extras: ["Convite para a revisão de 6 meses", "Lembrete de retorno de tratamento", "Lista de espera para encaixes"],
  },
  medica: {
    nome: "Clínicas médicas",
    emoji: "🩺",
    mensagem: "Sua consulta com o Dr. Paulo é amanhã às 15h. Não esqueça a carteirinha do convênio, a guia e os exames anteriores.",
    extras: ["Aviso de guia e autorização do convênio", "Confirmação de retorno", "Respostas sobre convênios aceitos"],
  },
  oftalmo: {
    nome: "Oftalmologia",
    emoji: "👁️",
    mensagem: "Seu exame é amanhã às 10h. Se houver dilatação, venha acompanhado e não dirija depois. Responda 1 para confirmar.",
    extras: ["Lembrete do retorno anual", "Revisão de grau (óculos e lentes)", "Orientação de preparo cadastrada pela clínica"],
  },
} as const;

type Tipo = keyof typeof TIPOS;

export function Especialidades() {
  const [tipo, setTipo] = useState<Tipo>("odonto");
  const t = TIPOS[tipo];

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div>
        <div role="tablist" className="flex flex-wrap gap-2">
          {(Object.keys(TIPOS) as Tipo[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tipo === k}
              onClick={() => setTipo(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tipo === k ? "bg-bia text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-menta-clara"}`}
            >
              {TIPOS[k].emoji} {TIPOS[k].nome}
            </button>
          ))}
        </div>
        <ul className="mt-6 space-y-3">
          {t.extras.map((e) => (
            <li key={e} className="flex items-center gap-3 text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-menta-clara text-bia">✓</span>
              {e}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl bg-[#efeae2] p-6">
        <p className="mb-3 text-xs font-semibold text-slate-500">Exemplo de mensagem da Bia</p>
        <div key={tipo} className="animate-entrar max-w-md rounded-2xl rounded-tl-none bg-white p-4 text-[15px] leading-relaxed shadow-sm">
          {t.mensagem}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          A clínica escreve as orientações; a Bia nunca cita nome de exame ou doença na mensagem.
        </p>
      </div>
    </div>
  );
}
