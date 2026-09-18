import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import * as XLSX from 'xlsx';
import readline from 'readline';

// Mapeamento das URLs oficiais de resultados do SAEB no INEP (nível municipal)
interface EdicaoSaeb {
  ano: number;
  url: string;
  formato: 'xlsx' | 'xlsb' | 'xls' | 'rar' | 'zip';
  descricao: string;
}

const EDICOES_CONHECIDAS: Record<number, EdicaoSaeb> = {
  2025: {
    ano: 2025,
    url: 'https://download.inep.gov.br/saeb/resultados/saeb_2025_brasil_estados_municipios_censitario.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2025 (Censitário - Brasil, Estados e Municípios)',
  },
  2023: {
    ano: 2023,
    url: 'https://download.inep.gov.br/saeb/resultados/planilha_de_resultados_2023.rar',
    formato: 'rar',
    descricao: 'Resultados do Saeb 2023 (Pacote com planilha completa de Municípios)',
  },
  2021: {
    ano: 2021,
    url: 'https://download.inep.gov.br/saeb/resultados/saeb_2021_brasil_estados_municipios.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2021 (Brasil, Estados e Municípios)',
  },
  2019: {
    ano: 2019,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/2019/resultados/Resultados_Saeb_2019_Brasil_Estados_Municipios.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2019 (Brasil, Estados e Municípios)',
  },
  2017: {
    ano: 2017,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/2019/resultados/Resultados_Saeb_2017_Brasil_Estados_Municipios.zip',
    formato: 'zip',
    descricao: 'Resultados do Saeb 2017 (Pacote de tabelas municipais TS_MUNICIPIO)',
  },
  2015: {
    ano: 2015,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/aneb_anresc/resultados/resultados_municipais_saeb_2015.xls',
    formato: 'xls',
    descricao: 'Resultados do Saeb 2015 (Municípios)',
  },
  2013: {
    ano: 2013,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/2013/resultado/resultados_saeb_2013_brasil_estados_municipios.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2013 (Brasil, Estados e Municípios)',
  },
  2011: {
    ano: 2011,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/2011/resultado/resultados_saeb_2011_brasil_estados_municipios.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2011 (Brasil, Estados e Municípios)',
  },
  2009: {
    ano: 2009,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/2009/resultado/resultados_saeb_2009_brasil__regioes_estados_municipios.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2009 (Brasil, Estados e Municípios)',
  },
  2007: {
    ano: 2007,
    url: 'https://download.inep.gov.br/educacao_basica/saeb/2007/resultado/resultados_saeb_2007_brasil_estados_municipios.xlsx',
    formato: 'xlsx',
    descricao: 'Resultados do Saeb 2007 (Brasil, Estados e Municípios)',
  },
};

// Bases oficiais de resultados por escola do INEP (SAEB + IDEB histórico por escola)
const URLS_ESCOLAS = {
  iniciais: 'https://download.inep.gov.br/ideb/resultados/divulgacao_anos_iniciais_escolas_2025.zip',
  finais: 'https://download.inep.gov.br/ideb/resultados/divulgacao_anos_finais_escolas_2025.zip',
  medio: 'https://download.inep.gov.br/ideb/resultados/divulgacao_ensino_medio_escolas_2025.zip',
};

const BARAUNA_CONFIG = {
  nome: 'Baraúna',
  uf: 'RN',
  co_uf: 24,
  codigoIbge7: '2401453',
  codigoIbgeInformado: '2401450',
  prefixoIbge: '240145',
};

const CACHE_DIR = path.resolve(process.cwd(), 'saeb_cache');
const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'saeb_barauna');

function normalizarTexto(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function colToNum(col: string): number {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num;
}

function baixarArquivo(url: string, destino: string): void {
  const dir = path.dirname(destino);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`\n⬇️  Baixando arquivo de: ${url}`);
  console.log(`📁 Destino: ${destino}`);

  const cmd = `curl.exe --retry 5 --retry-delay 2 --retry-all-errors -k -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o "${destino}" "${url}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    throw new Error(`Falha ao baixar o arquivo: ${(err as Error).message}`);
  }

  if (!fs.existsSync(destino) || fs.statSync(destino).size === 0) {
    throw new Error(`O arquivo baixado está vazio ou não foi salvo.`);
  }

  const tamanhoMb = (fs.statSync(destino).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Download concluído com sucesso (${tamanhoMb} MB)!`);
}

