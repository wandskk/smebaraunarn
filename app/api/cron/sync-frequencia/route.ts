import { NextResponse, type NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { syncFrequenciaChunk } from "@/lib/sync/sigeduc-sync";

export const maxDuration = 120;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Diário, incremental: sincroniza só uma janela curta (hoje e os 3 dias
 * anteriores, para pegar lançamentos tardios/correções), em vez do ano
 * inteiro. Isso é o que torna viável rodar todo dia — um sync completo do
 * ano letivo levaria muitas horas dado o volume da API (dezenas de
 * milhares de registros por poucos dias).
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 3);

    const dataInicio = isoDate(inicio);
    const dataFim = isoDate(hoje);

    let pagina = 0;
    let done = false;
    let total = 0;

    while (!done) {
      const result = await syncFrequenciaChunk(dataInicio, dataFim, pagina);
      total += result.registrosNestaExecucao;
      done = result.done;
      pagina = result.nextPagina;
    }

    return NextResponse.json({ ok: true, dataInicio, dataFim, totalRegistros: total });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
