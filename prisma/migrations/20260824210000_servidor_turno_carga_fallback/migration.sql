-- ETAPA 08 (Servidor Geral P0): fallback de lotação funcional em Servidor.
--
-- Por que: a origem (SIGEduc) manda turno/carga_trabalho na própria linha do
-- servidor, independente de haver turma — mas o sync só persistia esses
-- valores em ServidorTurma (dentro do `if (s.turma)`), descartando-os para
-- servidores sem turma (cargos administrativos, o caso típico de
-- SERVIDOR_GERAL). Colunas aditivas e nullable: nenhum dado existente é
-- afetado, não há backfill possível nem necessário (o valor nunca foi
-- capturado antes desta migration) — populam-se a partir da próxima
-- sincronização.
ALTER TABLE "Servidor" ADD COLUMN "turno" TEXT;
ALTER TABLE "Servidor" ADD COLUMN "cargaTrabalho" INTEGER;
