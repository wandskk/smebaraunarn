"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/change-password";

export interface ChangePasswordState {
  error: string | null;
  success: boolean;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", success: false };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const senhaOk = await verifyPassword(parsed.data.senhaAtual, user.passwordHash);
  if (!senhaOk) {
    return { error: "Senha atual incorreta.", success: false };
  }

  const passwordHash = await hashPassword(parsed.data.novaSenha);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { error: null, success: true };
}
