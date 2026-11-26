import type { Especialidade, TipoTelefone } from "@/generated/prisma/enums";
import { PALAVRAS_DESCARTE, TIPOS_GOOGLE_DESCARTE } from "./config";
import { chave } from "./normalizar";

export type DadosPontuacao = {
  nome: string;
  tipo: Especialidade;
  nota: number | null;
  avaliacoes: number | null;
  tipoTelefone: TipoTelefone | null;
  temWhatsapp: boolean | null;
  site?: string | null;
  instagram?: string | null;
  tiposGoogle?: string[];
  fechadaNoGoogle?: boolean;
};

export type Resultado = { pontuacao: number; faixa: "A" | "B" | "C"; motivos: string[]; descartar: boolean };

/**
 * Quem abordar primeiro (0 a 100). Segue o critério do plano: nota 4+ com
 * 30 a 300 avaliações (tem volume e não é rede grande), WhatsApp para a
 * abordagem, e oftalmologia na frente por ter o ticket mais alto.
 */
export function pontuar(d: DadosPontuacao): Resultado {
  const motivos: string[] = [];
  let p = 0;
  const add = (pts: number, motivo: string) => {
    p += pts;
    motivos.push(`${pts >= 0 ? "+" : ""}${pts} ${motivo}`);
  };

  // perfil fora do alvo
  const nome = ` ${chave(d.nome)} `;
  const palavra = PALAVRAS_DESCARTE.find((w) => nome.includes(` ${chave(w)} `));
  const tipoRuim = d.tiposGoogle?.find((t) => TIPOS_GOOGLE_DESCARTE.includes(t));
  if (d.fechadaNoGoogle) return { pontuacao: 0, faixa: "C", motivos: ["fechada no Google"], descartar: true };
  if (palavra || tipoRuim) {
    return {
      pontuacao: 0,
      faixa: "C",
      motivos: [`fora do perfil (${palavra ?? tipoRuim})`],
      descartar: true,
    };
  }

  // avaliações: volume de pacientes sem ser rede grande
  const av = d.avaliacoes ?? 0;
  if (av >= 30 && av <= 300) add(30, `${av} avaliações (faixa ideal 30-300)`);
  else if (av > 300) add(12, `${av} avaliações (pode ser rede grande)`);
  else if (av >= 10) add(12, `${av} avaliações`);
  else add(3, `poucas avaliações (${av})`);

  // nota
  if (d.nota == null) add(5, "sem nota");
  else if (d.nota >= 4.5) add(20, `nota ${d.nota}`);
  else if (d.nota >= 4) add(15, `nota ${d.nota}`);
  else add(5, `nota ${d.nota} (abaixo de 4)`);

  // canal de abordagem
  if (d.temWhatsapp === true) add(25, "WhatsApp confirmado");
  else if (d.temWhatsapp === false) add(d.tipoTelefone ? 5 : 0, "sem WhatsApp: ligar ou visitar");
  else if (d.tipoTelefone === "CELULAR") add(18, "celular (provável WhatsApp)");
  else if (d.tipoTelefone === "FIXO") add(8, "telefone fixo: confirmar WhatsApp");
  else add(0, "sem telefone");

  // tipo de clínica
  if (d.tipo === "OFTALMOLOGIA") add(15, "oftalmologia (ticket alto)");
  else if (d.tipo === "ODONTOLOGIA" || d.tipo === "MEDICINA") add(10, d.tipo === "ODONTOLOGIA" ? "odontologia" : "clínica médica");

  // presença digital: dá para pesquisar antes da abordagem
  if (d.site || d.instagram) add(5, "tem site ou Instagram");

  const pontuacao = Math.max(0, Math.min(100, p));
  const faixa = pontuacao >= 70 ? "A" : pontuacao >= 45 ? "B" : "C";
  return { pontuacao, faixa, motivos, descartar: false };
}
