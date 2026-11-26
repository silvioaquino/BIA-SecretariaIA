import { CIDADES } from "./config";
import type { Porte, TipoTelefone } from "@/generated/prisma/enums";

/** Minúsculas, sem acento e sem espaços repetidos (para comparar nomes). */
export function chave(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Telefone BR → { numero: 55+DDD+número, tipo } ou null. */
export function telefone(bruto: string | null | undefined): { numero: string; tipo: TipoTelefone } | null {
  if (!bruto) return null;
  let d = bruto.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1); // 081…
  if (d.length !== 10 && d.length !== 11) return null;
  // celular: 11 dígitos com 9 depois do DDD; fixo: 10 dígitos começando de 2 a 5
  const tipo: TipoTelefone = d.length === 11 && d[2] === "9" ? "CELULAR" : "FIXO";
  return { numero: `55${d}`, tipo };
}

/** Nome oficial da cidade-alvo, ou null se estiver fora da região. */
export function cidadeAlvo(texto: string | null | undefined): (typeof CIDADES)[number] | null {
  if (!texto) return null;
  const k = chave(texto);
  // "Itamaracá" aparece sem o "Ilha de" em alguns endereços
  if (k.includes("itamaraca")) return "Ilha de Itamaracá";
  for (const c of CIDADES) {
    const kc = chave(c);
    if (k === kc || new RegExp(`(^| )${kc}( |$)`).test(k)) return c;
  }
  return null;
}

/** Porte estimado pelo nº de avaliações no Google (só uma pista para a abordagem). */
export function porteEstimado(avaliacoes: number | null | undefined): Porte | null {
  if (avaliacoes == null) return null;
  if (avaliacoes < 60) return "PEQUENA";
  if (avaliacoes <= 200) return "MEDIA";
  return "GRANDE";
}

/** "3,9" → 3.9 */
export function numero(bruto: string | null | undefined) {
  if (!bruto) return null;
  const n = Number(bruto.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
