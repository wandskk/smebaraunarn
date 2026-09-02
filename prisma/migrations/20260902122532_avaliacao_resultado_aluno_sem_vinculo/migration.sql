-- AlterTable
ALTER TABLE "AvaliacaoResultadoAluno" ADD COLUMN     "nomeBruto" TEXT,
ALTER COLUMN "estudanteId" DROP NOT NULL,
ALTER COLUMN "turma" DROP NOT NULL;
