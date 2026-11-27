"use client";

import { useState } from "react";
import type { Especialidade } from "@/generated/prisma/enums";
import { emailAbordagem } from "@/lib/prospeccao/mensagens";

const TIPOS: [Especialidade, string][] = [
  ["ODONTOLOGIA", "Odontologia"],
  ["MEDICINA", "Clínica médica"],
  ["OFTALMOLOGIA", "Oftalmologia"],
  ["OUTRA", "Outra"],
];

export function EmailAbordagem({ remetente, site, cidades }: { remetente: string; site: string; cidades: string[] }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState(cidades[0] ?? "");
  const [tipo, setTipo] = useState<Especialidade>("ODONTOLOGIA");

  const pronto = emailAbordagem({ nome, cidade, tipo }, remetente, site);

  return (
    <div className="space-y-6">
      <section className="cartao grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Nome da clínica
          <input className="campo mt-1 font-normal" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Clínica Sorriso (opcional)" />
        </label>
        <label className="block text-sm font-semibold">
          E-mail da clínica
          <input className="campo mt-1 font-normal" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@clinica.com.br (opcional)" />
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
      </section>

      {/* trocou a clínica, a cidade ou o tipo: o texto é refeito (a key recria o editor) */}
      <Editor key={`${nome}|${cidade}|${tipo}`} email={email} inicial={pronto} />
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
          <button type="button" className="botao" onClick={() => copiar("tudo", `${assunto}\n\n${corpo}`)}>
            {copiado === "tudo" ? "Copiado!" : "Copiar assunto e mensagem"}
          </button>
          <a href={mailto} className="botao-secundario">
            Abrir no meu e-mail
          </a>
        </div>
        <p className="text-xs text-slate-500">
          &quot;Abrir no meu e-mail&quot; abre o programa de e-mail do aparelho já com destinatário, assunto e texto. No
          Gmail pelo navegador, use os botões de copiar.
        </p>
      </section>
  );
}
