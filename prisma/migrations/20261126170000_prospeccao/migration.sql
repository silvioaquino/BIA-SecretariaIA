-- CreateEnum
CREATE TYPE "TipoTelefone" AS ENUM ('CELULAR', 'FIXO');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" UUID NOT NULL,
    "placeId" TEXT,
    "codigo" TEXT,
    "origem" TEXT NOT NULL,
    "tipo" "Especialidade" NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "bairro" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "tipoTelefone" "TipoTelefone",
    "temWhatsapp" BOOLEAN,
    "whatsappVerificadoEm" TIMESTAMP(3),
    "site" TEXT,
    "instagram" TEXT,
    "mapsUrl" TEXT,
    "nota" DOUBLE PRECISION,
    "avaliacoes" INTEGER,
    "porteEstimado" "Porte",
    "pontuacao" INTEGER NOT NULL DEFAULT 0,
    "faixa" TEXT NOT NULL DEFAULT 'C',
    "motivos" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'novo',
    "observacoes" TEXT,
    "extras" JSONB,
    "fechadaNoGoogle" BOOLEAN NOT NULL DEFAULT false,
    "vistoNoGoogleEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColetaProspeccao" (
    "id" UUID NOT NULL,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminouEm" TIMESTAMP(3),
    "buscas" INTEGER NOT NULL DEFAULT 0,
    "encontrados" INTEGER NOT NULL DEFAULT 0,
    "novos" INTEGER NOT NULL DEFAULT 0,
    "atualizados" INTEGER NOT NULL DEFAULT 0,
    "erros" TEXT[],

    CONSTRAINT "ColetaProspeccao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_placeId_key" ON "Prospect"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_codigo_key" ON "Prospect"("codigo");

-- CreateIndex
CREATE INDEX "Prospect_status_pontuacao_idx" ON "Prospect"("status", "pontuacao");

-- CreateIndex
CREATE INDEX "Prospect_telefone_idx" ON "Prospect"("telefone");


-- Dados internos: fora da API pública do Supabase (ver migration rls)
ALTER TABLE "Prospect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ColetaProspeccao" ENABLE ROW LEVEL SECURITY;
