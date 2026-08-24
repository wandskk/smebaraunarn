import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { scopeFromSession, ScopeError } from "./scope";

describe("scopeFromSession", () => {
  test("ADMIN e SECRETARIA recebem NetworkScope, independente de vínculo", () => {
    for (const role of ["ADMIN", "SECRETARIA"] as const) {
      const scope = scopeFromSession({ role, escolaId: null, servidorId: null, estudanteId: null });
      assert.deepEqual(scope, { kind: "network" });
    }
  });

  test("DIRETOR recebe SchoolScope com a escola da sessão", () => {
    const scope = scopeFromSession({ role: "DIRETOR", escolaId: 42, servidorId: 7, estudanteId: null });
    assert.deepEqual(scope, { kind: "school", escolaId: 42 });
  });

  test("DIRETOR sem escola vinculada lança ScopeError (conta incompleta)", () => {
    assert.throws(
      () => scopeFromSession({ role: "DIRETOR", escolaId: null, servidorId: 7, estudanteId: null }),
      ScopeError,
    );
  });

  test("PROFESSOR recebe ProfessorScope com escola e turmas informadas", () => {
    const scope = scopeFromSession(
      { role: "PROFESSOR", escolaId: 3, servidorId: 99, estudanteId: null },
      { professorTurmas: ["EFAFM6A", "EFAFM7B"] },
    );
    assert.deepEqual(scope, { kind: "professor", escolaId: 3, turmas: ["EFAFM6A", "EFAFM7B"] });
  });

  test("PROFESSOR sem turmas informadas recebe lista vazia, não undefined", () => {
    const scope = scopeFromSession({ role: "PROFESSOR", escolaId: 3, servidorId: 99, estudanteId: null });
    assert.deepEqual(scope, { kind: "professor", escolaId: 3, turmas: [] });
  });

  test("PROFESSOR sem escola vinculada lança ScopeError", () => {
    assert.throws(
      () => scopeFromSession({ role: "PROFESSOR", escolaId: null, servidorId: 99, estudanteId: null }),
      ScopeError,
    );
  });

  test("ALUNO recebe StudentSelfScope com o próprio estudanteId", () => {
    const scope = scopeFromSession({ role: "ALUNO", escolaId: null, servidorId: null, estudanteId: 501 });
    assert.deepEqual(scope, { kind: "student-self", estudanteId: 501 });
  });

  test("ALUNO sem estudanteId vinculado lança ScopeError", () => {
    assert.throws(
      () => scopeFromSession({ role: "ALUNO", escolaId: null, servidorId: null, estudanteId: null }),
      ScopeError,
    );
  });

  test("SERVIDOR_GERAL recebe StaffSelfScope com o próprio servidorId", () => {
    const scope = scopeFromSession({ role: "SERVIDOR_GERAL", escolaId: 3, servidorId: 12, estudanteId: null });
    assert.deepEqual(scope, { kind: "staff-self", servidorId: 12 });
  });

  test("SERVIDOR_GERAL sem servidorId vinculado lança ScopeError", () => {
    assert.throws(
      () => scopeFromSession({ role: "SERVIDOR_GERAL", escolaId: null, servidorId: null, estudanteId: null }),
      ScopeError,
    );
  });
});
