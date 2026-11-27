"use client";

import { useState, useTransition } from "react";
import type { Especialidade } from "@/generated/prisma/enums";
import { emailAbordagem } from "@/lib/prospeccao/mensagens";
import { registrarEmail } from "../actions";

const TIPOS: [Especialidade, string][] = [
  ["ODONTOLOGIA", "Odontologia"],
  ["MEDICINA", "Clínica médica"],
  ["OFTALMOLOGIA", "Oftalmologia"],
  ["OUTRA", "Outra"],
];

export type ClinicaEmail = { id: string; nome: string; cidade: string; tipo: Especialidade; email: string | null; status: string };

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const semAcento = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function EmailAbordagem({
  remetente,
  site,
  cidades,
  clinicas,
  inicialId,
}: {
  remetente: string;
  site: string;
  cidades: string[];
  clinicas: ClinicaEmail[];
  inicialId?: string;
}) {
  const inicial = clinicas.find((c) => c.id === inicialId) ?? null;
  const [escolhida, setEscolhida] = useState<ClinicaEmail | null>(inicial);
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [email, setEmail] = useState(inicial?.email ?? "");
  const [cidade, setCidade] = useState(inicial?.cidade ?? cidades[0] ?? "");
  const [tipo, setTipo] = useState<Especialidade>(inicial?.tipo ?? "ODONTOLOGIA");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const pronto = emailAbordagem({ nome, cidade, tipo }, remetente, site);
  const achadas = busca.trim().length >= 2 ? clinicas.filter((c) => semAcento(`${c.nome} ${c.cidade}`).includes(semAcento(busca.trim()))).slice(0, 8) : [];

  function escolher(c: ClinicaEmail | null) {
    setEscolhida(c);
    setBusca("");
    setAviso(null);
    if (c) {
      setNome(c.nome);
      setCidade(c.cidade);
      setTipo(c.tipo);
      setEmail(c.email ?? "");
    }
  }

  function marcarEnviado() {
    if (!escolhida) return;
    setAviso(null);
    iniciar(async () => {
      const r = await registrarEmail(escolhida.id, email);
      if (r.erro) return setAviso({ ok: false, texto: r.erro });
      setAviso({ ok: true, texto: `Registrado: e-mail enviado para ${escolhida.nome}.` });
      setEscolhida(null);
      setNome("");
      setEmail("");
    });
  }

  return (
    <div className="space-y-6">
      <section className="cartao space-y-4">
        <div>
          <p className="text-sm font-semibold">Clínica da lista</p>
          {escolhida ? (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-menta-clara px-3 py-2 text-sm">
              <span>
                <strong>{escolhida.nome}</strong> · {escolhida.cidade}
                {escolhida.status !== "novo" && <span className="text-slate-600"> · já abordada ({escolhida.status})</span>}
              </span>
              <button type="button" className="font-semibold text-bia-escuro underline" onClick={() => escolher(null)}>
                Trocar
              </button>
            </div>
          ) : (
            <div className="relative mt-1">
              <input
                className="campo"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome da clínica para buscar (ou preencha à mão abaixo)"
                aria-label="Buscar clínica"
              />
              {achadas.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
                  {achadas.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gelo" onClick={() => escolher(c)}>
                        <strong>{c.nome}</strong> <span className="text-slate-500">· {c.cidade}{c.email ? ` · ${c.email}` : ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Escolhendo da lista, o envio fica registrado: conta no relatório e a clínica sai da fila do WhatsApp.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Nome da clínica
            <input className="campo mt-1 font-normal" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Clínica Sorriso (opcional)" />
          </label>
          <label className="block text-sm font-semibold">
            E-mail da clínica
            <input className="campo mt-1 font-normal" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@clinica.com.br" />
          </label>
          <label className="block text-sm font-semibold">
            Cidade
            <select className="campo mt-1 font-normal" value={cidade} onChange={(e) => setCidade(e.target.value)}>
              {cidades.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Tipo de clínica
            <select className="campo mt-1 font-normal" value={tipo} onChange={(e) => setTipo(e.target.value as Especialidade)}>
              {TIPOS.map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* trocou a clínica, a cidade ou o tipo: o texto é refeito (a key recria o editor) */}
      <Editor key={`${nome}|${cidade}|${tipo}`} email={email} inicial={pronto} />

      <section className="cartao flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          {escolhida
            ? "Depois de enviar, registre aqui."
            : "Para registrar o envio, escolha a clínica da lista lá em cima."}
          {aviso && <span className={`block font-semibold ${aviso.ok ? "text-bia" : "text-coral"}`}>{aviso.texto}</span>}
        </p>
        <button
          type="button"
          className="botao"
          disabled={!escolhida || !EMAIL_OK.test(email.trim()) || pendente}
          onClick={marcarEnviado}
        >
          {pendente ? "Salvando…" : "✓ Enviei o e-mail"}
        </button>
      </section>
    </div>
  );
}

function Editor({ email, inicial }: { email: string; inicial: { assunto: string; corpo: string } }) {
  const [assunto, setAssunto] = useState(inicial.assunto);
  const [corpo, setCorpo] = useState(inicial.corpo);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(qual: string, texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(qual);
    setTimeout(() => setCopiado(null), 1500);
  }

  const mailto = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

  return (
    <section className="cartao space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="assunto" className="etiqueta text-[10px] text-slate-500">Assunto</label>
          <button type="button" className="text-sm font-semibold text-bia hover:underline" onClick={() => copiar("assunto", assunto)}>
            {copiado === "assunto" ? "Copiado!" : "Copiar assunto"}
          </button>
        </div>
        <input id="assunto" className="campo" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="corpo" className="etiqueta text-[10px] text-slate-500">Mensagem (pode editar)</label>
          <button type="button" className="text-sm font-semibold text-bia hover:underline" onClick={() => copiar("corpo", corpo)}>
            {copiado === "corpo" ? "Copiado!" : "Copiar mensagem"}
          </button>
        </div>
        <textarea id="corpo" className="campo text-[14px] leading-relaxed" rows={20} value={corpo} onChange={(e) => setCorpo(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="botao-secundario" onClick={() => copiar("tudo", `${assunto}\n\n${corpo}`)}>
          {copiado === "tudo" ? "Copiado!" : "Copiar assunto e mensagem"}
        </button>
        <a href={mailto} className="botao-secundario">
          Abrir no meu e-mail
        </a>
      </div>
      <p className="text-xs text-slate-500">
        &quot;Abrir no meu e-mail&quot; abre o programa de e-mail do aparelho já com destinatário, assunto e texto. No Gmail
        pelo navegador, use os botões de copiar.
      </p>
    </section>
  );
}
