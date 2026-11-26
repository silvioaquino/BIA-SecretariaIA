import type { Especialidade } from "@/generated/prisma/enums";

// Textos de semana-1/roteiros-de-abordagem.md. Se o roteiro mudar, mude aqui também.

type Dados = { nome: string; cidade: string; tipo: Especialidade };

// "Frase extra por tipo" do roteiro (seção 2)
const EXTRA: Partial<Record<Especialidade, string>> = {
  ODONTOLOGIA: "Funciona também para lembrar o paciente da revisão de 6 meses.",
  MEDICINA: "Ele já lembra o paciente de trazer a carteirinha do convênio e a guia, o que evita consulta perdida na recepção.",
  OFTALMOLOGIA: "Nos exames com dilatação, ele já avisa o paciente para vir acompanhado.",
};

/** Saudação pelo horário de Recife. */
export function saudacao(agora = new Date()) {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Recife" }).format(agora));
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

/** Nome curto da clínica para usar no texto ("Barros Odontologia", sem " - Paulista"…). */
export function nomeCurto(nome: string) {
  return nome.split(/ [-–|] /)[0].trim();
}

/** 1ª abordagem por WhatsApp (roteiro, seção 2, versão B + frase do tipo). */
export function primeiraMensagem(p: Dados, remetente: string, agora = new Date()) {
  const extra = EXTRA[p.tipo];
  return [
    `${saudacao(agora)}, tudo bem? Sou ${remetente}. Trabalho implantando a BIA-SecretariaIA em clínicas aqui de ${p.cidade}.`,
    "Uma pergunta rápida para quem cuida da agenda:",
    "Hoje vocês confirmam as consultas um dia antes?",
    "Quantos pacientes ainda faltam sem avisar por semana?",
    "Pergunto porque montei um sistema que faz essa confirmação sozinho pelo WhatsApp da clínica e também tem uma versão completa onde a BIA agenda, consulta, remarca, tira dúvidas 24h.",
    "Estou buscando 3 clínicas aqui da região para um teste de 30 dias.",
    ...(extra ? [extra] : []),
    "Vocês têm interesse?",
  ].join("\n\n");
}

/** Follow-ups (roteiro, seção 7): 3 dias e 7 dias depois. */
export function followUp(n: 1 | 2, p: Dados) {
  if (n === 1) {
    return `Oi, pessoal da ${nomeCurto(p.nome)}! Conseguiram ver minha mensagem sobre a confirmação automática? Se não for o momento, sem problema, é só me avisar 🙂`;
  }
  const exemplo: Partial<Record<Especialidade, string>> = {
    ODONTOLOGIA: "a confirmação e o lembrete da revisão de 6 meses",
    MEDICINA: "a confirmação com o lembrete da carteirinha e da guia",
    OFTALMOLOGIA: "a confirmação com o aviso de dilatação",
  };
  return `Oi! Passando só para deixar um vídeo de 1 minuto mostrando ${exemplo[p.tipo] ?? "a confirmação automática"} funcionando numa clínica como a de vocês. Se fizer sentido, me chama que eu explico em 10 minutos. Se não, sem problema!`;
}

/** Roteiro da ligação (seção 3). */
export function roteiroLigacao(p: Dados, remetente: string, agora = new Date()) {
  return [
    `${saudacao(agora)}, aqui é ${remetente}. Trabalho com clínicas aqui de ${p.cidade}. É rapidinho: com quem eu falo sobre a agenda de pacientes?`,
    "(com a pessoa certa) Hoje vocês têm muito paciente faltando sem avisar? Quantos mais ou menos por semana? E como é feita a confirmação hoje?",
    "Entendi. Eu tenho um sistema que confirma automaticamente pelo WhatsApp da clínica um dia antes e, se o paciente quiser remarcar, já avisa a recepção na hora. Estou fazendo um teste de 30 dias com 3 clínicas da região. Posso passar aí 10 minutos para mostrar no celular?",
  ].join("\n\n");
}

/** Abertura da visita (seção 4). */
export function roteiroVisita(p: Dados, remetente: string, agora = new Date()) {
  return `${saudacao(agora)}! Sou ${remetente}, trabalho com clínicas aqui de ${p.cidade}. Não vim vender plano nem convênio 😄. Vim mostrar uma coisa que ajuda a recepção com as faltas. O(a) Dr(a). ou o responsável tem 5 minutinhos hoje, ou prefere que eu volte em outro horário?`;
}

/** Link que abre o WhatsApp com o texto pronto (quem envia é a pessoa, à mão). */
export function linkWhatsapp(telefone: string, texto: string) {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
}
