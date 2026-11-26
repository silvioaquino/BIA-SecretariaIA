import { redirect } from "next/navigation";
import { Marca } from "@/components/Marca";
import { FormBia } from "@/components/FormBia";
import { exigirUsuario } from "@/lib/sessao";
import { valoresFormBia } from "@/lib/valoresFormBia";
import { lerPorte, lerProduto } from "@/lib/formTipos";

// Páginas da clínica logada: dependem da sessão, não têm versão estática.
export const instant = false;

export default async function Onboarding({ searchParams }: PageProps<"/onboarding">) {
  const usuario = await exigirUsuario();
  // já configurou: edição fica no painel
  if (usuario.clinica?.config?.completo) redirect("/painel");

  // plano escolhido na landing page (?produto=COMPLETA&porte=MEDIA)
  const q = await searchParams;
  const inicial = await valoresFormBia(usuario.clinicaId, usuario.email, {
    produto: lerProduto(q.produto),
    porte: lerPorte(q.porte),
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Marca />
      <h1 className="mt-8 text-3xl font-bold">Vamos personalizar a sua Bia</h1>
      <p className="mt-2 text-slate-600">
        São 4 passos rápidos. Tudo o que você preencher aqui é o que a Bia vai usar para
        responder os seus pacientes. Dá para mudar depois.
      </p>
      <div className="cartao mt-8">
        <FormBia inicial={inicial} />
      </div>
    </main>
  );
}
