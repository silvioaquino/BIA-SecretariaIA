"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Conversa de EXEMPLO (fictícia) mostrando a confirmação e a remarcação.
const ROTEIRO: { de: "bia" | "paciente" | "sistema"; texto: string }[] = [
  { de: "bia", texto: "Oi, Maria! Aqui é a Bia, assistente virtual da Clínica Sorriso 😊" },
  { de: "bia", texto: "Sua consulta com a Dra. Ana é amanhã, terça, às 14h.\n\nResponda:\n1 para confirmar\n2 para remarcar" },
  { de: "paciente", texto: "2" },
  { de: "bia", texto: "Sem problema! Já avisei a recepção, e ela vai te chamar para combinar um novo horário 👍" },
  { de: "sistema", texto: "Recepção avisada: Maria pediu para remarcar. O horário de terça às 14h ficou livre." },
];

export function ChatDemo() {
  const [visiveis, setVisiveis] = useState(1);

  useEffect(() => {
    const completo = visiveis >= ROTEIRO.length;
    // movimento reduzido: mostra a conversa inteira e para
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (completo) return;
      const t = setTimeout(() => setVisiveis(ROTEIRO.length), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setVisiveis((v) => (v >= ROTEIRO.length ? 1 : v + 1)),
      completo ? 4500 : 1600,
    );
    return () => clearTimeout(t);
  }, [visiveis]);

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute -inset-6 rounded-[3rem] bg-menta/30 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[2.2rem] border-[10px] border-grafite bg-[#efeae2] shadow-2xl">
        <div className="flex items-center gap-3 bg-bia-escuro px-4 py-3 text-white">
          <Image src="/bia.png" alt="" width={34} height={34} className="rounded-full" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Clínica Sorriso</p>
            <p className="text-[11px] text-menta">online</p>
          </div>
        </div>
        <div className="flex h-[400px] flex-col gap-2 overflow-hidden p-3 text-grafite" aria-live="polite">
          {ROTEIRO.slice(0, visiveis).map((m, i) =>
            m.de === "sistema" ? (
              <div key={i} className="animate-entrar mx-auto mt-1 max-w-[95%] rounded-xl bg-coral px-3 py-2 text-center text-[12px] font-semibold text-white shadow">
                🔔 {m.texto}
              </div>
            ) : (
              <div
                key={i}
                className={`animate-entrar max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 text-[13px] leading-snug shadow-sm ${
                  m.de === "bia" ? "self-start rounded-tl-none bg-white" : "self-end rounded-tr-none bg-[#d9fdd3]"
                }`}
              >
                {m.texto}
              </div>
            ),
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-menta-clara/80">Conversa de exemplo</p>
    </div>
  );
}
