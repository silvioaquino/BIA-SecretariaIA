import Link from "next/link";
import { connection } from "next/server";
import { META_WHATSAPP } from "@/lib/prospeccao/config";
import { montarFila, type ItemFila } from "@/lib/prospeccao/fila";
import { followUp, primeiraMensagem, roteiroLigacao, roteiroVisita } from "@/lib/prospeccao/mensagens";
import { CartaoProspect, type DadosCartao } from "./CartaoProspect";

const PORTE: Record<string, string> = { PEQUENA: "Pequena", MEDIA: "Média", GRANDE: "Grande" };

const ETAPA_NOME: Record<string, string> = { conversa: "em conversa", proposta: "proposta enviada", piloto: "piloto rodando" };

const ETAPAS_FUNIL = [
  ["novo", "Na fila"],
  ["abordado", "Abordadas"],
  ["respondeu", "Responderam"],
  ["conversa", "Em conversa"],
  ["proposta", "Proposta"],
  ["piloto", "Piloto"],
  ["cliente", "Clientes"],
] as const;

function cartao(p: ItemFila): DadosCartao {
  return {
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    cidade: p.cidade,
    bairro: p.bairro,
    endereco: p.endereco,
    telefone: p.telefone,
    mapsUrl: p.mapsUrl,
    site: p.site,
    email: p.email,
    nota: p.nota,
    avaliacoes: p.avaliacoes,
    faixa: p.faixa,
    pontuacao: p.pontuacao,
    motivos: p.motivos,
    observacoes: p.observacoes,
    tentativas: p.tentativas,
    porte: p.porteEstimado ? PORTE[p.porteEstimado] : null,
  };
}

/**
 * A fila do dia. `remetente` é o nome de quem está usando (vai na mensagem).
 * `alvoWhatsapp`: total de 1ªs mensagens do dia (sobe de 10 em 10 com o botão "carregar mais 10").
 */
