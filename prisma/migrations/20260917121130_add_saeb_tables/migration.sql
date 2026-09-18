-- CreateTable
CREATE TABLE "SaebResultadoMunicipio" (
    "id" TEXT NOT NULL,
    "anoSaeb" INTEGER NOT NULL,
    "dependenciaAdm" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "media5Lp" DOUBLE PRECISION,
    "media5Mt" DOUBLE PRECISION,
    "media9Lp" DOUBLE PRECISION,
    "media9Mt" DOUBLE PRECISION,
    "media12Lp" DOUBLE PRECISION,
    "media12Mt" DOUBLE PRECISION,
    "niveisLp5" JSONB,
    "niveisMt5" JSONB,
    "niveisLp9" JSONB,
    "niveisMt9" JSONB,
    "niveisLp12" JSONB,
    "niveisMt12" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaebResultadoMunicipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaebResultadoEscola" (
    "id" TEXT NOT NULL,
    "anoSaeb" INTEGER NOT NULL,
    "codigoInep" TEXT NOT NULL,
    "nomeEscola" TEXT NOT NULL,
    "rede" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "indicadorRend" JSONB,
    "aprovacoes" JSONB,
    "escolaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaebResultadoEscola_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaebResultadoMunicipio_anoSaeb_idx" ON "SaebResultadoMunicipio"("anoSaeb");

-- CreateIndex
CREATE UNIQUE INDEX "SaebResultadoMunicipio_anoSaeb_dependenciaAdm_localizacao_key" ON "SaebResultadoMunicipio"("anoSaeb", "dependenciaAdm", "localizacao");

-- CreateIndex
CREATE INDEX "SaebResultadoEscola_codigoInep_idx" ON "SaebResultadoEscola"("codigoInep");

-- CreateIndex
CREATE INDEX "SaebResultadoEscola_anoSaeb_idx" ON "SaebResultadoEscola"("anoSaeb");

-- CreateIndex
CREATE UNIQUE INDEX "SaebResultadoEscola_anoSaeb_codigoInep_segmento_key" ON "SaebResultadoEscola"("anoSaeb", "codigoInep", "segmento");

-- AddForeignKey
ALTER TABLE "SaebResultadoEscola" ADD CONSTRAINT "SaebResultadoEscola_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;
