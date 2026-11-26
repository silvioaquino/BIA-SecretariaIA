"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/sessao";
import { onboardingSchema } from "@/lib/validacao";

export type EstadoOnboarding = { erro?: string } | undefined;

export async function salvarOnboarding(
  _: EstadoOnboarding,
  form: FormData,
): Promise<EstadoOnboarding> {
  const usuario = await exigirUsuario();
  const r = onboardingSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return { erro: r.error.issues[0].message };
  const d = r.data;

  const clinicaExistente = usuario.clinica;
  // Depois que a assinatura existe, porte e documento só mudam pelo suporte
  // (senão o valor da cobrança fica diferente do plano).
  const travado = Boolean(clinicaExistente?.asaasSubscriptionId);

  const dadosClinica = {
    nome: d.nome,
    email: d.email,
    whatsapp: d.whatsapp,
    cidade: d.cidade,
    // produto e porte depois da assinatura só mudam pela página Assinatura (upgrade)
    ...(travado ? {} : { cpfCnpj: d.cpfCnpj, porte: d.porte, produto: d.produto }),
  };

  const dadosConfig = {
    especialidade: d.especialidade,
    nomeExibicao: d.nomeExibicao,
    endereco: d.endereco,
    linkMaps: d.linkMaps,
    telefoneRecepcao: d.telefoneRecepcao,
    horarios: d.horarios,
    aceitaParticular: d.aceitaParticular,
    convenios: d.convenios,
    formasPagamento: d.formasPagamento,
    modoAgenda: d.modoAgenda,
    fonteAgenda: d.fonteAgenda,
    orientacoesGerais: d.orientacoesGerais,
    mensagemBoasVindas: d.mensagemBoasVindas,
    informacoesExtras: d.informacoesExtras,
    completo: true,
  };

  try {
    await prisma.$transaction(async (tx) => {
      const clinica = clinicaExistente
        ? await tx.clinica.update({ where: { id: clinicaExistente.id }, data: dadosClinica })
        : await tx.clinica.create({
            data: {
              ...dadosClinica,
              cpfCnpj: d.cpfCnpj,
              porte: d.porte,
              produto: d.produto,
              aceiteTermosEm: new Date(),
              usuarios: { connect: { id: usuario.id } },
            },
          });

      await tx.configBia.upsert({
        where: { clinicaId: clinica.id },
        update: dadosConfig,
        create: { ...dadosConfig, clinicaId: clinica.id },
      });

      // listas: substitui tudo (simples e suficiente para o tamanho de uma clínica)
      await tx.profissional.deleteMany({ where: { clinicaId: clinica.id } });
      await tx.profissional.createMany({
        data: d.profissionais.map((p) => ({
          clinicaId: clinica.id,
          nome: p.nome,
          especialidade: p.especialidade || null,
          atendimento: p.atendimento || null,
          idAgenda: p.idAgenda || null,
        })),
      });
      await tx.procedimento.deleteMany({ where: { clinicaId: clinica.id } });
      if (d.procedimentos.length) {
        await tx.procedimento.createMany({
          data: d.procedimentos.map((p) => ({ ...p, clinicaId: clinica.id })),
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Já existe uma clínica cadastrada com este CPF/CNPJ." };
    }
    throw e;
  }

  revalidatePath("/painel", "layout");
  redirect(clinicaExistente?.asaasSubscriptionId ? "/painel?salvo=1" : "/painel/assinatura");
}
