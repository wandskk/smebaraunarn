import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calcularIdadeEmAnos,
  calcularDistorcaoIdadeSerie,
  classificarIntensidadeDefasagem,
  IDADE_ESPERADA_POR_SERIE,
  LIMIAR_DISTORCAO_ANOS,
} from "./distorcao";

describe("calcularIdadeEmAnos", () => {
  test("calcula idade quando o aniversário já ocorreu no ano de referência", () => {
    assert.equal(calcularIdadeEmAnos("2015-01-10", "2026-03-31"), 11);
  });

  test("calcula idade quando o aniversário ainda não ocorreu no ano de referência", () => {
    assert.equal(calcularIdadeEmAnos("2015-06-15", "2026-03-31"), 10);
  });

  test("conta o aniversário exatamente na data de referência como já ocorrido", () => {
    assert.equal(calcularIdadeEmAnos("2015-03-31", "2026-03-31"), 11);
  });

  test("um dia antes do aniversário ainda não soma o ano", () => {
    assert.equal(calcularIdadeEmAnos("2015-04-01", "2026-03-31"), 10);
  });

  test("rejeita datas fora do formato ISO", () => {
    assert.throws(() => calcularIdadeEmAnos("15/06/2015", "2026-03-31"));
    assert.throws(() => calcularIdadeEmAnos("", "2026-03-31"));
  });
});

describe("calcularDistorcaoIdadeSerie", () => {
  test("idade exata para a série: sem distorção", () => {
    // 6º ano espera 11 anos; nascido em 2015, na referência de 2026-03-31 tem 11.
    const resultado = calcularDistorcaoIdadeSerie("2015-01-10", "EF_6", "2026-03-31");
    assert.equal(resultado.idadeNaReferencia, 11);
    assert.equal(resultado.idadeEsperada, 11);
    assert.equal(resultado.defasagemAnos, 0);
    assert.equal(resultado.emDistorcao, false);
  });

  test("um ano acima do esperado ainda não é distorção (limiar é 2)", () => {
    const resultado = calcularDistorcaoIdadeSerie("2014-01-10", "EF_6", "2026-03-31");
    assert.equal(resultado.defasagemAnos, 1);
    assert.equal(resultado.emDistorcao, false);
  });

  test("exatamente 2 anos acima já é distorção", () => {
    const resultado = calcularDistorcaoIdadeSerie("2013-01-10", "EF_6", "2026-03-31");
    assert.equal(resultado.defasagemAnos, 2);
    assert.equal(resultado.emDistorcao, true);
  });

  test("idade abaixo do esperado não é distorção (defasagem negativa)", () => {
    const resultado = calcularDistorcaoIdadeSerie("2016-01-10", "EF_6", "2026-03-31");
    assert.equal(resultado.defasagemAnos, -1);
    assert.equal(resultado.emDistorcao, false);
  });

  test("aceita limiar customizado por rede", () => {
    const resultado = calcularDistorcaoIdadeSerie("2014-01-10", "EF_6", "2026-03-31", 1);
    assert.equal(resultado.defasagemAnos, 1);
    assert.equal(resultado.emDistorcao, true);
  });

  test("cobre todas as séries da tabela de idade esperada", () => {
    for (const [serie, idadeEsperada] of Object.entries(IDADE_ESPERADA_POR_SERIE)) {
      const nascimento = `${2026 - idadeEsperada}-03-31`;
      const resultado = calcularDistorcaoIdadeSerie(nascimento, serie as keyof typeof IDADE_ESPERADA_POR_SERIE, "2026-03-31");
      assert.equal(resultado.defasagemAnos, 0, `${serie} deveria ter defasagem 0`);
    }
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
