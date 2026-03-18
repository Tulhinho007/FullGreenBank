-- CreateTable
CREATE TABLE "gestao_banca_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "casaAposta" TEXT NOT NULL,
    "bancaInicial" DECIMAL(10,2) NOT NULL DEFAULT 1000,
    "perfilRisco" TEXT NOT NULL DEFAULT 'moderado',

    CONSTRAINT "gestao_banca_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestao_banca_itens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "casaAposta" TEXT NOT NULL,
    "dataReferencia" DATE NOT NULL,
    "deposito" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saque" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "resultado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestao_banca_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestao_banca_configs_userId_casaAposta_key" ON "gestao_banca_configs"("userId", "casaAposta");

-- AddForeignKey
ALTER TABLE "gestao_banca_configs" ADD CONSTRAINT "gestao_banca_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao_banca_itens" ADD CONSTRAINT "gestao_banca_itens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
