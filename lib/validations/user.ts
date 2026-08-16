import { z } from "zod";
import { isValidCpfFormat } from "@/lib/utils";

export const createUserSchema = z.object({
  cpf: z.string().refine(isValidCpfFormat, "CPF inválido."),
  nome: z.string().min(3, "Informe o nome completo."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "SECRETARIA", "DIRETOR", "PROFESSOR", "SERVIDOR_GERAL", "ALUNO"]),
  senha: z.string().min(4, "A senha deve ter pelo menos 4 caracteres."),
});
