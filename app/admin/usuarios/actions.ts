"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { hashPassword } from "@/lib/auth";
import { classifyServidorRole } from "@/lib/roles";
import { formatCpf, normalizeBirthDate, normalizeCpf } from "@/lib/utils";
import { createUserSchema, type VinculoTipo } from "@/lib/validations/user";

export interface FormState {
  error: string | null;
}

interface VinculoResolvido {
  cpf: string;
  nome: string;
  role: Role;
  escolaId: number | null;
  servidorId: number | null;
  estudanteId: number | null;
}

/**
 * Resolve os dados derivados do Servidor/Estudante selecionado como vínculo,
 * garantindo que a conta manual fique consistente com a mesma regra usada no
 * primeiro acesso automático (login por CPF) — sem isso, DIRETOR/PROFESSOR/
 * SERVIDOR_GERAL criados manualmente ficam com o portal quebrado.
 */
async function resolveVinculo(
  vinculoTipo: VinculoTipo,
  vinculoId: string | undefined,
  fallback: { cpf: string; nome: string; role: Role },
): Promise<VinculoResolvido | { error: string }> {
  if (vinculoTipo === "NENHUM") {
    return {
      cpf: fallback.cpf,
      nome: fallback.nome,
      role: fallback.role,
      escolaId: null,
      servidorId: null,
      estudanteId: null,
    };
  }

  const id = Number(vinculoId);
  if (!Number.isInteger(id)) {
    return { error: "Vínculo inválido." };
  }

  if (vinculoTipo === "SERVIDOR") {
    const servidor = await prisma.servidor.findUnique({ where: { id } });
    if (!servidor) return { error: "Servidor selecionado não encontrado." };
    return {
      cpf: servidor.cpf,
      nome: servidor.nome,
      role: classifyServidorRole(servidor.cargo, servidor.funcao),
      escolaId: servidor.escolaId,
      servidorId: servidor.id,
      estudanteId: null,
    };
  }

  const estudante = await prisma.estudante.findUnique({ where: { id } });
  if (!estudante) return { error: "Estudante selecionado não encontrado." };
  return {
    cpf: estudante.cpf ?? fallback.cpf,
    nome: estudante.nome,
    role: "ALUNO",
    escolaId: estudante.escolaId,
    servidorId: null,
    estudanteId: estudante.id,
  };
}

export async function createUserAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireSession(["ADMIN"]);

  const parsed = createUserSchema.safeParse({
    cpf: formData.get("cpf"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    role: formData.get("role"),
    senha: formData.get("senha"),
    vinculoTipo: formData.get("vinculoTipo") || "NENHUM",
    vinculoId: formData.get("vinculoId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const vinculo = await resolveVinculo(parsed.data.vinculoTipo, parsed.data.vinculoId, {
    cpf: normalizeCpf(parsed.data.cpf),
    nome: parsed.data.nome,
    role: parsed.data.role,
  });
  if ("error" in vinculo) {
    return { error: vinculo.error };
  }

  const cpf = normalizeCpf(vinculo.cpf);
  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) {
    return {
      error: `Já existe um acesso cadastrado para o CPF ${formatCpf(cpf)}${
        vinculo.servidorId || vinculo.estudanteId ? " (a pessoa selecionada já tem conta)" : ""
      }.`,
    };
  }

  const passwordHash = await hashPassword(parsed.data.senha);

  await prisma.user.create({
    data: {
      cpf,
      nome: vinculo.nome,
      email: parsed.data.email || null,
      role: vinculo.role,
      escolaId: vinculo.escolaId,
      servidorId: vinculo.servidorId,
      estudanteId: vinculo.estudanteId,
      passwordHash,
    },
  });

  revalidatePath("/admin/usuarios");
  return { error: null };
}

export interface VinculoOption {
  id: string;
  label: string;
  nome: string;
  cpfDigits: string | null;
}

