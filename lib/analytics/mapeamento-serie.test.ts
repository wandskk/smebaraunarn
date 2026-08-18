import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizarSerie } from "./mapeamento-serie";

describe("normalizarSerie", () => {
  test("mapeia todos os anos do Ensino Fundamental (1º a 9º)", () => {
    assert.equal(normalizarSerie("1º Ano"), "EF_1");
    assert.equal(normalizarSerie("2º Ano"), "EF_2");
    assert.equal(normalizarSerie("3º Ano"), "EF_3");
    assert.equal(normalizarSerie("4º Ano"), "EF_4");
    assert.equal(normalizarSerie("5º Ano"), "EF_5");
    assert.equal(normalizarSerie("6º Ano"), "EF_6");
    assert.equal(normalizarSerie("7º Ano"), "EF_7");
    assert.equal(normalizarSerie("8º Ano"), "EF_8");
    assert.equal(normalizarSerie("9º Ano"), "EF_9");
  });

  test("mapeia as séries do Ensino Médio", () => {
    assert.equal(normalizarSerie("1ª Série"), "EM_1");
    assert.equal(normalizarSerie("2ª Série"), "EM_2");
    assert.equal(normalizarSerie("3ª Série"), "EM_3");
  });

  test("é tolerante a espaçamento e caixa", () => {
    assert.equal(normalizarSerie(" 6º Ano "), "EF_6");
    assert.equal(normalizarSerie("6º ano"), "EF_6");
    assert.equal(normalizarSerie("6º  Ano"), "EF_6");
  });

  test("aceita o símbolo de grau (°) como variante do indicador ordinal (º)", () => {
    // A rede usa os dois interculadamente nos dados reais (ex.: "TRAJETÓRIA
    // DE SUCESSO I (6° E 7° ANO)" usa °, "6º Ano" usa º) — ver mapeamento-serie.ts.
    assert.equal(normalizarSerie("6° Ano"), "EF_6");
    assert.equal(normalizarSerie("1° Série"), "EM_1");
  });

  test("retorna null para entradas vazias", () => {
    assert.equal(normalizarSerie(null), null);
    assert.equal(normalizarSerie(undefined), null);
    assert.equal(normalizarSerie(""), null);
    assert.equal(normalizarSerie("   "), null);
  });

  test("retorna null para valores fora da faixa (defensivo)", () => {
    assert.equal(normalizarSerie("0º Ano"), null);
    assert.equal(normalizarSerie("10º Ano"), null);
    assert.equal(normalizarSerie("4ª Série"), null);
  });

  // Casos reais observados em produção (2026-08-18) — todos devem ficar
  // fora do escopo do indicador de distorção, de propósito (ver comentário
  // no topo de mapeamento-serie.ts).
  describe("casos reais fora do escopo (retornam null de propósito)", () => {
    const casosForaDoEscopo = [
      "2º PERIODO (2º E 3º ANO)",
      "3º PERIODO (4º E 5º ANO)",
      "4º PERIODO (6º E 7º ANO)",
      "5º PERÍODO (8º E 9º ANO)",
      "TRAJETÓRIA DE SUCESSO I (6° E 7° ANO)",
      "TRAJETÓRIA DE SUCESSO II (8° E 9° ANO)",
      "EDUCAÇÃO ESPECIAL",
      "MISTA (CRECHE + PRÉ)",
      "MISTA (CRECHE I E II)",
      "MISTA (PRÉ-ESCOLA I E II)",
      "MULTIANUAL (1° E 2° ANO)",
      "MULTIANUAL (1º A 3º ANO)",
      "MULTIANUAL (1º A 5º ANO)",
      "MULTIANUAL (3º A 4º ANO)",
      "MULTIANUAL (3º A 5º ANO)",
      "MULTIANUAL (4º E 5º ANO)",
      "NÍVEL I",
      "NÍVEL II",
    ];

    for (const caso of casosForaDoEscopo) {
      test(`"${caso}"`, () => {
        assert.equal(normalizarSerie(caso), null);
      });
    }
  });
});
