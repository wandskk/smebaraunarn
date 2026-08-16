"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Post } from "@prisma/client";
import type { PostFormState } from "@/app/admin/posts/actions";

const initialState: PostFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

interface PostFormProps {
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>;
  post?: Post;
  submitLabel: string;
}

export function PostForm({ action, post, submitLabel }: PostFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
        <input
          name="titulo"
          defaultValue={post?.titulo}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Resumo</label>
        <input
          name="resumo"
          defaultValue={post?.resumo ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Conteúdo</label>
        <textarea
          name="conteudo"
          defaultValue={post?.conteudo}
          required
          rows={10}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Imagem de capa</label>
        {post?.imagemCapa && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imagemCapa}
            alt=""
            className="mb-2 h-32 w-full max-w-xs rounded-lg border border-slate-200 object-cover"
          />
        )}
        <input
          name="imagemCapaFile"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <input
          name="imagemCapa"
          defaultValue={post?.imagemCapa ?? ""}
          placeholder="ou cole uma URL de imagem"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
        <select
          name="categoria"
          defaultValue={post?.categoria ?? "NOTICIA"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="NOTICIA">Notícia</option>
          <option value="AVISO">Aviso</option>
          <option value="DESTAQUE">Destaque</option>
          <option value="DOCUMENTO">Documento</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="destaque" defaultChecked={post?.destaque} className="rounded" />
          Destaque na página inicial
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="importante" defaultChecked={post?.importante} className="rounded" />
          Marcar como importante
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="publicado"
            defaultChecked={post?.publicado ?? true}
            className="rounded"
          />
          Publicado
        </label>
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