function descompactarArquivo(origem: string, destinoDir: string): void {
  if (!fs.existsSync(destinoDir)) fs.mkdirSync(destinoDir, { recursive: true });
  console.log(`📦 Extraindo pacote para: ${destinoDir}...`);

  const cmd = `tar -xf "${origem}" -C "${destinoDir}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Arquivos extraídos com sucesso!`);
  } catch (err) {
    throw new Error(`Falha ao descompactar o arquivo: ${(err as Error).message}`);
  }
}

function encontrarPlanilhaMunicipal(diretorioOuArquivo: string): string {
  if (fs.statSync(diretorioOuArquivo).isFile()) {
    return diretorioOuArquivo;
  }

  const arquivos = fs.readdirSync(diretorioOuArquivo, { recursive: true }) as string[];
  const planilhas = arquivos.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.xlsx', '.xlsb', '.xls'].includes(ext);
  });

  if (planilhas.length === 0) {
    throw new Error(`Nenhuma planilha (.xlsx, .xlsb, .xls) encontrada em: ${diretorioOuArquivo}`);
  }

  const prioritaria = planilhas.find(p => {
    const n = path.basename(p).toLowerCase();
    return (
      n.includes('brasil_estados_municipios') ||
      n.includes('ts_municipio') ||
      n.includes('resultados_municipais') ||
      n.includes('municip')
    );
  });

  const escolhida = prioritaria ?? planilhas[0];
  return path.resolve(diretorioOuArquivo, String(escolhida));
}

function linhaPertenceABarauna(row: any[], header: string[]): boolean {
  let idxCodMun = -1;
  let idxNomeMun = -1;
  let idxUf = -1;
  let idxCodUf = -1;

  for (let i = 0; i < header.length; i++) {
    const col = normalizarTexto(header[i]);
    if (col === 'co_municipio' || col === 'cod_municipio' || col === 'ibge' || col === 'codigo_municipio') {
      idxCodMun = i;
    } else if (col === 'no_municipio' || col === 'municipio' || col === 'nome_municipio') {
      idxNomeMun = i;
    } else if (col === 'sg_uf' || col === 'uf' || col === 'sigla_uf') {
      idxUf = i;
    } else if (col === 'co_uf' || col === 'cod_uf' || col === 'codigo_uf') {
      idxCodUf = i;
    }
  }

  if (idxCodMun !== -1 && row[idxCodMun] !== undefined) {
    const cod = String(row[idxCodMun]).trim();
    if (
      cod === BARAUNA_CONFIG.codigoIbge7 ||
      cod === BARAUNA_CONFIG.codigoIbgeInformado ||
      cod.startsWith(BARAUNA_CONFIG.prefixoIbge)
    ) {
      return true;
    }
  }

  const rowText = row.map(v => (v !== null && v !== undefined ? String(v) : ''));
  const temNomeBarauna =
    (idxNomeMun !== -1 && normalizarTexto(row[idxNomeMun]).includes('barauna')) ||
    rowText.some(v => normalizarTexto(v) === 'barauna' || normalizarTexto(v) === 'baraúna');

  if (temNomeBarauna) {
    const ehRn =
      (idxUf !== -1 && normalizarTexto(row[idxUf]) === 'rn') ||
      (idxCodUf !== -1 && String(row[idxCodUf]).trim() === '24') ||
      rowText.some(v => {
        const val = normalizarTexto(v);
        return val === 'rn' || val === 'rio grande do norte' || val === '24';
      });

    if (ehRn) return true;
  }

  return rowText.some(
    v =>
      v === BARAUNA_CONFIG.codigoIbge7 ||
      v === BARAUNA_CONFIG.codigoIbgeInformado ||
      v.startsWith(BARAUNA_CONFIG.prefixoIbge)
  );
}

/**
 * Leitor streaming ultrarrápido para extrair apenas Baraúna de grandes planilhas nacionais de escolas
 */
async function parseSharedStrings(tarXlsxPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn('tar', ['-xOf', tarXlsxPath, 'xl/sharedStrings.xml']);
    let xml = '';
    proc.stdout.on('data', chunk => {
      xml += chunk;
    });
    proc.on('close', code => {
      if (code !== 0) return reject(new Error('Falha ao extrair sharedStrings'));
      const strings: string[] = [];
      const siRegex = /<si>([\s\S]*?)<\/si>/gi;
      let siMatch;
      while ((siMatch = siRegex.exec(xml)) !== null) {
        const body = siMatch[1] ?? '';
        const textParts = [...body.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/gi)].map(x => x[1] ?? '');
        strings.push(textParts.join(''));
      }
      resolve(strings);
    });
    proc.on('error', reject);
  });
}

