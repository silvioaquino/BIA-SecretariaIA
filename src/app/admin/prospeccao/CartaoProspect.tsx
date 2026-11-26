"use client";

import { useState, useTransition } from "react";
import { registrarAcao } from "./actions";
import type { Acao } from "@/lib/prospeccao/fila";

export type DadosCartao = {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  bairro: string | null;
  endereco: string | null;
  telefone: string | null;
  mapsUrl: string | null;
  site: string | null;
  nota: number | null;
  avaliacoes: number | null;
  faixa: string;
  pontuacao: number;
  motivos: string[];
  observacoes: string | null;
  tentativas: number;
  porte: string | null;
};

export type Modo = "negociacao" | "resposta" | "whatsapp" | "follow_up" | "ligacao" | "visita";

const EMOJI: Record<string, string> = { ODONTOLOGIA: "🦷", MEDICINA: "🩺", OFTALMOLOGIA: "👁️", OUTRA: "🏥" };
const COR_FAIXA: Record<string, string> = {
  A: "bg-bia text-white",
  B: "bg-menta-clara text-bia-escuro",
  C: "bg-slate-100 text-slate-600",
};

// Botões de resultado por tipo de contato. O 1º é o caminho feliz.
const RESULTADOS: Record<Modo, Acao[]> = {
  negociacao: ["proposta_enviada", "fechou_piloto", "virou_cliente", "sem_interesse"],
  resposta: ["virou_conversa", "sem_interesse"],
  whatsapp: ["whatsapp_enviado", "numero_errado", "pular"],
  follow_up: ["follow_up_enviado", "respondeu", "sem_interesse"],
  ligacao: ["ligou_falou", "ligou_nao_atendeu", "sem_interesse", "numero_errado", "pular"],
  visita: ["visitou_conversou", "visitou_voltar", "sem_interesse"],
};

const ROTULO: Record<Acao, string> = {
  whatsapp_enviado: "✓ Enviei",
  follow_up_enviado: "✓ Enviei o follow-up",
  respondeu: "Já respondeu",
  virou_conversa: "✓ Já respondi, estamos conversando",
  proposta_enviada: "Proposta enviada",
  fechou_piloto: "Fechou o piloto 🎉",
  virou_cliente: "Virou cliente 🎉",
  ligou_falou: "✓ Falei com quem decide",
  ligou_nao_atendeu: "Não atendeu",
  visitou_conversou: "✓ Conversei",
  visitou_voltar: "Voltar outro dia",
  sem_interesse: "Sem interesse",
  numero_errado: "Número errado",
  pular: "Pular hoje",
};

export function CartaoProspect({ p, modo, texto, rotuloTexto }: { p: DadosCartao; modo: Modo; texto: string; rotuloTexto: string }) {
  const [mensagem, setMensagem] = useState(texto);
  const [feito, setFeito] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [verMotivos, setVerMotivos] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const enviarPorWhats = modo === "whatsapp" || modo === "follow_up";
  const resposta = modo === "resposta" || modo === "negociacao";
  const tel = p.telefone ? formatarTelefone(p.telefone) : null;

  function marcar(acao: Acao) {
    setErro(null);
    iniciar(async () => {
      try {
        await registrarAcao(p.id, acao);
        setFeito(ROTULO[acao]);
      } catch {
        setErro("Não consegui salvar. Tente de novo.");
      }
    });
  }

  if (feito) {
    return (
      <div className="animate-entrar rounded-2xl bg-menta-clara px-4 py-3 text-sm">
        <strong>{p.nome}</strong> · {feito}
      </div>
    );
  }

  return (
    <article className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 ${pendente ? "opacity-60" : ""}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">
            <span aria-hidden>{EMOJI[p.tipo] ?? "🏥"}</span> {p.nome}
          </h3>
          <p className="text-sm text-slate-600">
            {p.cidade}
            {p.bairro ? ` · ${p.bairro}` : ""}
            {p.nota != null && ` · ⭐ ${p.nota.toLocaleString("pt-BR")}`}
            {p.avaliacoes != null && ` (${p.avaliacoes})`}
            {p.porte && ` · porte ${p.porte.toLowerCase()} (estimado)`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVerMotivos(!verMotivos)}
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${COR_FAIXA[p.faixa] ?? COR_FAIXA.C}`}
          title="Ver por que está nessa posição"
        >
          {p.faixa} · {p.pontuacao}
        </button>
      </header>

      {verMotivos && (
        <ul className="mt-2 rounded-xl bg-gelo p-3 text-xs text-slate-600">
          {p.motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {p.observacoes && <p className="mt-2 whitespace-pre-line text-xs text-slate-500">{p.observacoes}</p>}

      {resposta ? (
        <div className="mt-3">
          <p className="etiqueta mb-1 text-[10px] text-slate-500">{rotuloTexto}</p>
          <p className="whitespace-pre-line rounded-2xl rounded-tl-none bg-[#efeae2] px-4 py-3 text-[14px] leading-relaxed">{texto}</p>
        </div>
      ) : (
        <div className="mt-3">
          <label className="etiqueta mb-1 block text-[10px] text-slate-500" htmlFor={`msg-${p.id}`}>
            {rotuloTexto}
          </label>
          <textarea
            id={`msg-${p.id}`}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            readOnly={!enviarPorWhats}
            rows={enviarPorWhats ? 7 : 5}
            className={`campo text-[13px] leading-relaxed ${enviarPorWhats ? "" : "bg-gelo"}`}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {resposta && p.telefone && (
          <a href={`https://wa.me/${p.telefone}`} target="_blank" rel="noopener noreferrer" className="botao bg-[#1fa855] hover:bg-[#178a45]">
            Abrir a conversa
          </a>
        )}
        {enviarPorWhats && p.telefone && (
          <a
            href={`https://wa.me/${p.telefone}?text=${encodeURIComponent(mensagem)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="botao bg-[#1fa855] hover:bg-[#178a45]"
          >
            Abrir no WhatsApp
          </a>
        )}
        {modo === "ligacao" && tel && (
          <a href={`tel:+${p.telefone}`} className="botao">
            Ligar {tel}
          </a>
        )}
        {modo === "visita" && p.mapsUrl && (
          <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="botao">
            Abrir no Maps
          </a>
        )}
        {enviarPorWhats && (
          <button
            type="button"
            className="botao-secundario"
            onClick={async () => {
              await navigator.clipboard.writeText(mensagem);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1500);
            }}
          >
            {copiado ? "Copiado!" : "Copiar texto"}
          </button>
        )}
      </div>
      {modo === "visita" && p.endereco && <p className="mt-2 text-xs text-slate-500">{p.endereco}</p>}
      {enviarPorWhats && tel && <p className="mt-2 text-xs text-slate-500">{tel} · confira o texto e envie você mesmo, do número comercial.</p>}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="etiqueta mb-2 text-[10px] text-slate-500">O que aconteceu?</p>
        <div className="flex flex-wrap gap-2">
          {RESULTADOS[modo].map((acao, i) => (
            <button
              key={acao}
              type="button"
              disabled={pendente}
              onClick={() => marcar(acao)}
              className={
                i === 0
                  ? "rounded-xl bg-bia-escuro px-3 py-2 text-sm font-semibold text-white hover:bg-grafite disabled:opacity-50"
                  : "rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-gelo disabled:opacity-50"
              }
            >
              {ROTULO[acao]}
            </button>
          ))}
        </div>
        {erro && <p className="mt-2 text-sm text-coral">{erro}</p>}
      </div>
    </article>
  );
}

function formatarTelefone(n: string) {
  const d = n.replace(/^55/, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}
