// Respostas prontas para quem respondeu a abordagem. Base: semana-1/roteiros-de-abordagem.md
// (seções 5 e 6) e semana-1/oferta-piloto.md. Preços e garantia têm que bater com a oferta.
// Sem "server-only": o cartão da fila (client) monta os textos.

type Dados = { nome: string; porte?: string | null };

export type RespostaPronta = { id: string; titulo: string; texto: (p: Dados) => string };

const SITE = "https://biasecretariaia.vercel.app";

const clinica = (nome: string) => nome.split(/ [-–|] /)[0].trim();

/** Preço do piloto pelo porte estimado; sem porte, fala "a partir de". */
function precoPiloto(porte?: string | null) {
  if (porte === "Média") return "R$ 397 (clínicas com 3 a 5 profissionais)";
  if (porte === "Grande") return "R$ 697 (clínicas com 6 ou mais profissionais)";
  return "a partir de R$ 197 (clínicas com 1 ou 2 profissionais)";
}

export const RESPOSTAS_PRONTAS: RespostaPronta[] = [
  {
    id: "interesse",
    titulo: "Tem interesse / quer saber mais",
    texto: () =>
      [
        "Que bom! 😊",
        "Funciona assim: um dia antes, a BIA manda a confirmação para cada paciente pelo WhatsApp da clínica. Quem precisa remarcar avisa ali mesmo, e a recepção recebe um alerta na hora para encaixar outro paciente. Toda semana vocês recebem um relatório com as faltas evitadas.",
        "Não precisa instalar nada: eu configuro tudo em 1 dia.",
        "Posso te mostrar funcionando em 10 minutos? Pode ser por vídeo ou passo aí na clínica. Qual dia e horário ficam melhor?",
      ].join("\n\n"),
  },
  {
    id: "custo",
    titulo: "Pergunta se tem custo / quanto custa",
    texto: (p) =>
      [
        "Vou ser bem transparente com você:",
        `o teste de 30 dias tem um valor pequeno, ${precoPiloto(p.porte)}, pago no início.`,
        "E tem garantia: nos primeiros 7 dias, se não gostar por qualquer motivo, eu devolvo o valor inteiro.",
        "Com 30 dias, a gente senta junto e compara as faltas de antes e de depois da BIA, para você decidir se continua.",
        "Para comparar: normalmente 1 ou 2 faltas evitadas já pagam o mês.",
        "Antes de qualquer decisão, posso te mostrar como funciona em 10 minutos, sem compromisso. Quer marcar?",
      ].join("\n\n"),
  },
  {
    id: "portfolio",
    titulo: "Pediu portfólio ou vídeo de demonstração",
    texto: () =>
      [
        "Ótima pergunta! 😊",
        "Estamos começando aqui na região, por isso estou fazendo o teste de 30 dias com só 3 clínicas: para vocês verem o resultado na própria agenda antes de decidir qualquer coisa.",
        "Mas dá para ver funcionando agora mesmo:",
        `1. No site tem a demonstração de como fica a conversa com o paciente: ${SITE}`,
        "2. Melhor ainda: me passa um WhatsApp pessoal seu (ou da recepcionista) que eu mando uma confirmação de teste, igual à que o paciente recebe. Você responde e vê na hora o que acontece.",
        "Se preferir, mostro tudo em 10 minutos por chamada de vídeo ou passo aí na clínica.",
      ].join("\n\n"),
  },
  {
    id: "teste_enviado",
    titulo: "Mandei a confirmação de teste",
    texto: () =>
      [
        "Prontinho! Acabei de mandar a confirmação de teste para o número que você me passou. 📲",
        "Responda 1 para confirmar ou 2 para remarcar e veja o que acontece. Quando o paciente escolhe remarcar, a recepção recebe um alerta na hora.",
        "Na clínica de vocês, a mensagem sai do WhatsApp da própria clínica, com o nome e o jeito de falar de vocês.",
        "Depois me conta o que achou!",
      ].join("\n\n"),
  },
  {
    id: "sem_convenio",
    titulo: "Não trabalha com convênio",
    texto: () =>
      [
        "Sem problema nenhum! A BIA não depende de convênio: ela funciona igual para atendimento particular.",
        "E no particular cada falta pesa ainda mais, porque é o valor inteiro da consulta que deixa de entrar.",
        "Hoje, mais ou menos quantos pacientes faltam sem avisar por semana aí?",
      ].join("\n\n"),
  },
  {
    id: "sem_convenio_custo",
    titulo: "Sem convênio + só se não tiver custo",
    texto: (p) =>
      [
        "Que bom que gostou! E não ter convênio não é problema: a BIA funciona para atendimento particular, onde cada falta pesa ainda mais no caixa.",
        `Sobre custo, sendo transparente: o teste de 30 dias tem um valor pequeno, ${precoPiloto(p.porte)}, pago no início. Nos primeiros 7 dias, se não gostar, eu devolvo o valor inteiro. E com 30 dias a gente compara as faltas de antes e de depois para você decidir se continua.`,
        "Antes de qualquer decisão, posso te mostrar como funciona em 10 minutos, sem compromisso nenhum. Pode ser por vídeo ou passo aí. Qual fica melhor pra você?",
      ].join("\n\n"),
  },
  {
    id: "descoberta",
    titulo: "Perguntas para entender a clínica",
    texto: () =>
      [
        "Para eu te mostrar como ficaria aí, me tira 3 dúvidas rápidas:",
        "1. Mais ou menos quantos pacientes faltam sem avisar por semana?",
        "2. Hoje quem faz a confirmação e como (ligação, mensagem)?",
        "3. Quantos profissionais atendem na clínica?",
      ].join("\n\n"),
  },
  {
    id: "ja_confirma",
    titulo: "\"A gente já confirma\"",
    texto: () =>
      [
        "Ótimo, então vocês já sabem que confirmar funciona!",
        "A diferença é que a BIA faz isso sozinha, todo dia, sem esquecer ninguém, e libera a recepção para atender quem está na clínica. Quem não pode ir já avisa pelo WhatsApp e a recepção recebe o alerta na hora.",
        "Quanto tempo por dia a recepção gasta confirmando hoje?",
      ].join("\n\n"),
  },
  {
    id: "sistema_confirma",
    titulo: "\"Nosso sistema já manda confirmação\"",
    texto: () =>
      [
        "Que bom! E vocês usam? Mesmo com ela, quantos pacientes ainda faltam por semana?",
        "Pergunto porque na BIA, além de confirmar, quem responde que não pode ir já gera um alerta para a recepção encaixar outro paciente, e toda semana vocês recebem quanto foi recuperado em reais. E eu configuro tudo, sem ninguém precisar mexer no sistema.",
      ].join("\n\n"),
  },
  {
    id: "robo",
    titulo: "\"Paciente não gosta de robô\"",
    texto: () =>
      [
        "Concordo com você.",
        "Por isso a mensagem sai do WhatsApp da própria clínica, com o nome de vocês e um texto escrito do jeito que vocês falam. E qualquer coisa fora do padrão vai direto para a recepção.",
      ].join("\n\n"),
  },
  {
    id: "idosos",
    titulo: "\"Meus pacientes são mais velhos\"",
    texto: () =>
      [
        "Muitos usam WhatsApp, ou um filho usa por eles.",
        "E quem não responder em algumas horas aparece numa lista para a recepção ligar. Ela liga só para quem precisa, não para todo mundo.",
      ].join("\n\n"),
  },
  {
    id: "lgpd",
    titulo: "Dados dos pacientes / LGPD",
    texto: () =>
      [
        "Boa pergunta!",
        "A BIA usa só nome, telefone e horário da consulta. Nada de prontuário, exame ou diagnóstico: a mensagem diz só \"sua consulta\".",
        "Isso fica no contrato, com a clínica como dona dos dados.",
      ].join("\n\n"),
  },
  {
    id: "falar_responsavel",
    titulo: "Vai passar para o(a) doutor(a) / responsável",
    texto: () =>
      [
        "Perfeito, obrigado!",
        "Consegue me dizer o melhor dia e horário para eu falar 10 minutinhos com ele(a)? Pode ser por ligação, vídeo ou passo aí.",
        "A ideia é tirar da recepção essa parte chata de ficar ligando para confirmar.",
      ].join("\n\n"),
  },
  {
    id: "vou_pensar",
    titulo: "\"Vou pensar\"",
    texto: () =>
      [
        "Claro, sem pressa!",
        "Só para eu entender: o que precisaria acontecer para fazer sentido testar?",
        "Estou acompanhando só 3 clínicas por vez, porque acompanho o resultado de uma por uma.",
      ].join("\n\n"),
  },
  {
    id: "marcar",
    titulo: "Marcar a demonstração",
    texto: () =>
      [
        "Combinado!",
        "Tenho horário amanhã às 10h ou às 15h. Algum desses fica bom? Se preferir outro, me diz que eu me ajusto.",
      ].join("\n\n"),
  },
  {
    id: "saudacao",
    titulo: "Responderam com saudação ou mensagem automática",
    texto: (p) =>
      [
        `Oi, pessoal da ${clinica(p.nome)}! 😊`,
        "Quando puderem, me falem: hoje vocês confirmam as consultas um dia antes? E quantos pacientes ainda faltam sem avisar por semana?",
      ].join("\n\n"),
  },
  {
    id: "sem_interesse",
    titulo: "Não tem interesse (encerrar com educação)",
    texto: () =>
      [
        "Tudo bem, obrigado pela atenção! 🙏",
        "Se um dia as faltas virarem um problema, é só me chamar por aqui. Bom trabalho para vocês!",
      ].join("\n\n"),
  },
];
