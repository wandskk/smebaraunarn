"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { uploadToBlob } from "@/lib/blob";
import { z } from "zod";

export interface FormState {
  error: string | null;
}

const documentoSchema = z.object({
  titulo: z.string().min(3, "Informe um título."),
  categoria: z.string().min(2, "Informe uma categoria."),
  descricao: z.string().optional().or(z.literal("")),
  tamanho: z.string().optional().or(z.literal("")),
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function createDocumentoAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const parsed = documentoSchema.safeParse({
    titulo: formData.get("titulo"),
    categoria: formData.get("categoria"),
    descricao: formData.get("descricao"),
    tamanho: formData.get("tamanho"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const file = formData.get("arquivoFile");
  const manualUrl = formData.get("arquivoUrl");

  let arquivoUrl: string | null = null;
  let tamanho = parsed.data.tamanho || null;

  if (file instanceof File && file.size > 0) {
    arquivoUrl = await uploadToBlob(file, "documentos");
    tamanho = tamanho ?? formatBytes(file.size);
  } else if (typeof manualUrl === "string" && manualUrl.trim()) {
    try {
      arquivoUrl = new URL(manualUrl.trim()).toString();
    } catch {
      return { error: "Informe uma URL válida ou envie um arquivo." };
    }
  }

  if (!arquivoUrl) {
    return { error: "Envie um arquivo ou informe a URL do documento." };
  }

  await prisma.documentoPublico.create({
    data: {
      titulo: parsed.data.titulo,
      categoria: parsed.data.categoria,
      descricao: parsed.data.descricao || null,
      arquivoUrl,
      tamanho,
    },
  });

  revalidatePath("/admin/documentos");
  revalidatePath("/documentos");
  revalidatePath("/");
  return { error: null };
}

export async function deleteDocumentoAction(id: string) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await prisma.documentoPublico.delete({ where: { id } });
  revalidatePath("/admin/documentos");
  revalidatePath("/documentos");
  revalidatePath("/");
}