interface DadosEscolasExtraidos {
  header: string[];
  rows: string[][];
}

async function extrairEscolasStream(xlsxPath: string): Promise<DadosEscolasExtraidos> {
  const shared = await parseSharedStrings(xlsxPath);

  return new Promise((resolve, reject) => {
    const proc = spawn('tar', ['-xOf', xlsxPath, 'xl/worksheets/sheet1.xml']);
    let buffer = '';
    const rows: string[][] = [];
    let headerRow: string[] = [];

    proc.stdout.on('data', chunk => {
      buffer += chunk.toString();
      let rowStart;
      while ((rowStart = buffer.indexOf('<row ')) !== -1) {
        const rowEnd = buffer.indexOf('</row>', rowStart);
        if (rowEnd === -1) break;
        const rowXml = buffer.slice(rowStart, rowEnd + 6);
        buffer = buffer.slice(rowEnd + 6);

        const rMatch = rowXml.match(/r="(\d+)"/);
        if (!rMatch) continue;
        const rNum = parseInt(rMatch[1]!, 10);

        const cellRegex = /<c\s+([^>]*?)>(?:<v>([\s\S]*?)<\/v>)?<\/c>/gi;
        const cells: Record<number, string> = {};
        let cMatch;
        let maxCol = 0;

        while ((cMatch = cellRegex.exec(rowXml)) !== null) {
          const attrs = cMatch[1] ?? '';
          const rAttr = attrs.match(/r="([A-Z]+)\d+"/);
          if (!rAttr || !rAttr[1]) continue;
          const colNum = colToNum(rAttr[1]!);
          if (colNum > maxCol) maxCol = colNum;

          const tAttr = attrs.match(/t="([^"]+)"/);
          let val = cMatch[2] ?? '';
          if (tAttr && tAttr[1] === 's') {
            val = shared[parseInt(val, 10)] ?? val;
          }
          cells[colNum] = val;
        }

        // Linha 10 contém as siglas oficiais das variáveis
        if (rNum === 10) {
          headerRow = [];
          for (let c = 1; c <= maxCol; c++) {
            headerRow.push(cells[c] ?? '');
          }
        }

        // Coluna B (colNum 2) é CO_MUNICIPIO — filtra Baraúna
        const codMun = String(cells[2] ?? '');
        const ehBarauna =
          codMun === BARAUNA_CONFIG.codigoIbge7 ||
          codMun === BARAUNA_CONFIG.codigoIbgeInformado ||
          codMun.startsWith(BARAUNA_CONFIG.prefixoIbge);

        if (ehBarauna) {
          const rowArr: string[] = [];
          for (let c = 1; c <= maxCol; c++) {
            rowArr.push(cells[c] ?? '');
          }

          // Coluna F (colNum 6) é REDE — mantém apenas escolas Municipais
          const rede = normalizarTexto(cells[6] ?? '');
          if (rede === 'municipal') {
            rows.push(rowArr);
          }
        }
      }
    });

    proc.stdout.on('end', () => {
      resolve({ header: headerRow, rows });
    });

    proc.on('error', reject);
  });
}

/**
 * Baixa e extrai uma etapa escolar (Iniciais, Finais, Médio)
 */
async function obterDadosEscolaresEtapa(
  etapa: 'iniciais' | 'finais' | 'medio',
  force: boolean
): Promise<DadosEscolasExtraidos> {
  const url = URLS_ESCOLAS[etapa];
  const zipName = `divulgacao_escolas_${etapa}.zip`;
  const zipPath = path.join(CACHE_DIR, zipName);
  const extractDir = path.join(CACHE_DIR, `extracted_escolas_${etapa}`);

  if (!fs.existsSync(zipPath) || force) {
    baixarArquivo(url, zipPath);
  }

  if (!fs.existsSync(extractDir) || force) {
    descompactarArquivo(zipPath, extractDir);
  }

  const arquivos = fs.readdirSync(extractDir, { recursive: true }) as string[];
  const xlsxFile = arquivos.find(f => f.endsWith('.xlsx'));
  if (!xlsxFile) {
    throw new Error(`Planilha .xlsx não encontrada no pacote de escolas (${etapa}).`);
  }

  const xlsxPath = path.join(extractDir, xlsxFile);
  console.log(`⚡ Extraindo escolas de Baraúna - RN de: ${path.basename(xlsxPath)}...`);
  return extrairEscolasStream(xlsxPath);
}

