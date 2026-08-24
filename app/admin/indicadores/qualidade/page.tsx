import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import {
  getStatusSincronizacao,
  getColisoesCodigoTurma,
  getCompletudeDados,
  getEscolasNaoMapeadas,
  ROTULO_MODULO,
  rotuloModulo,
} from "@/lib/queries/qualidade-dados";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

function formatarData(data: Date | null): string {
  return data ? data.toLocaleString("pt-BR") : "nunca";
}

function formatarDuracao(ms: number | null): string {
  if (ms === null) return "-";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

const STATUS_LOG_VARIANT: Record<string, BadgeVariant> = {
  SUCESSO: "success",
  ERRO: "danger",
};

function StatusLogBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_LOG_VARIANT[status] ?? "neutral"}>{status}</Badge>;
}

export default async function QualidadeDadosPage() {
  const [{ modulos, historico }, colisoes, completude, escolasNaoMapeadas] = await Promise.all([
    getStatusSincronizacao(),
    getColisoesCodigoTurma(),
    getCompletudeDados(),
    getEscolasNaoMapeadas(),
  ]);

  const colisoesDivergentes = colisoes.filter((c) => c.divergente);

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-info-subtle-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Qualidade dos Dados"
        description="Os indicadores acima só valem o que a sincronização entrega. Este painel mostra a saúde de cada módulo sincronizado do SIGEduc e checagens de integridade sobre os dados já carregados."
      />

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Saúde da sincronização</h2>
      {modulos.some((m) => m.execucaoIncompleta) && (
        <p className="mt-3 max-w-2xl rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
          <strong>Execução travada:</strong>{" "}
          {modulos
            .filter((m) => m.execucaoIncompleta)
            .map((m) => ROTULO_MODULO[m.modulo])
            .join(", ")}{" "}
          ficou em &quot;PROCESSANDO&quot; sem terminar com SUCESSO — provavelmente uma sincronização manual
          interrompida (aba fechada) ou um timeout no meio de um lote. Dados desse módulo podem estar incompletos;
          execute a sincronização novamente.
        </p>
      )}
      <div className="mt-3">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Módulo</TableHeadCell>
              <TableHeadCell>Situação</TableHeadCell>
              <TableHeadCell>Última execução</TableHeadCell>
              <TableHeadCell>Registros</TableHeadCell>
              <TableHeadCell>Duração</TableHeadCell>
              <TableHeadCell>Erros (7 dias)</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {modulos.map((m) => (
              <TableRow key={m.modulo}>
                <TableCell className="font-medium text-foreground">{ROTULO_MODULO[m.modulo] ?? m.modulo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <DataFreshnessBadge situacao={m.situacao} />
                    {m.execucaoIncompleta && <Badge variant="danger">Travado</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {m.ultimoLog ? (
                    <div className="flex items-center gap-2">
                      <StatusLogBadge status={m.ultimoLog.status} />
                      <span>{formatarData(m.ultimoLog.createdAt)}</span>
                    </div>
                  ) : (
                    "nunca sincronizado"
                  )}
                </TableCell>
                <TableCell className="text-foreground-muted">{m.ultimoLog ? formatNumber(m.ultimoLog.registros) : "-"}</TableCell>
                <TableCell className="text-foreground-muted">{formatarDuracao(m.ultimoLog?.duracaoMs ?? null)}</TableCell>
                <TableCell>
                  {m.errosUltimos7Dias > 0 ? (
                    <span className="font-semibold text-danger">{m.errosUltimos7Dias}</span>
                  ) : (
                    <span className="text-foreground-muted/60">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>
      {modulos.some((m) => m.ultimoLog?.status === "ERRO" && m.ultimoLog?.mensagem) && (
        <div className="mt-3 space-y-1">
          {modulos
            .filter((m) => m.ultimoLog?.status === "ERRO" && m.ultimoLog?.mensagem)
            .map((m) => (
              <p key={m.modulo} className="rounded-lg bg-danger-subtle px-3 py-2 text-xs text-danger-subtle-foreground">
                <strong>{ROTULO_MODULO[m.modulo] ?? m.modulo}:</strong> {m.ultimoLog!.mensagem}
              </p>
            ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Completude por campo</h2>
      <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
        A sincronização pode rodar com SUCESSO e ainda assim faltar dado em campos específicos — isso não aparece na
        saúde de sincronização acima, só olhando campo a campo.
      </p>
      <div className="mt-3">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Campo</TableHeadCell>
              <TableHeadCell>Ausentes</TableHeadCell>
              <TableHeadCell>% do total</TableHeadCell>
              <TableHeadCell>Impacto</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {completude.map((c) => (
              <TableRow key={c.campo}>
                <TableCell className="font-medium text-foreground">{c.campo}</TableCell>
                <TableCell className="text-foreground-muted">
                  {formatNumber(c.ausentes)} / {formatNumber(c.total)}
                </TableCell>
                <TableCell>
                  {c.percentualAusente === null ? (
                    "-"
                  ) : c.percentualAusente > 0 ? (
                    <span className="font-semibold text-warning-subtle-foreground">{c.percentualAusente.toFixed(1)}%</span>
                  ) : (
                    <span className="text-success-subtle-foreground">0%</span>
                  )}
                </TableCell>
                <TableCell className="max-w-sm text-xs text-foreground-muted">{c.impacto}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>

      {escolasNaoMapeadas.length > 0 && (
        <p className="mt-3 max-w-2xl rounded-lg bg-warning-subtle px-3 py-2 text-sm text-warning-subtle-foreground">
          <strong>{escolasNaoMapeadas.length} nome(s) de escola sem correspondência</strong> a uma Escola cadastrada,
          em registros de notas/frequência:{" "}
          {escolasNaoMapeadas.map((e) => e.nome).join(", ")}. Esses registros contam nos totais acima
          (&quot;sem escola&quot; quando o campo é vazio) ou ficam de fora dos indicadores por escola quando o nome
          não bate com nenhuma escola sincronizada.
        </p>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
        Integridade — código de turma reutilizado entre escolas
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
        A origem (SIGEduc) não garante que um código de turma seja único na rede. Isso não é um erro por si só —
        vira risco quando escolas diferentes atribuem séries diferentes ao mesmo código, o que poderia levar o
        indicador de distorção idade-série a usar a série errada para uma turma.
      </p>
      {colisoes.length === 0 ? (
        <p className="mt-3 text-sm text-foreground-muted/60">Nenhum código de turma reutilizado entre escolas no momento.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {colisoesDivergentes.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger-subtle px-3 py-1.5 font-medium text-danger-subtle-foreground">
                <AlertTriangle className="h-4 w-4" />
                {colisoesDivergentes.length} código(s) com série divergente entre escolas — revisar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-subtle px-3 py-1.5 font-medium text-success-subtle-foreground">
                <CheckCircle2 className="h-4 w-4" />
                {formatNumber(colisoes.length)} código(s) reutilizado(s), mas a série resolvida é consistente entre
                as escolas
              </span>
            )}
          </div>

          <div className="mt-3">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Código da turma</TableHeadCell>
                  <TableHeadCell>Escolas</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {colisoes.map((c) => (
                  <TableRow key={c.turma}>
                    <TableCell className="font-mono text-xs text-foreground">{c.turma}</TableCell>
                    <TableCell className="text-foreground-muted">
                      <ul className="space-y-0.5">
                        {c.escolas.map((e) => (
                          <li key={e.escolaId}>
                            {e.nomeEscola}{" "}
                            <span className="text-foreground-muted/60">
                              ({e.series.length > 0 ? e.series.join(", ") : "sem série resolvida"})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      {c.divergente ? <Badge variant="danger">Divergente</Badge> : <Badge variant="success">Consistente</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
        Histórico recente de sincronização
      </h2>
      <div className="mt-3">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Data</TableHeadCell>
              <TableHeadCell>Módulo</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Registros</TableHeadCell>
              <TableHeadCell>Duração</TableHeadCell>
              <TableHeadCell>Mensagem</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {historico.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="text-foreground-muted">{formatarData(h.createdAt)}</TableCell>
                <TableCell className="text-foreground">{rotuloModulo(h.modulo)}</TableCell>
                <TableCell>
                  <StatusLogBadge status={h.status} />
                </TableCell>
                <TableCell className="text-foreground-muted">{formatNumber(h.registros)}</TableCell>
                <TableCell className="text-foreground-muted">{formatarDuracao(h.duracaoMs)}</TableCell>
                <TableCell className="max-w-xs truncate text-foreground-muted" title={h.mensagem ?? undefined}>
                  {h.mensagem ?? "-"}
                </TableCell>
              </TableRow>
            ))}
            {historico.length === 0 && <TableEmptyState colSpan={6} title="Nenhuma sincronização registrada ainda." />}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
