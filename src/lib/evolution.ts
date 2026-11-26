import "server-only";

// Evolution API v2: só CONSULTA se um número tem WhatsApp. Não envia nada.
//   POST {EVOLUTION_URL}/chat/whatsappNumbers/{EVOLUTION_INSTANCIA}
//   header apikey · body { numbers: ["5581999999999", …] }

export function evolutionConfigurada() {
  return Boolean(process.env.EVOLUTION_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCIA);
}

/** Mapa número → tem WhatsApp. Números que a Evolution não devolver ficam de fora. */
export async function temWhatsapp(numeros: string[]): Promise<Map<string, boolean>> {
  const r = new Map<string, boolean>();
  if (!evolutionConfigurada() || numeros.length === 0) return r;

  const base = process.env.EVOLUTION_URL!.replace(/\/$/, "");
  const instancia = encodeURIComponent(process.env.EVOLUTION_INSTANCIA!);

  const consultar = async (lote: string[]) => {
    const res = await fetch(`${base}/chat/whatsappNumbers/${instancia}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
      body: JSON.stringify({ numbers: lote }),
    });
    if (!res.ok) throw new Error(`Evolution ${res.status}`);
    const corpo = (await res.json()) as { exists?: boolean; number?: string; jid?: string }[];
    for (const item of corpo ?? []) {
      const num = (item.number ?? item.jid ?? "").replace(/\D/g, "");
      const original = lote.find((n) => mesmoNumero(n, num));
      if (original) r.set(original, Boolean(item.exists));
    }
  };
  const pausa = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

  // lotes pequenos e espaçados: consulta não é mensagem, mas não vale chamar atenção
  let falhas = 0;
  for (let i = 0; i < numeros.length; i += 20) {
    const lote = numeros.slice(i, i + 20);
    try {
      await consultar(lote);
    } catch {
      // a Evolution recusa o lote inteiro por causa de um número ruim (ou falha passageira):
      // tenta um por um e pula só o que der erro
      for (const n of lote) {
        try {
          await consultar([n]);
        } catch {
          falhas++;
        }
        await pausa(300);
      }
    }
    if (i + 20 < numeros.length) await pausa(1500);
  }
  if (falhas === numeros.length) throw new Error("Evolution recusou todas as consultas");
  return r;
}

/**
 * Avisa a equipe (ALERTA_WHATSAPP: números de vocês dois, separados por vírgula).
 * Nunca manda para clínica: só para os números da lista. Falha de envio não derruba quem chamou.
 */
export async function avisarEquipe(texto: string) {
  const numeros = (process.env.ALERTA_WHATSAPP ?? "").split(",").map((n) => n.replace(/\D/g, "")).filter(Boolean);
  if (!evolutionConfigurada() || numeros.length === 0) return { enviados: 0, motivo: "avisos não configurados" };

  const base = process.env.EVOLUTION_URL!.replace(/\/$/, "");
  const instancia = encodeURIComponent(process.env.EVOLUTION_INSTANCIA!);
  let enviados = 0;
  for (const number of numeros) {
    try {
      const res = await fetch(`${base}/message/sendText/${instancia}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({ number, text: texto }),
      });
      if (res.ok) enviados++;
      else console.error("aviso WhatsApp", number, res.status);
    } catch (e) {
      console.error("aviso WhatsApp", number, e);
    }
  }
  return { enviados };
}

/** Variações do mesmo celular (com e sem o 9 depois do DDD). */
export function variacoesNumero(n: string) {
  const d = n.replace(/\D/g, "");
  const v = new Set([d]);
  if (d.length === 13 && d[4] === "9") v.add(d.slice(0, 4) + d.slice(5));
  if (d.length === 12 && /[6-9]/.test(d[4])) v.add(`${d.slice(0, 4)}9${d.slice(4)}`);
  return [...v];
}

// O WhatsApp às vezes devolve celular sem o 9 extra (55 81 9XXXX-XXXX → 55 81 XXXX-XXXX).
function mesmoNumero(a: string, b: string) {
  if (a === b) return true;
  const sem9 = (n: string) => (n.length === 13 ? n.slice(0, 4) + n.slice(5) : n);
  return sem9(a) === sem9(b);
}
