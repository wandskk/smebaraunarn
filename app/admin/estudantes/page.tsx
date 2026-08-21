import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminEstudantesPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" as const } },
          { matricula: { contains: q } },
          { cpf: { contains: q } },
        ],
      }
    : undefined;

  const [estudantes, total] = await Promise.all([
    prisma.estudante.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take,
      include: { escola: true },
    }),
    prisma.estudante.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Estudantes" description={`Base sincronizada com o SIGEduc. ${total} estudante(s).`} />

      <ListToolbar searchPlaceholder="Buscar por nome, matrícula ou CPF..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>Matrícula</TableHeadCell>
              <TableHeadCell>Turma</TableHeadCell>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell className="text-right">Ações</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {estudantes.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium text-foreground">{e.nome}</TableCell>
                <TableCell className="text-foreground-muted">{e.matricula}</TableCell>
                <TableCell className="text-foreground-muted">{e.turmaSerie ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{e.escola?.nome ?? e.nomeEscola ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/estudantes/${e.id}`} className="text-primary hover:underline">
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
        basePath="/admin/estudantes"
        searchParams={searchParams}
      />
    </div>
  );
}
