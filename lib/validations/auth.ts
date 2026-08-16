import { z } from "zod";
import { isValidCpfFormat } from "@/lib/utils";

export const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "Informe o CPF.")
    .refine(isValidCpfFormat, "CPF inválido. Use o formato 000.000.000-00."),
  senha: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;
