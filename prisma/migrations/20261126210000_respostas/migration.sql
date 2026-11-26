-- AlterTable
ALTER TABLE "InteracaoProspect" ADD COLUMN     "detalhe" TEXT,
ADD COLUMN     "mensagemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InteracaoProspect_mensagemId_key" ON "InteracaoProspect"("mensagemId");

