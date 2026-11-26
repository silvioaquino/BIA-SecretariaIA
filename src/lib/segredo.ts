import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Compara um segredo recebido com o esperado em tempo constante. */
export function segredoConfere(recebido: string | null | undefined, esperado: string | undefined) {
  if (!recebido || !esperado) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}
