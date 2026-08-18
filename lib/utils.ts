import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Resolve o ano letivo pedido via query string contra a lista de anos com
 * dado real, caindo para o mais recente disponível se o parâmetro faltar ou
 * for um ano sem dado — usado nos filtros globais do Centro de Indicadores.
 */
export function resolverAnoLetivo(searchParams: { ano?: string }, anosDisponiveis: number[]): number {
  const solicitado = searchParams.ano ? Number(searchParams.ano) : NaN;
  if (Number.isInteger(solicitado) && anosDisponiveis.includes(solicitado)) return solicitado;
  return anosDisponiveis[0] ?? new Date().getFullYear();
}

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Normaliza um CPF para 11 dígitos, aceitando com ou sem pontuação. */
export function normalizeCpf(value: string | null | undefined): string {
  return onlyDigits(value).padStart(11, "0").slice(-11);
}

export function formatCpf(value: string): string {
  const digits = normalizeCpf(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Exige exatamente 11 dígitos — usado para validar entrada do usuário. */
export function isValidCpfFormat(value: string | null | undefined): boolean {
  return onlyDigits(value).length === 11;
}

/**
 * Normaliza um CPF só quando o valor bruto tem 10 ou 11 dígitos: 10 é o caso
 * comum de fonte que armazena CPF como número e perde o zero à esquerda; 11
 * é o formato completo. Valores mais curtos (ex.: "0", fragmentos, outros
 * documentos) não são CPFs confiáveis — completá-los com padStart inventaria
 * dígitos e pode colidir com um CPF real (ex.: "0" viraria "00000000000").
 * Usado para documentoResponsavel, que na origem (SIGEduc) não tem a mesma
 * qualidade de dado garantida que o CPF do próprio estudante/servidor.
 */
export function normalizeCpfLoose(value: string | null | undefined): string | null {
  const digits = onlyDigits(value);
  if (digits.length < 10 || digits.length > 11) return null;
  return digits.padStart(11, "0");
}

/**
 * Normaliza uma data de nascimento informada em qualquer um dos formatos
 * aceitos (DDMMAAAA, DD/MM/YYYY, YYYY-MM-DD) para o formato canônico YYYY-MM-DD.
 * Retorna null se a data for inválida.
 */
export function normalizeBirthDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return buildIsoDate(isoMatch[1]!, isoMatch[2]!, isoMatch[3]!);
  }

  // DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return buildIsoDate(slashMatch[3]!, slashMatch[2]!, slashMatch[1]!);
  }

  // DDMMAAAA
  const digits = onlyDigits(trimmed);
  if (digits.length === 8) {
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    return buildIsoDate(yyyy, mm, dd);
  }

  return null;
}

function buildIsoDate(yyyy: string, mm: string, dd: string): string | null {
  const year = Number(yyyy);
  const month = Number(mm);
  const day = Number(dd);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
