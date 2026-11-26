-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "canal" TEXT,
ADD COLUMN     "primeiroContatoEm" TIMESTAMP(3),
ADD COLUMN     "proximoContatoEm" TIMESTAMP(3),
ADD COLUMN     "tentativas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimoContatoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InteracaoProspect" (
    "id" UUID NOT NULL,
    "prospectId" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "statusDe" TEXT NOT NULL,
    "statusPara" TEXT NOT NULL,
    "por" TEXT NOT NULL,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteracaoProspect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InteracaoProspect_em_idx" ON "InteracaoProspect"("em");

-- CreateIndex
CREATE INDEX "InteracaoProspect_prospectId_idx" ON "InteracaoProspect"("prospectId");

-- AddForeignKey
ALTER TABLE "InteracaoProspect" ADD CONSTRAINT "InteracaoProspect_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "InteracaoProspect" ENABLE ROW LEVEL SECURITY;
