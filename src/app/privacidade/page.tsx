import { Marca } from "@/components/Marca";

// RASCUNHO: revisar com advogado antes de abrir para clientes.
export default function Privacidade() {
  return (
    <main className="mx-auto max-w-3xl flex-1 space-y-4 px-4 py-10 text-sm leading-relaxed">
      <Marca />
      <h1 className="text-2xl font-bold">Política de privacidade</h1>
      <p className="rounded-xl bg-orange-50 p-3 text-coral">Rascunho em revisão jurídica.</p>
      <p>A clínica é a controladora dos dados dos seus pacientes, e a Bia atua como operadora, tratando esses dados apenas para confirmar consultas e responder mensagens em nome da clínica (LGPD, art. 39).</p>
      <p>Dados de saúde são dados sensíveis. A Bia guarda o mínimo necessário da conversa e não usa os dados para outra finalidade.</p>
      <p>Os dados de cobrança da clínica são processados pelo Asaas.</p>
    </main>
  );
}
