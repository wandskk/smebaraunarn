"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  previewImportCaedAction,
  commitImportCaedAction,
  type PreviewCaedArquivo,
  type ResultadoTurmaImportado,
  type FiltroCaed,
  type CommitCaedState,
} from "../actions";
import { CAED_CICLOS, CAED_ANOS_ESCOLARES, CAED_COMPONENTES, CAED_REDES, type CaedCodigoCiclo } from "@/lib/caed-catalogo";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

const STATUS_LABEL: Record<ResultadoTurmaImportado["status"], string> = {
  ok: "OK",
  escola_nao_encontrada: "Escola não encontrada",
  combinacao_diferente: "Combinação diferente",
  erro_dado: "Dado inválido",
};

const STATUS_VARIANT: Record<ResultadoTurmaImportado["status"], BadgeVariant> = {
  ok: "success",
  escola_nao_encontrada: "warning",
  combinacao_diferente: "warning",
  erro_dado: "danger",
};

export function ImportarCaedForm({ anoAtual }: { anoAtual: number }) {
  const [codigoCiclo, setCodigoCiclo] = useState<CaedCodigoCiclo>(CAED_CICLOS[0].codigoCiclo);
  const [ano, setAno] = useState(anoAtual);
  const [anoEscolarValor, setAnoEscolarValor] = useState<string>(CAED_ANOS_ESCOLARES[0].valor);
  const [componenteSlug, setComponenteSlug] = useState<string>(CAED_COMPONENTES[0].slug);
  const [redeValor, setRedeValor] = useState<string>(CAED_REDES[0].valor);
  const [arquivos, setArquivos] = useState<PreviewCaedArquivo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CommitCaedState | null>(null);
  const [pending, startTransition] = useTransition();

  const filtro: FiltroCaed = useMemo(() => {
    const ciclo = CAED_CICLOS.find((c) => c.codigoCiclo === codigoCiclo)!;
    const componente = CAED_COMPONENTES.find((c) => c.slug === componenteSlug)!;
    return {
      codigoCiclo,
      nomeCiclo: ciclo.nomeCiclo,
      ano,
      anoEscolarValor,
      componenteSlug,
      componenteLabel: componente.label,
      redeValor,
    };
  }, [codigoCiclo, ano, anoEscolarValor, componenteSlug, redeValor]);

  function handleAnalisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResultado(null);
    startTransition(async () => {
      const resposta = await previewImportCaedAction(filtro, formData);
      setErro(resposta.error);
      setArquivos(resposta.error ? null : resposta.arquivos);
    });
  }

  function handleConfirmar() {
    if (!arquivos) return;
    startTransition(async () => {
      const resposta = await commitImportCaedAction(filtro, arquivos);
      setResultado(resposta);
      setArquivos(null);
    });
  }

  const todasLinhas = arquivos?.flatMap((a) => a.linhas) ?? [];
  const ok = todasLinhas.filter((l) => l.status === "ok");
  const comProblema = todasLinhas.filter((l) => l.status !== "ok");

  return (
    <div className="space-y-4">
      <form onSubmit={handleAnalisar} className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="mb-1 block text-xs text-foreground-muted">Ciclo</label>
          <Select value={codigoCiclo} onChange={(e) => setCodigoCiclo(e.target.value as CaedCodigoCiclo)}>
            {CAED_CICLOS.map((c) => (
              <option key={c.codigoCiclo} value={c.codigoCiclo}>
                {c.nomeCiclo}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-24">
          <label className="mb-1 block text-xs text-foreground-muted">Ano</label>
          <Input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value) || anoAtual)} min={2020} max={2100} />
        </div>
        <div className="w-56">
          <label className="mb-1 block text-xs text-foreground-muted">Ano escolar</label>
          <Select value={anoEscolarValor} onChange={(e) => setAnoEscolarValor(e.target.value)}>
            {CAED_ANOS_ESCOLARES.map((a) => (
              <option key={a.valor} value={a.valor}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <label className="mb-1 block text-xs text-foreground-muted">Componente curricular</label>
          <Select value={componenteSlug} onChange={(e) => setComponenteSlug(e.target.value)}>
            {CAED_COMPONENTES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <label className="mb-1 block text-xs text-foreground-muted">Rede</label>
          <Select value={redeValor} onChange={(e) => setRedeValor(e.target.value)}>
            {CAED_REDES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground-muted">Arquivo(s) CSV (nível &quot;Turma&quot;)</label>
          <Input type="file" name="arquivos" accept=".csv,.xlsx,.xls" required multiple />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Analisando..." : "Analisar arquivos"}
        </Button>
      </form>
      <p className="text-xs text-foreground-muted/70">
        Os 5 campos acima devem ser exatamente os mesmos filtros usados para baixar o CSV no site do CAEd — o
        Componente curricular não dá pra conferir automaticamente contra o arquivo (Leitura e Escrita aparecem
        iguais no CSV), então é sempre o que estiver selecionado aqui que vale.
      </p>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {arquivos && arquivos.length > 0 && (
        <div>
          <p className="text-sm text-foreground">
            {ok.length} linha(s) prontas para importar em {filtro.nomeCiclo} {filtro.ano} — {filtro.componenteLabel}
            {comProblema.length > 0 && (
              <>
                {" · "}
                <span className="text-danger">{comProblema.length} com problema (não serão gravadas)</span>
              </>
            )}
          </p>

          {arquivos.map((arquivo) => (
            <div key={arquivo.nomeArquivo} className="mt-4">
              <p className="text-xs font-medium text-foreground-muted">
                {arquivo.nomeArquivo}
                {arquivo.erro ? (
                  <span className="ml-2 text-danger">{arquivo.erro}</span>
                ) : (
                  <span className="ml-2 text-foreground-muted/70">
                    {arquivo.linhas.filter((l) => l.status === "ok").length} / {arquivo.linhas.length} linha(s) ok
                  </span>
                )}
              </p>
              {arquivo.linhas.length > 0 && (
                <div className="mt-2 max-h-72 overflow-y-auto">
                  <DataTable>
                    <TableHeader>
                      <tr>
                        <TableHeadCell>Linha</TableHeadCell>
                        <TableHeadCell>Escola</TableHeadCell>
                        <TableHeadCell>Turma</TableHeadCell>
                        <TableHeadCell>Defasagem</TableHeadCell>
                        <TableHeadCell>Intermediário</TableHeadCell>
                        <TableHeadCell>Adequado</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {arquivo.linhas.map((l) => (
                        <TableRow key={l.linha}>
                          <TableCell className="text-foreground-muted">{l.linha}</TableCell>
                          <TableCell className="text-foreground">{l.escolaTexto}</TableCell>
                          <TableCell className="text-foreground-muted">{l.turma ?? "-"}</TableCell>
                          <TableCell className="text-foreground-muted">
                            {l.percentualDefasagem !== null ? `${l.percentualDefasagem}%` : "-"}
                          </TableCell>
                          <TableCell className="text-foreground-muted">
                            {l.percentualIntermediario !== null ? `${l.percentualIntermediario}%` : "-"}
                          </TableCell>
                          <TableCell className="text-foreground-muted">
                            {l.percentualAdequado !== null ? `${l.percentualAdequado}%` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[l.status]} title={l.detalhe ?? undefined}>
                              {STATUS_LABEL[l.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </div>
              )}
            </div>
          ))}

          <div className="mt-4">
            <Button type="button" onClick={handleConfirmar} disabled={pending || ok.length === 0}>
              {pending ? "Importando..." : `Confirmar importação (${ok.length})`}
            </Button>
          </div>
        </div>
      )}

      {resultado && <p className="text-sm text-success-subtle-foreground">{resultado.gravados} resultado(s) de turma gravado(s).</p>}
    </div>
  );
}
