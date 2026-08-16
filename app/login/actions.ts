"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { establishSession, hashPassword, verifyPassword } from "@/lib/auth";
import { roleHomePath } from "@/lib/session";
import { normalizeBirthDate, normalizeCpf } from "@/lib/utils";
import { classifyServidorRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validations/auth";

export interface LoginState {
  error: string | null;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    cpf: formData.get("cpf"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const cpf = normalizeCpf(parsed.data.cpf);
  const senhaBruta = parsed.data.senha;
  const senhaComoData = normalizeBirthDate(senhaBruta);

  const candidatosSenha = Array.from(
    new Set([senhaBruta, senhaComoData].filter((v): v is string => Boolean(v))),
  );

  // 1. Usuário já provisionado (ADMIN, SECRETARIA ou conta manual/reincidente)
  const existingUser = await prisma.user.findUnique({ where: { cpf } });

  if (existingUser) {
    if (!existingUser.ativo) {
      return { error: "Este acesso está desativado. Procure a Secretaria de Educação." };
    }

    for (const candidato of candidatosSenha) {
      if (await verifyPassword(candidato, existingUser.passwordHash)) {
        // Reflete mudanças na fonte (SIGEduc) a cada login — ex.: a Secretaria
        // vinculou a escola de um diretor, ou o cargo do servidor mudou —
        // sem isso, a conta ficaria presa para sempre no snapshot do 1º login.
        let { role, escolaId, nome } = existingUser;

        if (existingUser.servidorId) {
          const servidor = await prisma.servidor.findUnique({ where: { id: existingUser.servidorId } });
          if (servidor) {
            role = classifyServidorRole(servidor.cargo, servidor.funcao);
            escolaId = servidor.escolaId;
            nome = servidor.nome;
          }
        } else if (existingUser.estudanteId) {
          const estudante = await prisma.estudante.findUnique({ where: { id: existingUser.estudanteId } });
          if (estudante) {
            escolaId = estudante.escolaId;
            nome = estudante.nome;
          }
        }

        if (role !== existingUser.role || escolaId !== existingUser.escolaId || nome !== existingUser.nome) {
          await prisma.user.update({ where: { id: existingUser.id }, data: { role, escolaId, nome } });
        }

        await establishSession({
          userId: existingUser.id,
          cpf: existingUser.cpf,
          nome,
          role,
          escolaId,
          servidorId: existingUser.servidorId,
          estudanteId: existingUser.estudanteId,
        });
        redirect(roleHomePath(role));
      }
    }

    return { error: "CPF ou senha inválidos." };
  }

  if (!senhaComoData) {
    return { error: "Informe a data de nascimento como senha (DD/MM/AAAA)." };
  }

  // 2. Servidor (Direção, Professor ou Servidor Geral)
  const servidor = await prisma.servidor.findUnique({ where: { cpf } });
  if (servidor) {
    const dataNascimentoServidor = normalizeBirthDate(servidor.dataNascimento ?? "");
    if (!dataNascimentoServidor || dataNascimentoServidor !== senhaComoData) {
      return { error: "CPF ou senha inválidos." };
    }

    const role = classifyServidorRole(servidor.cargo, servidor.funcao);
    const passwordHash = await hashPassword(senhaComoData);

    const user = await prisma.user.create({
      data: {
        cpf,
        nome: servidor.nome,
        passwordHash,
        role,
        escolaId: servidor.escolaId,
        servidorId: servidor.id,
      },
    });

    await establishSession({
      userId: user.id,
      cpf: user.cpf,
      nome: user.nome,
      role: user.role,
      escolaId: user.escolaId,
      servidorId: user.servidorId,
      estudanteId: user.estudanteId,
    });
    redirect(roleHomePath(role));
  }

  // 3. Estudante (CPF próprio) ou, na falta dele — comum em anos iniciais,
  // onde o aluno ainda não tem CPF emitido —, o CPF do responsável cadastrado
  // na origem (documentoResponsavel). Se o mesmo responsável tiver mais de um
  // filho na rede sem CPF próprio, só o primeiro (por id) fica acessível por
  // este fluxo automático; para os demais, crie o acesso manualmente em
  // /admin/usuarios vinculando ao estudante certo com outro CPF de contato.
  const estudante =
    (await prisma.estudante.findFirst({ where: { cpf }, orderBy: { id: "asc" } })) ??
    (await prisma.estudante.findFirst({ where: { documentoResponsavel: cpf }, orderBy: { id: "asc" } }));
  if (estudante) {
    const dataNascimentoAluno = normalizeBirthDate(estudante.dataNascimento ?? "");
    if (!dataNascimentoAluno || dataNascimentoAluno !== senhaComoData) {
      return { error: "CPF ou senha inválidos." };
    }

    const passwordHash = await hashPassword(senhaComoData);

    const user = await prisma.user.create({
      data: {
        cpf,
        nome: estudante.nome,
        passwordHash,
        role: "ALUNO",
        escolaId: estudante.escolaId,
        estudanteId: estudante.id,
      },
    });

    await establishSession({
      userId: user.id,
      cpf: user.cpf,
      nome: user.nome,
      role: user.role,
      escolaId: user.escolaId,
      servidorId: user.servidorId,
      estudanteId: user.estudanteId,
    });
    redirect(roleHomePath("ALUNO"));
  }

  return { error: "CPF não encontrado. Procure a Secretaria de Educação para regularizar seu acesso." };
}
