-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR', 'SERVIDOR_GERAL', 'ALUNO');

-- CreateEnum
CREATE TYPE "CategoriaPost" AS ENUM ('NOTICIA', 'AVISO', 'DESTAQUE', 'DOCUMENTO');

-- CreateEnum
CREATE TYPE "TipoAvaliacao" AS ENUM ('FLUENCIA_LEITORA', 'SPADEB', 'SIMULADO', 'PROVA_MUNICIPAL');

-- CreateEnum
CREATE TYPE "NivelFluencia" AS ENUM ('NAO_LEITOR', 'LEITOR_DE_SILABAS', 'LEITOR_DE_PALAVRAS', 'LEITOR_DE_FRASES', 'LEITOR_SEM_FLUENCIA', 'LEITOR_FLUENTE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ALUNO',
    "escolaId" INTEGER,
    "servidorId" INTEGER,
    "estudanteId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escola" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoInep" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" INTEGER NOT NULL,
    "categoria" TEXT,
    "denominacao" TEXT NOT NULL,
    "nivelCargo" TEXT,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servidor" (
    "id" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "matricula" TEXT,
    "nome" TEXT NOT NULL,
    "dataNascimento" TEXT,
    "sexo" TEXT,
    "cargo" TEXT,
    "funcao" TEXT,
    "disciplina" TEXT,
    "cargaTrabalho" INTEGER,
    "tipoVinculo" TEXT,
    "status" TEXT DEFAULT 'Ativo',
    "pendenciaPedagogica" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "escolaId" INTEGER,
    "escolaNome" TEXT,
    "turma" TEXT,
    "serie" TEXT,
    "turno" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estudante" (
    "id" INTEGER NOT NULL,
    "matricula" TEXT NOT NULL,
    "cpf" TEXT,
    "nome" TEXT NOT NULL,
    "dataNascimento" TEXT,
    "ano" INTEGER NOT NULL,
    "turmaSerie" TEXT,
    "escolaId" INTEGER NOT NULL,
    "nomeEscola" TEXT,
    "nomeFiliacao1" TEXT,
    "nomeFiliacao2" TEXT,
    "nomeResponsavel" TEXT,
    "documentoResponsavel" TEXT,
    "codigoNis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estudante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaEstudante" (
    "id" TEXT NOT NULL,
    "estudanteMatricula" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "escola" TEXT,
    "etapaEnsino" TEXT,
    "serie" TEXT,
    "turma" TEXT,
    "disciplina" TEXT NOT NULL,
    "unidade" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaEstudante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequenciaEstudante" (
    "id" TEXT NOT NULL,
    "estudanteMatricula" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "disciplina" TEXT,
    "turma" TEXT,
    "etapaEnsino" TEXT,
    "falta" INTEGER NOT NULL DEFAULT 0,
    "quantidadeAula" INTEGER NOT NULL DEFAULT 1,
    "abonada" BOOLEAN NOT NULL DEFAULT false,
    "motivoAbono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrequenciaEstudante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resumo" TEXT,
    "conteudo" TEXT NOT NULL,
    "imagemCapa" TEXT,
    "galeriaImagens" TEXT[],
    "categoria" "CategoriaPost" NOT NULL DEFAULT 'NOTICIA',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoPublico" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivoUrl" TEXT NOT NULL,
    "tamanho" TEXT,
    "acessos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoPublico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicadoresLanding" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "totalEscolas" INTEGER NOT NULL DEFAULT 20,
    "totalAlunos" INTEGER NOT NULL DEFAULT 3800,
    "totalDocumentos" INTEGER NOT NULL DEFAULT 150,
    "totalAcessos" INTEGER NOT NULL DEFAULT 12500,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicadoresLanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoAvaliacao" NOT NULL DEFAULT 'FLUENCIA_LEITORA',
    "ano" INTEGER NOT NULL,
    "etapaEnsino" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoQuestao" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "enunciado" TEXT,
    "descritor" TEXT,
    "gabaritoCorreto" TEXT,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "AvaliacaoQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoResultadoAluno" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "estudanteId" INTEGER NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "turma" TEXT NOT NULL,
    "pontuacao" DOUBLE PRECISION,
    "nivelDesempenho" "NivelFluencia",
    "palavrasPorMin" INTEGER,
    "respostasJson" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoResultadoAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogSincronizacao" (
    "id" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "registros" INTEGER NOT NULL DEFAULT 0,
    "mensagem" TEXT,
    "duracaoMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogSincronizacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Servidor_cpf_key" ON "Servidor"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Estudante_matricula_key" ON "Estudante"("matricula");

-- CreateIndex
CREATE INDEX "NotaEstudante_estudanteMatricula_ano_idx" ON "NotaEstudante"("estudanteMatricula", "ano");

-- CreateIndex
CREATE INDEX "FrequenciaEstudante_estudanteMatricula_data_idx" ON "FrequenciaEstudante"("estudanteMatricula", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_codigo_key" ON "Avaliacao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoResultadoAluno_avaliacaoId_estudanteId_key" ON "AvaliacaoResultadoAluno"("avaliacaoId", "estudanteId");

-- AddForeignKey
ALTER TABLE "Servidor" ADD CONSTRAINT "Servidor_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudante" ADD CONSTRAINT "Estudante_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaEstudante" ADD CONSTRAINT "NotaEstudante_estudanteMatricula_fkey" FOREIGN KEY ("estudanteMatricula") REFERENCES "Estudante"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaEstudante" ADD CONSTRAINT "FrequenciaEstudante_estudanteMatricula_fkey" FOREIGN KEY ("estudanteMatricula") REFERENCES "Estudante"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoQuestao" ADD CONSTRAINT "AvaliacaoQuestao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoResultadoAluno" ADD CONSTRAINT "AvaliacaoResultadoAluno_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoResultadoAluno" ADD CONSTRAINT "AvaliacaoResultadoAluno_estudanteId_fkey" FOREIGN KEY ("estudanteId") REFERENCES "Estudante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoResultadoAluno" ADD CONSTRAINT "AvaliacaoResultadoAluno_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
