import Link from "next/link";
import { entrar } from "../actions";
import { FormAuth } from "../FormAuth";

export default function Entrar() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>
      <FormAuth
        acao={entrar}
        botao="Entrar"
        campos={[
          { nome: "email", rotulo: "E-mail", tipo: "email", autoComplete: "email" },
          { nome: "senha", rotulo: "Senha", tipo: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-6 text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-bia">
          Cadastrar clínica
        </Link>
      </p>
    </>
  );
}
