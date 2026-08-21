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

export default async function AdminEscolasPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" as const } },
          { codigoInep: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [escolas, total] = await Promise.all([
    prisma.escola.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take,
      include: { _count: { select: { servidores: true, estudantes: true } } },
    }),
    prisma.escola.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Escolas"
        description={
          <>
            Base de escolas sincronizada com o SIGEduc. Use{" "}
            <Link href="/admin/sincronizacao" className="text-primary underline">
              Sincronização
            </Link>{" "}
            para atualizar. {total} escola(s).
          </>
        }
      />

      <ListToolbar searchPlaceholder="Buscar por nome ou código INEP..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>Código INEP</TableHeadCell>
              <TableHeadCell>Servidores</TableHeadCell>
              <TableHeadCell>Estudantes</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {escolas.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/admin/escolas/${e.id}`} className="hover:text-primary hover:underline">
                    {e.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-foreground-muted">{e.codigoInep ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{e._count.servidores}</TableCell>
                <TableCell className="text-foreground-muted">{e._count.estudantes}</TableCell>
              </TableRow>
            ))}
            {escolas.length === 0 && <TableEmptyState colSpan={4} title="Nenhuma escola encontrada." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/admin/escolas"
        searchParams={searchParams}
      />
    </div>
  );
}
