import "server-only";

import { put } from "@vercel/blob";

/** Envia um arquivo para o Vercel Blob e retorna a URL pública. */
export async function uploadToBlob(file: File, folder: string): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const blob = await put(`${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    token,
  });

  return blob.url;
}
