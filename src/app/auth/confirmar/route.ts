import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarSupabaseServidor } from "@/lib/supabase/server";

// Link do e-mail de confirmação do Supabase.
// Aceita os dois formatos: ?code=… (PKCE) e ?token_hash=…&type=…
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const proximo = url.searchParams.get("next");
  const destino = proximo?.startsWith("/") && !proximo.startsWith("//") ? proximo : "/painel";

  const supabase = await criarSupabaseServidor();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  return NextResponse.redirect(new URL(ok ? destino : "/entrar", url.origin));
}
