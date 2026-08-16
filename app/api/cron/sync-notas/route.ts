import { NextResponse, type NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { syncNotasChunk } from "@/lib/sync/sigeduc-sync";

export const maxDuration = 180;

/** Diário: notas do ano corrente. */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const ano = new Date().getFullYear();
    let pagina = 0;
    let done = false;
    let total = 0;

    while (!done) {
      const result = await syncNotasChunk(ano, pagina);
      total += result.registrosNestaExecucao;
      done = result.done;
      pagina = result.nextPagina;
    }

    return NextResponse.json({ ok: true, ano, totalRegistros: total });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
