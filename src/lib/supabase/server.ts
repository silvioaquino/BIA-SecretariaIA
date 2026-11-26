import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

export async function criarSupabaseServidor() {
  // A sessão depende de quem está acessando, e o Supabase confere a validade do
  // token com Date.now(). Sem isso, o Next 16 tenta pré-renderizar e acusa
  // "Blocking Route ... Date.now()" (só aparece com alguém logado).
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component: o proxy renova a sessão.
          }
        },
      },
    },
  );
}
