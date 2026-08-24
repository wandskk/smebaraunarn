-- ETAPA 06 (Professor P0): ServidorTurma ganha escolaId própria.
--
-- Por que: Servidor.escolaId é único por servidor e é sobrescrito a cada
-- linha processada pela sincronização ("last write wins"); um professor com
-- turmas em mais de uma escola perdia a escola de origem de cada turma
-- individual. A origem (SIGEduc) já entrega codigo_inep_escola por linha de
-- servidor×turma — só não estava sendo gravado em ServidorTurma. Com 57
-- códigos de turma confirmados colidindo entre escolas diferentes nesta
-- base, isso é risco real de escopo, não teórico.
--
-- Backfill: nenhuma linha de ServidorTurma hoje pertence a um Servidor com
-- escolaId nulo (conferido antes desta migration), então o backfill a partir
-- de Servidor.escolaId é seguro e a coluna pode ficar NOT NULL imediatamente.
-- Para os poucos servidores que atuam em mais de uma escola, o valor herdado
-- pode não ser o correto para todas as turmas até a próxima sincronização —
-- a partir desta migration, o sync (lib/sync/sigeduc-sync.ts) passa a gravar
-- o escolaId correto por linha, então o dado se autocorrige no próximo ciclo.

-- AlterTable: adiciona coluna nullable primeiro (tabela já tem 611 linhas)
ALTER TABLE "ServidorTurma" ADD COLUMN "escolaId" INTEGER;

-- Backfill a partir do Servidor dono de cada linha
UPDATE "ServidorTurma" st
SET "escolaId" = s."escolaId"
FROM "Servidor" s
WHERE s.id = st."servidorId";

-- Agora que todas as linhas estão preenchidas, torna a coluna obrigatória
ALTER TABLE "ServidorTurma" ALTER COLUMN "escolaId" SET NOT NULL;

-- Substitui a unicidade por servidor+turma por servidor+escola+turma —
-- permite (em tese) o mesmo código de turma em escolas diferentes para o
-- mesmo servidor, o que antes colidiria incorretamente.
DROP INDEX "ServidorTurma_servidorId_turma_key";
CREATE UNIQUE INDEX "ServidorTurma_servidorId_escolaId_turma_key" ON "ServidorTurma"("servidorId", "escolaId", "turma");

-- Índice de apoio para consultas por escola (ex.: turmas de uma escola)
CREATE INDEX "ServidorTurma_escolaId_idx" ON "ServidorTurma"("escolaId");

-- AddForeignKey
ALTER TABLE "ServidorTurma" ADD CONSTRAINT "ServidorTurma_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
