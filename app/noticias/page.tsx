import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { PostCard } from "@/components/site/post-card";
import { listPosts } from "@/lib/queries/site";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: undefined, label: "Todas" },
  { value: "NOTICIA", label: "Notícias" },
  { value: "AVISO", label: "Avisos" },
  { value: "DESTAQUE", label: "Destaques" },
  { value: "DOCUMENTO", label: "Documentos" },
] as const;

interface PageProps {
  searchParams: { categoria?: string; page?: string };
}

export default async function NoticiasPage({ searchParams }: PageProps) {
  const categoria = CATEGORIES.find((c) => c.value === searchParams.categoria)?.value;
  const page = Number(searchParams.page ?? "1") || 1;
  const { posts, totalPages } = await listPosts({ categoria, page });

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

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/noticias?${categoria ? `categoria=${categoria}&` : ""}page=${p}`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border text-sm",
                  page === p ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600",
                )}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
