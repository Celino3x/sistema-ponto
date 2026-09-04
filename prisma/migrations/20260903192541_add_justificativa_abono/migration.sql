-- CreateTable
CREATE TABLE "JustificativaAbono" (
    "id" SERIAL NOT NULL,
    "colaboradorId" INTEGER NOT NULL,
    "dataFalta" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "anexoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JustificativaAbono_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JustificativaAbono" ADD CONSTRAINT "JustificativaAbono_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
