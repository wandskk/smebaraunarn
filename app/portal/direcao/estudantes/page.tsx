import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function DirecaoEstudantesPage({ searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = {
    escolaId: session.escolaId!,
    ...(q
      ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { matricula: { contains: q } }] }
      : {}),
  };

  const [estudantes, total] = await Promise.all([
    prisma.estudante.findMany({ where, orderBy: { nome: "asc" }, skip, take }),
    prisma.estudante.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Estudantes" description={`${total} estudante(s) enturmado(s).`} />

      <ListToolbar searchPlaceholder="Buscar por nome ou matrícula..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>Matrícula</TableHeadCell>
              <TableHeadCell>Turma</TableHeadCell>
              <TableHeadCell>Responsável</TableHeadCell>
              <TableHeadCell className="text-right">Ações</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {estudantes.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium text-foreground">{e.nome}</TableCell>
                <TableCell className="text-foreground-muted">{e.matricula}</TableCell>
                <TableCell className="text-foreground-muted">{e.turmaSerie ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{e.nomeResponsavel ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/portal/direcao/estudantes/${e.id}`} className="text-primary hover:underline">
                    Ver detalhes
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {estudantes.length === 0 && <TableEmptyState colSpan={5} title="Nenhum estudante encontrado." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/portal/direcao/estudantes"
        searchParams={searchParams}
      />
    </div>
  );
}
