"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { syncCargos, syncEscolas, syncEstudantes, syncServidores } from "@/lib/sync/sigeduc-sync";

export async function syncEscolasAction() {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await syncEscolas().catch(() => null);
  revalidatePath("/admin/sincronizacao");
}

export async function syncCargosAction() {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await syncCargos().catch(() => null);
  revalidatePath("/admin/sincronizacao");
}

export async function syncServidoresAction() {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await syncServidores().catch(() => null);
  revalidatePath("/admin/sincronizacao");
}

export async function syncEstudantesAction(formData: FormData) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const ano = Number(formData.get("ano")) || new Date().getFullYear();
  await syncEstudantes(ano).catch(() => null);
  revalidatePath("/admin/sincronizacao");
}
