import { prisma } from "@/lib/prisma";

export interface EscolaScopeAnos {
  escolaId: number;
}

function anoDaData(data: string): number {
  return Number(data.slice(0, 4));
}

async function resolverNomeEscola(escolaId: number): Promise<string | null> {
  const escola = await prisma.escola.findUnique({ where: { id: escolaId }, select: { nome: true } });
  return escola?.nome ?? null;
}

/**
 * Anos letivos com dado real (rede inteira, ou escopados a uma escola),
 * derivados de `NotaEstudante`/`FrequenciaEstudante`/`Avaliacao` — nunca de
 * `Estudante.ano`, que é só o snapshot de matrícula MAIS RECENTE de cada
 * aluno (ver `upsertEstudante` em `lib/sync/sigeduc-sync.ts`) e por isso some
 * com anos antigos de quem já migrou de ano/escola, mesmo com notas/
 * frequência daquele ano ainda no banco. Fonte única para todo filtro de ano
 * letivo do app — não recriar `prisma.estudante.groupBy({by:["ano"]})` em
 * nenhuma página nova.
 */
export async function getAnosLetivosDisponiveis(scope?: EscolaScopeAnos): Promise<number[]> {
  const escolaId = scope?.escolaId;
  const nomeEscola = escolaId ? await resolverNomeEscola(escolaId) : null;

  // `escola`/`serie` em NotaEstudante e FrequenciaEstudante são o nome no
  // momento do registro (nem sempre preenchido em dado antigo) — quando
  // ausente, cai para o vínculo atual do Estudante, mesmo fallback já usado
  // em lib/queries/distorcao.ts (resolverMatriculaPorAno).
  const notaWhere = escolaId ? { OR: [{ escola: nomeEscola }, { escola: null, estudante: { escolaId } }] } : {};
  const frequenciaWhere = escolaId
    ? { OR: [{ escola: nomeEscola }, { escola: null, estudante: { escolaId } }] }
    : {};
  const avaliacaoWhere = escolaId
    ? { OR: [{ resultados: { some: { escolaId } } }, { resultadosTurma: { some: { escolaId } } }] }
    : {};

  const [notaAnos, avaliacaoAnos, frequenciaDatas] = await Promise.all([
    prisma.notaEstudante.findMany({ where: notaWhere, distinct: ["ano"], select: { ano: true } }),
    prisma.avaliacao.findMany({ where: avaliacaoWhere, distinct: ["ano"], select: { ano: true } }),
    prisma.frequenciaEstudante.findMany({ where: frequenciaWhere, distinct: ["data"], select: { data: true } }),
  ]);

  const anos = new Set<number>();
  for (const n of notaAnos) anos.add(n.ano);
  for (const a of avaliacaoAnos) anos.add(a.ano);
  for (const f of frequenciaDatas) anos.add(anoDaData(f.data));

  return Array.from(anos).sort((a, b) => b - a);
}

/** Nome do cookie que guarda a última seleção de ano(s) letivo(s) do usuário — mesmas opções de `lib/auth.ts` (httpOnly/secure/sameSite=lax). */
export const ANOS_LETIVOS_COOKIE_NAME = "sme_anos_letivos";

export type SelecaoAnosLetivos =
  | { modo: "unico"; ano: number }
  | { modo: "multiplos"; anos: number[] }
  /** `anos` é sempre a lista completa de `anosDisponiveis` no momento da resolução — não um valor congelado. */
  | { modo: "todos"; anos: number[] };

interface SearchParamsAnosLetivos {
  anos?: string | string[];
  ano?: string;
}

interface CookieAnosLetivos {
  modo: string;
  anos: string[];
}

