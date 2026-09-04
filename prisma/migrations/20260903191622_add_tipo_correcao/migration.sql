/*
  Warnings:

  - You are about to drop the column `aprovadoPor` on the `SolicitacaoCorrecao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SolicitacaoCorrecao" DROP COLUMN "aprovadoPor",
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'entrada';
