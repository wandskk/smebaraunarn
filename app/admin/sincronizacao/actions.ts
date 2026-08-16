"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import {
  type ChunkResult,
  type PageChunkResult,
  type ServidorChunkResult,
  syncCargos,
  syncEscolas,
  syncEstudantesChunk,
  syncFrequenciaChunk,
  syncNotasChunk,
  syncServidoresChunk,
} from "@/lib/sync/sigeduc-sync";

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

/**
 * Sincroniza um lote de páginas por chamada, para não estourar o timeout da
 * função serverless em redes com muitos servidores. O cliente chama de novo
 * com `startPagina = nextPagina` e o mesmo `syncStartedAt` retornado, até
 * `done === true`.
 */
export async function syncServidoresChunkAction(
  startPagina: number,
  syncStartedAt?: string,
): Promise<ServidorChunkResult> {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const result = await syncServidoresChunk(startPagina, undefined, syncStartedAt);
  if (result.done) revalidatePath("/admin/sincronizacao");
  return result;
}

export async function syncEstudantesChunkAction(ano: number, startIndex: number): Promise<ChunkResult> {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const result = await syncEstudantesChunk(ano, startIndex);
  if (result.done) revalidatePath("/admin/sincronizacao");
  return result;
}

export async function syncNotasChunkAction(ano: number, startPagina: number): Promise<PageChunkResult> {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const result = await syncNotasChunk(ano, startPagina);
  if (result.done) revalidatePath("/admin/sincronizacao");
  return result;
}

export async function syncFrequenciaChunkAction(
  dataInicio: string,
  dataFim: string,
  startPagina: number,
): Promise<PageChunkResult> {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const result = await syncFrequenciaChunk(dataInicio, dataFim, startPagina);
  if (result.done) revalidatePath("/admin/sincronizacao");
  return result;
}
