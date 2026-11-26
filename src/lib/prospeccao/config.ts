import type { Especialidade } from "@/generated/prisma/enums";

// Região do PLANO-DE-EXECUCAO.md (Litoral Norte e RMR Norte).
export const CIDADES = [
  "Olinda",
  "Paulista",
  "Abreu e Lima",
  "Igarassu",
  "Itapissuma",
  "Ilha de Itamaracá",
] as const;

// Fila do dia (PLANO-DE-EXECUCAO.md, semana 2: "10 abordagens novas + ligações + visitas").
export const META_WHATSAPP = 10;
export const META_LIGACOES = 5;
// Rota 3: poucas clínicas e todo mundo se conhece, então vai direto na visita (roteiro, seção 1).
export const CIDADES_VISITA = ["Itapissuma", "Ilha de Itamaracá"];
// Roteiro, seção 7: follow-up 3 dias depois, outro aos 7 dias, depois encerra.
export const DIAS_FOLLOW_UP = [3, 4, 4]; // 1ª msg → +3 → FU1 → +4 → FU2 → +4 → encerra

// Buscas por tipo de clínica. Cada uma roda em cada cidade ("<termo> <cidade> PE").
// Custo: até 3 páginas por busca = 3 chamadas à Places API.
export const BUSCAS: { tipo: Especialidade; termos: string[] }[] = [
  { tipo: "ODONTOLOGIA", termos: ["dentista", "clínica odontológica"] },
  { tipo: "MEDICINA", termos: ["clínica médica", "consultório médico", "clínica popular"] },
  { tipo: "OFTALMOLOGIA", termos: ["oftalmologista", "clínica de olhos"] },
];

// Fora do perfil: hospital, rede pública, laboratório, farmácia…
export const PALAVRAS_DESCARTE = [
  "hospital",
  "upa ",
  "unidade de saúde",
  "usf",
  "posto de saúde",
  "prefeitura",
  "secretaria",
  "sus",
  "policlínica municipal",
  "laboratório",
  "farmácia",
  "drogaria",
  "ótica",
  "otica",
  // unidades próprias de plano de saúde: o atendimento é do plano, não compram de terceiros
  "hapvida",
  "unimed",
  "sesi",
  "sesc",
];

// Só tipos que o Google acerta. "store" e "hospital" vêm errados em clínicas
// de verdade (ex.: consultório odontológico marcado como "store"), então não
// descartam: o nome decide (veja PALAVRAS_DESCARTE).
export const TIPOS_GOOGLE_DESCARTE = ["pharmacy", "drugstore", "local_government_office"];
