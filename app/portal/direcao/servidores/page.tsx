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

export default async function DirecaoServidoresPage({ searchParams }: PageProps) {
  const session = await requireSession(["DIRETOR"]);
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = {
    escolaId: session.escolaId!,
    ...(q ? { nome: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [servidores, total] = await Promise.all([
    prisma.servidor.findMany({ where, orderBy: { nome: "asc" }, skip, take }),
    prisma.servidor.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Servidores" description={`${total} servidor(es) lotado(s) na escola.`} />

      <ListToolbar searchPlaceholder="Buscar por nome..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>Cargo</TableHeadCell>
              <TableHeadCell>Função</TableHeadCell>
              <TableHeadCell>Vínculo</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {servidores.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-foreground">{s.nome}</TableCell>
                <TableCell className="text-foreground-muted">{s.cargo ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{s.funcao ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{s.tipoVinculo ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{s.status ?? "-"}</TableCell>
              </TableRow>
            ))}
            {servidores.length === 0 && <TableEmptyState colSpan={5} title="Nenhum servidor encontrado." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/portal/direcao/servidores"
        searchParams={searchParams}
      />
    </div>
  );
}
