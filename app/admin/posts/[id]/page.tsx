import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";
import { updatePostAction } from "../actions";

interface PageProps {
  params: { id: string };
}

export default async function EditPostPage({ params }: PageProps) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  const boundAction = updatePostAction.bind(null, post.id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Editar Publicação</h1>
      <p className="mt-1 text-sm text-slate-500">/{post.slug}</p>
      <div className="mt-6">
        <PostForm action={boundAction} post={post} submitLabel="Salvar Alterações" />
      </div>
    </div>
  );
}
