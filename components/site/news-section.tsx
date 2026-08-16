import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Post } from "@prisma/client";
import { PostCard } from "./post-card";

export function NewsSection({ posts }: { posts: Post[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notícias e Avisos</h2>
          <p className="text-sm text-slate-500">Acompanhe as novidades da educação municipal</p>
        </div>
        <Link
          href="/noticias"
          className="hidden items-center gap-1 text-sm font-medium text-brand-700 hover:underline sm:flex"
        >
          Ver todas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Nenhuma notícia publicada até o momento.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
