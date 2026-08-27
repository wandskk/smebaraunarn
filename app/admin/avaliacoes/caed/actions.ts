"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { parseArquivoTabular } from "@/lib/import/parse-tabular";
import {
  validarLinhasResultadoTurma,
  commitResultadosTurmaImportados,
  type FiltroCaed,
  type ResultadoTurmaImportado,
} from "@/lib/import/caed-turma-import";

export type { FiltroCaed, ResultadoTurmaImportado };

export interface PreviewCaedArquivo {
  nomeArquivo: string;
  linhas: ResultadoTurmaImportado[];
  erro: string | null;
}

export interface PreviewCaedState {
  error: string | null;
  arquivos: PreviewCaedArquivo[];
}

/**
 * Lê e valida um ou mais CSVs "Habilidade, Participação e Desempenho -
 * Turma" baixados do portal Criança Alfabetizada (CAEd), todos contra o
 * mesmo filtro (ciclo/ano/ano escolar/componente/rede) selecionado no
 * formulário — cada combinação de filtro do site gera exatamente um CSV.
 */
export async function previewImportCaedAction(filtro: FiltroCaed, formData: FormData): Promise<PreviewCaedState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const arquivos = formData.getAll("arquivos").filter((a): a is File => a instanceof File && a.size > 0);
  if (arquivos.length === 0) {
    return { error: "Selecione ao menos um arquivo CSV.", arquivos: [] };
  }

  const resultado: PreviewCaedArquivo[] = [];
  for (const arquivo of arquivos) {
    try {
      const linhasBrutas = await parseArquivoTabular(arquivo);
      if (linhasBrutas.length === 0) {
        resultado.push({ nomeArquivo: arquivo.name, linhas: [], erro: "Arquivo vazio ou sem linhas de dado (só cabeçalho)." });
        continue;
      }
      resultado.push({ nomeArquivo: arquivo.name, linhas: await validarLinhasResultadoTurma(linhasBrutas, filtro), erro: null });
    } catch {
      resultado.push({ nomeArquivo: arquivo.name, linhas: [], erro: "Não foi possível ler o arquivo. Confirme que é um CSV ou XLSX válido." });
    }
  }

  return { error: null, arquivos: resultado };
}

export interface CommitCaedState {
  error: string | null;
  gravados: number;
}

export async function commitImportCaedAction(filtro: FiltroCaed, arquivos: PreviewCaedArquivo[]): Promise<CommitCaedState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const todasLinhas = arquivos.flatMap((a) => a.linhas);
  const gravados = await commitResultadosTurmaImportados(filtro, todasLinhas);

  revalidatePath("/admin/avaliacoes");
  return { error: null, gravados };
}
