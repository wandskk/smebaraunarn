-- AlterTable
ALTER TABLE "NotaEstudante" ADD CONSTRAINT "notaEstudanteUnica" UNIQUE ("estudanteMatricula", "ano", "disciplina", "unidade");

-- AlterTable
ALTER TABLE "FrequenciaEstudante" ADD CONSTRAINT "frequenciaEstudanteUnica" UNIQUE ("estudanteMatricula", "data", "disciplina");
