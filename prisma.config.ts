import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Mesmo arquivo do app: .env.local (e .env, se existir, como reserva).
config({ path: [".env.local", ".env"], quiet: true });

// A CLI do Prisma (migrate) usa a conexão DIRETA do Supabase (porta 5432).
// O app usa DATABASE_URL (pooler, porta 6543) via adapter em src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
