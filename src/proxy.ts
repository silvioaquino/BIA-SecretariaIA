import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova a sessão do Supabase a cada requisição e faz o redirecionamento
// otimista das rotas privadas. A checagem de verdade fica em src/lib/sessao.ts.
const ROTAS_PRIVADAS = ["/painel", "/onboarding", "/admin"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);
  const caminho = request.nextUrl.pathname;

  if (!logado && ROTAS_PRIVADAS.some((r) => caminho.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // tudo menos estáticos e as APIs de máquina (webhook, cron, n8n)
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
