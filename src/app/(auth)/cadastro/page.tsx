import Link from "next/link";
import { cadastrar } from "../actions";
import { FormAuth } from "../FormAuth";
import { lerPorte, lerProduto } from "@/lib/formTipos";
import { PORTES, PRODUTOS, brl } from "@/lib/planos";

// lê o plano escolhido na landing page (?produto=&porte=)
export const instant = false;

export default async function Cadastro({ searchParams }: PageProps<"/cadastro">) {
  const q = await searchParams;
  const produto = lerProduto(q.produto);
  const porte = lerPorte(q.porte);
  const ocultos: Record<string, string> = {};
  if (produto) ocultos.produto = produto;
  if (porte) ocultos.porte = porte;

  return (
    <>
      <h1 className="text-2xl font-bold">Cadastre sua clínica</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        Primeiro, crie o acesso do responsável. Leva menos de 1 minuto.
      </p>
      {produto && (
        <p className="mb-5 rounded-xl bg-menta-clara px-4 py-3 text-sm">
          Plano escolhido: <strong>{PRODUTOS[produto].nome}</strong>
          {porte && <> · {PORTES[porte].nome} · {brl(PRODUTOS[produto].precos[porte])}/mês</>}
        </p>
      )}
      <FormAuth
        acao={cadastrar}
        botao="Criar conta"
        ocultos={ocultos}
        campos={[
          { nome: "nome", rotulo: "Seu nome", autoComplete: "name" },
          { nome: "email", rotulo: "E-mail", tipo: "email", autoComplete: "email" },
          { nome: "senha", rotulo: "Senha (mín. 8 caracteres)", tipo: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-6 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-bia">
          Entrar
        </Link>
      </p>
    </>
  );
}
