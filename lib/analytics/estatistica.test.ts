import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calcularPercentil, calcularMediana, calcularAmplitude, calcularProporcaoAbaixoDe, calcularHistograma } from "./estatistica";

describe("calcularPercentil", () => {
  test("retorna null para lista vazia", () => {
    assert.equal(calcularPercentil([], 50), null);
  });

  test("percentil 0 é o mínimo e percentil 100 é o máximo", () => {
    const valores = [5, 1, 9, 3];
    assert.equal(calcularPercentil(valores, 0), 1);
    assert.equal(calcularPercentil(valores, 100), 9);
  });

  test("mediana de lista com quantidade ímpar é o valor do meio", () => {
    assert.equal(calcularPercentil([1, 3, 5], 50), 3);
  });

  test("mediana de lista com quantidade par interpola os dois do meio", () => {
    assert.equal(calcularPercentil([1, 2, 3, 4], 50), 2.5);
  });

  test("não depende da ordem de entrada", () => {
    assert.equal(calcularPercentil([4, 1, 3, 2], 50), 2.5);
  });

  test("percentil 25 e 75 de uma distribuição conhecida", () => {
    const valores = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    assert.equal(calcularPercentil(valores, 25), 32.5);
    assert.equal(calcularPercentil(valores, 75), 77.5);
  });

  test("lista com um único valor retorna esse valor para qualquer percentil", () => {
    assert.equal(calcularPercentil([7], 10), 7);
    assert.equal(calcularPercentil([7], 90), 7);
  });
});

describe("calcularMediana", () => {
  test("é equivalente ao percentil 50", () => {
    assert.equal(calcularMediana([7, 1, 4]), calcularPercentil([7, 1, 4], 50));
  });

  test("retorna null para lista vazia", () => {
    assert.equal(calcularMediana([]), null);
  });
});

describe("calcularAmplitude", () => {
  test("calcula a diferença entre máximo e mínimo", () => {
    assert.equal(calcularAmplitude([3, 7, 1, 9, 5]), 8);
  });

  test("é zero quando todos os valores são iguais", () => {
    assert.equal(calcularAmplitude([5, 5, 5]), 0);
  });

  test("retorna null para lista vazia", () => {
    assert.equal(calcularAmplitude([]), null);
  });
});

describe("calcularProporcaoAbaixoDe", () => {
  test("calcula o percentual de valores abaixo do limite", () => {
    assert.equal(calcularProporcaoAbaixoDe([4, 5, 6, 7, 8], 6), 40);
  });

  test("valores iguais ao limite não contam como abaixo", () => {
    assert.equal(calcularProporcaoAbaixoDe([6, 6, 6], 6), 0);
  });

  test("retorna 100 quando todos os valores estão abaixo", () => {
    assert.equal(calcularProporcaoAbaixoDe([1, 2, 3], 10), 100);
  });

  test("retorna null para lista vazia", () => {
    assert.equal(calcularProporcaoAbaixoDe([], 6), null);
  });
});

describe("calcularHistograma", () => {
  const faixas = [
    { min: 0, max: 2, label: "0–2" },
    { min: 2, max: 4, label: "2–4" },
    { min: 4, max: 6, label: "4–6" },
    { min: 6, max: 8, label: "6–8" },
    { min: 8, max: 10, label: "8–10" },
  ];

  test("distribui valores nas faixas [min, max), última faixa inclui o max", () => {
    const resultado = calcularHistograma([1, 3, 5, 7, 9, 10], faixas);
    assert.deepEqual(
      resultado.map((b) => b.quantidade),
      [1, 1, 1, 1, 2],
    );
  });

  test("valor exatamente no limite entre duas faixas cai na faixa superior, não na inferior", () => {
    const resultado = calcularHistograma([6], faixas);
    assert.equal(resultado[2]!.quantidade, 0); // 4–6 não conta o 6
    assert.equal(resultado[3]!.quantidade, 1); // 6–8 conta o 6
  });

  test("valor 10 (máximo) entra na última faixa, não fica de fora", () => {
    const resultado = calcularHistograma([10], faixas);
    assert.equal(resultado[4]!.quantidade, 1);
  });

  test("lista vazia retorna todas as faixas zeradas, não uma lista vazia", () => {
    const resultado = calcularHistograma([], faixas);
    assert.equal(resultado.length, 5);
    assert.ok(resultado.every((b) => b.quantidade === 0));
  });

  test("preserva label/min/max de cada faixa no resultado", () => {
    const resultado = calcularHistograma([1], faixas);
    assert.deepEqual(
      { min: resultado[0]!.min, max: resultado[0]!.max, label: resultado[0]!.label },
      { min: 0, max: 2, label: "0–2" },
    );
  });
});
