import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { PostCard } from "@/components/site/post-card";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { listPosts } from "@/lib/queries/site";
import { parsePaginationParams, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: undefined, label: "Todas" },
  { value: "NOTICIA", label: "Notícias" },
  { value: "AVISO", label: "Avisos" },
  { value: "DESTAQUE", label: "Destaques" },
  { value: "DOCUMENTO", label: "Documentos" },
] as const;

const PAGE_SIZE_OPTIONS = [6, 9, 12, 24] as const;
const DEFAULT_PAGE_SIZE = 9;

interface PageProps {
  searchParams: { categoria?: string; q?: string; page?: string; pageSize?: string };
}

export default async function NoticiasPage({ searchParams }: PageProps) {
  const categoria = CATEGORIES.find((c) => c.value === searchParams.categoria)?.value;
  const q = searchParams.q?.trim();
  const { page, pageSize, skip, take } = parsePaginationParams(searchParams, {
    defaultPageSize: DEFAULT_PAGE_SIZE,
    allowedPageSizes: PAGE_SIZE_OPTIONS,
  });
  const { posts, total } = await listPosts({ categoria, q, page, pageSize });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Notícias e Avisos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fique por dentro das novidades da educação municipal de Baraúna.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={c.value ? `/noticias?categoria=${c.value}` : "/noticias"}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                categoria === c.value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 text-slate-600 hover:border-brand-400",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <ListToolbar
          searchPlaceholder="Buscar por título..."
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          defaultPageSize={DEFAULT_PAGE_SIZE}
        />

        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            Nenhuma publicação encontrada.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPagesFor(total, pageSize)}
          basePath="/noticias"
          searchParams={searchParams}
        />
      </main>
      <SiteFooter />
    </>
  );
}
