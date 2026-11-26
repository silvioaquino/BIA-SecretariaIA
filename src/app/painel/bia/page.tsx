import { FormBia } from "@/components/FormBia";
import { exigirClinica } from "@/lib/sessao";
import { valoresFormBia } from "@/lib/valoresFormBia";

export default async function PersonalizarBia() {
  const { usuario, clinica } = await exigirClinica();
  const inicial = await valoresFormBia(clinica.id, usuario.email);

  return (
    <>
      <h1 className="text-3xl font-bold">Personalizar a Bia</h1>
      <p className="mt-2 text-slate-600">O que você salvar aqui vale para as próximas conversas.</p>
      <div className="cartao mt-6">
        <FormBia inicial={inicial} travado={Boolean(clinica.asaasSubscriptionId)} edicao />
      </div>
    </>
  );
}
