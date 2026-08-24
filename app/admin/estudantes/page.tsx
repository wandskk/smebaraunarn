import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string; escolaId?: string; ano?: string };
}

export default async function AdminEstudantesPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const escolaIdFiltro = searchParams.escolaId ? Number(searchParams.escolaId) : undefined;
  const anoFiltro = searchParams.ano ? Number(searchParams.ano) : undefined;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const [escolas, anosDisponiveis] = await Promise.all([
    prisma.escola.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } }).then((rows) => rows.map((r) => r.ano)),
  ]);

  const where = {
    ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" as const } },
            { matricula: { contains: q } },
            { cpf: { contains: q } },
          ],
        }
      : {}),
    ...(escolaIdFiltro ? { escolaId: escolaIdFiltro } : {}),
    ...(anoFiltro ? { ano: anoFiltro } : {}),
  };

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

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        {q && <input type="hidden" name="q" value={q} />}
        <div className="w-56">
          <label className="mb-1 block text-xs text-foreground-muted">Escola</label>
          <Select name="escolaId" defaultValue={searchParams.escolaId ?? ""}>
            <option value="">Todas</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs text-foreground-muted">Ano</label>
          <Select name="ano" defaultValue={searchParams.ano ?? ""}>
            <option value="">Todos</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(escolaIdFiltro || anoFiltro) && (
          <Link href={q ? `/admin/estudantes?q=${encodeURIComponent(q)}` : "/admin/estudantes"} className="text-sm text-primary hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

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
