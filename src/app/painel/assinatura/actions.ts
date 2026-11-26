"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirClinica } from "@/lib/sessao";
import { DIAS_UPGRADE_SEM_IMPLANTACAO, PRODUTOS, nomePlano, precoMensal } from "@/lib/planos";
import {
  criarAssinatura,
  criarCliente,
  criarCobrancaAvulsa,
  ErroAsaas,
  hojeRecife,
  somarMeses,
} from "@/lib/asaas";
import {
  EM_ABERTO,
  aplicarUpgrade,
  referencia,
  salvarCobranca,
  sincronizarClinica,
  taxaUpgrade,
} from "@/lib/cobranca";

export type EstadoAssinatura = { erro?: string; ok?: string } | undefined;

function erroAsaas(e: unknown): EstadoAssinatura {
  if (e instanceof ErroAsaas) {
    console.error("Asaas:", e.status, JSON.stringify(e.detalhes));
    return { erro: `O Asaas recusou: ${e.message}` };
  }
  throw e;
}

export async function assinar(): Promise<EstadoAssinatura> {
  const { clinica } = await exigirClinica();
  if (!clinica.config?.completo) return { erro: "Termine a personalização da Bia antes." };
  if (clinica.asaasSubscriptionId) return; // já assinou (duplo clique)

  // trava contra dois envios simultâneos: só um consegue sair de CADASTRO
  const trava = await prisma.clinica.updateMany({
    where: { id: clinica.id, status: "CADASTRO", asaasSubscriptionId: null },
    data: { status: "AGUARDANDO_PAGAMENTO" },
  });
  if (trava.count === 0 && clinica.status === "CADASTRO") return;

  try {
    let customerId = clinica.asaasCustomerId;
    if (!customerId) {
      const c = await criarCliente({
        name: clinica.nome,
        cpfCnpj: clinica.cpfCnpj,
        email: clinica.email,
        mobilePhone: clinica.whatsapp,
        externalReference: clinica.id,
      });
      customerId = c.id;
      await prisma.clinica.update({ where: { id: clinica.id }, data: { asaasCustomerId: customerId } });
    }

    const produto = PRODUTOS[clinica.produto];
    const mensal = precoMensal(clinica.produto, clinica.porte);
    const hoje = hojeRecife();
    const descricao = `Bia · Secretária IA · ${nomePlano(clinica.produto, clinica.porte)}`;

    // Com implantação: UM Pix só (implantação + 1º mês) hoje, e a assinatura começa no mês seguinte.
    // Sem implantação: a assinatura já gera a 1ª mensalidade vencendo hoje.
    if (produto.implantacao > 0) {
      const avulsa = await criarCobrancaAvulsa({
        customer: customerId,
        value: produto.implantacao + mensal,
        dueDate: hoje,
        description: `Implantação + 1º mês · ${descricao}`,
        externalReference: referencia(clinica.id, "IMPLANTACAO"),
      });
      await salvarCobranca(avulsa);
    }

    const sub = await criarAssinatura({
      customer: customerId,
      value: mensal,
      nextDueDate: produto.implantacao > 0 ? somarMeses(hoje, 1) : hoje,
      description: descricao,
      externalReference: clinica.id,
    });
    await prisma.clinica.update({
      where: { id: clinica.id },
      data: { asaasSubscriptionId: sub.id, status: "AGUARDANDO_PAGAMENTO" },
    });

    await sincronizarClinica(clinica.id); // traz a 1ª cobrança para mostrar o QR
  } catch (e) {
    await prisma.clinica.updateMany({
      where: { id: clinica.id, asaasSubscriptionId: null },
      data: { status: "CADASTRO" },
    });
    return erroAsaas(e);
  }

  revalidatePath("/painel", "layout");
}

/** Upgrade Confirma → Completa. Com taxa: gera o Pix e aplica quando pagar. Sem taxa: aplica na hora. */
export async function fazerUpgrade(): Promise<EstadoAssinatura> {
  const { clinica } = await exigirClinica();
  if (clinica.produto === "COMPLETA") return;
  if (!clinica.asaasSubscriptionId || !clinica.asaasCustomerId) {
    return { erro: "Ative a assinatura antes de fazer o upgrade." };
  }
  if (clinica.status !== "ATIVA") return { erro: "Regularize a mensalidade antes de fazer o upgrade." };

  const jaTem = await prisma.pagamento.findFirst({
    where: { clinicaId: clinica.id, tipo: "UPGRADE", status: { in: [...EM_ABERTO] } },
  });
  if (jaTem) return { ok: "O Pix do upgrade já está gerado logo acima." };

  try {
    const taxa = await taxaUpgrade(clinica.id, DIAS_UPGRADE_SEM_IMPLANTACAO);
    if (taxa === 0) {
      await aplicarUpgrade(clinica.id);
    } else {
      const avulsa = await criarCobrancaAvulsa({
        customer: clinica.asaasCustomerId,
        value: taxa,
        dueDate: hojeRecife(),
        description: "Implantação Bia Completa (upgrade)",
        externalReference: referencia(clinica.id, "UPGRADE"),
      });
      await salvarCobranca(avulsa);
    }
  } catch (e) {
    return erroAsaas(e);
  }
  revalidatePath("/painel", "layout");
}

/** Botão "Já paguei": consulta o Asaas na hora, sem esperar o webhook. */
export async function verificarPagamento(): Promise<EstadoAssinatura> {
  const { clinica } = await exigirClinica();
  try {
    await sincronizarClinica(clinica.id);
  } catch (e) {
    if (e instanceof ErroAsaas) return { erro: "Não consegui falar com o Asaas agora. Tente em instantes." };
    throw e;
  }
  revalidatePath("/painel", "layout");
}
