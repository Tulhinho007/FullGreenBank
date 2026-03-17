-- CreateTable
CREATE TABLE "banca_contratos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataInicial" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFinal" TIMESTAMP(3),
    "bancaInicial" DECIMAL(10,2) NOT NULL,
    "bancaFinal" DECIMAL(10,2) NOT NULL,
    "comissaoPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "motivoFim" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banca_contratos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "banca_contratos" ADD CONSTRAINT "banca_contratos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
