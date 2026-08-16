"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { syncServidoresChunkAction } from "./actions";

export function ServidorSyncButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pagina: number; total: number; registros: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setRunning(true);
    setError(null);
    setProgress(null);
    let pagina = 0;
    let totalRegistros = 0;
    let syncStartedAt: string | undefined;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await syncServidoresChunkAction(pagina, syncStartedAt);
        syncStartedAt = result.syncStartedAt;
        totalRegistros += result.registrosNestaExecucao;
        setProgress({ pagina: result.nextPagina, total: result.totalPaginas, registros: totalRegistros });
        if (result.done) break;
        pagina = result.nextPagina;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setRunning(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={running}
      className="flex w-full flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-brand-300 hover:shadow-sm disabled:opacity-70"
    >
      {running ? (
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      ) : (
        <RefreshCw className="h-5 w-5 text-brand-600" />
      )}
      <span className="text-sm font-semibold text-slate-900">3. Servidores</span>
      <span className="text-xs text-slate-500">
        Consulta /consulta-servidor (inclui cargos lotados na Secretaria)
      </span>
      {progress && (
        <span className="text-xs text-brand-700">
          {progress.pagina}/{progress.total} páginas · {progress.registros} registro(s)
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </button>
  );
}
