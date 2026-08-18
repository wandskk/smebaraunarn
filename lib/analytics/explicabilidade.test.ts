import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  montarFichaIndicador,
  descreverContexto,
  DICIONARIO_INDICADORES,
  type FichaIndicador,
} from "./explicabilidade";

const fichaValida: FichaIndicador = {
  nome: "Frequência média",
  objetivo: "Acompanhar presença escolar.",
  fonte: "SIGEduc",
  formula: "(Aulas - Faltas) / Aulas x 100",
  periodicidade: "Diária",
  granularidade: "Turma",
};

describe("montarFichaIndicador", () => {
  test("aceita ficha com todos os campos obrigatórios", () => {
    assert.deepEqual(montarFichaIndicador(fichaValida), fichaValida);
  });

  test("rejeita ficha sem fórmula", () => {
    const { formula: _formula, ...semFormula } = fichaValida;
    assert.throws(() => montarFichaIndicador(semFormula as FichaIndicador), /formula/);
  });

  test("rejeita ficha com campo em branco", () => {
    assert.throws(() => montarFichaIndicador({ ...fichaValida, fonte: "   " }));
  });
});

describe("descreverContexto", () => {
  test("inclui fórmula, fonte, granularidade e data de atualização", () => {
    const texto = descreverContexto(fichaValida, { dataAtualizacao: "2026-08-18T05:00:00Z" });
    assert.match(texto, /Fórmula: \(Aulas - Faltas\) \/ Aulas x 100/);
    assert.match(texto, /Fonte: SIGEduc/);
    assert.match(texto, /Granularidade: Turma/);
    assert.match(texto, /Atualizado em: 2026-08-18T05:00:00Z/);
  });

  test("inclui filtros ativos quando informados", () => {
    const texto = descreverContexto(fichaValida, {
      dataAtualizacao: "2026-08-18",
      filtrosAtivos: { escola: "EMEF Centro", turma: "6º Ano A" },
    });
    assert.match(texto, /Filtros ativos: escola: EMEF Centro, turma: 6º Ano A/);
  });

  test("omite a linha de filtros quando não há filtros ativos", () => {
    const texto = descreverContexto(fichaValida, { dataAtualizacao: "2026-08-18" });
    assert.doesNotMatch(texto, /Filtros ativos/);
  });

  test("inclui período analisado quando informado", () => {
    const texto = descreverContexto(fichaValida, {
      dataAtualizacao: "2026-08-18",
      periodoAnalisado: "1º Bimestre 2026",
    });
    assert.match(texto, /Período analisado: 1º Bimestre 2026/);
  });

  test("inclui limitações quando a ficha as declara", () => {
    const texto = descreverContexto(
      { ...fichaValida, limitacoes: ["Depende do lançamento manual da escola."] },
      { dataAtualizacao: "2026-08-18" },
    );
    assert.match(texto, /Limitações conhecidas: Depende do lançamento manual da escola\./);
  });

  test("lança erro se a ficha for inválida", () => {
    assert.throws(() => descreverContexto({ ...fichaValida, nome: "" }, { dataAtualizacao: "2026-08-18" }));
  });
});

describe("DICIONARIO_INDICADORES", () => {
  test("toda entrada do dicionário é uma ficha válida", () => {
    for (const [chave, ficha] of Object.entries(DICIONARIO_INDICADORES)) {
      assert.doesNotThrow(() => montarFichaIndicador(ficha), `entrada "${chave}" deveria ser uma ficha válida`);
    }
  });

  test("contém os indicadores cujo motor de cálculo já existe", () => {
    assert.ok(DICIONARIO_INDICADORES.frequenciaMedia);
    assert.ok(DICIONARIO_INDICADORES.faltasConsecutivas);
    assert.ok(DICIONARIO_INDICADORES.distorcaoIdadeSerie);
  });
});
