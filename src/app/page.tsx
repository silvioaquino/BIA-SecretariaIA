import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Marca } from "@/components/Marca";
import { ChatDemo } from "@/components/landing/ChatDemo";
import { Calculadora } from "@/components/landing/Calculadora";
import { Precos, Check } from "@/components/landing/Precos";
import { Especialidades } from "@/components/landing/Especialidades";
import { CUSTO_RECEPCIONISTA, PRODUTOS, brl } from "@/lib/planos";

export const metadata: Metadata = {
  title: "Bia · Secretária IA | Menos faltas na sua clínica, pelo WhatsApp",
  description:
    "A Bia confirma as consultas no WhatsApp, avisa a recepção quando alguém remarca e atende seus pacientes 24h. Para clínicas odontológicas, médicas e de oftalmologia. A partir de R$ 197/mês, com 7 dias de garantia.",
  openGraph: {
    title: "Bia · Secretária IA para clínicas",
    description: "Paciente que confirma aparece. Confirmação automática no WhatsApp, a partir de R$ 197/mês.",
    images: ["/bia.png"],
    locale: "pt_BR",
    type: "website",
  },
};

const WHATSAPP_VENDAS = process.env.NEXT_PUBLIC_WHATSAPP_VENDAS; // ex.: 5581999999999

const CTA = "Quero a Bia na minha clínica";

