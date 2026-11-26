-- CreateEnum
CREATE TYPE "Produto" AS ENUM ('CONFIRMA', 'COMPLETA');

-- CreateEnum
CREATE TYPE "FonteAgenda" AS ENUM ('PLANILHA', 'GOOGLE');

-- AlterTable
ALTER TABLE "Clinica" ADD COLUMN     "produto" "Produto" NOT NULL DEFAULT 'CONFIRMA';

-- AlterTable
ALTER TABLE "ConfigBia" ADD COLUMN     "fonteAgenda" "FonteAgenda" NOT NULL DEFAULT 'PLANILHA';

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'MENSALIDADE';

