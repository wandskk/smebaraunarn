"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Post } from "@prisma/client";
import type { PostFormState } from "@/app/admin/posts/actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: PostFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Salvando..." : label}
    </Button>
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
      <FormField label="Título" htmlFor="titulo">
        <Input id="titulo" name="titulo" defaultValue={post?.titulo} required />
      </FormField>

      <FormField label="Resumo" htmlFor="resumo">
        <Input id="resumo" name="resumo" defaultValue={post?.resumo ?? ""} />
      </FormField>

      <FormField label="Conteúdo" htmlFor="conteudo">
        <Textarea id="conteudo" name="conteudo" defaultValue={post?.conteudo} required rows={10} />
      </FormField>

      <div>
        <Label htmlFor="imagemCapaFile">Imagem de capa</Label>
        {post?.imagemCapa && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imagemCapa}
            alt=""
            className="mb-2 h-32 w-full max-w-xs rounded-lg border border-border object-cover"
          />
        )}
        <input
          id="imagemCapaFile"
          name="imagemCapaFile"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-subtle file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-subtle-foreground hover:file:bg-primary-subtle/70"
        />
        <Input
          name="imagemCapa"
          defaultValue={post?.imagemCapa ?? ""}
          placeholder="ou cole uma URL de imagem"
          className="mt-2"
        />
      </div>

      <FormField label="Categoria" htmlFor="categoria">
        <Select id="categoria" name="categoria" defaultValue={post?.categoria ?? "NOTICIA"}>
          <option value="NOTICIA">Notícia</option>
          <option value="AVISO">Aviso</option>
          <option value="DESTAQUE">Destaque</option>
          <option value="DOCUMENTO">Documento</option>
        </Select>
      </FormField>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox name="destaque" defaultChecked={post?.destaque} />
          Destaque na página inicial
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox name="importante" defaultChecked={post?.importante} />
          Marcar como importante
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox name="publicado" defaultChecked={post?.publicado ?? true} />
          Publicado
        </label>
      </div>

      {state.error && (
        <div className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
          {state.error}
        </div>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