/** Busca servidores ou estudantes por nome/CPF/matrícula para o seletor de vínculo. */
export async function searchVinculosAction(tipo: VinculoTipo, query: string): Promise<VinculoOption[]> {
  await requireSession(["ADMIN"]);

  const q = query.trim();
  if (tipo === "NENHUM" || q.length < 2) return [];

  if (tipo === "SERVIDOR") {
    const servidores = await prisma.servidor.findMany({
      where: { OR: [{ nome: { contains: q, mode: "insensitive" } }, { cpf: { contains: q } }] },
      orderBy: { nome: "asc" },
      take: 10,
    });
    return servidores.map((s) => ({
      id: String(s.id),
      label: `${s.nome} — ${formatCpf(s.cpf)}${s.cargo ? ` (${s.cargo})` : ""}`,
      nome: s.nome,
      cpfDigits: s.cpf,
    }));
  }

  const estudantes = await prisma.estudante.findMany({
    where: {
      OR: [
        { nome: { contains: q, mode: "insensitive" } },
        { matricula: { contains: q } },
        { cpf: { contains: q } },
      ],
    },
    orderBy: { nome: "asc" },
    take: 10,
  });
  return estudantes.map((e) => ({
    id: String(e.id),
    label: `${e.nome} — Mat. ${e.matricula}${e.turmaSerie ? ` (${e.turmaSerie})` : ""}${
      e.cpf ? "" : " · sem CPF na origem"
    }`,
    nome: e.nome,
    cpfDigits: e.cpf,
  }));
}

/**
 * Vincula (ou desvincula) uma conta já existente a um Servidor/Estudante —
 * usado para consertar contas manuais criadas antes desse vínculo existir,
 * ou para corrigir um vínculo errado.
 */
export async function updateUserVinculoAction(
  userId: string,
  vinculoTipo: VinculoTipo,
  vinculoId: string,
): Promise<FormState> {
  await requireSession(["ADMIN"]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado." };

  const vinculo = await resolveVinculo(vinculoTipo, vinculoId, {
    cpf: user.cpf,
    nome: user.nome,
    role: user.role,
  });
  if ("error" in vinculo) {
    return { error: vinculo.error };
  }

  const cpf = normalizeCpf(vinculo.cpf);
  if (cpf !== user.cpf) {
    const cpfEmUso = await prisma.user.findUnique({ where: { cpf } });
    if (cpfEmUso) {
      return { error: `O CPF ${formatCpf(cpf)} já está em uso por outra conta.` };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      cpf,
      nome: vinculo.nome,
      role: vinculo.role,
      escolaId: vinculo.escolaId,
      servidorId: vinculo.servidorId,
      estudanteId: vinculo.estudanteId,
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { error: null };
}

export async function toggleUserAtivoAction(userId: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.user.update({ where: { id: userId }, data: { ativo } });
  revalidatePath("/admin/usuarios");
}

export interface ResetPasswordResult {
  error: string | null;
  novaSenha: string | null;
}

/**
 * Redefine a senha para a data de nascimento cadastrada na origem (SIGEduc),
 * o mesmo padrão usado no primeiro acesso. Só funciona para contas vinculadas
 * a um Servidor ou Estudante — contas manuais não têm data de nascimento de
 * origem, use setPasswordAction para essas.
 */
export async function resetPasswordToBirthDateAction(userId: string): Promise<ResetPasswordResult> {
  await requireSession(["ADMIN"]);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado.", novaSenha: null };

  let dataNascimentoBruta: string | null = null;
  if (user.servidorId) {
    const servidor = await prisma.servidor.findUnique({ where: { id: user.servidorId } });
    dataNascimentoBruta = servidor?.dataNascimento ?? null;
  } else if (user.estudanteId) {
    const estudante = await prisma.estudante.findUnique({ where: { id: user.estudanteId } });
    dataNascimentoBruta = estudante?.dataNascimento ?? null;
  }

  const dataNascimento = normalizeBirthDate(dataNascimentoBruta);
  if (!dataNascimento) {
    return {
      error: "Não há data de nascimento cadastrada na origem para esta conta. Use a redefinição manual.",
      novaSenha: null,
    };
  }

  const passwordHash = await hashPassword(dataNascimento);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath("/admin/usuarios");

  const [yyyy, mm, dd] = dataNascimento.split("-");
  return { error: null, novaSenha: `${dd}/${mm}/${yyyy}` };
}

/** Define uma senha personalizada — usado para contas manuais (sem vínculo de origem). */
export async function setPasswordAction(userId: string, novaSenha: string): Promise<ResetPasswordResult> {
  await requireSession(["ADMIN"]);

  if (novaSenha.length < 4) {
    return { error: "A senha deve ter pelo menos 4 caracteres.", novaSenha: null };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado.", novaSenha: null };

  const passwordHash = await hashPassword(novaSenha);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath("/admin/usuarios");
  return { error: null, novaSenha };
}
