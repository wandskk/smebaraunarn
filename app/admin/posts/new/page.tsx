import { PostForm } from "@/components/admin/post-form";
import { createPostAction } from "../actions";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Nova Publicação</h1>
      <p className="mt-1 text-sm text-slate-500">Crie uma notícia, aviso ou destaque para o portal.</p>
      <div className="mt-6">
        <PostForm action={createPostAction} submitLabel="Publicar" />
      </div>
    </div>
  );
}
