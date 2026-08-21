import { PostForm } from "@/components/admin/post-form";
import { createPostAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";

export default function NewPostPage() {
  return (
    <div>
      <PageHeader title="Nova Publicação" description="Crie uma notícia, aviso ou destaque para o portal." />
      <div className="mt-6">
        <PostForm action={createPostAction} submitLabel="Publicar" />
      </div>
    </div>
  );
}
