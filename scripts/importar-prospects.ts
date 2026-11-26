// Importa a lista feita à mão na semana 1 para a tabela Prospect e pontua tudo.
//
//   npm run prospects:importar -- ../semana-1/prospeccao-clinicas.csv
//   npm run prospects:importar -- <pasta com o export JSON da aba Planilha do painel>
//
// Pode rodar de novo: atualiza pelo código ("001" no CSV, "g001" no painel) sem duplicar.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import type { Especialidade } from "@/generated/prisma/enums";
import { cidadeAlvo, numero, porteEstimado, telefone } from "@/lib/prospeccao/normalizar";
import { repontuar } from "@/lib/prospeccao/coletar";

type Linha = {
  codigo: string;
  tipo: string;
  nome: string;
  cidade: string;
  bairro?: string;
  telefone?: string;
  instagram?: string;
  nota?: string | number | null;
  avaliacoes?: string | number | null;
  status?: string;
  observacoes?: string;
  extras: Record<string, unknown>;
};

const TIPOS: Record<string, Especialidade> = {
  odonto: "ODONTOLOGIA",
  medica: "MEDICINA",
  oftalmo: "OFTALMOLOGIA",
};

function lerCsv(caminho: string): Linha[] {
  const [cab, ...linhas] = readFileSync(caminho, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
  const cols = cab.split(";");
  return linhas.map((l) => {
    const v = Object.fromEntries(l.split(";").map((x, i) => [cols[i], x.trim()]));
    const usados = ["id", "tipo", "clinica", "cidade", "bairro", "telefone_whatsapp", "instagram", "nota_google", "num_avaliacoes", "status", "observacoes"];
    const extras = Object.fromEntries(Object.entries(v).filter(([k, x]) => x && !usados.includes(k)));
    return {
      codigo: v.id,
      tipo: v.tipo,
      nome: v.clinica,
      cidade: v.cidade,
      bairro: v.bairro,
      telefone: v.telefone_whatsapp,
      instagram: v.instagram,
      nota: v.nota_google,
      avaliacoes: v.num_avaliacoes,
      status: v.status,
      observacoes: v.observacoes,
      extras,
    };
  });
}

function lerPainel(pasta: string): Linha[] {
  return readdirSync(pasta)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."))
    .map((f) => {
      const d = JSON.parse(readFileSync(join(pasta, f), "utf8"));
      const { nome, tipo, cidade, bairro, whatsapp, nota, avaliacoes, status, obs, ...resto } = d;
      return {
        codigo: f.replace(/\.json$/, ""),
        tipo,
        nome,
        cidade,
        bairro,
        telefone: whatsapp,
        nota,
        avaliacoes,
        status,
        observacoes: obs,
        extras: resto,
      };
    });
}

async function main() {
  const caminho = process.argv[2];
  if (!caminho) throw new Error("Informe o CSV ou a pasta do export do painel.");
  const linhas = statSync(caminho).isDirectory() ? lerPainel(caminho) : lerCsv(caminho);

  let criados = 0;
  let atualizados = 0;
  const avisos: string[] = [];

  for (const l of linhas) {
    const tipo = TIPOS[l.tipo];
    const cidade = cidadeAlvo(l.cidade);
    if (!tipo || !cidade || !l.nome) {
      avisos.push(`${l.codigo}: ignorada (tipo "${l.tipo}", cidade "${l.cidade}")`);
      continue;
    }
    const tel = telefone(l.telefone);
    const aval = typeof l.avaliacoes === "number" ? l.avaliacoes : numero(l.avaliacoes ?? null);
    const nota = typeof l.nota === "number" ? l.nota : numero(l.nota ?? null);
    const dados = {
      origem: "planilha",
      tipo,
      nome: l.nome,
      cidade,
      bairro: l.bairro || null,
      endereco: l.observacoes?.match(/Endereço: ([^|\n]+)/)?.[1]?.trim() ?? null,
      telefone: tel?.numero ?? null,
      tipoTelefone: tel?.tipo ?? null,
      instagram: l.instagram || null,
      nota,
      avaliacoes: aval != null ? Math.round(aval) : null,
      porteEstimado: porteEstimado(aval),
      status: l.status || "novo",
      observacoes: l.observacoes || null,
      extras: l.extras as object,
    };

    const existe = await prisma.prospect.findUnique({ where: { codigo: l.codigo } });
    if (existe) {
      // na reimportação, o status do banco vale mais que o da planilha
      await prisma.prospect.update({ where: { id: existe.id }, data: { ...dados, status: existe.status } });
      atualizados++;
    } else {
      await prisma.prospect.create({ data: { ...dados, codigo: l.codigo } });
      criados++;
    }
  }

  const total = await repontuar();
  console.log(JSON.stringify({ lidas: linhas.length, criados, atualizados, pontuados: total, avisos }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