export async function FilaDoDia({ remetente, alvoWhatsapp }: { remetente: string; alvoWhatsapp?: number }) {
  await connection(); // depende da hora atual: nunca pré-renderizar
  const f = await montarFila(undefined, alvoWhatsapp);
  // ainda há clínicas além das que estão na tela?
  const temMais = f.whatsappDisponiveis > f.whatsapp.length;
  const proximoAlvo = f.metas.whatsapp.feitos + f.whatsapp.length + META_WHATSAPP;
  const vazio = !f.indicacoes.length && !f.negociacao.length && !f.respostas.length && !f.whatsapp.length && !f.ligacoes.length && !f.visitas.length && !f.followUps.length;

  return (
    <div className="space-y-10">
      {/* metas + funil */}
      <section className="grid gap-3 sm:grid-cols-[auto_auto_1fr]">
        <Meta rotulo="WhatsApp hoje" feitos={f.metas.whatsapp.feitos} meta={f.metas.whatsapp.meta} />
        <Meta rotulo="Ligações hoje" feitos={f.metas.ligacoes.feitos} meta={f.metas.ligacoes.meta} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
          {ETAPAS_FUNIL.map(([k, r]) => (
            <span key={k}>
              <strong className="text-lg text-bia-escuro">{f.funil[k] ?? 0}</strong> <span className="text-slate-500">{r}</span>
            </span>
          ))}
        </div>
      </section>

      {vazio && (
        <p className="rounded-3xl bg-menta-clara p-6 text-center font-semibold">
          Fila de hoje concluída. Bom trabalho! 🎉
        </p>
      )}

      <Secao
        titulo="Responderam: responda primeiro"
        ajuda="Chegaram pelo WhatsApp comercial. Responda lá e marque aqui quando a conversa estiver andando."
        itens={f.respostas}
        render={(p) => {
          const ultima = f.respostas.find((r) => r.id === p.id)?.interacoes[0];
          const quando = ultima?.em.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Recife" });
          return (
            <CartaoProspect
              key={p.id}
              p={cartao(p)}
              modo="resposta"
              texto={ultima?.detalhe ?? "(resposta registrada à mão)"}
              rotuloTexto={quando ? `Mensagem de ${quando}` : "Resposta"}
            />
          );
        }}
      />
      <Secao
        titulo="Indicações"
        ajuda="Clínicas que vocês adicionaram à mão. Não contam na meta: aborde quando quiser."
        itens={f.indicacoes}
        render={(p) => {
          const temWhats = Boolean(p.telefone) && (p.temWhatsapp || (p.temWhatsapp == null && p.tipoTelefone === "CELULAR"));
          return temWhats ? (
            <CartaoProspect key={p.id} p={cartao(p)} modo="whatsapp" texto={primeiraMensagem(p, remetente)} rotuloTexto="Mensagem (pode editar antes de abrir)" />
          ) : (
            <CartaoProspect
              key={p.id}
              p={cartao(p)}
              modo="ligacao"
              texto={roteiroLigacao(p, remetente)}
              rotuloTexto={p.telefone ? "Roteiro da ligação (sem WhatsApp)" : "Sem telefone: aborde por e-mail ou visita"}
            />
          );
        }}
      />
      <Secao
        titulo="Em negociação"
        ajuda="Já conversando. Marque cada avanço: é o que mede o funil no relatório de sexta."
        itens={f.negociacao}
        render={(p) => (
          <CartaoProspect
            key={p.id}
            p={cartao(p)}
            modo="negociacao"
            texto={`Etapa atual: ${ETAPA_NOME[p.status] ?? p.status}`}
            rotuloTexto="Onde está"
          />
        )}
      />
      <Secao
        titulo="Follow-ups de hoje"
        ajuda="Quem não respondeu à primeira mensagem. 1º follow-up no 3º dia; no 2º (7º dia), anexe o vídeo da demo do tipo de clínica."
        itens={f.followUps}
        render={(p) => {
          const n = p.tentativas >= 2 ? 2 : 1;
          return <CartaoProspect key={p.id} p={cartao(p)} modo="follow_up" texto={followUp(n, p)} rotuloTexto={`Follow-up ${n} de 2`} />;
        }}
      />
      <Secao
        id="whatsapp"
        titulo="WhatsApp: primeira mensagem"
        ajuda="Ordem de prioridade. Abra, confira o texto e envie do número comercial, uma por vez."
        itens={f.whatsapp}
        render={(p) => <CartaoProspect key={p.id} p={cartao(p)} modo="whatsapp" texto={primeiraMensagem(p, remetente)} rotuloTexto="Mensagem (pode editar antes de abrir)" />}
      />
      {temMais && (
        <div id="mais-whatsapp" className="flex scroll-mt-6 flex-wrap items-center justify-between gap-3 rounded-2xl bg-menta-clara px-5 py-4">
          <p className="text-sm">
            {f.whatsapp.length
              ? "Mandou todas as de cima? Carregue mais para continuar."
              : `Meta de hoje feita: ${f.metas.whatsapp.feitos} mensagem(ns). Quer mandar mais?`}
            <span className="block text-xs text-slate-600">
              Ainda há {f.whatsappDisponiveis - f.whatsapp.length} clínica(s) com WhatsApp esperando a 1ª mensagem.
            </span>
          </p>
          <Link href={`?mais=${proximoAlvo}#whatsapp`} className="botao px-5 py-2">
            Carregar mais {META_WHATSAPP}
          </Link>
        </div>
      )}
      <Secao
        titulo="Ligações"
        ajuda="Telefone fixo ou sem WhatsApp. Melhor horário: 9h às 11h30 e 14h às 17h."
        itens={f.ligacoes}
        render={(p) => <CartaoProspect key={p.id} p={cartao(p)} modo="ligacao" texto={roteiroLigacao(p, remetente)} rotuloTexto="Roteiro da ligação" />}
      />
      <Secao
        titulo="Visitas · Rota 3"
        ajuda="Itapissuma e Itamaracá. Melhor horário da visita: 11h30 às 12h ou 17h30 às 18h. Enquanto não der para ir, quem tem WhatsApp ou e-mail já pode ser abordado pelo cartão."
        itens={f.visitas}
        render={(p) => (
          <CartaoProspect
            key={p.id}
            p={cartao(p)}
            modo="visita"
            texto={roteiroVisita(p, remetente)}
            rotuloTexto="Como abrir a conversa"
            // tem WhatsApp (conferido, ou celular ainda não conferido): já dá para mandar a 1ª mensagem
            mensagemWhats={p.temWhatsapp || (p.temWhatsapp == null && p.tipoTelefone === "CELULAR") ? primeiraMensagem(p, remetente) : undefined}
          />
        )}
      />
    </div>
  );
}

function Meta({ rotulo, feitos, meta }: { rotulo: string; feitos: number; meta: number }) {
  const pct = Math.min(100, Math.round((feitos / meta) * 100));
  return (
    <div className="min-w-40 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="etiqueta text-[10px] text-slate-500">{rotulo}</p>
      <p className="text-2xl font-bold">
        {feitos}
        <span className="text-base font-normal text-slate-400">/{meta}</span>
      </p>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-bia" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Secao({ id, titulo, ajuda, itens, render }: { id?: string; titulo: string; ajuda: string; itens: ItemFila[]; render: (p: ItemFila) => React.ReactNode }) {
  if (!itens.length) return null;
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3">
        <h2 className="text-xl font-bold">
          {titulo} <span className="text-base font-normal text-slate-400">({itens.length})</span>
        </h2>
        <p className="text-sm text-slate-500">{ajuda}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{itens.map(render)}</div>
    </section>
  );
}
