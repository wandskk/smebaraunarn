import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { maskCpf } from "@/lib/utils";
import { classifyServidorRole } from "@/lib/roles";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { EscolaSelect } from "./escola-select";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string; escolaId?: string; status?: string };
}

const ROLE_LABEL: Record<string, string> = {
  DIRETOR: "Direção",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor Geral",
};

const SEM_ESCOLA = "sem-escola";

export default async function AdminServidoresPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const escolaIdFiltro = searchParams.escolaId && searchParams.escolaId !== SEM_ESCOLA ? Number(searchParams.escolaId) : undefined;
  const semEscolaFiltro = searchParams.escolaId === SEM_ESCOLA;
  const statusFiltro = searchParams.status?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const [escolas, statusDisponiveis] = await Promise.all([
    prisma.escola.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.servidor
      .groupBy({ by: ["status"] })
      .then((rows) => rows.map((r) => r.status).filter((s): s is string => Boolean(s)).sort()),
  ]);

  const where = {
    ...(q ? { OR: [{ nome: { contains: q, mode: "insensitive" as const } }, { cpf: { contains: q } }] } : {}),
    ...(escolaIdFiltro ? { escolaId: escolaIdFiltro } : {}),
    ...(semEscolaFiltro ? { escolaId: null } : {}),
    ...(statusFiltro ? { status: statusFiltro } : {}),
  };

  const [servidores, total] = await Promise.all([
    prisma.servidor.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take,
      include: { escola: true },
    }),
    prisma.servidor.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Servidores"
        description={`Base sincronizada com o SIGEduc. Cargos de direção/coordenação vêm sem escola vinculada na origem (ficam lotados na Secretaria) — atribua manualmente abaixo. ${total} servidor(es).`}
      />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        {q && <input type="hidden" name="q" value={q} />}
        <div className="w-56">
          <label className="mb-1 block text-xs text-foreground-muted">Escola</label>
          <Select name="escolaId" defaultValue={searchParams.escolaId ?? ""}>
            <option value="">Todas</option>
            <option value={SEM_ESCOLA}>Sem escola atribuída</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs text-foreground-muted">Status</label>
          <Select name="status" defaultValue={searchParams.status ?? ""}>
            <option value="">Todos</option>
            {statusDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(escolaIdFiltro || semEscolaFiltro || statusFiltro) && (
          <Link href={q ? `/admin/servidores?q=${encodeURIComponent(q)}` : "/admin/servidores"} className="text-sm text-primary hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

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
              <TableHeadCell></TableHeadCell>
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
                <TableCell className="text-right">
                  <Link href={`/admin/servidores/${s.id}`} className="text-primary hover:underline">
                    Ver detalhes
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {servidores.length === 0 && <TableEmptyState colSpan={7} title="Nenhum servidor encontrado." />}
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
