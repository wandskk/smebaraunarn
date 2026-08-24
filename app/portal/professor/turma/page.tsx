import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function TurmaPage({ searchParams }: PageProps) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const nomesTurma = servidor.turmas.map((t) => t.turma);
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where =
    nomesTurma.length === 0
      ? null
      : {
          escolaId: servidor.escolaId ?? -1,
          turmaSerie: { in: nomesTurma },
          ...(q
            ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { matricula: { contains: q } }] }
            : {}),
        };

  const [alunos, total] = where
    ? await Promise.all([
        prisma.estudante.findMany({
          where,
          orderBy: [{ turmaSerie: "asc" }, { nome: "asc" }],
          skip,
          take,
        }),
        prisma.estudante.count({ where }),
      ])
    : [[], 0];

  return (
    <div>
      <PageHeader
        title="Minhas Turmas"
        description={`${nomesTurma.length > 0 ? nomesTurma.join(", ") : "Nenhuma turma vinculada"} · ${
          servidor.escolaNome ?? "Escola"
        } · ${total} aluno(s)`}
      />

      {nomesTurma.length > 0 && <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />}

      {alunos.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhum aluno enturmado encontrado para suas turmas.
        </p>
      ) : (
        <div className="mt-6">
          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadCell>Nome</TableHeadCell>
                <TableHeadCell>Matrícula</TableHeadCell>
                <TableHeadCell>Turma</TableHeadCell>
                <TableHeadCell className="text-right">Ações</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium text-foreground">{aluno.nome}</TableCell>
                  <TableCell className="text-foreground-muted">{aluno.matricula}</TableCell>
                  <TableCell className="text-foreground-muted">{aluno.turmaSerie ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/portal/professor/turma/${aluno.id}`} className="text-primary hover:underline">
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
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/portal/professor/turma"
        searchParams={searchParams}
      />
    </div>
  );
}
