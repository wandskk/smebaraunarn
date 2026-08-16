import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getPostBySlug } from "@/lib/queries/site";

interface PageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-700">
          {post.categoria}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{post.titulo}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Publicado em {format(post.dataPublicacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>

        {post.imagemCapa && (
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
            <Image src={post.imagemCapa} alt={post.titulo} fill className="object-cover" />
          </div>
        )}

        <article className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap">
          {post.conteudo}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
