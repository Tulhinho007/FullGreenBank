-- AlterTable
ALTER TABLE "banca_contratos" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "banca_contratos" ADD CONSTRAINT "banca_contratos_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "banca_contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
