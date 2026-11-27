import { Marca } from "@/components/Marca";

// RASCUNHO: revisar com advogado antes de abrir para clientes.
export default function Termos() {
  return (
    <main className="mx-auto max-w-3xl flex-1 space-y-4 px-4 py-10 text-sm leading-relaxed">
      <Marca />
      <h1 className="text-2xl font-bold">Termos de uso</h1>
      <p className="rounded-xl bg-orange-50 p-3 text-coral">Rascunho em revisão jurídica.</p>
      <p>A Bia é uma assistente virtual que confirma consultas e responde pacientes pelo WhatsApp com as informações cadastradas pela clínica. A clínica é responsável pela exatidão dessas informações.</p>
      <p>A Bia não faz diagnóstico nem orientação clínica. Em situações de urgência, orienta o paciente a procurar atendimento e aciona a recepção.</p>
      <p>A assinatura é mensal, sem fidelidade. Com mais de 5 dias de atraso, o atendimento automático é pausado até a regularização. O cancelamento pode ser pedido a qualquer momento.</p>
      <p>Garantia de 7 dias: nos primeiros 7 dias da primeira contratação, a clínica pode desistir por qualquer motivo e recebe de volta 100% do valor pago (mensalidade e implantação), pelo mesmo meio de pagamento. Depois desse prazo, os valores já pagos não são devolvidos, e o cancelamento vale a partir do mês seguinte, sem multa. Com 30 dias de uso, fazemos com a clínica uma análise de resultado, comparando as faltas de antes e de depois da Bia.</p>
    </main>
  );
}
