import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { classifyServidorRole, explicarClassificacaoServidorRole } from "./roles";

describe("classifyServidorRole", () => {
  test("cargo com DIRETOR vira DIRETOR", () => {
    assert.equal(classifyServidorRole("DIRETOR ESCOLAR", null), "DIRETOR");
  });

  test("cargo com COORDENA vira DIRETOR", () => {
    assert.equal(classifyServidorRole("COORDENADOR PEDAGOGICO", null), "DIRETOR");
  });

  test("cargo com PROF vira PROFESSOR", () => {
    assert.equal(classifyServidorRole("PROFESSOR - CONVENIO", null), "PROFESSOR");
  });

  test("sem palavra-chave vira SERVIDOR_GERAL (fallback)", () => {
    assert.equal(classifyServidorRole("AUXILIAR DE SERVICOS GERAIS", null), "SERVIDOR_GERAL");
  });

  test("DIRETOR tem prioridade sobre PROF quando ambos aparecem", () => {
    assert.equal(classifyServidorRole("PROFESSOR COORDENADOR", null), "DIRETOR");
  });
});

describe("explicarClassificacaoServidorRole", () => {
  test("cita a palavra-chave real encontrada para Direção", () => {
    const explicacao = explicarClassificacaoServidorRole("VICE DIRETOR", null);
    assert.match(explicacao, /Direção/);
    assert.match(explicacao, /"DIRETOR"/);
  });

  test("cita a palavra-chave real encontrada para Professor", () => {
    const explicacao = explicarClassificacaoServidorRole("PROF PERM NIVEL - III", null);
    assert.match(explicacao, /Professor/);
    assert.match(explicacao, /"PROF"/);
  });

  test("explica o fallback para Servidor Geral", () => {
    const explicacao = explicarClassificacaoServidorRole("MERENDEIRA", null);
    assert.match(explicacao, /Servidor Geral/);
    assert.match(explicacao, /fallback/);
  });
});
