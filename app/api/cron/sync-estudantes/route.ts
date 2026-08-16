import { NextResponse, type NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { syncEstudantesChunk } from "@/lib/sync/sigeduc-sync";

export const maxDuration = 300;

/** Diário: estudantes enturmados no ano corrente, em lotes por escola. */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const ano = new Date().getFullYear();
    let index = 0;
    let done = false;
    let total = 0;

    while (!done) {
      const result = await syncEstudantesChunk(ano, index);
      total += result.registrosNestaExecucao;
      done = result.done;
      index = result.nextIndex;
    }

    return NextResponse.json({ ok: true, ano, totalRegistros: total });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
