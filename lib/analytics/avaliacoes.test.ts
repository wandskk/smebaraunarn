import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deriveStatusAvaliacao, calcularAnalisePorItem, calcularDistribuicaoFluencia } from "./avaliacoes";

describe("deriveStatusAvaliacao", () => {
  test("sem nenhum resultado -> preparacao", () => {
    const status = deriveStatusAvaliacao({ esperado: 0, realizado: 0, turmasCompletas: 0, turmasParciais: 0 });
    assert.equal(status, "preparacao");
  });

  test("resultados mas nenhuma turma completa -> em_aplicacao", () => {
    const status = deriveStatusAvaliacao({ esperado: 30, realizado: 5, turmasCompletas: 0, turmasParciais: 2 });
    assert.equal(status, "em_aplicacao");
  });

  test("alguma turma completa e outra pendente -> coleta_parcial", () => {
    const status = deriveStatusAvaliacao({ esperado: 30, realizado: 20, turmasCompletas: 1, turmasParciais: 1 });
    assert.equal(status, "coleta_parcial");
  });

  test("todas as turmas tocadas completas -> consolidada", () => {
    const status = deriveStatusAvaliacao({ esperado: 30, realizado: 30, turmasCompletas: 2, turmasParciais: 0 });
    assert.equal(status, "consolidada");
  });
});

describe("calcularAnalisePorItem", () => {
  const questoes = [
    { numero: 1, descritor: "D01", gabaritoCorreto: "A" },
    { numero: 2, descritor: "D01", gabaritoCorreto: "B" },
    { numero: 3, descritor: "D02", gabaritoCorreto: null },
  ];

  test("calcula % de acerto por questão a partir de respostasJson", () => {
    const resultados: { respostasJson: Record<string, string> | null }[] = [
      { respostasJson: { "1": "A", "2": "B" } },
      { respostasJson: { "1": "C", "2": "B" } },
      { respostasJson: { "1": "A" } },
    ];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);

    const q1 = porQuestao.find((q) => q.numero === 1)!;
    assert.equal(q1.respondidas, 3);
    assert.equal(q1.acertos, 2);
    assert.equal(q1.percentualAcerto, (2 / 3) * 100);

    const q2 = porQuestao.find((q) => q.numero === 2)!;
    assert.equal(q2.respondidas, 2);
    assert.equal(q2.acertos, 2);
    assert.equal(q2.percentualAcerto, 100);
  });

  test("questão sem gabarito não produz percentual inventado", () => {
    const resultados = [{ respostasJson: { "3": "A" } }];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);
    const q3 = porQuestao.find((q) => q.numero === 3)!;
    assert.equal(q3.respondidas, 0);
    assert.equal(q3.percentualAcerto, null);
  });

  test("resultado sem resposta para a questão não conta como respondida", () => {
    const resultados: { respostasJson: Record<string, string> | null }[] = [
      { respostasJson: null },
      { respostasJson: {} },
      { respostasJson: { "1": "" } },
    ];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);
    const q1 = porQuestao.find((q) => q.numero === 1)!;
    assert.equal(q1.respondidas, 0);
    assert.equal(q1.percentualAcerto, null);
  });

  test("agrega por descritor somando questões do mesmo descritor", () => {
    const resultados = [
      { respostasJson: { "1": "A", "2": "X" } },
      { respostasJson: { "1": "X", "2": "B" } },
    ];
    const { porDescritor } = calcularAnalisePorItem(questoes, resultados);
    const d01 = porDescritor.find((d) => d.descritor === "D01")!;
    assert.equal(d01.respondidas, 4);
    assert.equal(d01.acertos, 2);
    assert.equal(d01.percentualAcerto, 50);
  });

  test("comparação de gabarito ignora espaços e caixa", () => {
    const resultados = [{ respostasJson: { "1": " a " } }];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);
    const q1 = porQuestao.find((q) => q.numero === 1)!;
    assert.equal(q1.acertos, 1);
  });
});

describe("calcularDistribuicaoFluencia", () => {
  const niveis = ["NAO_LEITOR", "LEITOR_DE_SILABAS", "LEITOR_FLUENTE"];

  test("conta resultados por nível, na ordem recebida (não a de chegada)", () => {
    const resultado = calcularDistribuicaoFluencia(
      [
        { nivelDesempenho: "LEITOR_FLUENTE", palavrasPorMin: null },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
      ],
      niveis,
    );
    assert.deepEqual(
      resultado.porNivel.map((n) => n.quantidade),
      [2, 0, 1],
    );
  });

  test("nível com zero resultados aparece com quantidade 0, não fica ausente da lista", () => {
    const resultado = calcularDistribuicaoFluencia([{ nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null }], niveis);
    assert.equal(resultado.porNivel.length, 3);
    assert.equal(resultado.porNivel.find((n) => n.nivel === "LEITOR_FLUENTE")!.quantidade, 0);
  });

  test("resultado sem nível conta em semNivel, não é descartado nem quebra a contagem por nível", () => {
    const resultado = calcularDistribuicaoFluencia(
      [
        { nivelDesempenho: null, palavrasPorMin: null },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
      ],
      niveis,
    );
    assert.equal(resultado.semNivel, 1);
    assert.equal(resultado.porNivel.find((n) => n.nivel === "NAO_LEITOR")!.quantidade, 1);
  });

  test("calcula média/mínimo/máximo de palavras por minuto só sobre quem tem o dado", () => {
    const resultado = calcularDistribuicaoFluencia(
      [
        { nivelDesempenho: "LEITOR_FLUENTE", palavrasPorMin: 100 },
        { nivelDesempenho: "LEITOR_FLUENTE", palavrasPorMin: 80 },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
      ],
      niveis,
    );
    assert.equal(resultado.palavrasPorMinuto.media, 90);
    assert.equal(resultado.palavrasPorMinuto.minimo, 80);
    assert.equal(resultado.palavrasPorMinuto.maximo, 100);
    assert.equal(resultado.palavrasPorMinuto.totalComDado, 2);
  });

  test("sem nenhum dado de palavras por minuto, estatísticas ficam null, não zero", () => {
    const resultado = calcularDistribuicaoFluencia([{ nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null }], niveis);
    assert.equal(resultado.palavrasPorMinuto.media, null);
    assert.equal(resultado.palavrasPorMinuto.totalComDado, 0);
  });

  test("lista vazia retorna todos os níveis zerados", () => {
    const resultado = calcularDistribuicaoFluencia([], niveis);
    assert.ok(resultado.porNivel.every((n) => n.quantidade === 0));
    assert.equal(resultado.semNivel, 0);
  });
});
