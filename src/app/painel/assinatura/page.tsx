import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { exigirClinica } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import {
  CARENCIA_DIAS,
  DIAS_UPGRADE_SEM_IMPLANTACAO,
  PORTES,
  PRODUTOS,
  brl,
  precoMensal,
} from "@/lib/planos";
import { pixQrCode, type AsaasPixQrCode } from "@/lib/asaas";
import { taxaUpgrade } from "@/lib/cobranca";
import { BotaoAcao, CopiarPix } from "./Botoes";
import { assinar, fazerUpgrade, verificarPagamento } from "./actions";

const STATUS_COBRANCA: Record<string, string> = {
  PENDING: "Em aberto",
  OVERDUE: "Vencida",
  RECEIVED: "Paga",
  CONFIRMED: "Paga",
  RECEIVED_IN_CASH: "Paga",
  REFUNDED: "Estornada",
};

const TIPO_COBRANCA: Record<string, string> = {
  MENSALIDADE: "Mensalidade",
  IMPLANTACAO: "Implantação + 1º mês",
  UPGRADE: "Upgrade para a Completa",
};

const data = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default async function Assinatura() {
  const { clinica } = await exigirClinica();
  await connection(); // a taxa de upgrade depende de quantos dias a clínica já é cliente
  if (!clinica.config?.completo) redirect("/onboarding");
  const produto = PRODUTOS[clinica.produto];
  const mensal = precoMensal(clinica.produto, clinica.porte);

  if (!clinica.asaasSubscriptionId) {
    const hoje = mensal + produto.implantacao;
    return (
      <div className="cartao mx-auto max-w-lg text-center">
        <p className="etiqueta text-bia">
          {produto.nome} · {PORTES[clinica.porte].nome}
        </p>
        <p className="mt-2 text-4xl font-bold">
          {brl(mensal)}
          <span className="text-base font-normal text-slate-500">/mês</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">{PORTES[clinica.porte].descricao} · sem fidelidade</p>
        {produto.implantacao > 0 && (
          <p className="mt-3 rounded-xl bg-gelo p-3 text-sm">
            Hoje: <strong>{brl(hoje)}</strong> (implantação de {brl(produto.implantacao)} + 1º mês). Depois,{" "}
            {brl(mensal)} por mês.
          </p>
        )}
        <ul className="mx-auto mt-6 max-w-xs space-y-1 text-left text-sm text-slate-700">
          <li>✓ Pagamento por Pix, com QR Code aqui mesmo</li>
          <li>✓ A Bia é ativada assim que o pagamento cai</li>
          <li>✓ 7 dias de garantia: não gostou, devolvemos 100%</li>
        </ul>
        <div className="mt-8">
          <BotaoAcao acao={assinar} texto={`Gerar Pix de ${brl(hoje)}`} pendente="Gerando cobrança…" />
        </div>
        <p className="ajuda mt-4">
          Multa de 2% e juros de 1% ao mês em caso de atraso. Depois de {CARENCIA_DIAS} dias de atraso a Bia é pausada,
          e volta sozinha quando o pagamento é feito.
        </p>
        <p className="ajuda mt-2">
          Quer trocar de plano? Volte em{" "}
          <a href="/painel/bia" className="font-semibold text-bia underline">Personalizar Bia</a>, passo 1.
        </p>
      </div>
    );
  }

  const pagamentos = await prisma.pagamento.findMany({
    where: { clinicaId: clinica.id, status: { not: "DELETED" } },
    orderBy: { vencimento: "desc" },
  });
  const abertos = pagamentos.filter((p) => p.status === "PENDING" || p.status === "OVERDUE").reverse();

  const qrs = await Promise.all(
    abertos.map(async (p): Promise<AsaasPixQrCode | null> => {
      try {
        return await pixQrCode(p.asaasPaymentId);
      } catch (e) {
        console.error("QR Pix:", e);
        return null;
      }
    }),
  );

  const podeUpgrade = clinica.produto === "CONFIRMA" && clinica.status === "ATIVA";
  const upgradeAberto = abertos.some((p) => p.tipo === "UPGRADE");
  const taxa = podeUpgrade && !upgradeAberto ? await taxaUpgrade(clinica.id, DIAS_UPGRADE_SEM_IMPLANTACAO) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Assinatura</h1>
          <p className="text-slate-600">
            {produto.nome} · {PORTES[clinica.porte].nome} · {brl(mensal)}/mês
          </p>
        </div>
        <BotaoAcao acao={verificarPagamento} texto={abertos.length ? "Já paguei" : "Atualizar"} pendente="Verificando…" secundario />
      </div>

      {abertos.map((p, i) => {
        const qr = qrs[i];
        return (
          <div key={p.id} className="cartao grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            {qr ? (
              <Image
                src={`data:image/png;base64,${qr.encodedImage}`}
                alt="QR Code Pix"
                width={220}
                height={220}
                unoptimized
                className="mx-auto rounded-xl ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-gelo p-4 text-center text-sm text-slate-500">
                Não consegui gerar o QR agora. Use o link da fatura.
              </div>
            )}
            <div className="space-y-3">
              <p className="etiqueta text-bia">
                {TIPO_COBRANCA[p.tipo] ?? "Cobrança"} · {p.status === "OVERDUE" ? "vencida" : "em aberto"}
              </p>
              <p className="text-3xl font-bold">{brl(Number(p.valor))}</p>
              <p className="text-sm text-slate-600">Vencimento: {data(p.vencimento)}</p>
              {qr && <CopiarPix payload={qr.payload} />}
              {p.invoiceUrl && (
                <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="botao-secundario">
                  Pagar com cartão ou boleto
                </a>
              )}
              <p className="ajuda">A confirmação do Pix costuma levar poucos segundos.</p>
            </div>
          </div>
        );
      })}

      {abertos.length === 0 && (
        <div className="cartao">
          <p className="font-semibold">Nenhuma cobrança em aberto. Tudo certo por aqui.</p>
          <p className="mt-1 text-sm text-slate-600">A próxima mensalidade aparece aqui alguns dias antes do vencimento.</p>
        </div>
      )}

      {podeUpgrade && !upgradeAberto && (
        <div className="cartao bg-gradient-to-br from-bia to-bia-escuro text-white ring-0">
          <p className="etiqueta text-menta">Upgrade</p>
          <h2 className="mt-1 text-2xl font-bold">Bia Completa: uma secretária 24h no WhatsApp</h2>
          <ul className="mt-4 grid gap-1 text-sm text-menta-clara sm:grid-cols-2">
            {PRODUTOS.COMPLETA.recursos.slice(1).map((r) => (
              <li key={r}>✓ {r}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            Mensalidade passa para <strong>{brl(precoMensal("COMPLETA", clinica.porte))}</strong>.{" "}
            {taxa === 0 ? (
              <strong className="text-menta">Implantação grátis para você, que já é cliente do Confirma.</strong>
            ) : (
              <>Implantação única de {brl(taxa)}. É grátis para quem é cliente do Confirma há {DIAS_UPGRADE_SEM_IMPLANTACAO} dias ou mais.</>
            )}
          </p>
          <div className="mt-5 [&_.botao]:bg-white [&_.botao]:text-bia-escuro [&_.botao:hover]:bg-menta-clara">
            <BotaoAcao
              acao={fazerUpgrade}
              texto={taxa === 0 ? "Fazer upgrade agora" : `Gerar Pix de ${brl(taxa)} e fazer upgrade`}
              pendente="Processando…"
            />
          </div>
        </div>
      )}

      <div className="cartao">
        <h2 className="text-lg font-bold">Histórico</h2>
        {pagamentos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nenhuma cobrança ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 font-semibold">Vencimento</th>
                  <th className="py-2 font-semibold">Tipo</th>
                  <th className="py-2 font-semibold">Valor</th>
                  <th className="py-2 font-semibold">Situação</th>
                  <th className="py-2 font-semibold">Pago em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{data(p.vencimento)}</td>
                    <td className="py-2">{TIPO_COBRANCA[p.tipo] ?? p.tipo}</td>
                    <td className="py-2">{brl(Number(p.valor))}</td>
                    <td className="py-2">{STATUS_COBRANCA[p.status] ?? p.status}</td>
                    <td className="py-2">{p.pagoEm ? data(p.pagoEm) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
