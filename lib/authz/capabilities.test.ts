import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hasCapability } from "./capabilities";

describe("hasCapability", () => {
  test("ADMIN tem usuarios:manage", () => {
    assert.equal(hasCapability("ADMIN", "usuarios:manage"), true);
  });

  test("SECRETARIA não executa ação Admin-only (usuarios:manage)", () => {
    assert.equal(hasCapability("SECRETARIA", "usuarios:manage"), false);
  });

  test("SECRETARIA compartilha as demais capabilities administrativas com ADMIN", () => {
    for (const capability of [
      "servidores:manage",
      "posts:manage",
      "documentos:manage",
      "avaliacoes:manage",
      "sincronizacao:executar",
      "indicadores-landing:editar",
    ] as const) {
      assert.equal(hasCapability("SECRETARIA", capability), true);
      assert.equal(hasCapability("ADMIN", capability), true);
    }
  });

  test("papéis de portal não têm capabilities administrativas", () => {
    for (const role of ["DIRETOR", "PROFESSOR", "SERVIDOR_GERAL", "ALUNO"] as const) {
      assert.equal(hasCapability(role, "usuarios:manage"), false);
      assert.equal(hasCapability(role, "servidores:manage"), false);
    }
  });
});
