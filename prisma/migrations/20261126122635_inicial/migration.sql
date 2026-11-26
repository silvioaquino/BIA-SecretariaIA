-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('PEQUENA', 'MEDIA', 'GRANDE');

-- CreateEnum
CREATE TYPE "Especialidade" AS ENUM ('ODONTOLOGIA', 'MEDICINA', 'OFTALMOLOGIA', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusClinica" AS ENUM ('CADASTRO', 'AGUARDANDO_PAGAMENTO', 'ATIVA', 'ATRASADA', 'BLOQUEADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ModoAgenda" AS ENUM ('DIRETO', 'PRE');

-- CreateTable
CREATE TABLE "Clinica" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "cidade" TEXT,
    "porte" "Porte" NOT NULL DEFAULT 'PEQUENA',
    "status" "StatusClinica" NOT NULL DEFAULT 'CADASTRO',
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "evolutionInstance" TEXT,
    "inadimplenteDesde" TIMESTAMP(3),
    "bloqueadaEm" TIMESTAMP(3),
    "aceiteTermosEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "clinicaId" UUID,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigBia" (
    "id" UUID NOT NULL,
    "clinicaId" UUID NOT NULL,
    "especialidade" "Especialidade" NOT NULL DEFAULT 'ODONTOLOGIA',
    "nomeExibicao" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "linkMaps" TEXT,
    "telefoneRecepcao" TEXT NOT NULL,
    "horarios" JSONB NOT NULL,
    "aceitaParticular" BOOLEAN NOT NULL DEFAULT true,
    "convenios" TEXT[],
    "formasPagamento" TEXT[],
    "modoAgenda" "ModoAgenda" NOT NULL DEFAULT 'PRE',
    "orientacoesGerais" TEXT,
    "mensagemBoasVindas" TEXT,
    "informacoesExtras" TEXT,
    "completo" BOOLEAN NOT NULL DEFAULT false,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigBia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profissional" (
    "id" UUID NOT NULL,
    "clinicaId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT,
    "idAgenda" TEXT,
    "atendimento" TEXT,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedimento" (
    "id" UUID NOT NULL,
    "clinicaId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "duracaoMin" INTEGER,
    "valor" DECIMAL(10,2),
    "orientacoes" TEXT,

    CONSTRAINT "Procedimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" UUID NOT NULL,
    "clinicaId" UUID NOT NULL,
    "asaasPaymentId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "billingType" TEXT,
    "vencimento" DATE NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "invoiceUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_cpfCnpj_key" ON "Clinica"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_asaasCustomerId_key" ON "Clinica"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_asaasSubscriptionId_key" ON "Clinica"("asaasSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_evolutionInstance_key" ON "Clinica"("evolutionInstance");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigBia_clinicaId_key" ON "ConfigBia"("clinicaId");

-- CreateIndex
CREATE INDEX "Profissional_clinicaId_idx" ON "Profissional"("clinicaId");

-- CreateIndex
CREATE INDEX "Procedimento_clinicaId_idx" ON "Procedimento"("clinicaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_asaasPaymentId_key" ON "Pagamento"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "Pagamento_clinicaId_idx" ON "Pagamento"("clinicaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigBia" ADD CONSTRAINT "ConfigBia_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimento" ADD CONSTRAINT "Procedimento_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
