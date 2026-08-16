import { NextResponse, type NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { syncCargos, syncEscolas } from "@/lib/sync/sigeduc-sync";

export const maxDuration = 60;

/** Diário: escolas e cargos são pequenos e mudam raramente. */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const escolas = await syncEscolas();
    const cargos = await syncCargos();
    return NextResponse.json({ ok: true, escolas, cargos });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
