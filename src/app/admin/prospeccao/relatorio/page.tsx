import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/sessao";
import { ConteudoRelatorio } from "./Conteudo";

export const metadata: Metadata = { title: "Relatório de prospecção · Bia", robots: { index: false } };
export const instant = false;

export default async function RelatorioProspeccao() {
  await exigirAdmin();
  return <ConteudoRelatorio />;
}
