import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";

const TIPO_LABEL: Record<string, string> = {
  FLUENCIA_LEITORA: "Fluência Leitora",
  SPADEB: "SPADEB",
  SIMULADO: "Simulado",
  PROVA_MUNICIPAL: "Prova Municipal",
};

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminAvaliacoesPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q
    ? {
        OR: [
          { nome: { contains: q, mode: "insensitive" as const } },
          { codigo: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Avaliações Municipais</h1>
          <p className="mt-1 text-sm text-slate-500">
            Fluência Leitora, SPADEB, simulados e provas municipais. {total} avaliação(ões).
          </p>
        </div>
        <Link
          href="/admin/avaliacoes/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Link>
      </div>

      <ListToolbar searchPlaceholder="Buscar por nome ou código..." />

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Ano</th>
              <th className="px-4 py-3">Resultados</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {avaliacoes.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.codigo}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{a.nome}</td>
                <td className="px-4 py-3 text-slate-500">{TIPO_LABEL[a.tipo]}</td>
                <td className="px-4 py-3 text-slate-500">{a.ano}</td>
                <td className="px-4 py-3 text-slate-500">
                  {a._count.resultados} resultado(s) · {a._count.questoes} questão(ões)
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/avaliacoes/${a.id}`} className="text-brand-700 hover:underline">
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
            {avaliacoes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nenhuma avaliação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
