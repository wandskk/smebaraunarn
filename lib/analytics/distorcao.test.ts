import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calcularIdadeCompletadaNoAno,
  calcularDistorcaoIdadeSerie,
  calcularEvolucaoDistorcaoPorAno,
  classificarIntensidadeDefasagem,
  IDADE_ESPERADA_POR_SERIE,
  LIMIAR_DISTORCAO_ANOS,
  type MatriculaParaDistorcao,
} from "./distorcao";

describe("calcularIdadeCompletadaNoAno", () => {
  // Metodologia oficial do INEP (Dicionário de Indicadores Educacionais,
  // item D.2): idade = anoReferencia - anoNascimento, SEM olhar mês/dia —
  // o aluno é tratado como tendo completado essa idade em algum momento do
  // ano, mesmo que o aniversário ainda não tenha ocorrido.
  test("subtrai só o ano de nascimento, independente do mês/dia", () => {
    assert.equal(calcularIdadeCompletadaNoAno("2015-01-10", 2026), 11);
    assert.equal(calcularIdadeCompletadaNoAno("2015-12-31", 2026), 11);
  });

  test("aluno que nasceu no fim do ano ainda conta como tendo completado a idade (regra oficial do INEP)", () => {
    // Nascido em dezembro de 2015: só completa 11 anos em dezembro de 2026,
    // mas o INEP considera que ele "teve" 11 anos em algum momento de 2026.
    assert.equal(calcularIdadeCompletadaNoAno("2015-12-25", 2026), 11);
  });

  test("retorna null para datas fora do formato ISO (dado corrompido, não exceção)", () => {
    assert.equal(calcularIdadeCompletadaNoAno("15/06/2015", 2026), null);
    assert.equal(calcularIdadeCompletadaNoAno("", 2026), null);
    assert.equal(calcularIdadeCompletadaNoAno("2015-06", 2026), null);
  });
});

describe("calcularDistorcaoIdadeSerie", () => {
  test("idade exata para a série: sem distorção", () => {
    // 6º ano espera 11 anos; nascido em 2015, em 2026 completa 11.
    const resultado = calcularDistorcaoIdadeSerie("2015-01-10", "EF_6", 2026);
    assert.ok(resultado);
    assert.equal(resultado.idadeCompletadaNoAno, 11);
    assert.equal(resultado.idadeEsperada, 11);
    assert.equal(resultado.defasagemAnos, 0);
    assert.equal(resultado.emDistorcao, false);
  });

  test("nascido em dezembro do ano esperado: mesmo resultado que nascido em janeiro (regra oficial, não idade calendário)", () => {
    const nascidoJaneiro = calcularDistorcaoIdadeSerie("2015-01-10", "EF_6", 2026);
    const nascidoDezembro = calcularDistorcaoIdadeSerie("2015-12-25", "EF_6", 2026);
    assert.ok(nascidoJaneiro);
    assert.ok(nascidoDezembro);
    assert.equal(nascidoJaneiro.defasagemAnos, nascidoDezembro.defasagemAnos);
  });

  test("um ano acima do esperado ainda não é distorção (limiar é 2)", () => {
    const resultado = calcularDistorcaoIdadeSerie("2014-01-10", "EF_6", 2026);
    assert.ok(resultado);
    assert.equal(resultado.defasagemAnos, 1);
    assert.equal(resultado.emDistorcao, false);
  });

  test("exatamente 2 anos acima já é distorção", () => {
    const resultado = calcularDistorcaoIdadeSerie("2013-01-10", "EF_6", 2026);
    assert.ok(resultado);
    assert.equal(resultado.defasagemAnos, 2);
    assert.equal(resultado.emDistorcao, true);
  });

  test("idade abaixo do esperado não é distorção (defasagem negativa)", () => {
    const resultado = calcularDistorcaoIdadeSerie("2016-01-10", "EF_6", 2026);
    assert.ok(resultado);
    assert.equal(resultado.defasagemAnos, -1);
    assert.equal(resultado.emDistorcao, false);
  });

  test("aceita limiar customizado por rede", () => {
    const resultado = calcularDistorcaoIdadeSerie("2014-01-10", "EF_6", 2026, 1);
    assert.ok(resultado);
    assert.equal(resultado.defasagemAnos, 1);
    assert.equal(resultado.emDistorcao, true);
  });

  test("cobre todas as séries da tabela de idade esperada", () => {
    for (const [serie, idadeEsperada] of Object.entries(IDADE_ESPERADA_POR_SERIE)) {
      const nascimento = `${2026 - idadeEsperada}-01-10`;
      const resultado = calcularDistorcaoIdadeSerie(nascimento, serie as keyof typeof IDADE_ESPERADA_POR_SERIE, 2026);
      assert.ok(resultado, `${serie} deveria retornar um resultado`);
      assert.equal(resultado.defasagemAnos, 0, `${serie} deveria ter defasagem 0`);
    }
  });

  test("retorna null quando a data de nascimento está corrompida", () => {
    assert.equal(calcularDistorcaoIdadeSerie("24/03/0201", "EF_6", 2026), null);
  });

  test("o limiar padrão exportado é 2, conforme metodologia INEP", () => {
    assert.equal(LIMIAR_DISTORCAO_ANOS, 2);
  });
});

