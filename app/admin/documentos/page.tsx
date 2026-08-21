import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { DocumentoForm } from "./documento-form";
import { DeleteDocumentoButton } from "./delete-documento-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminDocumentosPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q ? { titulo: { contains: q, mode: "insensitive" as const } } : undefined;

  const [documentos, total] = await Promise.all([
    prisma.documentoPublico.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.documentoPublico.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Documentos Públicos"
        description={`Portarias, resoluções, editais e calendário escolar exibidos no portal. ${total} documento(s).`}
      />

      <SectionCard title="Novo documento" className="mt-6">
        <DocumentoForm />
      </SectionCard>

      <ListToolbar searchPlaceholder="Buscar por título..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Título</TableHeadCell>
              <TableHeadCell>Categoria</TableHeadCell>
              <TableHeadCell>Acessos</TableHeadCell>
              <TableHeadCell className="text-right">Ações</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {documentos.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-foreground">{d.titulo}</TableCell>
                <TableCell className="text-foreground-muted">{d.categoria}</TableCell>
                <TableCell className="text-foreground-muted">{d.acessos}</TableCell>
                <TableCell className="text-right">
                  <DeleteDocumentoButton id={d.id} />
                </TableCell>
              </TableRow>
            ))}
            {documentos.length === 0 && <TableEmptyState colSpan={4} title="Nenhum documento encontrado." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/admin/documentos"
        searchParams={searchParams}
      />
    </div>
  );
}
