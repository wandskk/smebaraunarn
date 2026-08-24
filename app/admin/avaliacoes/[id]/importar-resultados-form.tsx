"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  previewImportResultadosAction,
  commitImportResultadosAction,
  type ResultadoImportado,
  type CommitResultadosState,
} from "../actions";
import { NIVEL_FLUENCIA_LABEL } from "@/lib/queries/avaliacoes";
import type { NivelFluencia } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

const STATUS_LABEL: Record<ResultadoImportado["status"], string> = {
  ok: "OK",
  nao_encontrado: "Não encontrado",
  ambiguo: "Ambíguo",
  erro_dado: "Dado inválido",
};

const STATUS_VARIANT: Record<ResultadoImportado["status"], BadgeVariant> = {
  ok: "success",
  nao_encontrado: "warning",
  ambiguo: "warning",
  erro_dado: "danger",
};

export function ImportarResultadosForm({ avaliacaoId }: { avaliacaoId: string }) {
  const [linhas, setLinhas] = useState<ResultadoImportado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CommitResultadosState | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAnalisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResultado(null);
    startTransition(async () => {
      const resposta = await previewImportResultadosAction(avaliacaoId, formData);
      setErro(resposta.error);
      setLinhas(resposta.error ? null : resposta.linhas);
    });
  }

  function handleConfirmar() {
    if (!linhas) return;
    startTransition(async () => {
      const resposta = await commitImportResultadosAction(avaliacaoId, linhas);
      setResultado(resposta);
      setLinhas(null);
    });
  }

  const ok = linhas?.filter((l) => l.status === "ok") ?? [];
  const comProblema = linhas?.filter((l) => l.status !== "ok") ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleAnalisar} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-foreground-muted">Arquivo (CSV ou XLSX)</label>
          <Input type="file" name="arquivo" accept=".csv,.xlsx,.xls" required />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Analisando..." : "Analisar arquivo"}
        </Button>
      </form>
      <p className="text-xs text-foreground-muted/70">
        Identifique o aluno por <code>matricula</code>, <code>cpf</code>, ou <code>nome</code> (+ opcionalmente{" "}
        <code>escola</code>/<code>turma</code> para desambiguar — nome sozinho numa rede grande costuma achar mais
        de um aluno). Outras colunas aceitas: <code>turma</code>, <code>pontuacao</code>,{" "}
        <code>nivel</code> (nome ou código do nível de fluência), <code>palavras_por_min</code>,{" "}
        <code>observacoes</code>, e <code>resposta_1</code>, <code>resposta_2</code>... por questão (também aceita{" "}
        <code>q1</code>/<code>questao_1</code>).
      </p>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {linhas && linhas.length > 0 && (
        <div>
          <p className="text-sm text-foreground">
            {ok.length} linha(s) prontas para importar
            {comProblema.length > 0 && (
              <>
                {" · "}
                <span className="text-danger">{comProblema.length} com problema (não serão gravadas)</span>
              </>
            )}
          </p>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Linha</TableHeadCell>
                  <TableHeadCell>Identificado por</TableHeadCell>
                  <TableHeadCell>Aluno</TableHeadCell>
                  <TableHeadCell>Turma</TableHeadCell>
                  <TableHeadCell>Nível</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.linha}>
                    <TableCell className="text-foreground-muted">{l.linha}</TableCell>
                    <TableCell className="text-foreground-muted">{l.identificadorUsado}</TableCell>
                    <TableCell className="text-foreground">{l.nomeEstudante ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{l.turma ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">
                      {l.nivelDesempenho ? NIVEL_FLUENCIA_LABEL[l.nivelDesempenho as NivelFluencia] : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[l.status]} title={l.detalhe ?? undefined}>
                        {STATUS_LABEL[l.status]}
                      </Badge>
                      {l.detalhe && <div className="mt-0.5 text-xs text-foreground-muted/70">{l.detalhe}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
          <div className="mt-3">
            <Button type="button" onClick={handleConfirmar} disabled={pending || ok.length === 0}>
              {pending ? "Importando..." : `Confirmar importação (${ok.length})`}
            </Button>
          </div>
        </div>
      )}

      {resultado && <p className="text-sm text-success-subtle-foreground">{resultado.gravados} resultado(s) gravado(s).</p>}
    </div>
  );
}
