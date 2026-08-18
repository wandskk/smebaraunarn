import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calcularPercentil, calcularMediana, calcularAmplitude, calcularProporcaoAbaixoDe } from "./estatistica";

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
