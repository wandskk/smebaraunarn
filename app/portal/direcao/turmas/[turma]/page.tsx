import Link from "next/link";
import { GraduationCap, CalendarCheck, CalendarX } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { formatTurmaLabel, getTurmaDetalhe } from "@/lib/queries/academico";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

interface PageProps {
  params: { turma: string };
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function DirecaoTurmaDetalhePage({ params, searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const turma = decodeURIComponent(params.turma);
  const anoAtual = new Date().getFullYear();
  const detalhe = await getTurmaDetalhe(session.escolaId!, turma, anoAtual);

  const q = searchParams.q?.trim().toLowerCase();
  const alunosFiltrados = q
    ? detalhe.alunos.filter(
        (a) => a.nome.toLowerCase().includes(q) || a.matricula.toLowerCase().includes(q),
      )
    : detalhe.alunos;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
  const alunosPagina = alunosFiltrados.slice(skip, skip + take);

  return (
    <div>
      <PageHeader
        breadcrumbs={
          <Link href="/portal/direcao/turmas" className="text-primary hover:underline">
            ← Turmas
          </Link>
        }
        title={formatTurmaLabel(detalhe.serie, turma)}
        description={
          <>
            {detalhe.serie && <span className="text-foreground-muted/70">{turma} · </span>}
            {detalhe.alunos.length} aluno(s) enturmado(s).
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Frequência da turma"
          value={detalhe.frequencia.percentual !== null ? `${detalhe.frequencia.percentual.toFixed(1)}%` : "-"}
          icon={CalendarCheck}
          accent="attendance"
        />
        <MetricCard
          label="Faltas registradas"
          value={String(detalhe.frequencia.totalFaltas)}
          icon={CalendarX}
          accent="attendance"
        />
        <MetricCard
          label={`Disciplinas com notas (${anoAtual})`}
          value={String(detalhe.notasPorDisciplina.length)}
          icon={GraduationCap}
          accent="education"
        />
      </div>

      {detalhe.notasPorDisciplina.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-foreground">Médias por disciplina</h2>
          <div className="mt-3">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Disciplina</TableHeadCell>
                  <TableHeadCell>Notas lançadas</TableHeadCell>
                  <TableHeadCell>Média</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {detalhe.notasPorDisciplina.map((n) => (
                  <TableRow key={n.disciplina}>
                    <TableCell className="font-medium text-foreground">{n.disciplina}</TableCell>
                    <TableCell className="text-foreground-muted">{n.quantidade}</TableCell>
                    <TableCell className="text-foreground">{n.media.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold text-foreground">Alunos</h2>
      {detalhe.alunos.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Nenhum aluno enturmado nesta turma.
        </p>
      ) : (
        <>
          <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />
          {alunosPagina.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
              Nenhum aluno encontrado.
            </p>
          ) : (
            <div className="mt-3">
              <DataTable>
                <TableHeader>
                  <tr>
                    <TableHeadCell>Nome</TableHeadCell>
                    <TableHeadCell>Matrícula</TableHeadCell>
                    <TableHeadCell>Responsável</TableHeadCell>
                    <TableHeadCell className="text-right">Ações</TableHeadCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {alunosPagina.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium text-foreground">{aluno.nome}</TableCell>
                      <TableCell className="text-foreground-muted">{aluno.matricula}</TableCell>
                      <TableCell className="text-foreground-muted">{aluno.nomeResponsavel ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/portal/direcao/alunos/${aluno.id}`} className="text-primary hover:underline">
                          Ver detalhes
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPagesFor(alunosFiltrados.length, pageSize)}
            basePath={`/portal/direcao/turmas/${params.turma}`}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
