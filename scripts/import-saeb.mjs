/**
 * scripts/import-saeb.mjs
 *
 * Importa as planilhas SAEB de Baraúna/RN para o banco Neon (via Prisma).
 * Cobre edições: 2019, 2021, 2023, 2025.
 *
 * Uso:
 *   node scripts/import-saeb.mjs
 *   node scripts/import-saeb.mjs --dry-run   (apenas mostra o que seria importado)
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const prisma = new PrismaClient();

// ─── Configuração dos arquivos ────────────────────────────────────────────────

const MUNICIPIO_FILES = [
  { ano: 2019, file: "saeb_barauna/saeb_2019_barauna_rn.xlsx", sheet: "Baraúna RN (2019)" },
  { ano: 2021, file: "saeb_barauna/saeb_2021_barauna_rn.xlsx", sheet: "Baraúna RN (2021)" },
  { ano: 2023, file: "saeb_barauna/saeb_2023_barauna_rn.xlsx", sheet: "Baraúna RN (2023)" },
  { ano: 2025, file: "saeb_barauna/saeb_2025_barauna_rn.xlsx", sheet: "Baraúna RN (2025)" },
];

const ESCOLA_FILES = [
  {
    ano: 2023,
    file: "saeb_barauna/saeb_2023_barauna_rn_municipio_e_escolas.xlsx",
    sheets: [
      { sheet: "Escolas (Anos Iniciais)", segmento: "iniciais" },
      { sheet: "Escolas (Anos Finais)", segmento: "finais" },
      { sheet: "Escolas (Ensino Médio)", segmento: "medio" },
    ],
  },
  {
    ano: 2025,
    file: "saeb_barauna/saeb_2025_barauna_rn_municipio_e_escolas.xlsx",
    sheets: [
      { sheet: "Escolas (Anos Iniciais)", segmento: "iniciais" },
      { sheet: "Escolas (Anos Finais)", segmento: "finais" },
      { sheet: "Escolas (Ensino Médio)", segmento: "medio" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v) {
  if (v === null || v === undefined || v === "" || v === "-") return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

/**
 * Extrai campos nivel_N_<comp><serie> da linha e retorna JSON { "0": %, "1": %, ... }
 * Ex: nivel_0_LP5, nivel_1_LP5, ..., nivel_9_LP5
 */
function extrairNiveis(row, prefixo) {
  const resultado = {};
  let temAlgum = false;
  for (let i = 0; i <= 10; i++) {
    const chave = `nivel_${i}_${prefixo}`;
    const valor = toNum(row[chave]);
    if (valor !== null) {
      resultado[String(i)] = valor;
      temAlgum = true;
    }
  }
  return temAlgum ? resultado : null;
}

