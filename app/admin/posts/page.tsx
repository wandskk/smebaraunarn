import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { DeletePostButton } from "./delete-post-button";

interface PageProps {
  searchParams: { q?: string; page?: string; pageSize?: string };
}

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams);

  const where = q ? { titulo: { contains: q, mode: "insensitive" as const } } : undefined;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { dataPublicacao: "desc" }, skip, take }),
    prisma.post.count({ where }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notícias / CMS</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie as publicações do portal institucional. {total} publicação(ões).
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova Publicação
        </Link>
      </div>

      <ListToolbar searchPlaceholder="Buscar por título..." />

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{post.titulo}</td>
                <td className="px-4 py-3 text-slate-500">{post.categoria}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      post.publicado
                        ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                    }
                  >
                    {post.publicado ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {post.dataPublicacao.toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/posts/${post.id}`} className="text-brand-700 hover:underline">
                      Editar
                    </Link>
                    <DeletePostButton postId={post.id} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhuma publicação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPagesFor(total, pageSize)}
        basePath="/admin/posts"
        searchParams={searchParams}
      />
    </div>
  );
}
