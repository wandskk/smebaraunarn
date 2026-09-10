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