export default function Landing() {
  return (
    <div className="flex-1 bg-white">
      {/* ───────── Cabeçalho fixo ───────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Marca />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#como-funciona" className="hover:text-bia">Como funciona</a>
            <a href="#calculadora" className="hover:text-bia">Calculadora</a>
            <a href="#precos" className="hover:text-bia">Preços</a>
            <a href="#duvidas" className="hover:text-bia">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/entrar" className="px-1 py-2 text-sm font-semibold text-slate-600 hover:text-bia">Entrar</Link>
            <a href="#precos" className="botao px-4 py-2">Começar</a>
          </div>
        </div>
      </header>

      {/* ───────── 1. Hero: resultado + prova visual ───────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-bia-claro via-bia to-bia-escuro text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-menta/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <p className="etiqueta inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-menta ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-menta" /> Secretária IA para clínicas
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Paciente que confirma, <span className="text-menta">aparece.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-menta-clara sm:text-xl">
              A Bia confirma cada consulta no WhatsApp da sua clínica, avisa a recepção na hora quando alguém precisa
              remarcar e devolve o horário vago para a agenda.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#precos" className="inline-flex justify-center rounded-xl bg-white px-7 py-4 text-base font-bold text-bia-escuro shadow-lg transition hover:bg-menta-clara">
                {CTA}
              </a>
              <a href="#calculadora" className="inline-flex justify-center rounded-xl px-7 py-4 text-base font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10">
                Quanto eu perco com faltas?
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-menta-clara">
              {["Pronta no mesmo dia", "Sem trocar seu sistema", "Sem fidelidade", "7 dias de garantia"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check claro /> {t}</li>
              ))}
            </ul>
          </div>
          <ChatDemo />
        </div>
      </section>

      {/* ───────── 2. Para quem é ───────── */}
      <section className="border-b border-slate-100 bg-gelo">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-sm font-semibold text-slate-600">
          <span className="etiqueta text-slate-400">Feita para</span>
          <span>🦷 Clínicas odontológicas</span>
          <span>🩺 Clínicas médicas e consultórios</span>
          <span>👁️ Oftalmologia</span>
        </div>
      </section>

      {/* ───────── 3. Problema ───────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="etiqueta text-coral">O problema</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Cada falta é uma cadeira vazia que você já pagou.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            O profissional está lá, a sala está pronta, a luz está acesa. Só o paciente que não veio, e
            ninguém ficou sabendo a tempo de chamar outro.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              icone: "📉",
              titulo: "Faltas que ninguém vê chegando",
              texto: "Estudos no Brasil registram de 9% a 38% de faltas em consultas agendadas. Quase sempre o paciente só esqueceu.",
            },
            {
              icone: "📞",
              titulo: "Recepção presa no telefone",
              texto: "Ligar e mandar mensagem para confirmar um por um toma horas do dia e ainda deixa gente sem resposta.",
            },
            {
              icone: "🌙",
              titulo: "Mensagens fora do horário",
              texto: "O paciente pergunta à noite ou no domingo. Quando a recepção responde, ele já marcou em outro lugar.",
            },
          ].map((c) => (
            <div key={c.titulo} className="rounded-3xl bg-gelo p-7">
              <span className="text-3xl" aria-hidden>{c.icone}</span>
              <h3 className="mt-4 text-lg font-bold">{c.titulo}</h3>
              <p className="mt-2 text-slate-600">{c.texto}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Taxas de absenteísmo variam por serviço e cidade. Faixa observada em estudos publicados no Brasil (SciELO, USP, Unesp).
        </p>
      </section>

      {/* ───────── 4. Calculadora ───────── */}
      <section id="calculadora" className="bg-gelo py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="etiqueta text-bia">Faça a conta</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Quanto as faltas custam para a sua clínica?</h2>
            <p className="mt-4 text-lg text-slate-600">Coloque os números da sua agenda. Leva 20 segundos.</p>
          </div>
          <div className="cartao">
            <Calculadora />
          </div>
        </div>
      </section>

      {/* ───────── 5. Como funciona ───────── */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="etiqueta text-bia">Como funciona</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Funcionando hoje, sem mudar a rotina da clínica</h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {[
            ["Conte sobre a sua clínica", "Preencha um formulário de 10 minutos com horários, profissionais, convênios e orientações. É assim que a Bia aprende o jeito da sua clínica."],
            ["Pague por Pix e conecte o WhatsApp", "A Bia é ativada assim que o pagamento cai, no número que seus pacientes já conhecem."],
            ["A Bia confirma, a recepção encaixa", "Na véspera, cada paciente recebe a confirmação. Quem não pode ir avisa, e a recepção é alertada na hora para chamar outro paciente."],
          ].map(([titulo, texto], i) => (
            <li key={titulo} className="relative rounded-3xl p-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bia text-xl font-bold text-white">{i + 1}</span>
              <h3 className="mt-5 text-xl font-bold">{titulo}</h3>
              <p className="mt-2 text-slate-600">{texto}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 grid gap-4 rounded-3xl bg-grafite p-8 text-white sm:grid-cols-3">
          {[
            ["Véspera, 10h", "Confirmação: “1 confirma · 2 remarca”"],
            ["Dia da consulta, 7h", "Lembrete com a orientação da clínica"],
            ["Toda semana", "Relatório para o dono: confirmados, faltas e valor recuperado"],
          ].map(([q, o]) => (
            <div key={q}>
              <p className="etiqueta text-menta">{q}</p>
              <p className="mt-1 font-semibold">{o}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 6. Especialidades ───────── */}
      <section className="bg-gelo py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 max-w-2xl">
            <p className="etiqueta text-bia">Do seu jeito</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Fala a língua da sua especialidade</h2>
          </div>
          <Especialidades />
        </div>
      </section>

      {/* ───────── 7. Preços ───────── */}
      <section id="precos" className="bg-gradient-to-b from-white to-gelo py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="etiqueta text-bia">Planos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Duas Bias. Escolha a que a sua clínica precisa.</h2>
            <p className="mt-4 text-lg text-slate-600">O preço acompanha o tamanho da clínica. Comece pelo Confirma e passe para a Completa quando quiser.</p>
          </div>
          <Precos />
        </div>
      </section>

      {/* ───────── 8. Comparação (ancoragem) ───────── */}
      <section className="mx-auto max-w-5xl px-5 py-20 lg:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="etiqueta text-bia">Compare</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Menos que um dia de faltas por mês</h2>
        </div>
        <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200">
          <table className="w-full text-left text-sm sm:text-base">
            <thead>
              <tr className="bg-gelo">
                <th className="p-4 sm:p-5" />
                <th className="p-4 font-semibold text-slate-500 sm:p-5">Mais uma pessoa na recepção</th>
                <th className="bg-bia p-4 font-bold text-white sm:p-5">Bia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["Custo por mês", `acima de ${brl(CUSTO_RECEPCIONISTA, false)} com encargos`, `a partir de ${brl(PRODUTOS.CONFIRMA.precos.PEQUENA, false)}`],
                ["Confirma todas as consultas", "Quando sobra tempo", "Todas, todo dia"],
                ["Responde à noite e no fim de semana", "Não", "Sim (Bia Completa)"],
                ["Férias, atestado e rotatividade", "Acontecem", "Não para"],
                ["Relatório de faltas e valor recuperado", "Planilha à mão", "Automático, toda semana"],
              ].map(([item, humano, bia]) => (
                <tr key={item}>
                  <td className="p-4 font-semibold sm:p-5">{item}</td>
                  <td className="p-4 text-slate-500 sm:p-5">{humano}</td>
                  <td className="bg-menta-clara/50 p-4 font-semibold text-bia-escuro sm:p-5">{bia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-center text-slate-600">
          A Bia não substitui a sua recepção: ela tira dela o trabalho repetitivo, para sobrar tempo de cuidar de quem está na clínica.
        </p>
      </section>

      {/* ───────── 9. Segurança ───────── */}
      <section className="bg-grafite py-20 text-white lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="etiqueta text-menta">Confiança</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Educada com o paciente. Cuidadosa com os dados.</h2>
            <p className="mt-4 text-lg text-white/70">
              Saúde não é lugar para improviso. A Bia segue regras claras, e a sua equipe tem sempre a última palavra.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              ["Se apresenta como assistente virtual", "Sem enganar o paciente."],
              ["Não dá diagnóstico", "Só usa as informações que a clínica cadastrou."],
              ["Urgência vai para gente", "Orienta procurar atendimento e chama a recepção."],
              ["A recepção assume quando quiser", "Respondeu à mão? A Bia sai da conversa."],
              ["Dados mínimos", "Guarda só o necessário para confirmar e atender."],
              ["LGPD", "Contrato com tratamento de dados de saúde."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="font-semibold text-menta">{t}</p>
                <p className="mt-1 text-sm text-white/70">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── 10. Garantia ───────── */}
      <section className="mx-auto max-w-4xl px-5 py-20 lg:py-28">
        <div className="flex flex-col items-center gap-8 rounded-3xl bg-menta-clara p-8 text-center sm:flex-row sm:p-12 sm:text-left">
          <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full bg-bia text-white shadow-lg ring-8 ring-white">
            <span className="text-4xl font-bold leading-none">7</span>
            <span className="etiqueta text-[10px] text-menta">dias</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">7 dias de garantia. Não gostou, devolvemos.</h2>
            <p className="mt-3 text-lg text-slate-700">
              Nos primeiros 7 dias, se não gostar por qualquer motivo, devolvemos 100% do valor pago. É só pedir.
            </p>
            <p className="mt-2 text-slate-600">
              E com 30 dias fazemos juntos a análise de resultado: comparamos as faltas de antes e de depois da Bia, e você
              decide se continua. Sem fidelidade e sem multa.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── 11. Dúvidas ───────── */}
      <section id="duvidas" className="bg-gelo py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-10 text-center">
            <p className="etiqueta text-bia">Dúvidas</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Preciso trocar o sistema da minha clínica?", "Não. A Bia lê a agenda do Google Agenda ou de uma planilha que a recepção preenche em 5 minutos no fim do dia. Funciona com qualquer sistema, e até com agenda de papel."],
              ["Os pacientes vão achar que é um robô?", "A Bia se apresenta como assistente virtual, mas fala de um jeito próximo e simples, com o nome da sua clínica e as suas orientações. Quem quiser falar com uma pessoa é passado para a recepção."],
              ["Ela usa o WhatsApp da clínica?", "Sim. As mensagens saem do número que seus pacientes já conhecem, e a recepção continua vendo e respondendo as conversas normalmente."],
              ["Qual a diferença entre o Confirma e a Completa?", "O Confirma cuida das confirmações, dos lembretes e dos avisos de remarcação. A Completa faz tudo isso e ainda atende o WhatsApp 24h: tira dúvidas, agenda, remarca, cuida da lista de espera e chama de volta pacientes sumidos."],
              ["Tem fidelidade ou multa para cancelar?", "Não. A assinatura é mensal e você cancela quando quiser."],
              ["Como funciona o pagamento?", "Por Pix, com o QR Code direto no painel (ou cartão e boleto na fatura). A Bia é ativada assim que o pagamento cai. Se uma mensalidade atrasar, você tem alguns dias de tolerância antes de a Bia ser pausada, e ela volta sozinha quando o pagamento é feito."],
              ["E os dados dos pacientes?", "A Bia guarda só o necessário para confirmar e atender, segue a LGPD e nunca usa os dados para outra finalidade. A clínica continua sendo a dona dos dados."],
              ["Quanto tempo leva para começar?", "O cadastro e a personalização levam uns 10 minutos. Com o pagamento confirmado e o WhatsApp conectado, a Bia começa a trabalhar."],
            ].map(([p, r]) => (
              <details key={p} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 open:ring-bia/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {p}
                  <span className="text-xl text-bia transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 12. CTA final ───────── */}
      <section className="bg-gradient-to-br from-bia-claro via-bia to-bia-escuro text-white">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center lg:py-24">
          <Image src="/bia.png" alt="" width={72} height={72} className="mx-auto rounded-full ring-4 ring-white/30" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">Amanhã tem consulta marcada. Vai todo mundo?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-menta-clara">
            Comece hoje. Em 10 minutos a Bia já sabe tudo sobre a sua clínica, e você tem 7 dias de garantia.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#precos" className="inline-flex justify-center rounded-xl bg-white px-8 py-4 font-bold text-bia-escuro shadow-lg transition hover:bg-menta-clara">
              {CTA}
            </a>
            {WHATSAPP_VENDAS && (
              <a
                href={`https://wa.me/${WHATSAPP_VENDAS}?text=${encodeURIComponent("Oi! Quero saber mais sobre a Bia para a minha clínica.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center rounded-xl px-8 py-4 font-semibold ring-1 ring-white/40 transition hover:bg-white/10"
              >
                Tirar dúvidas no WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-grafite pb-24 text-sm text-white/60 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <p>© 2026 Bia · Secretária IA · Feito em Pernambuco</p>
          <div className="flex gap-5">
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/entrar" className="hover:text-white">Área da clínica</Link>
          </div>
        </div>
      </footer>

      {/* CTA fixo no celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <a href="#precos" className="botao w-full py-3.5 text-base">{CTA}</a>
      </div>
    </div>
  );
}
