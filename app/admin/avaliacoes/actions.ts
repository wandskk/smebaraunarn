"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { normalizeCpf } from "@/lib/utils";
import { avaliacaoSchema, questaoSchema, resultadoSchema } from "@/lib/validations/avaliacao";

export interface FormState {
  error: string | null;
}

export async function createAvaliacaoAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const parsed = avaliacaoSchema.safeParse({
    codigo: formData.get("codigo"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    tipo: formData.get("tipo"),
    ano: formData.get("ano"),
    etapaEnsino: formData.get("etapaEnsino"),
    ativo: formData.get("ativo") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.avaliacao.findUnique({ where: { codigo: parsed.data.codigo } });
  if (existing) {
    return { error: "Já existe uma avaliação com este código." };
  }

  const avaliacao = await prisma.avaliacao.create({
    data: { ...parsed.data, descricao: parsed.data.descricao || null, etapaEnsino: parsed.data.etapaEnsino || null },
  });

  revalidatePath("/admin/avaliacoes");
  redirect(`/admin/avaliacoes/${avaliacao.id}`);
}

export async function deleteAvaliacaoAction(id: string) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await prisma.avaliacao.delete({ where: { id } });
  revalidatePath("/admin/avaliacoes");
}

export async function addQuestaoAction(
  avaliacaoId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const parsed = questaoSchema.safeParse({
    numero: formData.get("numero"),
    enunciado: formData.get("enunciado"),
    descritor: formData.get("descritor"),
    gabaritoCorreto: formData.get("gabaritoCorreto"),
    peso: formData.get("peso") || 1,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Número duplicado na mesma avaliação quebraria a análise por item
  // (respostasJson usa o número da questão como chave) — sem índice único no
  // schema, a validação precisa acontecer aqui.
  const duplicada = await prisma.avaliacaoQuestao.findFirst({ where: { avaliacaoId, numero: parsed.data.numero } });
  if (duplicada) {
    return { error: `Já existe a questão nº ${parsed.data.numero} nesta avaliação.` };
  }

  await prisma.avaliacaoQuestao.create({
    data: {
      avaliacaoId,
      numero: parsed.data.numero,
      enunciado: parsed.data.enunciado || null,
      descritor: parsed.data.descritor || null,
      gabaritoCorreto: parsed.data.gabaritoCorreto || null,
      peso: parsed.data.peso,
    },
  });

  revalidatePath(`/admin/avaliacoes/${avaliacaoId}`);
  return { error: null };
}

export async function deleteQuestaoAction(avaliacaoId: string, questaoId: string) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await prisma.avaliacaoQuestao.delete({ where: { id: questaoId } });
  revalidatePath(`/admin/avaliacoes/${avaliacaoId}`);
}

export async function updateQuestaoAction(
  avaliacaoId: string,
  questaoId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const parsed = questaoSchema.safeParse({
    numero: formData.get("numero"),
    enunciado: formData.get("enunciado"),
    descritor: formData.get("descritor"),
    gabaritoCorreto: formData.get("gabaritoCorreto"),
    peso: formData.get("peso") || 1,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const duplicada = await prisma.avaliacaoQuestao.findFirst({
    where: { avaliacaoId, numero: parsed.data.numero, id: { not: questaoId } },
  });
  if (duplicada) {
    return { error: `Já existe a questão nº ${parsed.data.numero} nesta avaliação.` };
  }

  await prisma.avaliacaoQuestao.update({
    where: { id: questaoId },
    data: {
      numero: parsed.data.numero,
      enunciado: parsed.data.enunciado || null,
      descritor: parsed.data.descritor || null,
      gabaritoCorreto: parsed.data.gabaritoCorreto || null,
      peso: parsed.data.peso,
    },
  });

  revalidatePath(`/admin/avaliacoes/${avaliacaoId}`);
  redirect(`/admin/avaliacoes/${avaliacaoId}?tab=questoes`);
}

export async function registrarResultadoAction(
  avaliacaoId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession(["ADMIN", "SECRETARIA"]);

  const raw = {
    matriculaOuCpf: formData.get("matriculaOuCpf"),
    turma: formData.get("turma"),
    pontuacao: formData.get("pontuacao") || undefined,
    nivelDesempenho: formData.get("nivelDesempenho") || undefined,
    palavrasPorMin: formData.get("palavrasPorMin") || undefined,
    observacoes: formData.get("observacoes"),
  };

  const parsed = resultadoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const identificador = parsed.data.matriculaOuCpf.trim();
  const estudante = await prisma.estudante.findFirst({
    where: {
      OR: [{ matricula: identificador }, { cpf: normalizeCpf(identificador) }],
    },
  });

  if (!estudante) {
    return { error: "Aluno não encontrado pela matrícula ou CPF informado." };
  }

  // Resposta por questão (chave = número da questão, ex.: "1", "2") — só
  // presente quando a avaliação tem questões cadastradas (ResultadoForm só
  // renderiza esses campos nesse caso). Habilita a análise por item/descritor
  // sem precisar de importação; campo vazio não entra no objeto.
  const respostasJson: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("resposta_") || typeof value !== "string") continue;
    const numero = key.slice("resposta_".length);
    if (value.trim() !== "") respostasJson[numero] = value.trim();
  }

  await prisma.avaliacaoResultadoAluno.upsert({
    where: { avaliacaoId_estudanteId: { avaliacaoId, estudanteId: estudante.id } },
    update: {
      turma: parsed.data.turma,
      pontuacao: parsed.data.pontuacao ?? null,
      nivelDesempenho: parsed.data.nivelDesempenho || null,
      palavrasPorMin: parsed.data.palavrasPorMin ?? null,
      observacoes: parsed.data.observacoes || null,
      ...(Object.keys(respostasJson).length > 0 ? { respostasJson } : {}),
    },
    create: {
      avaliacaoId,
      estudanteId: estudante.id,
      escolaId: estudante.escolaId,
      turma: parsed.data.turma,
      pontuacao: parsed.data.pontuacao ?? null,
      nivelDesempenho: parsed.data.nivelDesempenho || null,
      palavrasPorMin: parsed.data.palavrasPorMin ?? null,
      observacoes: parsed.data.observacoes || null,
      respostasJson: Object.keys(respostasJson).length > 0 ? respostasJson : undefined,
    },
  });

  revalidatePath(`/admin/avaliacoes/${avaliacaoId}`);
  return { error: null };
}

export async function deleteResultadoAction(avaliacaoId: string, resultadoId: string) {
  await requireSession(["ADMIN", "SECRETARIA"]);
  await prisma.avaliacaoResultadoAluno.delete({ where: { id: resultadoId } });
  revalidatePath(`/admin/avaliacoes/${avaliacaoId}`);
}