describe("classificarIntensidadeDefasagem", () => {
  test("classifica corretamente nos limites", () => {
    assert.equal(classificarIntensidadeDefasagem(-1), "nenhuma");
    assert.equal(classificarIntensidadeDefasagem(0), "nenhuma");
    assert.equal(classificarIntensidadeDefasagem(1), "nenhuma");
    assert.equal(classificarIntensidadeDefasagem(2), "moderada");
    assert.equal(classificarIntensidadeDefasagem(3), "moderada");
    assert.equal(classificarIntensidadeDefasagem(4), "severa");
    assert.equal(classificarIntensidadeDefasagem(10), "severa");
  });
});

describe("calcularEvolucaoDistorcaoPorAno", () => {
  test("lista de anos vazia retorna array vazio", () => {
    assert.deepEqual(calcularEvolucaoDistorcaoPorAno([], new Map()), []);
  });

  test("calcula taxa de distorção por ano com coortes diferentes em fixture de 3 anos (2024-2026)", () => {
    const mapa2024 = new Map<string, MatriculaParaDistorcao>([
      // EF_6 espera 11 anos. Em 2024-03-31:
      // A: nascido 2013-01-10 -> 11 anos (defasagem 0) -> não distorcido
      ["A", { dataNascimento: "2013-01-10", serieTexto: "6º Ano", escolaId: 1 }],
      // B: nascido 2011-01-10 -> 13 anos (defasagem 2) -> distorcido
      ["B", { dataNascimento: "2011-01-10", serieTexto: "6º Ano", escolaId: 1 }],
    ]);

    const mapa2025 = new Map<string, MatriculaParaDistorcao>([
      // EF_6 espera 11 anos. Em 2025-03-31:
      // C: nascido 2012-01-10 -> 13 anos (defasagem 2) -> distorcido
      ["C", { dataNascimento: "2012-01-10", serieTexto: "6º Ano", escolaId: 1 }],
      // D: nascido 2013-01-10 -> 12 anos (defasagem 1) -> não distorcido
      ["D", { dataNascimento: "2013-01-10", serieTexto: "6º Ano", escolaId: 1 }],
      // E: nascido 2014-01-10 -> 11 anos (defasagem 0) -> não distorcido
      ["E", { dataNascimento: "2014-01-10", serieTexto: "6º Ano", escolaId: 1 }],
    ]);

    const mapa2026 = new Map<string, MatriculaParaDistorcao>([
      // EF_6 espera 11 anos. Em 2026-03-31:
      // F: nascido 2015-01-10 -> 11 anos (defasagem 0) -> não distorcido
      ["F", { dataNascimento: "2015-01-10", serieTexto: "6º Ano", escolaId: 1 }],
    ]);

    const matriculasPorAno = new Map<number, Map<string, MatriculaParaDistorcao>>([
      [2024, mapa2024],
      [2025, mapa2025],
      [2026, mapa2026],
    ]);

    const evolucao = calcularEvolucaoDistorcaoPorAno([2024, 2025, 2026], matriculasPorAno);
    assert.equal(evolucao.length, 3);
    assert.equal(evolucao[0]!.ano, 2024);
    assert.equal(evolucao[0]!.valor, 50); // 1/2 = 50%
    assert.equal(evolucao[1]!.ano, 2025);
    assert.ok(evolucao[1]!.valor !== null && Math.abs(evolucao[1]!.valor - 33.33) < 0.05); // 1/3 = 33.33%
    assert.equal(evolucao[2]!.ano, 2026);
    assert.equal(evolucao[2]!.valor, 0); // 0/1 = 0%
  });

  test("ordena anos em ordem cronológica ascendente mesmo se fornecidos fora de ordem", () => {
    const mapa = new Map<number, Map<string, MatriculaParaDistorcao>>([
      [2024, new Map([["A", { dataNascimento: "2013-01-10", serieTexto: "6º Ano", escolaId: 1 }]])],
      [2025, new Map([["B", { dataNascimento: "2014-01-10", serieTexto: "6º Ano", escolaId: 1 }]])],
      [2026, new Map([["C", { dataNascimento: "2015-01-10", serieTexto: "6º Ano", escolaId: 1 }]])],
    ]);

    const evolucao = calcularEvolucaoDistorcaoPorAno([2026, 2024, 2025], mapa);
    assert.deepEqual(
      evolucao.map((p) => p.ano),
      [2024, 2025, 2026],
    );
  });

  test("filtra por escolaId quando especificado", () => {
    const mapa2025 = new Map<string, MatriculaParaDistorcao>([
      // Escola 1: 1 distorcido de 1 elegível = 100%
      ["A", { dataNascimento: "2012-01-10", serieTexto: "6º Ano", escolaId: 1 }],
      // Escola 2: 0 distorcido de 1 elegível = 0%
      ["B", { dataNascimento: "2014-01-10", serieTexto: "6º Ano", escolaId: 2 }],
    ]);

    const matriculas = new Map([[2025, mapa2025]]);

    const evolucaoEscola1 = calcularEvolucaoDistorcaoPorAno([2025], matriculas, 1);
    assert.equal(evolucaoEscola1[0]!.valor, 100);

    const evolucaoEscola2 = calcularEvolucaoDistorcaoPorAno([2025], matriculas, 2);
    assert.equal(evolucaoEscola2[0]!.valor, 0);

    const evolucaoEscolaInexistente = calcularEvolucaoDistorcaoPorAno([2025], matriculas, 999);
    assert.equal(evolucaoEscolaInexistente[0]!.valor, null);
  });

  test("ignora alunos fora do escopo (EJA, infantil, ou data de nascimento nula)", () => {
    const mapa = new Map<string, MatriculaParaDistorcao>([
      ["A", { dataNascimento: "2015-01-10", serieTexto: "6º Ano", escolaId: 1 }], // elegível, 0 defasagem
      ["B", { dataNascimento: null, serieTexto: "6º Ano", escolaId: 1 }], // sem data nascimento
      ["C", { dataNascimento: "2000-01-10", serieTexto: "EJA Inicial", escolaId: 1 }], // fora de escopo
    ]);

    const evolucao = calcularEvolucaoDistorcaoPorAno([2026], new Map([[2026, mapa]]));
    assert.equal(evolucao[0]!.valor, 0); // 0 distorções em 1 elegível = 0%
  });

  test("ano sem matrículas ou sem alunos elegíveis retorna valor: null", () => {
    const evolucao = calcularEvolucaoDistorcaoPorAno([2024, 2025], new Map());
    assert.deepEqual(evolucao, [
      { ano: 2024, valor: null },
      { ano: 2025, valor: null },
    ]);
  });
});

