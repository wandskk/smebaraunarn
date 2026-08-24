import * as XLSX from "xlsx";

/**
 * Uma linha de planilha/CSV já normalizada: chaves em minúsculo, sem
 * acento, sem espaço nas pontas — para o chamador não precisar adivinhar
 * variações de cabeçalho ("Número"/"numero"/"NÚMERO ") linha por linha.
 */
export type LinhaTabular = Record<string, string>;

function normalizarCabecalho(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_");
}

/**
 * Lê um arquivo CSV ou XLSX (a primeira aba) e devolve linhas como objetos
 * chave→valor usando o cabeçalho. Mesma função para os dois formatos —
 * `XLSX.read` já detecta CSV puro pelo conteúdo (sem assinatura ZIP) e
 * decodifica como texto delimitado, sem precisar de um parser CSV à parte.
 * Linhas em branco (todas as células vazias) são descartadas.
 */
export async function parseArquivoTabular(file: File): Promise<LinhaTabular[]> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "array", raw: true });
  const nomeAba = workbook.SheetNames[0];
  if (!nomeAba) return [];
  const aba = workbook.Sheets[nomeAba];
  if (!aba) return [];
  const linhas: unknown[][] = XLSX.utils.sheet_to_json(aba, { header: 1, raw: false, defval: "" });
  if (linhas.length === 0) return [];

  const cabecalho = (linhas[0] as unknown[]).map((h) => normalizarCabecalho(String(h ?? "")));

  return linhas
    .slice(1)
    .filter((linha) => linha.some((celula) => String(celula ?? "").trim() !== ""))
    .map((linha) => {
      const objeto: LinhaTabular = {};
      cabecalho.forEach((chave, indice) => {
        if (!chave) return; // coluna sem cabeçalho — ignorada, não vira chave "" sobrescrevendo outras
        objeto[chave] = String(linha[indice] ?? "").trim();
      });
      return objeto;
    });
}
