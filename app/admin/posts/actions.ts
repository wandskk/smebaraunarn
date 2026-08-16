"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { slugify } from "@/lib/utils";
import { uploadToBlob } from "@/lib/blob";
import { postSchema } from "@/lib/validations/post";

export interface PostFormState {
  error: string | null;
}

function readForm(formData: FormData) {
  return postSchema.safeParse({
    titulo: formData.get("titulo"),
    resumo: formData.get("resumo"),
    conteudo: formData.get("conteudo"),
    categoria: formData.get("categoria"),
    destaque: formData.get("destaque") === "on",
    importante: formData.get("importante") === "on",
    publicado: formData.get("publicado") === "on",
  });
}

async function resolveImagemCapa(
  formData: FormData,
  existingUrl: string | null,
): Promise<string | null> {
  const file = formData.get("imagemCapaFile");
  if (file instanceof File && file.size > 0) {
    return uploadToBlob(file, "posts");
  }

  const manualUrl = formData.get("imagemCapa");
  if (typeof manualUrl === "string" && manualUrl.trim()) {
    try {
      return new URL(manualUrl.trim()).toString();
    } catch {
      return existingUrl;
    }
  }

  return existingUrl;
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const baseSlug = slugify(base) || "post";
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function createPostAction(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const session = await requireSession(["ADMIN", "SECRETARIA"]);
  const parsed = readForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const slug = await uniqueSlug(parsed.data.titulo);
  const imagemCapa = await resolveImagemCapa(formData, null);

  const post = await prisma.post.create({
    data: {
      ...parsed.data,
      resumo: parsed.data.resumo || null,
      imagemCapa,
      slug,
      autorId: session.userId,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/noticias");
  revalidatePath("/");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePostAction(
  postId: string,
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const parsed = readForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    return { error: "Publicação não encontrada." };
  }

  const slug =
    slugify(parsed.data.titulo) === existing.slug
      ? existing.slug
      : await uniqueSlug(parsed.data.titulo, postId);

  const imagemCapa = await resolveImagemCapa(formData, existing.imagemCapa);

  await prisma.post.update({
    where: { id: postId },
    data: {
      ...parsed.data,
      resumo: parsed.data.resumo || null,
      imagemCapa,
      slug,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/noticias");
  revalidatePath(`/noticias/${slug}`);
  revalidatePath("/");
  return { error: null };
}

export async function deletePostAction(postId: string) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin/posts");
  revalidatePath("/noticias");
  revalidatePath("/");
}
