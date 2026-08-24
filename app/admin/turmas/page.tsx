import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber, resolverAnoLetivo } from "@/lib/utils";
import { getTurmasRede } from "@/lib/queries/academico";
import { classificarFaixaFrequencia } from "@/lib/analytics/frequencia";
import { FaixaBadge } from "@/components/admin/faixa-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

interface PageProps {
  searchParams: { ano?: string; escolaId?: string; serie?: string; turno?: string; ordenar?: string };
}

const ORDENACOES = {
  alfabetica: "Alfabética",
  "menor-frequencia": "Menor frequência",
  "menor-desempenho": "Menor desempenho",
} as const;
type Ordenacao = keyof typeof ORDENACOES;

function formatarNota(valor: number | null): string {
  return valor === null ? "-" : valor.toFixed(1);
}

export default async function AdminTurmasPage({ searchParams }: PageProps) {
  const anosRows = await prisma.estudante.groupBy({ by: ["ano"], orderBy: { ano: "desc" } });
  const anosDisponiveis = anosRows.map((r) => r.ano);
  const ano = resolverAnoLetivo(searchParams, anosDisponiveis);
  const escolaId = searchParams.escolaId ? Number(searchParams.escolaId) : undefined;
  const serie = searchParams.serie?.trim() || undefined;
  const turno = searchParams.turno?.trim() || undefined;
  const ordenar: Ordenacao = searchParams.ordenar && searchParams.ordenar in ORDENACOES ? (searchParams.ordenar as Ordenacao) : "alfabetica";

  const [turmas, escolas] = await Promise.all([
    getTurmasRede({ ano, escolaId, serie, turno }),
    prisma.escola.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  const seriesDisponiveis = Array.from(new Set(turmas.map((t) => t.serie).filter((s): s is string => Boolean(s)))).sort();
  const turnosDisponiveis = Array.from(new Set(turmas.map((t) => t.turno).filter((t): t is string => Boolean(t)))).sort();

  const turmasOrdenadas = [...turmas].sort((a, b) => {
    if (ordenar === "menor-frequencia") return (a.frequenciaPercentual ?? 100) - (b.frequenciaPercentual ?? 100);
    if (ordenar === "menor-desempenho") return (a.desempenhoMedia ?? 10) - (b.desempenhoMedia ?? 10);
    return a.nomeEscola.localeCompare(b.nomeEscola) || a.turma.localeCompare(b.turma);
  });

  return (
    <div>
      <PageHeader
        title="Turmas"
        description={`Visão de rede por turma — ${turmas.length} turma(s) com estudante matriculado atualmente. Ano letivo ${ano}. Cada linha abre a ficha de turma já existente na escola.`}
      />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
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
        <div className="w-48">
          <label className="mb-1 block text-xs text-foreground-muted">Série</label>
          <Select name="serie" defaultValue={searchParams.serie ?? ""}>
            <option value="">Todas</option>
            {seriesDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs text-foreground-muted">Turno</label>
          <Select name="turno" defaultValue={searchParams.turno ?? ""}>
            <option value="">Todos</option>
            {turnosDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <label className="mb-1 block text-xs text-foreground-muted">Ordenar por</label>
          <Select name="ordenar" defaultValue={ordenar}>
            {Object.entries(ORDENACOES).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
        </div>
        {searchParams.ano && <input type="hidden" name="ano" value={searchParams.ano} />}
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(escolaId || serie || turno) && (
          <Link href="/admin/turmas" className="text-sm text-primary hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Escola</TableHeadCell>
              <TableHeadCell>Turma</TableHeadCell>
              <TableHeadCell>Turno</TableHeadCell>
              <TableHeadCell>Estudantes</TableHeadCell>
              <TableHeadCell>Docentes</TableHeadCell>
              <TableHeadCell>Frequência</TableHeadCell>
              <TableHeadCell>Faixa</TableHeadCell>
              <TableHeadCell>Desempenho</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {turmasOrdenadas.map((t) => (
              <TableRow key={`${t.escolaId}:${t.turma}`}>
                <TableCell className="text-foreground-muted">{t.nomeEscola}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/escolas/${t.escolaId}/turmas/${encodeURIComponent(t.turma)}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {t.serie ? `${t.serie} (${t.turma})` : t.turma}
                  </Link>
                </TableCell>
                <TableCell className="text-foreground-muted">{t.turno ?? "-"}</TableCell>
                <TableCell className="text-foreground-muted">{formatNumber(t.totalAlunos)}</TableCell>
                <TableCell className="text-foreground-muted">{formatNumber(t.totalDocentes)}</TableCell>
                <TableCell className="font-semibold text-foreground">
                  {t.frequenciaPercentual === null ? "-" : `${t.frequenciaPercentual.toFixed(1)}%`}
                </TableCell>
                <TableCell>
                  <FaixaBadge faixa={t.frequenciaPercentual !== null ? classificarFaixaFrequencia(t.frequenciaPercentual) : null} />
                </TableCell>
                <TableCell className="text-foreground-muted">{formatarNota(t.desempenhoMedia)}</TableCell>
              </TableRow>
            ))}
            {turmasOrdenadas.length === 0 && (
              <TableEmptyState colSpan={8} title="Nenhuma turma encontrada para os filtros selecionados." />
            )}
          </TableBody>
        </DataTable>
      </div>
    </div>
  );
}
