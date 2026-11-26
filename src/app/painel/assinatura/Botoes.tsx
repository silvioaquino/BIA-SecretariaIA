"use client";

import { useActionState, useState } from "react";
import type { EstadoAssinatura } from "./actions";

export function BotaoAcao({
  acao,
  texto,
  pendente,
  secundario,
}: {
  acao: () => Promise<EstadoAssinatura>;
  texto: string;
  pendente: string;
  secundario?: boolean;
}) {
  const [estado, executar, carregando] = useActionState(acao, undefined);
  return (
    <form action={executar} className="inline-block">
      <button type="submit" disabled={carregando} className={secundario ? "botao-secundario" : "botao"}>
        {carregando ? pendente : texto}
      </button>
      {estado?.erro && <p className="mt-2 text-sm text-coral">{estado.erro}</p>}
      {estado?.ok && <p className="mt-2 text-sm">{estado.ok}</p>}
    </form>
  );
}

export function CopiarPix({ payload }: { payload: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div>
      <p className="rotulo">Pix copia e cola</p>
      <div className="flex gap-2">
        <input readOnly value={payload} className="campo font-mono text-xs" onFocus={(e) => e.target.select()} />
        <button
          type="button"
          className="botao shrink-0"
          onClick={async () => {
            await navigator.clipboard.writeText(payload);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          }}
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
