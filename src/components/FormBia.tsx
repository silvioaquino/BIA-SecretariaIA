"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { salvarOnboarding } from "@/app/onboarding/actions";
import { DIAS } from "@/lib/validacao";
import { PORTES, PRODUTOS, brl } from "@/lib/planos";
import type { Horario, PorteId, Prof, Proc, ProdutoId, ValoresFormBia } from "@/lib/formTipos";

const ETAPAS = ["Clínica", "Atendimento", "Equipe e serviços", "Regras da Bia"];

export function FormBia({
  inicial,
  travado = false,
  edicao = false,
}: {
  inicial: ValoresFormBia;
  travado?: boolean;
  edicao?: boolean;
}) {
  const [estado, enviar, pendente] = useActionState(salvarOnboarding, undefined);
  const [etapa, setEtapa] = useState(0);
  const [horarios, setHorarios] = useState(inicial.horarios);
  const [profs, setProfs] = useState<Prof[]>(
    inicial.profissionais.length ? inicial.profissionais : [{ nome: "" }],
  );
  const [procs, setProcs] = useState<Proc[]>(
    inicial.procedimentos.length ? inicial.procedimentos : [{ nome: "" }],
  );
  const [modoAgenda, setModoAgenda] = useState(inicial.modoAgenda);
  const [fonteAgenda, setFonteAgenda] = useState(inicial.fonteAgenda);
  const [produto, setProduto] = useState<ProdutoId>(inicial.produto);
  const [porte, setPorte] = useState<PorteId>(inicial.porte);
  const usaGoogle = fonteAgenda === "GOOGLE" || (produto === "COMPLETA" && modoAgenda === "DIRETO");
  const refs = useRef<(HTMLFieldSetElement | null)[]>([]);

  // valida só os campos da etapa visível (as outras ficam ocultas no DOM)
  function etapaValida(i: number) {
    const campos = refs.current[i]?.querySelectorAll<HTMLInputElement>("input,select,textarea");
    for (const c of campos ?? []) if (!c.reportValidity()) return false;
    return true;
  }

  function avancar() {
    if (etapaValida(etapa)) setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1));
  }

  const ultima = etapa === ETAPAS.length - 1;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        // envio manual: com action={...} o React limpa o formulário mesmo quando dá erro
        e.preventDefault();
        if (!ultima) return avancar();
        if (!etapaValida(etapa)) return;
        const dados = new FormData(e.currentTarget);
        startTransition(() => enviar(dados));
      }}
      className="space-y-6"
    >
      <ol className="flex flex-wrap gap-2 text-xs">
        {ETAPAS.map((nome, i) => (
          <li key={nome}>
            <button
              type="button"
              onClick={() => (i < etapa || edicao) && setEtapa(i)}
              className={`rounded-full px-3 py-1 font-semibold ${
                i === etapa ? "bg-bia text-white" : i < etapa ? "bg-menta-clara text-bia-escuro" : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}. {nome}
            </button>
          </li>
        ))}
      </ol>

      {/* 1. Clínica */}
      <fieldset ref={(el) => { refs.current[0] = el; }} hidden={etapa !== 0} className="space-y-4">
        <Grade>
          <Campo nome="nome" rotulo="Nome da clínica" valor={inicial.nome} obrigatorio />
          <Campo
            nome="cpfCnpj"
            rotulo="CNPJ (ou CPF do responsável)"
            valor={inicial.cpfCnpj}
            obrigatorio
            somenteLeitura={travado}
            ajuda="Usado para emitir a cobrança no Asaas."
          />
          <Campo nome="email" rotulo="E-mail para cobrança" tipo="email" valor={inicial.email} obrigatorio />
          <Campo nome="whatsapp" rotulo="WhatsApp do responsável" valor={inicial.whatsapp} obrigatorio ajuda="Com DDD. Ex.: (81) 99999-9999" />
          <Campo nome="cidade" rotulo="Cidade" valor={inicial.cidade} />
          <div>
            <label className="rotulo" htmlFor="especialidade">Tipo de clínica</label>
            <select id="especialidade" name="especialidade" defaultValue={inicial.especialidade} className="campo">
              <option value="ODONTOLOGIA">Odontológica</option>
              <option value="MEDICINA">Médica</option>
              <option value="OFTALMOLOGIA">Oftalmologia</option>
              <option value="OUTRA">Outra</option>
            </select>
          </div>
        </Grade>
        {travado ? (
          <>
            <input type="hidden" name="produto" value={produto} />
            <input type="hidden" name="porte" value={porte} />
            <p className="rounded-xl bg-gelo p-3 text-sm">
              Plano atual: <strong>{PRODUTOS[produto].nome} · {PORTES[porte].nome}</strong> ({brl(PRODUTOS[produto].precos[porte])}/mês).
              Para mudar de plano, use a página <a href="/painel/assinatura" className="font-semibold text-bia underline">Assinatura</a>.
            </p>
          </>
        ) : (
          <>
            <div>
              <p className="rotulo">Qual Bia você quer?</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(PRODUTOS) as ProdutoId[]).map((id) => {
                  const p = PRODUTOS[id];
                  return (
                    <label key={id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-300 p-4 has-checked:border-bia has-checked:bg-menta-clara">
                      <input type="radio" name="produto" value={id} checked={produto === id} onChange={() => setProduto(id)} className="mt-1 accent-bia" />
                      <span className="text-sm">
                        <span className="block font-bold">{p.nome}</span>
                        <span className="block text-slate-600">{p.resumo}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="rotulo">Tamanho da clínica</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(PORTES) as PorteId[]).map((id) => (
                  <label key={id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-300 p-3 has-checked:border-bia has-checked:bg-menta-clara">
                    <input type="radio" name="porte" value={id} checked={porte === id} onChange={() => setPorte(id)} className="mt-1 accent-bia" />
                    <span className="text-sm">
                      <span className="block font-semibold">{PORTES[id].nome} · {brl(PRODUTOS[produto].precos[id])}/mês</span>
                      <span className="text-slate-600">{PORTES[id].descricao}</span>
                    </span>
                  </label>
                ))}
              </div>
              {PRODUTOS[produto].implantacao > 0 && (
                <p className="ajuda">+ implantação única de {brl(PRODUTOS[produto].implantacao)}, cobrada junto com a 1ª mensalidade.</p>
              )}
            </div>
          </>
        )}
      </fieldset>

      {/* 2. Atendimento */}
      <fieldset ref={(el) => { refs.current[1] = el; }} hidden={etapa !== 1} className="space-y-4">
        <Grade>
          <Campo nome="nomeExibicao" rotulo="Como a Bia chama a clínica" valor={inicial.nomeExibicao} obrigatorio ajuda='Ex.: "Clínica Sorriso de Paulista"' />
          <Campo nome="telefoneRecepcao" rotulo="WhatsApp da recepção" valor={inicial.telefoneRecepcao} obrigatorio ajuda="Recebe o aviso quando o paciente pede para falar com alguém." />
        </Grade>
        <Campo nome="endereco" rotulo="Endereço completo" valor={inicial.endereco} obrigatorio />
        <Campo nome="linkMaps" rotulo="Link do Google Maps" tipo="url" valor={inicial.linkMaps} />

        <div>
          <p className="rotulo">Horário de atendimento</p>
          <div className="space-y-2">
            {DIAS.map(([k, nome]) => {
              const h = horarios[k];
              const set = (p: Partial<Horario>) => setHorarios({ ...horarios, [k]: { ...h, ...p } });
              return (
                <div key={k} className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex w-28 items-center gap-2">
                    <input type="checkbox" checked={h.aberto} onChange={(e) => set({ aberto: e.target.checked })} className="accent-bia" />
                    {nome}
                  </label>
                  {h.aberto ? (
                    <>
                      <input type="time" value={h.inicio} onChange={(e) => set({ inicio: e.target.value })} className="campo w-32" aria-label={`${nome} abre`} />
                      <span>às</span>
                      <input type="time" value={h.fim} onChange={(e) => set({ fim: e.target.value })} className="campo w-32" aria-label={`${nome} fecha`} />
                    </>
                  ) : (
                    <span className="text-slate-400">Fechado</span>
                  )}
                </div>
              );
            })}
          </div>
          <input type="hidden" name="horarios" value={JSON.stringify(horarios)} />
        </div>

        <Escolha
          rotulo="De onde a Bia pega as consultas para confirmar"
          nome="fonteAgenda"
          valor={fonteAgenda}
          onChange={setFonteAgenda}
          opcoes={[
            ["PLANILHA", "Planilha do dia seguinte", "A recepção cola a agenda numa planilha Google até as 17h. Leva uns 5 minutos e funciona com qualquer sistema."],
            ["GOOGLE", "Google Agenda", "A Bia lê direto o Google Agenda de cada profissional."],
          ]}
        />

        {produto === "COMPLETA" ? (
          <Escolha
            rotulo="Como a Bia marca consultas novas"
            nome="modoAgenda"
            valor={modoAgenda}
            onChange={setModoAgenda}
            opcoes={[
              ["PRE", "Pré-agendamento", "A Bia coleta nome, motivo e preferência de dia e turno, e a recepção marca no sistema da clínica."],
              ["DIRETO", "Agenda direta (Google Agenda)", "A Bia marca, remarca e cancela direto no Google Agenda de cada profissional."],
            ]}
          />
        ) : (
          <input type="hidden" name="modoAgenda" value={modoAgenda} />
        )}
      </fieldset>

      {/* 3. Equipe e serviços */}
      <fieldset ref={(el) => { refs.current[2] = el; }} hidden={etapa !== 2} className="space-y-6">
        <div>
          <p className="rotulo">Profissionais</p>
          <div className="space-y-3">
            {profs.map((p, i) => {
              const set = (c: Partial<Prof>) => setProfs(profs.map((x, j) => (j === i ? { ...x, ...c } : x)));
              return (
                <div key={i} className="grid gap-2 rounded-xl bg-gelo p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input className="campo" placeholder="Nome (ex.: Dra. Ana Lima)" value={p.nome} onChange={(e) => set({ nome: e.target.value })} required={i === 0} />
                  <input className="campo" placeholder="Especialidade" value={p.especialidade ?? ""} onChange={(e) => set({ especialidade: e.target.value })} />
                  <input className="campo" placeholder="Quando atende (ex.: seg e qua, tarde)" value={p.atendimento ?? ""} onChange={(e) => set({ atendimento: e.target.value })} />
                  <Remover onClick={() => setProfs(profs.filter((_, j) => j !== i))} desativado={profs.length === 1} />
                  {usaGoogle && (
                    <input className="campo sm:col-span-3" placeholder="ID do Google Agenda (ex.: ana@clinica.com.br)" value={p.idAgenda ?? ""} onChange={(e) => set({ idAgenda: e.target.value })} />
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setProfs([...profs, { nome: "" }])} className="mt-2 text-sm font-semibold text-bia">
            + Adicionar profissional
          </button>
          <input type="hidden" name="profissionais" value={JSON.stringify(profs)} />
        </div>

        <div>
          <p className="rotulo">Procedimentos e consultas</p>
          <p className="ajuda mb-2">Deixe o valor vazio para a Bia dizer que o valor é informado na avaliação.</p>
          <div className="space-y-3">
            {procs.map((p, i) => {
              const set = (c: Partial<Proc>) => setProcs(procs.map((x, j) => (j === i ? { ...x, ...c } : x)));
              return (
                <div key={i} className="grid gap-2 rounded-xl bg-gelo p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <input className="campo" placeholder="Nome (ex.: Limpeza)" value={p.nome} onChange={(e) => set({ nome: e.target.value })} />
                  <input className="campo" placeholder="Valor R$" inputMode="decimal" value={p.valor ?? ""} onChange={(e) => set({ valor: e.target.value })} />
                  <input className="campo" placeholder="Duração (min)" inputMode="numeric" value={p.duracaoMin ?? ""} onChange={(e) => set({ duracaoMin: e.target.value })} />
                  <Remover onClick={() => setProcs(procs.filter((_, j) => j !== i))} desativado={procs.length === 1} />
                  <input className="campo sm:col-span-2" placeholder="Descrição curta" value={p.descricao ?? ""} onChange={(e) => set({ descricao: e.target.value })} />
                  <input className="campo sm:col-span-1" placeholder="Preparo (jejum, acompanhante…)" value={p.orientacoes ?? ""} onChange={(e) => set({ orientacoes: e.target.value })} />
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setProcs([...procs, { nome: "" }])} className="mt-2 text-sm font-semibold text-bia">
            + Adicionar procedimento
          </button>
          <input type="hidden" name="procedimentos" value={JSON.stringify(procs)} />
        </div>
      </fieldset>

      {/* 4. Regras */}
      <fieldset ref={(el) => { refs.current[3] = el; }} hidden={etapa !== 3} className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="aceitaParticular" defaultChecked={inicial.aceitaParticular} className="accent-bia" />
          Atende particular
        </label>
        <Texto nome="convenios" rotulo="Convênios aceitos" valor={inicial.convenios} ajuda="Separe por vírgula. Ex.: Hapvida, Amil, Unimed" />
        <Texto nome="formasPagamento" rotulo="Formas de pagamento" valor={inicial.formasPagamento} ajuda="Ex.: Pix, cartão em até 3x, dinheiro" />
        <Texto nome="orientacoesGerais" rotulo="Orientações gerais" valor={inicial.orientacoesGerais} ajuda="Estacionamento, acessibilidade, chegar 15 min antes…" />
        <Texto nome="mensagemBoasVindas" rotulo="Mensagem de boas-vindas (opcional)" valor={inicial.mensagemBoasVindas} ajuda="Se vazio, a Bia usa a apresentação padrão." />
        <Texto nome="informacoesExtras" rotulo="Outras informações que a Bia deve saber" valor={inicial.informacoesExtras} ajuda="Perguntas frequentes, regras de remarcação, política de atraso…" linhas={5} />

        <div className="rounded-xl bg-gelo p-4 text-sm text-slate-700">
          A Bia se apresenta como <strong>assistente virtual</strong>, não dá diagnóstico e, em caso de urgência,
          orienta procurar o pronto atendimento e chama a recepção.
        </div>

        {!edicao && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="aceiteTermos" required className="mt-1 accent-bia" />
            <span>
              Li e aceito os <a href="/termos" target="_blank" className="font-semibold text-bia underline">termos de uso</a> e a{" "}
              <a href="/privacidade" target="_blank" className="font-semibold text-bia underline">política de privacidade</a>, inclusive o
              tratamento dos dados dos pacientes conforme a LGPD.
            </span>
          </label>
        )}
        {edicao && <input type="hidden" name="aceiteTermos" value="on" />}
      </fieldset>

      {estado?.erro && <p className="rounded-xl bg-orange-50 p-3 text-sm text-coral">{estado.erro}</p>}

      <div className="flex justify-between gap-3">
        <button type="button" onClick={() => setEtapa(etapa - 1)} className="botao-secundario" hidden={etapa === 0}>
          Voltar
        </button>
        <span />
        {ultima ? (
          <button type="submit" disabled={pendente} className="botao">
            {pendente ? "Salvando…" : edicao ? "Salvar alterações" : "Salvar e escolher pagamento"}
          </button>
        ) : (
          <button type="button" onClick={avancar} className="botao">
            Próximo
          </button>
        )}
      </div>
    </form>
  );
}

function Escolha<T extends string>({
  rotulo, nome, valor, onChange, opcoes,
}: {
  rotulo: string; nome: string; valor: T; onChange: (v: T) => void; opcoes: [T, string, string][];
}) {
  return (
    <div>
      <p className="rotulo">{rotulo}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {opcoes.map(([v, t, d]) => (
          <label key={v} className="flex cursor-pointer gap-2 rounded-xl border border-slate-300 p-3 has-checked:border-bia has-checked:bg-menta-clara">
            <input type="radio" name={nome} value={v} checked={valor === v} onChange={() => onChange(v)} className="mt-1 accent-bia" />
            <span className="text-sm">
              <span className="block font-semibold">{t}</span>
              <span className="text-slate-600">{d}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Grade({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Campo({
  nome, rotulo, valor, tipo = "text", obrigatorio, ajuda, somenteLeitura,
}: {
  nome: string; rotulo: string; valor: string; tipo?: string; obrigatorio?: boolean; ajuda?: string; somenteLeitura?: boolean;
}) {
  return (
    <div>
      <label htmlFor={nome} className="rotulo">{rotulo}</label>
      <input id={nome} name={nome} type={tipo} defaultValue={valor} required={obrigatorio} readOnly={somenteLeitura} className={`campo ${somenteLeitura ? "bg-slate-100" : ""}`} />
      {ajuda && <p className="ajuda">{ajuda}</p>}
    </div>
  );
}

function Texto({ nome, rotulo, valor, ajuda, linhas = 2 }: { nome: string; rotulo: string; valor: string; ajuda?: string; linhas?: number }) {
  return (
    <div>
      <label htmlFor={nome} className="rotulo">{rotulo}</label>
      <textarea id={nome} name={nome} defaultValue={valor} rows={linhas} className="campo" />
      {ajuda && <p className="ajuda">{ajuda}</p>}
    </div>
  );
}

function Remover({ onClick, desativado }: { onClick: () => void; desativado: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={desativado} className="px-2 text-sm text-slate-400 hover:text-coral disabled:opacity-30" aria-label="Remover">
      ✕
    </button>
  );
}
