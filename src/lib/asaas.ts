import "server-only";

// Cliente mínimo da API v3 do Asaas.
// Sandbox: https://api-sandbox.asaas.com/v3 · Produção: https://api.asaas.com/v3
// Docs: https://docs.asaas.com/docs/autenticação-1

const BASE = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";

export type AsaasPagamento = {
  id: string;
  customer: string;
  subscription?: string | null;
  value: number;
  netValue?: number;
  status: string; // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, RECEIVED_IN_CASH, …
  billingType?: string;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
  invoiceUrl?: string | null;
  externalReference?: string | null;
  deleted?: boolean;
};

export type AsaasPixQrCode = {
  encodedImage: string; // PNG em base64
  payload: string; // Pix copia e cola
  expirationDate: string;
};

export class ErroAsaas extends Error {
  constructor(
    public status: number,
    public detalhes: unknown,
  ) {
    super(extrairMensagem(detalhes) ?? `Asaas respondeu ${status}`);
  }
}

function extrairMensagem(d: unknown) {
  const erros = (d as { errors?: { description?: string }[] } | null)?.errors;
  return erros?.map((e) => e.description).filter(Boolean).join(" ") || null;
}

async function asaas<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new Error("ASAAS_API_KEY não configurada");

  const res = await fetch(`${BASE}${caminho}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "bia-saas", // obrigatório para contas criadas após 13/06/2024
      access_token: chave,
      ...init.headers,
    },
  });
  const corpo = await res.json().catch(() => null);
  if (!res.ok) throw new ErroAsaas(res.status, corpo);
  return corpo as T;
}

export function criarCliente(dados: {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone: string;
  externalReference: string;
}) {
  // Asaas espera o celular sem o 55
  const mobilePhone = dados.mobilePhone.replace(/^55/, "");
  return asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({ ...dados, mobilePhone, notificationDisabled: false }),
  });
}

export function criarAssinatura(dados: {
  customer: string;
  value: number;
  nextDueDate: string;
  description: string;
  externalReference: string;
}) {
  return asaas<{ id: string; status: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      ...dados,
      // UNDEFINED: a clínica paga por Pix (QR no painel) ou escolhe cartão na fatura
      billingType: process.env.ASAAS_BILLING_TYPE ?? "UNDEFINED",
      cycle: "MONTHLY",
      fine: { value: 2, type: "PERCENTAGE" }, // multa de 2%
      interest: { value: 1 }, // juros de 1% ao mês
    }),
  });
}

/** Cobrança avulsa (implantação + 1ª mensalidade, ou taxa de upgrade). */
export function criarCobrancaAvulsa(dados: {
  customer: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
}) {
  return asaas<AsaasPagamento>("/payments", {
    method: "POST",
    body: JSON.stringify({ ...dados, billingType: process.env.ASAAS_BILLING_TYPE ?? "UNDEFINED" }),
  });
}

/** Muda o valor da assinatura (upgrade), inclusive das cobranças ainda em aberto. */
export function atualizarValorAssinatura(subscriptionId: string, value: number, description: string) {
  return asaas<{ id: string }>(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "POST",
    body: JSON.stringify({ value, description, updatePendingPayments: true }),
  });
}

/** Soma meses a uma data YYYY-MM-DD (dia 31 → último dia do mês seguinte). */
export function somarMeses(data: string, meses: number) {
  const [a, m, d] = data.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(a, m - 1 + meses + 1, 0)).getUTCDate();
  const r = new Date(Date.UTC(a, m - 1 + meses, Math.min(d, ultimoDia)));
  return r.toISOString().slice(0, 10);
}

export async function cobrancasDaAssinatura(subscriptionId: string) {
  const r = await asaas<{ data: AsaasPagamento[] }>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments`,
  );
  return r.data;
}

export function cobranca(paymentId: string) {
  return asaas<AsaasPagamento>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function pixQrCode(paymentId: string) {
  return asaas<AsaasPixQrCode>(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);
}

/** Data de hoje no fuso de Recife, no formato YYYY-MM-DD. */
export function hojeRecife() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(new Date());
}
