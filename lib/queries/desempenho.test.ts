import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mapearEvolucaoDesempenho, getEvolucaoDesempenhoPorAno } from "./desempenho";

describe("mapearEvolucaoDesempenho", () => {
  test("lista de anos vazia retorna array vazio", () => {
    assert.deepEqual(mapearEvolucaoDesempenho([], [{ ano: 2025, media: 7.5 }]), []);
  });

  test("mapeia médias agregadas por ano em fixture multi-ano (2024-2026)", () => {
    const fixture = [
      { ano: 2024, media: 6.86 },
      { ano: 2025, media: 7.27 },
      { ano: 2026, media: 7.04 },
    ];

    const evolucao = mapearEvolucaoDesempenho([2024, 2025, 2026], fixture);
    assert.deepEqual(evolucao, [
      { ano: 2024, valor: 6.86 },
      { ano: 2025, valor: 7.27 },
      { ano: 2026, valor: 7.04 },
    ]);
  });

  test("ordena anos cronologicamente mesmo se fornecidos fora de ordem", () => {
    const fixture = [
      { ano: 2026, media: 7.04 },
      { ano: 2024, media: 6.86 },
      { ano: 2025, media: 7.27 },
    ];

    const evolucao = mapearEvolucaoDesempenho([2026, 2024, 2025], fixture);
    assert.deepEqual(
      evolucao.map((p) => p.ano),
      [2024, 2025, 2026],
    );
    assert.equal(evolucao[0]!.valor, 6.86);
    assert.equal(evolucao[1]!.valor, 7.27);
    assert.equal(evolucao[2]!.valor, 7.04);
  });

  test("ano sem notas registradas na fixture retorna valor: null", () => {
    const fixture = [
      { ano: 2024, media: 6.86 },
      { ano: 2026, media: 7.04 },
    ];

    const evolucao = mapearEvolucaoDesempenho([2024, 2025, 2026], fixture);
    assert.deepEqual(evolucao, [
      { ano: 2024, valor: 6.86 },
      { ano: 2025, valor: null },
      { ano: 2026, valor: 7.04 },
    ]);
  });

  test("deduplica anos repetidos na entrada", () => {
    const fixture = [{ ano: 2025, media: 7.5 }];
    const evolucao = mapearEvolucaoDesempenho([2025, 2025], fixture);
    assert.deepEqual(evolucao, [{ ano: 2025, valor: 7.5 }]);
  });
});

describe("getEvolucaoDesempenhoPorAno", () => {
  test("retorna array vazio quando anos é vazio sem tocar no banco", async () => {
    const resultado = await getEvolucaoDesempenhoPorAno([]);
    assert.deepEqual(resultado, []);
  });
});
