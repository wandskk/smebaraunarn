"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserVinculoAction } from "../actions";
import { VinculoPicker, type VinculoSelection } from "../vinculo-picker";
import { Button } from "@/components/ui/button";

interface EditVinculoFormProps {
  userId: string;
  vinculoAtual: VinculoSelection;
}

export function EditVinculoForm({ userId, vinculoAtual }: EditVinculoFormProps) {
  const router = useRouter();
  const [vinculo, setVinculo] = useState<VinculoSelection>(vinculoAtual);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function handleSubmit() {
    setErro(null);
    setSucesso(false);
    if (vinculo.tipo !== "NENHUM" && !vinculo.id) {
      setErro("Selecione um servidor ou estudante.");
      return;
    }
    startTransition(async () => {
      const result = await updateUserVinculoAction(userId, vinculo.tipo, vinculo.id);
      if (result.error) {
        setErro(result.error);
      } else {
        setSucesso(true);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <VinculoPicker value={vinculo} onChange={setVinculo} />
      <Button type="button" disabled={isPending} onClick={handleSubmit} className="mt-3">
        {isPending ? "Salvando..." : "Salvar vínculo"}
      </Button>
      {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
      {sucesso && <p className="mt-2 text-sm text-success">Vínculo atualizado.</p>}
    </div>
  );
}
