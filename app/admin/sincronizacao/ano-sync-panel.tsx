"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Progress {
  atual: number;
  total: number;
  registros: number;
}

interface AnoSyncPanelProps {
  numero: string;
  titulo: string;
  desc: string;
  anoAtual: number;
  /** Menor ano com dados no SIGEduc — trava o seletor para não gerar consultas inúteis. */
  anoMinimo?: number;
  runChunk: (ano: number, startIndex: number) => Promise<{
    done: boolean;
    registrosNestaExecucao: number;
    // ChunkResult usa nextIndex/totalEscolas, PageChunkResult usa nextPagina/totalPaginas
    nextIndex?: number;
    totalEscolas?: number;
    nextPagina?: number;
    totalPaginas?: number;
  }>;
}

export function AnoSyncPanel({ numero, titulo, desc, anoAtual, anoMinimo = 2020, runChunk }: AnoSyncPanelProps) {
  const router = useRouter();
  const [ano, setAno] = useState(anoAtual);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setRunning(true);
    setError(null);
    setProgress(null);
    let start = 0;
    let totalRegistros = 0;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await runChunk(ano, start);
        totalRegistros += result.registrosNestaExecucao;
        const atual = result.nextIndex ?? result.nextPagina ?? 0;
        const total = result.totalEscolas ?? result.totalPaginas ?? 0;
        setProgress({ atual, total, registros: totalRegistros });
        if (result.done) break;
        start = atual;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        {running ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <CalendarClock className="h-5 w-5 text-primary" />
        )}
        <span className="text-sm font-semibold text-foreground">{numero}. {titulo}</span>
      </div>
      <span className="text-xs text-foreground-muted">{desc}</span>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-foreground-muted">Ano</label>
          <Input
            type="number"
            value={ano}
            min={anoMinimo}
            max={anoAtual}
            onChange={(e) => setAno(Number(e.target.value))}
            disabled={running}
            className="w-24 py-1.5"
          />
        </div>
        <Button type="button" size="sm" onClick={handleClick} disabled={running}>
          {running ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      {progress && (
        <span className="text-xs text-primary-subtle-foreground">
          {progress.atual}/{progress.total} · {progress.registros} registro(s)
        </span>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
