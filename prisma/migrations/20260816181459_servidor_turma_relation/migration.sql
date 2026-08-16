-- AlterTable
ALTER TABLE "Servidor" DROP COLUMN "cargaTrabalho",
DROP COLUMN "disciplina",
DROP COLUMN "serie",
DROP COLUMN "turma",
DROP COLUMN "turno";

-- CreateTable
CREATE TABLE "ServidorTurma" (
    "id" TEXT NOT NULL,
    "servidorId" INTEGER NOT NULL,
    "turma" TEXT NOT NULL,
    "serie" TEXT,
    "turno" TEXT,
    "disciplina" TEXT,
    "cargaTrabalho" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServidorTurma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServidorTurma_servidorId_idx" ON "ServidorTurma"("servidorId");

-- CreateIndex
CREATE UNIQUE INDEX "ServidorTurma_servidorId_turma_key" ON "ServidorTurma"("servidorId", "turma");

-- AddForeignKey
ALTER TABLE "ServidorTurma" ADD CONSTRAINT "ServidorTurma_servidorId_fkey" FOREIGN KEY ("servidorId") REFERENCES "Servidor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
