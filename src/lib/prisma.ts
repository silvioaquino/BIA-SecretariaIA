import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não configurada");
  // O Supabase exige TLS, mas o certificado do pooler é da CA deles (não de uma CA pública):
  // conexão criptografada sem validar a cadeia, como o "sslmode=require" do libpq.
  const supabase = /\.supabase\.(co|com)/.test(connectionString);
  const adapter = new PrismaPg({ connectionString, ...(supabase && { ssl: { rejectUnauthorized: false } }) });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? criarPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
