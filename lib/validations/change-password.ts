import { z } from "zod";

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(4, "A nova senha deve ter pelo menos 4 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });
