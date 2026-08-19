/**
 * Compara, escola por escola, os estudantes retornados pelo SIGEduc
 * (mesmo endpoint que o sync usa: consulta-estudante/enturmado) com o que
 * está gravado localmente — para descobrir exatamente onde está a
 * discrepância entre a contagem do SIGEduc e a do banco local.
 *
 * Ao contrário do sync normal (lib/sync/sigeduc-sync.ts), este script NÃO
 * aborta quando uma escola dá erro: registra o erro e segue para a
 * próxima, porque o objetivo aqui é justamente revelar quais escolas estão
 * travando o sync de verdade (ver lib/sync/sigeduc-sync.ts:278-315, onde um
 * erro numa escola interrompe todas as seguintes).
 *
 * Uso:
 *   npx tsx scripts/diff-estudantes-sigeduc.ts --ano=2026
 *   npx tsx scripts/diff-estudantes-sigeduc.ts --ano=2026 --saida=faltantes.json
 */
import { prisma } from "../lib/prisma";
import { consultarEstudantesEnturmados, type EstudanteResponse } from "../lib/sigeduc";
import { writeFileSync } from "fs";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (nome: string) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];

  const ano = Number(get("ano")) || new Date().getFullYear();
  const saida = get("saida");

  return { ano, saida };
}

interface ResultadoEscola {
  escolaId: number;
  nomeEscola: string;
  sigeducTotal: number | null; // null = falhou ao consultar
  localTotal: number;
  erro: string | null;
  faltandoNoLocal: EstudanteResponse[];
}

async function buscarTodosDaEscola(ano: number, idEscola: number): Promise<EstudanteResponse[]> {
  const dados: EstudanteResponse[] = [];
  let pagina = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resposta = await consultarEstudantesEnturmados({ ano, idEscola }, pagina, 1000);
    dados.push(...resposta.dados);
    if (!resposta.temProximaPagina) break;
    pagina += 1;
  }
  return dados;
}

async function main() {
  const { ano, saida } = parseArgs();
  console.log(`=== Diff SIGEduc x banco local — estudantes enturmados, ano ${ano} ===\n`);

  const escolas = await prisma.escola.findMany({ orderBy: { id: "asc" } });
  const localEstudantes = await prisma.estudante.findMany({
    select: { id: true, matricula: true, escolaId: true, ano: true },
  });
  const localPorId = new Map(localEstudantes.map((e) => [e.id, e]));

  const resultados: ResultadoEscola[] = [];
  let sigeducTotalGeral = 0;
  let localTotalGeral = 0;
  let escolasComErro = 0;

  for (const escola of escolas) {
    const localDaEscola = localEstudantes.filter((e) => e.escolaId === escola.id && e.ano === ano);

    try {
      const dados = await buscarTodosDaEscola(ano, escola.id);
      const faltandoNoLocal = dados.filter((e) => !localPorId.has(e.id));

      resultados.push({
        escolaId: escola.id,
        nomeEscola: escola.nome,
        sigeducTotal: dados.length,
        localTotal: localDaEscola.length,
        erro: null,
        faltandoNoLocal,
      });

      sigeducTotalGeral += dados.length;
      localTotalGeral += localDaEscola.length;

      const diff = dados.length - localDaEscola.length;
      const marca = diff === 0 ? "OK" : diff > 0 ? `FALTAM ${diff}` : `${-diff} A MAIS localmente`;
      console.log(
        `[${marca.padEnd(14)}] escola ${escola.id} (${escola.nome}): SIGEduc=${dados.length} local=${localDaEscola.length}`,
      );
    } catch (err) {
      escolasComErro += 1;
      const message = err instanceof Error ? err.message : String(err);
      resultados.push({
        escolaId: escola.id,
        nomeEscola: escola.nome,
        sigeducTotal: null,
        localTotal: localDaEscola.length,
        erro: message,
        faltandoNoLocal: [],
      });
      console.log(`[ERRO          ] escola ${escola.id} (${escola.nome}): ${message}`);
    }
  }

  const totalFaltando = resultados.reduce((acc, r) => acc + r.faltandoNoLocal.length, 0);

  console.log(`\n=== Resumo ===`);
  console.log(`Escolas consultadas com sucesso: ${escolas.length - escolasComErro}/${escolas.length}`);
  if (escolasComErro > 0) {
    console.log(`Escolas com ERRO na consulta (não entraram no total): ${escolasComErro}`);
  }
  console.log(`Total SIGEduc (escolas OK, ano ${ano}): ${sigeducTotalGeral}`);
  console.log(`Total local (mesmas escolas, ano ${ano}): ${localTotalGeral}`);
  console.log(`Alunos que o SIGEduc retornou e não estão no banco: ${totalFaltando}`);

  if (saida) {
    const paraSalvar = resultados
      .filter((r) => r.erro || r.faltandoNoLocal.length > 0)
      .map((r) => ({
        escolaId: r.escolaId,
        nomeEscola: r.nomeEscola,
        sigeducTotal: r.sigeducTotal,
        localTotal: r.localTotal,
        erro: r.erro,
        faltandoNoLocal: r.faltandoNoLocal.map((e) => ({ id: e.id, matricula: e.matricula, nome: e.nome })),
      }));
    writeFileSync(saida, JSON.stringify(paraSalvar, null, 2));
    console.log(`\nDetalhes (escolas com erro ou com alunos faltando) gravados em ${saida}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO FATAL:", err);
    process.exit(1);
  });
