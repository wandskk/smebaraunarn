import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolverSelecaoAnosLetivos, anoReferencia, anosParaEvolucao } from "./anos-letivos";

const ANOS_DISPONIVEIS = [2026, 2025, 2024];

describe("resolverSelecaoAnosLetivos", () => {
  test("prioridade 1: ?anos= repetido vira seleção múltipla", () => {
    const selecao = resolverSelecaoAnosLetivos({ anos: ["2024", "2025"] }, undefined, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "multiplos", anos: [2024, 2025] });
  });

  test("prioridade 1: ?anos=todos vira seleção 'todos'", () => {
    const selecao = resolverSelecaoAnosLetivos({ anos: "todos" }, undefined, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "todos", anos: ANOS_DISPONIVEIS });
  });

  test("prioridade 1: ?anos= com um único ano vira seleção única (não múltipla com 1 item)", () => {
    const selecao = resolverSelecaoAnosLetivos({ anos: "2025" }, undefined, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "unico", ano: 2025 });
  });

  test("prioridade 2: sem ?anos=, cai para ?ano= legado", () => {
    const selecao = resolverSelecaoAnosLetivos({ ano: "2024" }, undefined, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "unico", ano: 2024 });
  });

  test("prioridade 3: sem query nenhuma, cai para o cookie", () => {
    const cookie = JSON.stringify({ modo: "multiplos", anos: ["2024", "2026"] });
    const selecao = resolverSelecaoAnosLetivos({}, cookie, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "multiplos", anos: [2024, 2026] });
  });

  test("prioridade 3: cookie com modo 'todos'", () => {
    const cookie = JSON.stringify({ modo: "todos", anos: [] });
    const selecao = resolverSelecaoAnosLetivos({}, cookie, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "todos", anos: ANOS_DISPONIVEIS });
  });

  test("prioridade 4: sem query nem cookie, default é o ano mais recente", () => {
    const selecao = resolverSelecaoAnosLetivos({}, undefined, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "unico", ano: 2026 });
  });

  test("ano inválido em ?anos= é descartado, cascateando para o próximo critério", () => {
    const cookie = JSON.stringify({ modo: "unico", anos: ["2025"] });
    const selecao = resolverSelecaoAnosLetivos({ anos: "1999" }, cookie, ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "unico", ano: 2025 });
  });

  test("cookie corrompido (JSON inválido) é ignorado, cai pro default", () => {
    const selecao = resolverSelecaoAnosLetivos({}, "{isso não é json", ANOS_DISPONIVEIS);
    assert.deepEqual(selecao, { modo: "unico", ano: 2026 });
  });

  test("anosDisponiveis vazio: default cai para o ano corrente", () => {
    const selecao = resolverSelecaoAnosLetivos({}, undefined, []);
    assert.deepEqual(selecao, { modo: "unico", ano: new Date().getFullYear() });
  });
});

describe("anoReferencia", () => {
  test("seleção única retorna o próprio ano", () => {
    assert.equal(anoReferencia({ modo: "unico", ano: 2024 }), 2024);
  });

  test("seleção múltipla retorna o ano mais recente", () => {
    assert.equal(anoReferencia({ modo: "multiplos", anos: [2024, 2026, 2025] }), 2026);
  });
});

describe("anosParaEvolucao", () => {
  test("seleção única vira array de 1 elemento", () => {
    assert.deepEqual(anosParaEvolucao({ modo: "unico", ano: 2024 }), [2024]);
  });

  test("seleção múltipla vem ordenada ascendente, independente da ordem de entrada", () => {
    assert.deepEqual(anosParaEvolucao({ modo: "multiplos", anos: [2026, 2024, 2025] }), [2024, 2025, 2026]);
  });
});
