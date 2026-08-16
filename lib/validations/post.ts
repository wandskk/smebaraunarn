import { z } from "zod";

export const postSchema = z.object({
  titulo: z.string().min(3, "Informe um título com pelo menos 3 caracteres."),
  resumo: z.string().max(300).optional().or(z.literal("")),
  conteudo: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres."),
  categoria: z.enum(["NOTICIA", "AVISO", "DESTAQUE", "DOCUMENTO"]),
  destaque: z.coerce.boolean().default(false),
  importante: z.coerce.boolean().default(false),
  publicado: z.coerce.boolean().default(true),
});

export type PostInput = z.infer<typeof postSchema>;
