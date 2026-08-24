import { prisma } from "@/lib/prisma";
import { maskCpf } from "@/lib/utils";
import { classifyServidorRole } from "@/lib/roles";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { EscolaSelect } from "./escola-select";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

const ROLE_LABEL: Record<string, string> = {
  DIRETOR: "Direção",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor Geral",
};

export default async function AdminServidoresPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q
    ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { cpf: { contains: q } }] }
    : undefined;

  const [servidores, total, escolas] = await Promise.all([
    prisma.servidor.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take,
      include: { escola: true },
    }),
    prisma.servidor.count({ where }),
    prisma.escola.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Servidores"
        description={`Base sincronizada com o SIGEduc. Cargos de direção/coordenação vêm sem escola vinculada na origem (ficam lotados na Secretaria) — atribua manualmente abaixo. ${total} servidor(es).`}
      />

      <ListToolbar searchPlaceholder="Buscar por nome ou CPF..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>CPF</TableHeadCell>
              <TableHeadCell>Cargo</TableHeadCell>
              <TableHeadCell>Papel no portal</TableHeadCell>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {servidores.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-foreground">{s.nome}</TableCell>
                <TableCell className="text-foreground-muted">{maskCpf(s.cpf)}</TableCell>
                <TableCell className="text-foreground-muted">{s.cargo ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">
                  {ROLE_LABEL[classifyServidorRole(s.cargo, s.funcao)]}
                </TableCell>
                <TableCell>
                  <EscolaSelect servidorId={s.id} escolaId={s.escolaId} escolas={escolas} />
                </TableCell>
                <TableCell className="text-foreground-muted">{s.status ?? "-"}</TableCell>
              </TableRow>
            ))}
            {servidores.length === 0 && <TableEmptyState colSpan={6} title="Nenhum servidor encontrado." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/admin/servidores"
        searchParams={searchParams}
      />
    </div>
  );
}
