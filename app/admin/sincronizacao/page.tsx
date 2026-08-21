import { RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { syncCargosAction, syncEscolasAction, syncEstudantesChunkAction, syncNotasChunkAction } from "./actions";
import { ServidorSyncButton } from "./servidor-sync-button";
import { FrequenciaSyncPanel } from "./frequencia-sync-panel";
import { AnoSyncPanel } from "./ano-sync-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  SUCESSO: "success",
  ERRO: "danger",
  PROCESSANDO: "warning",
};

export default async function SincronizacaoPage() {
  const logs = await prisma.logSincronizacao.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const anoAtual = new Date().getFullYear();

  return (
    <div>
      <PageHeader
        title="Sincronização SIGEduc"
        description="Importa dados diretamente da API Educ 21. Execute nesta ordem: Escolas → Cargos → Servidores → Estudantes → Notas → Frequência. Os módulos maiores são sincronizados em lotes, para não estourar o tempo limite da função — acompanhe o progresso no próprio botão."
      />
      <p className="mt-2 rounded-lg bg-primary-subtle px-3 py-2 text-sm text-primary-subtle-foreground">
        Desde que o CRON_SECRET esteja configurado na Vercel, todos os módulos abaixo também
        rodam automaticamente todo dia de madrugada (Frequência sincroniza uma janela dos
        últimos 3 dias, não o ano inteiro). Os disparos automáticos aparecem no histórico como
        qualquer outra sincronização.
      </p>
      <p className="mt-2 rounded-lg bg-warning-subtle px-3 py-2 text-sm text-warning-subtle-foreground">
        Carga histórica: Estudantes e Notas aceitam escolher o ano; Frequência aceita qualquer
        período. Para um ano anterior, sincronize Estudantes daquele ano antes de Notas/Frequência
        do mesmo ano — Notas e Frequência só gravam alunos que já existem na tabela de Estudantes,
        e o sync histórico nunca sobrescreve a matrícula/turma vigente de um aluno já sincronizado
        num ano mais recente.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <form action={syncEscolasAction}>
          <SyncCard title="1. Escolas" desc="Consulta /consulta-escola" />
        </form>
        <form action={syncCargosAction}>
          <SyncCard title="2. Cargos" desc="Consulta /consulta-cargo" />
        </form>
        <ServidorSyncButton />
        <AnoSyncPanel
          numero="4"
          titulo="Estudantes"
          desc="Consulta /consulta-estudante/enturmado — escolha o ano (histórico não sobrescreve a matrícula vigente do aluno)."
          anoAtual={anoAtual}
          runChunk={syncEstudantesChunkAction}
        />
        <AnoSyncPanel
          numero="5"
          titulo="Notas"
          desc="Consulta /consulta-nota — escolha o ano."
          anoAtual={anoAtual}
          runChunk={syncNotasChunkAction}
        />
        <FrequenciaSyncPanel />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Histórico de Sincronizações</h2>
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Módulo</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Registros</TableHeadCell>
              <TableHeadCell>Duração</TableHeadCell>
              <TableHeadCell>Data</TableHeadCell>
              <TableHeadCell>Mensagem</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-foreground">{log.modulo}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[log.status] ?? "neutral"}>{log.status}</Badge>
                </TableCell>
                <TableCell className="text-foreground-muted">{log.registros}</TableCell>
                <TableCell className="text-foreground-muted">
                  {log.duracaoMs ? `${(log.duracaoMs / 1000).toFixed(1)}s` : "-"}
                </TableCell>
                <TableCell className="text-foreground-muted">{log.createdAt.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="max-w-xs truncate text-foreground-muted">{log.mensagem ?? "-"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableEmptyState colSpan={6} title="Nenhuma sincronização executada ainda." />}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}

function SyncCard({ title, desc }: { title: string; desc: string }) {
  return (
    <button
      type="submit"
      className="flex w-full flex-col items-start gap-2 rounded-xl border border-border bg-surface p-5 text-left transition hover:border-primary/40 hover:shadow-card"
    >
      <RefreshCw className="h-5 w-5 text-primary" />
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-foreground-muted">{desc}</span>
    </button>
  );
}
