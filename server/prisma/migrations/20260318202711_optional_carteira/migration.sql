/*
  Warnings:

  - You are about to drop the column `casaAposta` on the `gestao_banca_itens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `gestao_banca_itens` table. All the data in the column will be lost.
  - You are about to drop the `gestao_banca_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "gestao_banca_configs" DROP CONSTRAINT "gestao_banca_configs_userId_fkey";

-- DropForeignKey
ALTER TABLE "gestao_banca_itens" DROP CONSTRAINT "gestao_banca_itens_userId_fkey";

-- AlterTable
ALTER TABLE "gestao_banca_itens" DROP COLUMN "casaAposta",
DROP COLUMN "userId",
ADD COLUMN     "carteiraId" TEXT;

-- DropTable
DROP TABLE "gestao_banca_configs";

-- CreateTable
CREATE TABLE "banca_carteiras" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "casaAposta" TEXT NOT NULL,
    "bancaInicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "perfilRisco" TEXT NOT NULL DEFAULT 'moderado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banca_carteiras_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "banca_carteiras" ADD CONSTRAINT "banca_carteiras_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestao_banca_itens" ADD CONSTRAINT "gestao_banca_itens_carteiraId_fkey" FOREIGN KEY ("carteiraId") REFERENCES "banca_carteiras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
