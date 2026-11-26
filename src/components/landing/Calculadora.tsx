"use client";

import Link from "next/link";
import { useState } from "react";
import { brl } from "@/lib/planos";

const PLANO_MAIS_BARATO = 197;

export function Calculadora() {
  const [consultas, setConsultas] = useState(20);
  const [valor, setValor] = useState(150);
  const [faltas, setFaltas] = useState(15);
  const [evita, setEvita] = useState(30);
  const dias = 22;

  const faltasMes = Math.round(consultas * dias * (faltas / 100));
  const perdaMes = faltasMes * valor;
  const recuperadas = Math.round(faltasMes * (evita / 100));
  const recuperadoMes = recuperadas * valor;
  const pagaCom = Math.max(1, Math.ceil(PLANO_MAIS_BARATO / Math.max(valor, 1)));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Controle rotulo="Consultas por dia" valor={consultas} min={5} max={120} passo={1} onChange={setConsultas} formato={(v) => `${v}`} />
        <Controle rotulo="Valor médio da consulta" valor={valor} min={50} max={1000} passo={10} onChange={setValor} formato={(v) => brl(v, false)} />
        <Controle rotulo="Faltas hoje (%)" valor={faltas} min={3} max={40} passo={1} onChange={setFaltas} formato={(v) => `${v}%`} />
        <Controle
          rotulo="Quantas dessas faltas a Bia evita (sua estimativa)"
          valor={evita}
          min={10}
          max={70}
          passo={5}
          onChange={setEvita}
          formato={(v) => `${v}%`}
        />
        <p className="text-xs text-slate-500">Conta feita com {dias} dias de atendimento por mês. Mexa nos números até ficarem iguais aos da sua clínica.</p>
      </div>

      <div className="flex flex-col justify-between rounded-3xl bg-grafite p-6 text-white sm:p-8">
        <div>
          <p className="etiqueta text-menta">Hoje, com as faltas</p>
          <p className="mt-2 text-4xl font-bold text-coral sm:text-5xl">{brl(perdaMes, false)}<span className="text-lg font-normal text-white/70">/mês</span></p>
          <p className="mt-1 text-sm text-white/70">
            {faltasMes} consultas vazias por mês · {brl(perdaMes * 12, false)} por ano
          </p>

          <div className="my-6 h-px bg-white/15" />

          <p className="etiqueta text-menta">Com a Bia, você recupera</p>
          <p className="mt-2 text-4xl font-bold text-menta sm:text-5xl">+{brl(recuperadoMes, false)}<span className="text-lg font-normal text-white/70">/mês</span></p>
          <p className="mt-1 text-sm text-white/70">{recuperadas} consultas que voltam para a agenda</p>
        </div>
        <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm">
          A Bia começa em <strong>{brl(PLANO_MAIS_BARATO, false)}/mês</strong>.{" "}
          {pagaCom === 1 ? (
            <>Ela se paga com <strong className="text-menta">1 consulta recuperada</strong> no mês.</>
          ) : (
            <>Ela se paga com <strong className="text-menta">{pagaCom} consultas recuperadas</strong> no mês.</>
          )}
        </div>
        <Link href="#precos" className="mt-6 inline-flex justify-center rounded-xl bg-menta px-6 py-3 font-bold text-bia-escuro transition hover:bg-white">
          Quero parar de perder esse dinheiro
        </Link>
      </div>
    </div>
  );
}

function Controle({
  rotulo, valor, min, max, passo, onChange, formato,
}: {
  rotulo: string; valor: number; min: number; max: number; passo: number; onChange: (v: number) => void; formato: (v: number) => string;
}) {
  const id = rotulo.replace(/\W+/g, "-");
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">{rotulo}</label>
        <span className="text-lg font-bold text-bia">{formato(valor)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-bia"
      />
    </div>
  );
}
