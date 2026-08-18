-- AlterTable
ALTER TABLE "FrequenciaEstudante" ADD COLUMN     "escola" TEXT,
ADD COLUMN     "serie" TEXT;

-- RenameIndex
ALTER INDEX "frequenciaEstudanteUnica" RENAME TO "FrequenciaEstudante_estudanteMatricula_data_disciplina_key";

-- RenameIndex
ALTER INDEX "notaEstudanteUnica" RENAME TO "NotaEstudante_estudanteMatricula_ano_disciplina_unidade_key";
