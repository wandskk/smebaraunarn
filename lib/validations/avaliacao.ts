import { z } from "zod";

export const avaliacaoSchema = z.object({
  codigo: z.string().min(2, "Informe um código único, ex: FLUENCIA-2025.1"),
  nome: z.string().min(3, "Informe um nome para a avaliação."),
  descricao: z.string().optional().or(z.literal("")),
  tipo: z.enum(["FLUENCIA_LEITORA", "SPADEB", "SIMULADO", "PROVA_MUNICIPAL"]),
  ano: z.coerce.number().int().min(2000).max(2100),
  etapaEnsino: z.string().optional().or(z.literal("")),
  ativo: z.coerce.boolean().default(true),
});

export const questaoSchema = z.object({
  numero: z.coerce.number().int().min(1),
  enunciado: z.string().optional().or(z.literal("")),
  descritor: z.string().optional().or(z.literal("")),
  gabaritoCorreto: z.string().optional().or(z.literal("")),
  peso: z.coerce.number().min(0).default(1),
});

export const resultadoSchema = z.object({
  matriculaOuCpf: z.string().min(1, "Informe a matrícula ou CPF do aluno."),
  turma: z.string().min(1, "Informe a turma."),
  pontuacao: z.coerce.number().optional(),
  nivelDesempenho: z
    .enum([
      "NAO_LEITOR",
      "LEITOR_DE_SILABAS",
      "LEITOR_DE_PALAVRAS",
      "LEITOR_DE_FRASES",
      "LEITOR_SEM_FLUENCIA",
      "LEITOR_FLUENTE",
    ])
    .optional()
    .or(z.literal("")),
  palavrasPorMin: z.coerce.number().int().optional(),
  observacoes: z.string().optional().or(z.literal("")),
});
