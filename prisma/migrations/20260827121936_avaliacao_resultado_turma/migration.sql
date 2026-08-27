-- AlterEnum
ALTER TYPE "TipoAvaliacao" ADD VALUE 'AVALIACAO_CONTINUA_CAED';

-- CreateTable
CREATE TABLE "AvaliacaoResultadoTurma" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "turma" TEXT NOT NULL,
    "percentualParticipacao" DOUBLE PRECISION,
    "percentualDefasagem" DOUBLE PRECISION,
    "percentualIntermediario" DOUBLE PRECISION,
    "percentualAdequado" DOUBLE PRECISION,
    "acertoPorHabilidade" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoResultadoTurma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoResultadoTurma_avaliacaoId_escolaId_turma_key" ON "AvaliacaoResultadoTurma"("avaliacaoId", "escolaId", "turma");

-- AddForeignKey
ALTER TABLE "AvaliacaoResultadoTurma" ADD CONSTRAINT "AvaliacaoResultadoTurma_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoResultadoTurma" ADD CONSTRAINT "AvaliacaoResultadoTurma_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
