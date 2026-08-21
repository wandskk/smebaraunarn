"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateIndicadoresAction, type FormState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: FormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  );
}

interface Props {
  indicadores: {
    totalEscolas: number;
    totalAlunos: number;
    totalDocumentos: number;
    totalAcessos: number;
  };
}

export function IndicadoresForm({ indicadores }: Props) {
  const [state, formAction] = useFormState(updateIndicadoresAction, initialState);

  return (
    <form action={formAction} className="grid max-w-lg gap-4 sm:grid-cols-2">
      {(
        [
          ["totalEscolas", "Escolas Municipais"],
          ["totalAlunos", "Alunos Matriculados"],
          ["totalDocumentos", "Documentos Publicados"],
          ["totalAcessos", "Acessos ao Portal"],
        ] as const
      ).map(([name, label]) => (
        <FormField key={name} label={label} htmlFor={name}>
          <Input id={name} name={name} type="number" min={0} defaultValue={indicadores[name]} />
        </FormField>
      ))}

      {state.error && (
        <div className="col-span-full rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
          {state.error}
        </div>
      )}

      <div className="col-span-full">
        <SubmitButton />
      </div>
    </form>
  );
}