function processarPlanilhaMunicipal(
  caminhoPlanilha: string,
  ano: number
): { header: string[]; rows: any[][]; dicionarioSheet?: XLSX.WorkSheet } {
  console.log(`\n📊 Lendo dados municipais da planilha: ${path.basename(caminhoPlanilha)}...`);
  const wb = XLSX.readFile(caminhoPlanilha, { cellDates: true });

  let sheetNameMunicipios = wb.SheetNames.find(s => {
    const norm = normalizarTexto(s);
    return norm.includes('municip') || norm.includes('ts_municipio');
  });

  if (!sheetNameMunicipios) {
    sheetNameMunicipios = wb.SheetNames[wb.SheetNames.length - 1] || 'Municípios';
  }

  const ws = wb.Sheets[sheetNameMunicipios];
  if (!ws) throw new Error(`Aba "${sheetNameMunicipios}" não encontrada.`);

  const allRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  let headerIndex = 0;
  for (let i = 0; i < Math.min(15, allRows.length); i++) {
    const row = allRows[i] || [];
    const joined = row.map(normalizarTexto).join(' ');
    if (joined.includes('municipio') || joined.includes('co_municipio')) {
      headerIndex = i;
      break;
    }
  }

  const rawHeader = allRows[headerIndex] || [];
  const header = rawHeader.map(h => (h !== null && h !== undefined ? String(h).trim() : ''));
  const dataRows = allRows.slice(headerIndex + 1);
  const rows = dataRows.filter(row => linhaPertenceABarauna(row, header));

  let dicionarioSheet: XLSX.WorkSheet | undefined;
  const sheetDicionario = wb.SheetNames.find(s => {
    const norm = normalizarTexto(s);
    return norm.includes('dicionario') || norm.includes('metadado');
  });
  if (sheetDicionario && wb.Sheets[sheetDicionario]) {
    dicionarioSheet = wb.Sheets[sheetDicionario];
  }

  return { header, rows, dicionarioSheet };
}

function imprimirResumoEscolas(iniciais: DadosEscolasExtraidos, finais: DadosEscolasExtraidos): void {
  console.log('\n🏫 --- ESCOLAS MUNICIPAIS DE BARAÚNA - RN (ANOS INICIAIS / 5º ANO) ---');
  const hIni = iniciais.header;
  const idxLp23 = hIni.indexOf('VL_NOTA_PORTUGUES_2023');
  const idxMt23 = hIni.indexOf('VL_NOTA_MATEMATICA_2023');
  const idxIdeb23 = hIni.indexOf('VL_OBSERVADO_2023');

  console.log(
    `${'INEP'.padEnd(10)} | ${'Nome da Escola'.padEnd(50)} | ${'Rede'.padEnd(11)} | ${'LP 2023'.padEnd(9)} | ${'MT 2023'.padEnd(9)} | ${'IDEB 2023'.padEnd(9)}`
  );
  console.log('-'.repeat(105));
  for (const r of iniciais.rows) {
    const inep = (r[3] ?? '').padEnd(10);
    const nome = (r[4] ?? '').slice(0, 48).padEnd(50);
    const rede = (r[5] ?? '').padEnd(11);
    const lp = (idxLp23 !== -1 && r[idxLp23] ? r[idxLp23] : '-').padEnd(9);
    const mt = (idxMt23 !== -1 && r[idxMt23] ? r[idxMt23] : '-').padEnd(9);
    const ideb = (idxIdeb23 !== -1 && r[idxIdeb23] ? r[idxIdeb23] : '-').padEnd(9);
    console.log(`${inep} | ${nome} | ${rede} | ${lp} | ${mt} | ${ideb}`);
  }
  console.log('-'.repeat(105));

  console.log('\n🏫 --- ESCOLAS MUNICIPAIS DE BARAÚNA - RN (ANOS FINAIS / 9º ANO) ---');
  const hFin = finais.header;
  const idxFinLp23 = hFin.indexOf('VL_NOTA_PORTUGUES_2023');
  const idxFinMt23 = hFin.indexOf('VL_NOTA_MATEMATICA_2023');
  const idxFinIdeb23 = hFin.indexOf('VL_OBSERVADO_2023');

  console.log(
    `${'INEP'.padEnd(10)} | ${'Nome da Escola'.padEnd(50)} | ${'Rede'.padEnd(11)} | ${'LP 2023'.padEnd(9)} | ${'MT 2023'.padEnd(9)} | ${'IDEB 2023'.padEnd(9)}`
  );
  console.log('-'.repeat(105));
  for (const r of finais.rows) {
    const inep = (r[3] ?? '').padEnd(10);
    const nome = (r[4] ?? '').slice(0, 48).padEnd(50);
    const rede = (r[5] ?? '').padEnd(11);
    const lp = (idxFinLp23 !== -1 && r[idxFinLp23] ? r[idxFinLp23] : '-').padEnd(9);
    const mt = (idxFinMt23 !== -1 && r[idxFinMt23] ? r[idxFinMt23] : '-').padEnd(9);
    const ideb = (idxFinIdeb23 !== -1 && r[idxFinIdeb23] ? r[idxFinIdeb23] : '-').padEnd(9);
    console.log(`${inep} | ${nome} | ${rede} | ${lp} | ${mt} | ${ideb}`);
  }
  console.log('-'.repeat(105));
}

