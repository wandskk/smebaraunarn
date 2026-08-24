import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { classificarSituacaoSincronizacao, execucaoIncompleta, possuiDivergenciaDeSerie } from "./qualidade-dados";

describe("classificarSituacaoSincronizacao", () => {
  const agora = new Date("2026-08-18T12:00:00Z");

  test("sem último sucesso é sem-sincronizacao", () => {
    assert.equal(classificarSituacaoSincronizacao(null, agora), "sem-sincronizacao");
  });

  test("último sucesso há poucas horas é em-dia", () => {
    const ultimoSucesso = new Date("2026-08-18T04:00:00Z"); // 8h atrás
    assert.equal(classificarSituacaoSincronizacao(ultimoSucesso, agora), "em-dia");
  });

  test("último sucesso exatamente no limiar ainda é em-dia", () => {
    const ultimoSucesso = new Date(agora.getTime() - 30 * 60 * 60 * 1000);
    assert.equal(classificarSituacaoSincronizacao(ultimoSucesso, agora, 30), "em-dia");
  });

  test("último sucesso passando do limiar é atrasado", () => {
    const ultimoSucesso = new Date(agora.getTime() - 30 * 60 * 60 * 1000 - 1);
    assert.equal(classificarSituacaoSincronizacao(ultimoSucesso, agora, 30), "atrasado");
  });

  test("limiar customizado é respeitado", () => {
    const ultimoSucesso = new Date(agora.getTime() - 5 * 60 * 60 * 1000);
    assert.equal(classificarSituacaoSincronizacao(ultimoSucesso, agora, 4), "atrasado");
  });

  test("timestamp no futuro (relógio/fuso) não gera falso atraso", () => {
    const ultimoSucesso = new Date(agora.getTime() + 60 * 60 * 1000);
    assert.equal(classificarSituacaoSincronizacao(ultimoSucesso, agora), "em-dia");
  });
});

describe("execucaoIncompleta", () => {
  const agora = new Date("2026-08-18T12:00:00Z");

  test("sem log nenhum não é execução incompleta", () => {
    assert.equal(execucaoIncompleta(null, agora), false);
  });

  test("último log SUCESSO não é execução incompleta, mesmo antigo", () => {
    const log = { status: "SUCESSO", createdAt: new Date("2026-08-01T00:00:00Z") };
    assert.equal(execucaoIncompleta(log, agora), false);
  });

  test("último log ERRO não é execução incompleta (falhou, mas terminou)", () => {
    const log = { status: "ERRO", createdAt: new Date(agora.getTime() - 60 * 60 * 1000) };
    assert.equal(execucaoIncompleta(log, agora), false);
  });

  test("PROCESSANDO recente (dentro do limiar) não é considerado travado", () => {
    const log = { status: "PROCESSANDO", createdAt: new Date(agora.getTime() - 2 * 60 * 1000) };
    assert.equal(execucaoIncompleta(log, agora, 10), false);
  });

  test("PROCESSANDO além do limiar é considerado execução travada", () => {
    const log = { status: "PROCESSANDO", createdAt: new Date(agora.getTime() - 15 * 60 * 1000) };
    assert.equal(execucaoIncompleta(log, agora, 10), true);
  });

  test("limiar customizado é respeitado", () => {
    const log = { status: "PROCESSANDO", createdAt: new Date(agora.getTime() - 3 * 60 * 1000) };
    assert.equal(execucaoIncompleta(log, agora, 2), true);
  });
});

describe("possuiDivergenciaDeSerie", () => {
  test("mesma série em todas as escolas não diverge", () => {
    assert.equal(possuiDivergenciaDeSerie(["6º Ano", "6º Ano", "6º Ano"]), false);
  });

  test("séries diferentes divergem", () => {
    assert.equal(possuiDivergenciaDeSerie(["6º Ano", "7º Ano"]), true);
  });

  test("uma única escola nunca diverge", () => {
    assert.equal(possuiDivergenciaDeSerie(["6º Ano"]), false);
  });

  test("valores nulos são ignorados na comparação", () => {
    assert.equal(possuiDivergenciaDeSerie(["6º Ano", null, "6º Ano"]), false);
    assert.equal(possuiDivergenciaDeSerie([null, null]), false);
  });

  test("lista vazia não diverge", () => {
    assert.equal(possuiDivergenciaDeSerie([]), false);
  });
});
