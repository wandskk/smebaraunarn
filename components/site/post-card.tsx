import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@prisma/client";

const CATEGORIA_LABEL: Record<Post["categoria"], string> = {
  NOTICIA: "Notícia",
  AVISO: "Aviso",
  DESTAQUE: "Destaque",
  DOCUMENTO: "Documento",
};

const CATEGORIA_COLOR: Record<Post["categoria"], string> = {
  NOTICIA: "bg-brand-50 text-brand-700",
  AVISO: "bg-amber-50 text-amber-700",
  DESTAQUE: "bg-fuchsia-50 text-fuchsia-700",
  DOCUMENTO: "bg-slate-100 text-slate-700",
};

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/noticias/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full bg-slate-100">
        {post.imagemCapa ? (
          <Image
            src={post.imagemCapa}
            alt={post.titulo}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">SME Baraúna</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span
          className={`mb-2 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORIA_COLOR[post.categoria]}`}
        >
          {CATEGORIA_LABEL[post.categoria]}
        </span>
        <h3 className="mb-1 line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
          {post.titulo}
        </h3>
        {post.resumo && <p className="mb-3 line-clamp-2 text-sm text-slate-500">{post.resumo}</p>}
        <span className="mt-auto text-xs text-slate-400">
          {format(post.dataPublicacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>
    </Link>
  );
}