async function executarExtracaoCompleta(
  ano: number,
  forceDownload: boolean,
  dirSaida: string
): Promise<string> {
  console.log(`\n============================================================`);
  console.log(`🚀 INICIANDO EXTRAÇÃO COMPLETA (MUNICÍPIO + ESCOLAS) - ANO ${ano}`);
  console.log(`============================================================`);

  const edicao = EDICOES_CONHECIDAS[ano];
  if (!edicao) {
    throw new Error(`Ano ${ano} não homologado para extração.`);
  }

  // 1. Dados do Município
  const extMatch = edicao.url.match(/\.(xlsx|xlsb|rar|zip|xls)/i);
  const extensao = extMatch ? extMatch[1]!.toLowerCase() : 'xlsx';
  const arquivoCache = path.join(CACHE_DIR, `saeb_${ano}_nacional.${extensao}`);

  if (!fs.existsSync(arquivoCache) || forceDownload) {
    baixarArquivo(edicao.url, arquivoCache);
  }

  let caminhoPlanilhaMun: string;
  if (extensao === 'rar' || extensao === 'zip') {
    const dirExtracao = path.join(CACHE_DIR, `saeb_${ano}_extracted`);
    if (!fs.existsSync(dirExtracao) || forceDownload) {
      descompactarArquivo(arquivoCache, dirExtracao);
    }
    caminhoPlanilhaMun = encontrarPlanilhaMunicipal(dirExtracao);
  } else {
    caminhoPlanilhaMun = arquivoCache;
  }

  const dadosMun = processarPlanilhaMunicipal(caminhoPlanilhaMun, ano);
  console.log(`✨ Dados municipais: ${dadosMun.rows.length} registros agregados.`);

  // 2. Dados por Escola (Anos Iniciais, Finais e Médio)
  console.log(`\n🏫 Coletando dados das escolas de Baraúna - RN...`);
  const escolasIniciais = await obterDadosEscolaresEtapa('iniciais', forceDownload);
  const escolasFinais = await obterDadosEscolaresEtapa('finais', forceDownload);
  const escolasMedio = await obterDadosEscolaresEtapa('medio', forceDownload);

  console.log(`✅ Escolas encontradas em Baraúna - RN:`);
  console.log(`   - Anos Iniciais (1º ao 5º ano): ${escolasIniciais.rows.length} escolas`);
  console.log(`   - Anos Finais (6º ao 9º ano): ${escolasFinais.rows.length} escolas`);
  console.log(`   - Ensino Médio: ${escolasMedio.rows.length} escolas`);

  // 3. Monta o novo Workbook integrado
  const novoWb = XLSX.utils.book_new();

  // Aba 1: Município
  const wsMun = XLSX.utils.aoa_to_sheet([dadosMun.header, ...dadosMun.rows]);
  XLSX.utils.book_append_sheet(novoWb, wsMun, `Município (${ano})`);

  // Aba 2: Escolas Anos Iniciais
  const wsIni = XLSX.utils.aoa_to_sheet([escolasIniciais.header, ...escolasIniciais.rows]);
  XLSX.utils.book_append_sheet(novoWb, wsIni, 'Escolas (Anos Iniciais)');

  // Aba 3: Escolas Anos Finais
  const wsFin = XLSX.utils.aoa_to_sheet([escolasFinais.header, ...escolasFinais.rows]);
  XLSX.utils.book_append_sheet(novoWb, wsFin, 'Escolas (Anos Finais)');

  // Aba 4: Escolas Ensino Médio
  const wsMed = XLSX.utils.aoa_to_sheet([escolasMedio.header, ...escolasMedio.rows]);
  XLSX.utils.book_append_sheet(novoWb, wsMed, 'Escolas (Ensino Médio)');

  // Aba 5: Dicionário
  if (dadosMun.dicionarioSheet) {
    XLSX.utils.book_append_sheet(novoWb, dadosMun.dicionarioSheet, 'Dicionário');
  }

  // 4. Salvar arquivo
  if (!fs.existsSync(dirSaida)) fs.mkdirSync(dirSaida, { recursive: true });
  const nomeArquivo = `saeb_${ano}_barauna_rn_municipio_e_escolas.xlsx`;
  const caminhoSaida = path.resolve(dirSaida, nomeArquivo);

  XLSX.writeFile(novoWb, caminhoSaida);
  console.log(`\n🎉 Planilha completa gerada com sucesso!`);
  console.log(`📁 Arquivo salvo em: ${caminhoSaida}`);

  // Exibe tabelas formatadas no terminal
  imprimirResumoEscolas(escolasIniciais, escolasFinais);

  return caminhoSaida;
}

