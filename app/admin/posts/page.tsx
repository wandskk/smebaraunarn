import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { DeletePostButton } from "./delete-post-button";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell, RowActions } from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";

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
      <PageHeader
        title="Notícias / CMS"
        description={`Gerencie as publicações do portal institucional. ${total} publicação(ões).`}
        actions={
          <Link href="/admin/posts/new" className={buttonVariants({ variant: "primary" })}>
            <Plus className="h-4 w-4" />
            Nova Publicação
          </Link>
        }
      />

      <ListToolbar searchPlaceholder="Buscar por título..." />

      <div className="mt-6">
        <DataTable>
          <TableHeader>
            <tr>
              <TableHeadCell>Título</TableHeadCell>
              <TableHeadCell>Categoria</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Data</TableHeadCell>
              <TableHeadCell className="text-right">Ações</TableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium text-foreground">{post.titulo}</TableCell>
                <TableCell className="text-foreground-muted">{post.categoria}</TableCell>
                <TableCell>
                  <Badge variant={post.publicado ? "success" : "neutral"}>
                    {post.publicado ? "Publicado" : "Rascunho"}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {post.dataPublicacao.toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <RowActions>
                    <Link href={`/admin/posts/${post.id}`} className="text-primary hover:underline">
                      Editar
                    </Link>
                    <DeletePostButton postId={post.id} />
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && <TableEmptyState colSpan={5} title="Nenhuma publicação encontrada." />}
          </TableBody>
        </DataTable>
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
