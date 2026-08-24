import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, CalendarCheck, CalendarX } from "lucide-react";
import { formatTurmaLabel, getTurmaDetalhe } from "@/lib/queries/academico";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

export interface TurmaDetalheViewProps {
  escolaId: number;
  turma: string;
  anoAtual: number;
  searchParams: { q?: string; page?: string; pageSize?: string };
  /** Breadcrumb acima do título — "← Escola" (Admin) ou "← Turmas" (Direção). */
  breadcrumb: ReactNode;
  /** Rota de destino do "Ver detalhes" de um aluno — difere por perfil (/admin/estudantes/[id] vs /portal/direcao/alunos/[id]). */
  alunoHref: (alunoId: number) => string;
  /** Base path usado pela paginação — a própria rota desta página. */
  paginationBasePath: string;
}

/**
 * Ficha de turma compartilhada entre Admin (`/admin/escolas/[id]/turmas/[turma]`)
 * e Direção (`/portal/direcao/turmas/[turma]`) — mesma query
 * (`getTurmaDetalhe`), mesmo cálculo de frequência/médias, mesma tabela de
 * alunos com busca e paginação. Antes da ETAPA 03 as duas rotas
 * reimplementavam essa tela de forma quase idêntica; a extração garante que
 * as duas telas sempre leiam o mesmo dado da mesma forma para a mesma
 * turma. Só o que realmente muda por perfil (link de volta, link do aluno,
 * base da paginação) é passado como prop.
 */
export async function TurmaDetalheView({
  escolaId,
  turma,
  anoAtual,
  searchParams,
  breadcrumb,
  alunoHref,
  paginationBasePath,
}: TurmaDetalheViewProps) {
  const detalhe = await getTurmaDetalhe(escolaId, turma, anoAtual);

  const q = searchParams.q?.trim().toLowerCase();
  const alunosFiltrados = q
    ? detalhe.alunos.filter((a) => a.nome.toLowerCase().includes(q) || a.matricula.toLowerCase().includes(q))
    : detalhe.alunos;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);
  const alunosPagina = alunosFiltrados.slice(skip, skip + take);

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumb}
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
                        <Link href={alunoHref(aluno.id)} className="text-primary hover:underline">
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
            basePath={paginationBasePath}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