async function perguntarAnoInterativo(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const anosDisponiveis = Object.keys(EDICOES_CONHECIDAS).sort((a, b) => Number(b) - Number(a));

  console.log('\n📚 =======================================================');
  console.log('   EXTRATOR SAEB - MUNICÍPIO E ESCOLAS (BARAÚNA / RN)     ');
  console.log('=======================================================');
  console.log('Edições disponíveis:');
  anosDisponiveis.forEach((a, idx) => {
    const num = Number(a);
    const desc = EDICOES_CONHECIDAS[num]?.descricao ?? '';
    console.log(`  ${idx + 1}. SAEB ${a} - ${desc}`);
  });
  console.log('-------------------------------------------------------');

  return new Promise(resolve => {
    rl.question('\nDigite o ano desejado (ex: 2023, 2021, 2025): ', resposta => {
      rl.close();
      resolve(resposta.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso:
  npx tsx scripts/baixar-saeb.ts [opções]

Opções:
  --ano <ano>       Ano da edição do SAEB (ex: 2025, 2023, 2021, 2019)
  --out <dir>       Diretório onde a nova planilha será salva (padrão: ./saeb_barauna)
  --force           Força novo download mesmo se o arquivo estiver no cache
  --help, -h        Exibe esta mensagem de ajuda

Exemplos:
  npx tsx scripts/baixar-saeb.ts --ano 2023
  npx tsx scripts/baixar-saeb.ts 2023
  npm run saeb:baixar -- 2023
    `);
    process.exit(0);
  }

  let anoArg: string | undefined;
  const idxAno = args.indexOf('--ano');
  if (idxAno !== -1 && args[idxAno + 1]) {
    anoArg = args[idxAno + 1];
  } else {
    const pos = args[0];
    if (pos && !pos.startsWith('--')) {
      anoArg = pos;
    }
  }

  const force = args.includes('--force');
  let outDir = DEFAULT_OUT_DIR;
  const idxOut = args.indexOf('--out');
  if (idxOut !== -1 && args[idxOut + 1]) {
    outDir = path.resolve(process.cwd(), String(args[idxOut + 1]));
  }

  if (!anoArg) {
    anoArg = await perguntarAnoInterativo();
  }

  if (!anoArg) {
    console.log('Nenhum ano selecionado. Operação cancelada.');
    process.exit(0);
  }

  const anoNum = parseInt(anoArg, 10);
  if (isNaN(anoNum)) {
    console.error(`❌ Ano inválido: "${anoArg}". Digite um ano com 4 dígitos (ex: 2023).`);
    process.exit(1);
  }

  await executarExtracaoCompleta(anoNum, force, outDir);
}

main().catch(err => {
  console.error('\n❌ Erro durante a execução:', (err as Error).message);
  process.exit(1);
});
