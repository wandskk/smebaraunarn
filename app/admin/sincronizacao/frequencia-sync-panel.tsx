"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { syncFrequenciaChunkAction } from "./actions";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const hoje = new Date();
  const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { inicio: isoDate(inicioDoMes), fim: isoDate(hoje) };
}

export function FrequenciaSyncPanel() {
  const router = useRouter();
  const { inicio, fim } = defaultRange();
  const [dataInicio, setDataInicio] = useState(inicio);
  const [dataFim, setDataFim] = useState(fim);
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

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await syncFrequenciaChunkAction(dataInicio, dataFim, pagina);
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
    <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        {running ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        ) : (
          <CalendarClock className="h-5 w-5 text-brand-600" />
        )}
        <span className="text-sm font-semibold text-slate-900">6. Frequência</span>
      </div>
      <span className="text-xs text-slate-500">
        Consulta /consulta-frequencia — escolha o período (bases grandes: prefira janelas curtas).
      </span>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            disabled={running}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            disabled={running}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={running}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {running ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {progress && (
        <span className="text-xs text-brand-700">
          {progress.pagina}/{progress.total} páginas · {progress.registros} registro(s)
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
