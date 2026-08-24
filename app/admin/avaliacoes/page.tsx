import Link from "next/link";
import { Plus } from "lucide-react";
import type { TipoAvaliacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

const TIPO_LABEL: Record<string, string> = {
  FLUENCIA_LEITORA: "Fluência Leitora",
  SPADEB: "SPADEB",
  SIMULADO: "Simulado",
  PROVA_MUNICIPAL: "Prova Municipal",
};

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string; tipo?: string; ano?: string };
}

export default async function AdminAvaliacoesPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const tipoFiltro = searchParams.tipo?.trim() as TipoAvaliacao | undefined;
  const anoFiltro = searchParams.ano ? Number(searchParams.ano) : undefined;
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const anosDisponiveis = (await prisma.avaliacao.groupBy({ by: ["ano"], orderBy: { ano: "desc" } })).map(
    (r) => r.ano,
  );

  const where = {
    ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" as const } },
            { codigo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
    ...(anoFiltro ? { ano: anoFiltro } : {}),
  };

  const [avaliacoes, total] = await Promise.all([
    prisma.avaliacao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { _count: { select: { resultados: true, questoes: true } } },
    }),
    prisma.avaliacao.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Avaliações Municipais"
        description={`Fluência Leitora, SPADEB, simulados e provas municipais. ${total} avaliação(ões).`}
        actions={
          <Link href="/admin/avaliacoes/new" className={buttonVariants({ variant: "primary" })}>
            <Plus className="h-4 w-4" />
            Nova Avaliação
          </Link>
        }
      />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        {q && <input type="hidden" name="q" value={q} />}
        <div className="w-52">
          <label className="mb-1 block text-xs text-foreground-muted">Tipo</label>
          <Select name="tipo" defaultValue={searchParams.tipo ?? ""}>
            <option value="">Todos</option>
            {Object.entries(TIPO_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
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
        {(tipoFiltro || anoFiltro) && (
          <Link href={q ? `/admin/avaliacoes?q=${encodeURIComponent(q)}` : "/admin/avaliacoes"} className="text-sm text-primary hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <ListToolbar searchPlaceholder="Buscar por nome ou código..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Código</TableHeadCell>
              <TableHeadCell>Nome</TableHeadCell>
              <TableHeadCell>Tipo</TableHeadCell>
              <TableHeadCell>Ano</TableHeadCell>
              <TableHeadCell>Resultados</TableHeadCell>
              <TableHeadCell className="text-right">Ações</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {avaliacoes.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs text-foreground-muted">{a.codigo}</TableCell>
                <TableCell className="font-medium text-foreground">{a.nome}</TableCell>
                <TableCell className="text-foreground-muted">{TIPO_LABEL[a.tipo]}</TableCell>
                <TableCell className="text-foreground-muted">{a.ano}</TableCell>
                <TableCell className="text-foreground-muted">
                  {a._count.resultados} resultado(s) · {a._count.questoes} questão(ões)
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/avaliacoes/${a.id}`} className="text-primary hover:underline">
                    Gerenciar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {avaliacoes.length === 0 && <TableEmptyState colSpan={6} title="Nenhuma avaliação encontrada." />}
          </TableBody>
        </DataTable>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/admin/avaliacoes"
        searchParams={searchParams}
      />
    </div>
  );
}
