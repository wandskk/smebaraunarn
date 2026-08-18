import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calcularMediaPonderada, calcularDiferencaParaRede } from "./comparativos";

describe("calcularMediaPonderada", () => {
  test("pondera pelo peso em vez de tirar média simples", () => {
    // Escola grande (peso 90) puxa a média pra perto de 5, não pra 7.5 (média simples de 8 e 5).
    const resultado = calcularMediaPonderada([
      { valor: 8, peso: 10 },
      { valor: 5, peso: 90 },
    ]);
    assert.equal(resultado, 5.3);
  });

  test("é equivalente a somar os totais brutos e dividir no fim", () => {
    // 3 acertos de 10 + 6 acertos de 20 = 9 de 30 = 30%, igual à ponderada de 30% e 30%.
    const porTotais = (3 / 10) * 100;
    const resultado = calcularMediaPonderada([
      { valor: porTotais, peso: 10 },
      { valor: (6 / 20) * 100, peso: 20 },
    ]);
    assert.equal(resultado, 30);
  });

  test("lista vazia retorna null", () => {
    assert.equal(calcularMediaPonderada([]), null);
  });

  test("peso total zero retorna null (não divide por zero)", () => {
    assert.equal(calcularMediaPonderada([{ valor: 10, peso: 0 }]), null);
  });

  test("um único item com peso retorna o próprio valor", () => {
    assert.equal(calcularMediaPonderada([{ valor: 7.5, peso: 42 }]), 7.5);
  });
});

describe("calcularDiferencaParaRede", () => {
  test("escola acima da rede retorna diferença positiva", () => {
    assert.equal(calcularDiferencaParaRede(85, 80), 5);
  });

  test("escola abaixo da rede retorna diferença negativa", () => {
    assert.equal(calcularDiferencaParaRede(70, 80), -10);
  });

  test("null quando o valor da escola falta", () => {
    assert.equal(calcularDiferencaParaRede(null, 80), null);
    assert.equal(calcularDiferencaParaRede(undefined, 80), null);
  });

  test("null quando a referência de rede falta", () => {
    assert.equal(calcularDiferencaParaRede(85, null), null);
    assert.equal(calcularDiferencaParaRede(85, undefined), null);
  });
});