function lerPlanilha(filePath, sheetName) {
  const wb = XLSX.readFile(path.join(ROOT, filePath));
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Aba "${sheetName}" não encontrada em ${filePath}`);
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function log(msg) {
  console.log(`[SAEB] ${msg}`);
}

// ─── Importação do município ──────────────────────────────────────────────────

async function importarMunicipio() {
  log("=== Importando dados municipais ===");
  let total = 0;

  for (const { ano, file, sheet } of MUNICIPIO_FILES) {
    const rows = lerPlanilha(file, sheet);
    log(`  ${ano}: ${rows.length} linhas lidas`);

    for (const row of rows) {
      // 2019 não tem ANO_SAEB na coluna, mas já sabemos pelo arquivo
      const anoSaeb = row.ANO_SAEB ? Number(row.ANO_SAEB) : ano;
      const dependenciaAdm = String(row.DEPENDENCIA_ADM ?? "").trim();
      const localizacao = String(row.LOCALIZACAO ?? "").trim();

      if (!dependenciaAdm || !localizacao) continue;

      const data = {
        anoSaeb,
        dependenciaAdm,
        localizacao,
        media5Lp: toNum(row.MEDIA_5_LP),
        media5Mt: toNum(row.MEDIA_5_MT),
        media9Lp: toNum(row.MEDIA_9_LP),
        media9Mt: toNum(row.MEDIA_9_MT),
        media12Lp: toNum(row.MEDIA_12_LP),
        media12Mt: toNum(row.MEDIA_12_MT),
        niveisLp5: extrairNiveis(row, "LP5"),
        niveisMt5: extrairNiveis(row, "MT5"),
        niveisLp9: extrairNiveis(row, "LP9"),
        niveisMt9: extrairNiveis(row, "MT9"),
        niveisLp12: extrairNiveis(row, "LP12"),
        niveisMt12: extrairNiveis(row, "MT12"),
      };

      if (DRY_RUN) {
        console.log("  [DRY]", anoSaeb, dependenciaAdm, localizacao, "LP5:", data.media5Lp, "MT5:", data.media5Mt);
        total++;
        continue;
      }

      await prisma.saebResultadoMunicipio.upsert({
        where: { anoSaeb_dependenciaAdm_localizacao: { anoSaeb, dependenciaAdm, localizacao } },
        update: data,
        create: data,
      });
      total++;
    }
  }

  log(`✅ Município: ${total} registros ${DRY_RUN ? "(dry-run)" : "importados"}`);
  return total;
}

// ─── Importação de escolas ────────────────────────────────────────────────────

async function importarEscolas() {
  log("=== Importando dados por escola (apenas Municipais) ===");
  let total = 0;
  let vinculadas = 0;
  let semVinculo = 0;

  // Remover registros Estaduais que possam ter sido importados anteriormente
  if (!DRY_RUN) {
    const deletadas = await prisma.saebResultadoEscola.deleteMany({
      where: { rede: { not: 'Municipal' } },
    });
    if (deletadas.count > 0) {
      log(`  ♻️  ${deletadas.count} registros não-Municipais removidos do banco`);
    }
  }

  // Pré-carregar escolas do banco para vincular por codigoInep
  const escolasBanco = await prisma.escola.findMany({
    select: { id: true, codigoInep: true, nome: true },
  });
  const mapaEscola = new Map(
    escolasBanco
      .filter((e) => e.codigoInep)
      .map((e) => [String(e.codigoInep).trim(), e.id])
  );
  log(`  Escolas no banco com codigoInep: ${mapaEscola.size}`);

  for (const { ano, file, sheets } of ESCOLA_FILES) {
    for (const { sheet, segmento } of sheets) {
      let rows;
      try {
        rows = lerPlanilha(file, sheet);
      } catch {
        log(`  ⚠️  Aba "${sheet}" não encontrada em ${file} — pulando`);
        continue;
      }

      log(`  ${ano} · ${segmento}: ${rows.length - 0} linhas`);

      for (const row of rows) {
        const codigoInep = String(row.ID_ESCOLA ?? "").trim();
        const nomeEscola = String(row.NO_ESCOLA ?? "").trim();
        const rede = String(row.REDE ?? "").trim();

        if (!codigoInep || !nomeEscola) continue;

        // Apenas escolas Municipais
        if (rede.toLowerCase() !== 'municipal') continue;

        // Construir indicadorRend histórico (JSON) — colunas VL_INDICADOR_REND_<ANO>
        const indicadorRend = {};
        for (const coluna of Object.keys(row)) {
          const match = coluna.match(/^VL_INDICADOR_REND_(\d{4})$/);
          if (match) {
            const v = toNum(row[coluna]);
            if (v !== null) indicadorRend[match[1]] = v;
          }
        }

        // Construir aprovações (JSON) — colunas VL_APROVACAO_<ANO>_<SERIE>
        const aprovacoes = {};
        for (const coluna of Object.keys(row)) {
          const match = coluna.match(/^VL_APROVACAO_(\d{4})_(.+)$/);
          if (match) {
            const v = toNum(row[coluna]);
            if (v !== null) {
              const chave = `${match[1]}_${match[2]}`;
              aprovacoes[chave] = v;
            }
          }
        }

        const escolaId = mapaEscola.get(codigoInep) ?? null;
        if (escolaId) vinculadas++;
        else semVinculo++;

        const data = {
          anoSaeb: ano,
          codigoInep,
          nomeEscola,
          rede,
          segmento,
          indicadorRend: Object.keys(indicadorRend).length ? indicadorRend : null,
          aprovacoes: Object.keys(aprovacoes).length ? aprovacoes : null,
          escolaId,
        };

        if (DRY_RUN) {
          console.log("  [DRY]", ano, codigoInep, nomeEscola, segmento, "vinculada:", !!escolaId);
          total++;
          continue;
        }

        await prisma.saebResultadoEscola.upsert({
          where: { anoSaeb_codigoInep_segmento: { anoSaeb: ano, codigoInep, segmento } },
          update: data,
          create: data,
        });
        total++;
      }
    }
  }

  log(`✅ Escolas: ${total} registros ${DRY_RUN ? "(dry-run)" : "importados"}`);
  log(`   Vinculadas ao cadastro: ${vinculadas}`);
  log(`   Sem vínculo (codigoInep não encontrado): ${semVinculo}`);
  return { total, vinculadas, semVinculo };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) log("🔍 Modo DRY-RUN — nenhuma gravação será feita\n");

  const startMs = Date.now();

  const totalMunicipio = await importarMunicipio();
  const { total: totalEscola, vinculadas, semVinculo } = await importarEscolas();

  const duracaoS = ((Date.now() - startMs) / 1000).toFixed(1);

  log("\n=== Relatório Final ===");
  log(`Município: ${totalMunicipio} registros`);
  log(`Escolas:   ${totalEscola} registros (${vinculadas} vinculadas, ${semVinculo} sem vínculo)`);
  log(`Duração:   ${duracaoS}s`);

  if (!DRY_RUN) {
    log("\n💡 Próximo passo: Acesse /admin/avaliacoes/saeb para ver os dados.");
  }
}

main()
  .catch((e) => {
    console.error("[SAEB] Erro fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
