"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createDocumentoAction, type FormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Publicando..." : "Publicar Documento"}
    </Button>
  );
}

export function DocumentoForm() {
  const [state, formAction] = useFormState(createDocumentoAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <Input name="titulo" placeholder="Título do documento" required className="sm:col-span-2" />
      <Input name="categoria" placeholder="Categoria (Portaria, Edital, Calendário...)" required />
      <Input name="tamanho" placeholder="Tamanho (ex: 1.2 MB) — preenchido automaticamente ao enviar arquivo" />
      <div className="sm:col-span-2">
        <Label htmlFor="arquivoFile">Arquivo (PDF)</Label>
        <input
          id="arquivoFile"
          name="arquivoFile"
          type="file"
          accept="application/pdf,.pdf"
          className="block w-full text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-subtle file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-subtle-foreground hover:file:bg-primary-subtle/70"
        />
        <Input name="arquivoUrl" placeholder="ou cole a URL do arquivo" className="mt-2" />
      </div>
      <Textarea name="descricao" placeholder="Descrição (opcional)" rows={2} className="sm:col-span-2" />
      <div>
        <SubmitButton />
      </div>
      {state.error && <p className="col-span-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
