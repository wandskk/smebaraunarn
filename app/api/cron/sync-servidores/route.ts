import { NextResponse, type NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { syncServidoresChunk } from "@/lib/sync/sigeduc-sync";

/**
 * Ajuste conforme o plano Vercel: Hobby permite até 300s por função com
 * Fluid Compute habilitado (padrão em projetos novos); Pro permite até 800s.
 * Se a execução for interrompida no meio, o progresso já feito fica salvo —
 * o próximo disparo do cron continua a partir do início novamente (o
 * upsert por CPF é idempotente, então reprocessar não duplica nada).
 */
export const maxDuration = 300;

/** Diário: consulta-servidor completo (inclui cargos lotados na Secretaria). */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    let pagina = 0;
    let done = false;
    let total = 0;
    let syncStartedAt: string | undefined;

    while (!done) {
      const result = await syncServidoresChunk(pagina, undefined, syncStartedAt);
      syncStartedAt = result.syncStartedAt;
      total += result.registrosNestaExecucao;
      done = result.done;
      pagina = result.nextPagina;
    }

    return NextResponse.json({ ok: true, totalRegistros: total });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
