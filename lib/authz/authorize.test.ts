import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { canViewEscola, canViewTurma, canViewEstudante, canViewServidor } from "./authorize";
import type { Scope } from "./scope";

const network: Scope = { kind: "network" };
const escolaA: Scope = { kind: "school", escolaId: 1 };
const escolaB: Scope = { kind: "school", escolaId: 2 };
const professorSemTurma: Scope = { kind: "professor", atribuicoes: [] };
const professorComTurmaA: Scope = { kind: "professor", atribuicoes: [{ escolaId: 1, turma: "EFAFM6A" }] };
const professorOutraEscola: Scope = { kind: "professor", atribuicoes: [{ escolaId: 2, turma: "EFAFM6A" }] };
// Mesmo código de turma atribuído em duas escolas diferentes — cenário que motivou a
// migração de ServidorTurma (ETAPA 06): a tupla (escolaId, turma) precisa bater exatamente.
const professorDuasEscolasMesmoCodigo: Scope = {
  kind: "professor",
  atribuicoes: [
    { escolaId: 1, turma: "EFAFM6A" },
    { escolaId: 2, turma: "EFAFM6A" },
  ],
};
const alunoSelf: Scope = { kind: "student-self", estudanteId: 100 };
const servidorSelf: Scope = { kind: "staff-self", servidorId: 50 };

describe("canViewEscola", () => {
  test("network vê qualquer escola", () => {
    assert.equal(canViewEscola(network, 1), true);
    assert.equal(canViewEscola(network, 999), true);
  });

  test("school só vê a própria escola", () => {
    assert.equal(canViewEscola(escolaA, 1), true);
    assert.equal(canViewEscola(escolaA, 2), false);
  });

  test("student-self e staff-self nunca veem escola por esse predicado", () => {
    assert.equal(canViewEscola(alunoSelf, 1), false);
    assert.equal(canViewEscola(servidorSelf, 1), false);
  });

  test("professor vê só a(s) escola(s) onde tem alguma atribuição", () => {
    assert.equal(canViewEscola(professorComTurmaA, 1), true);
    assert.equal(canViewEscola(professorComTurmaA, 2), false);
    assert.equal(canViewEscola(professorDuasEscolasMesmoCodigo, 2), true);
    assert.equal(canViewEscola(professorSemTurma, 1), false);
  });
});

describe("canViewTurma", () => {
  test("professor só vê turma dentro da própria escola e atribuída a ele", () => {
    assert.equal(canViewTurma(professorComTurmaA, { escolaId: 1, turma: "EFAFM6A" }), true);
  });

  test("professor não vê turma da própria escola se não estiver atribuído (P0: professor sem turma)", () => {
    assert.equal(canViewTurma(professorSemTurma, { escolaId: 1, turma: "EFAFM6A" }), false);
  });

  test("professor não vê turma de mesmo código em outra escola (códigos de turma se repetem entre escolas)", () => {
    assert.equal(canViewTurma(professorOutraEscola, { escolaId: 1, turma: "EFAFM6A" }), false);
  });

  test("professor com o mesmo código de turma em duas escolas só vê a turma da escola certa em cada uma (ETAPA 06)", () => {
    assert.equal(canViewTurma(professorDuasEscolasMesmoCodigo, { escolaId: 1, turma: "EFAFM6A" }), true);
    assert.equal(canViewTurma(professorDuasEscolasMesmoCodigo, { escolaId: 2, turma: "EFAFM6A" }), true);
    assert.equal(canViewTurma(professorDuasEscolasMesmoCodigo, { escolaId: 3, turma: "EFAFM6A" }), false);
  });

  test("diretor só vê turma da própria escola", () => {
    assert.equal(canViewTurma(escolaA, { escolaId: 1, turma: "EFAFM6A" }), true);
    assert.equal(canViewTurma(escolaB, { escolaId: 1, turma: "EFAFM6A" }), false);
  });
});

describe("canViewEstudante", () => {
  const estudanteEscolaA = { id: 10, escolaId: 1, turmaSerie: "EFAFM6A" };
  const estudanteSemTurma = { id: 11, escolaId: 1, turmaSerie: null };

  test("network vê qualquer estudante", () => {
    assert.equal(canViewEstudante(network, estudanteEscolaA), true);
  });

  test("diretor não abre estudante de outra escola", () => {
    assert.equal(canViewEstudante(escolaA, estudanteEscolaA), true);
    assert.equal(canViewEstudante(escolaB, estudanteEscolaA), false);
  });

  test("professor não abre estudante de turma não autorizada", () => {
    assert.equal(canViewEstudante(professorComTurmaA, estudanteEscolaA), true);
    assert.equal(
      canViewEstudante({ kind: "professor", atribuicoes: [{ escolaId: 1, turma: "EFAFM7B" }] }, estudanteEscolaA),
      false,
    );
  });

  test("professor não abre estudante de outra escola mesmo com código de turma igual (ETAPA 06)", () => {
    const estudanteEscolaB = { id: 20, escolaId: 2, turmaSerie: "EFAFM6A" };
    assert.equal(canViewEstudante(professorComTurmaA, estudanteEscolaB), false);
    assert.equal(canViewEstudante(professorDuasEscolasMesmoCodigo, estudanteEscolaB), true);
  });

  test("professor sem turma nenhuma não vê nenhum estudante da escola", () => {
    assert.equal(canViewEstudante(professorSemTurma, estudanteEscolaA), false);
  });

  test("professor não vê estudante sem turmaSerie definida (dado incompleto não vira acesso livre)", () => {
    assert.equal(canViewEstudante(professorComTurmaA, estudanteSemTurma), false);
  });

  test("aluno só vê a si mesmo", () => {
    assert.equal(canViewEstudante(alunoSelf, { id: 100, escolaId: 1, turmaSerie: null }), true);
    assert.equal(canViewEstudante(alunoSelf, estudanteEscolaA), false);
  });

  test("Servidor Geral não vê dados acadêmicos de estudante, nem da própria escola (regra 7.7)", () => {
    assert.equal(canViewEstudante(servidorSelf, estudanteEscolaA), false);
  });
});

describe("canViewServidor", () => {
  test("network vê qualquer servidor", () => {
    assert.equal(canViewServidor(network, { id: 1, escolaId: 1 }), true);
  });

  test("diretor só vê servidor da própria escola", () => {
    assert.equal(canViewServidor(escolaA, { id: 1, escolaId: 1 }), true);
    assert.equal(canViewServidor(escolaA, { id: 1, escolaId: 2 }), false);
  });

  test("diretor não vê servidor sem escola vinculada", () => {
    assert.equal(canViewServidor(escolaA, { id: 1, escolaId: null }), false);
  });

  test("staff-self só vê o próprio registro", () => {
    assert.equal(canViewServidor(servidorSelf, { id: 50, escolaId: 1 }), true);
    assert.equal(canViewServidor(servidorSelf, { id: 51, escolaId: 1 }), false);
  });

  test("professor e aluno nunca veem ficha de servidor por esse predicado", () => {
    assert.equal(canViewServidor(professorComTurmaA, { id: 1, escolaId: 1 }), false);
    assert.equal(canViewServidor(alunoSelf, { id: 1, escolaId: 1 }), false);
  });
});
