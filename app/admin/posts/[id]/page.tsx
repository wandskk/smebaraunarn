import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";
import { updatePostAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";

interface PageProps {
  params: { id: string };
}

export default async function EditPostPage({ params }: PageProps) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  const boundAction = updatePostAction.bind(null, post.id);

  return (
    <div>
      <PageHeader title="Editar Publicação" description={`/${post.slug}`} />
      <div className="mt-6">
        <PostForm action={boundAction} post={post} submitLabel="Salvar Alterações" />
      </div>
    </div>
  );
}
