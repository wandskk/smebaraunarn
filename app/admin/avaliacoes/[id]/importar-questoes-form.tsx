"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  previewImportQuestoesAction,
  commitImportQuestoesAction,
  type QuestaoImportada,
  type CommitQuestoesState,
} from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

/**
 * Fluxo em duas etapas: "Analisar" só lê e valida o arquivo (nada é
 * gravado); "Confirmar" reenvia as MESMAS linhas já validadas (guardadas
 * aqui em estado), nunca relê o arquivo. Assim o que o usuário confirma é
 * exatamente o que ele viu no preview.
 */
export function ImportarQuestoesForm({ avaliacaoId }: { avaliacaoId: string }) {
  const [linhas, setLinhas] = useState<QuestaoImportada[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CommitQuestoesState | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAnalisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResultado(null);
    startTransition(async () => {
      const resposta = await previewImportQuestoesAction(avaliacaoId, formData);
      setErro(resposta.error);
      setLinhas(resposta.error ? null : resposta.linhas);
    });
  }

  function handleConfirmar() {
    if (!linhas) return;
    startTransition(async () => {
      const resposta = await commitImportQuestoesAction(avaliacaoId, linhas);
      setResultado(resposta);
      setLinhas(null);
    });
  }

  const validas = linhas?.filter((l) => !l.erro) ?? [];
  const comErro = linhas?.filter((l) => l.erro) ?? [];

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
        Colunas aceitas (cabeçalho flexível a maiúsculas/acentos): <code>numero</code> (obrigatório, único no
        arquivo), <code>descritor</code>, <code>gabarito</code>, <code>peso</code> (padrão 1),{" "}
        <code>enunciado</code>. Número já cadastrado nesta avaliação é ignorado na confirmação, não sobrescrito.
      </p>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {linhas && linhas.length > 0 && (
        <div>
          <p className="text-sm text-foreground">
            {validas.length} linha(s) prontas para importar
            {comErro.length > 0 && (
              <>
                {" · "}
                <span className="text-danger">{comErro.length} com erro (não serão gravadas)</span>
              </>
            )}
          </p>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Linha</TableHeadCell>
                  <TableHeadCell>Nº</TableHeadCell>
                  <TableHeadCell>Descritor</TableHeadCell>
                  <TableHeadCell>Gabarito</TableHeadCell>
                  <TableHeadCell>Peso</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.linha}>
                    <TableCell className="text-foreground-muted">{l.linha}</TableCell>
                    <TableCell className="text-foreground">{l.numero ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{l.descritor ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{l.gabaritoCorreto ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{l.peso}</TableCell>
                    <TableCell>{l.erro ? <Badge variant="danger">{l.erro}</Badge> : <Badge variant="success">OK</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
          <div className="mt-3">
            <Button type="button" onClick={handleConfirmar} disabled={pending || validas.length === 0}>
              {pending ? "Importando..." : `Confirmar importação (${validas.length})`}
            </Button>
          </div>
        </div>
      )}

      {resultado && (
        <p className="text-sm text-success-subtle-foreground">
          {resultado.criadas} questão(ões) criada(s).
          {resultado.ignoradasPorDuplicidade.length > 0 &&
            ` ${resultado.ignoradasPorDuplicidade.length} ignorada(s) por já existir (nº ${resultado.ignoradasPorDuplicidade.join(", ")}).`}
        </p>
      )}
    </div>
  );
}