function paraArray(valor: string | string[] | undefined): string[] {
  if (valor === undefined) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function parseCookieAnosLetivos(valor: string | undefined): CookieAnosLetivos | null {
  if (!valor) return null;
  try {
    const parsed: unknown = JSON.parse(valor);
    if (
      parsed &&
      typeof parsed === "object" &&
      "modo" in parsed &&
      "anos" in parsed &&
      typeof (parsed as { modo: unknown }).modo === "string" &&
      Array.isArray((parsed as { anos: unknown }).anos)
    ) {
      return parsed as CookieAnosLetivos;
    }
  } catch {
    // cookie corrompido ou de um formato antigo — ignora e cai pro próximo critério.
  }
  return null;
}

/** `null` quando nenhum ano de `anosBrutos` é válido (ou `anosDisponiveis` está vazio) — sinaliza ao chamador para tentar o próximo critério da cadeia de prioridade. */
function construirSelecao(
  modo: string,
  anosBrutos: string[],
  anosDisponiveis: number[],
): SelecaoAnosLetivos | null {
  if (anosDisponiveis.length === 0) return null;

  if (modo === "todos") {
    return { modo: "todos", anos: anosDisponiveis };
  }

  const anosValidos = Array.from(
    new Set(
      anosBrutos
        .map((a) => Number(a))
        .filter((a) => Number.isInteger(a) && anosDisponiveis.includes(a)),
    ),
  ).sort((a, b) => a - b);

  if (anosValidos.length === 0) return null;
  if (anosValidos.length === 1) return { modo: "unico", ano: anosValidos[0]! };
  return { modo: "multiplos", anos: anosValidos };
}

/**
 * Resolve a seleção de ano(s) letivo(s) ativa, na ordem de prioridade:
 * 1. `?anos=` na URL (repetido — `?anos=2024&anos=2025` —, ou a sentinela
 *    `?anos=todos`).
 * 2. `?ano=` singular (compatibilidade com links/bookmarks antigos, mantida
 *    indefinidamente — custo de manutenção baixo).
 * 3. Cookie `sme_anos_letivos`, gravado por `salvarSelecaoAnosLetivosAction`
 *    (`lib/actions/anos-letivos.ts`) — é o que faz a seleção persistir ao
 *    navegar pela sidebar, que não propaga `?anos=`.
 * 4. Default: o ano mais recente disponível (mesmo comportamento de
 *    `resolverAnoLetivo` hoje).
 *
 * Qualquer ano fora de `anosDisponiveis` é descartado antes de cair pro
 * próximo critério — nunca deixa a UI "selecionada" num ano sem dado.
 */
export function resolverSelecaoAnosLetivos(
  searchParams: SearchParamsAnosLetivos,
  cookieValor: string | undefined,
  anosDisponiveis: number[],
): SelecaoAnosLetivos {
  const anosQuery = paraArray(searchParams.anos);
  if (anosQuery.length > 0) {
    const modo = anosQuery.includes("todos") ? "todos" : "multiplos";
    const selecao = construirSelecao(modo, anosQuery, anosDisponiveis);
    if (selecao) return selecao;
  }

  if (searchParams.ano) {
    const selecao = construirSelecao("multiplos", [searchParams.ano], anosDisponiveis);
    if (selecao) return selecao;
  }

  const cookie = parseCookieAnosLetivos(cookieValor);
  if (cookie) {
    const selecao = construirSelecao(cookie.modo, cookie.anos, anosDisponiveis);
    if (selecao) return selecao;
  }

  return { modo: "unico", ano: anosDisponiveis[0] ?? new Date().getFullYear() };
}

/** Ano "de referência" de uma seleção — usado pelos KPIs de ponto-no-tempo (o card continua mostrando 1 ano, mesmo quando a seleção é multi-ano). O mais recente dos anos selecionados. */
export function anoReferencia(selecao: SelecaoAnosLetivos): number {
  return selecao.modo === "unico" ? selecao.ano : Math.max(...selecao.anos);
}

/** Anos (ordenados ascendente) a considerar num gráfico de evolução histórica. */
export function anosParaEvolucao(selecao: SelecaoAnosLetivos): number[] {
  return selecao.modo === "unico" ? [selecao.ano] : [...selecao.anos].sort((a, b) => a - b);
}
