import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extrairCodigoInep, parsePercent, extrairAcertoPorHabilidade, slug } from "./caed-turma-import";

describe("extrairCodigoInep", () => {
  test("extrai o código INEP do fim do texto da escola", () => {
    assert.equal(extrairCodigoInep("ESCOLA MUNICIPAL JOAO DA SILVA - 24000531"), "24000531");
  });

  test("aceita código de 6 dígitos e espaços extras antes do hífen", () => {
    assert.equal(extrairCodigoInep("ESCOLA X  -  240005"), "240005");
  });

  test("retorna null quando não há código no fim do texto", () => {
    assert.equal(extrairCodigoInep("ESCOLA MUNICIPAL SEM CODIGO"), null);
  });
});

describe("parsePercent", () => {
  test("converte percentual com vírgula e símbolo %", () => {
    assert.equal(parsePercent("45,2%"), 45.2);
  });

  test("converte percentual já com ponto decimal", () => {
    assert.equal(parsePercent("45.2"), 45.2);
  });

  test("retorna null para texto vazio ou indefinido", () => {
    assert.equal(parsePercent(""), null);
    assert.equal(parsePercent(undefined), null);
  });

  test("retorna null para texto não numérico, nunca lança", () => {
    assert.equal(parsePercent("--"), null);
  });
});

describe("extrairAcertoPorHabilidade", () => {
  test("extrai colunas h_NN_... normalizando a chave para HNN", () => {
    const resultado = extrairAcertoPorHabilidade({ "h_01_(%)": "80", "h_12_(%)": "55,5" });
    assert.deepEqual(resultado, { H01: 80, H12: 55.5 });
  });

  test("ignora colunas que não seguem o padrão h_NN_", () => {
    const resultado = extrairAcertoPorHabilidade({ escola: "X", turma: "5A" });
    assert.equal(resultado, null);
  });

  test("retorna null quando nenhuma habilidade tem percentual numérico", () => {
    const resultado = extrairAcertoPorHabilidade({ "h_01_(%)": "" });
    assert.equal(resultado, null);
  });
});

describe("slug", () => {
  test("remove acentos e maiúsculiza", () => {
    assert.equal(slug("Ensino Fundamental de 9 Anos"), "ENSINO_FUNDAMENTAL_DE_9_ANOS");
  });

  test("substitui sequências de caracteres não alfanuméricos por um único underscore", () => {
    assert.equal(slug("1º ANO - Turma  A"), "1_ANO_TURMA_A");
  });

  test("remove underscores nas pontas", () => {
    assert.equal(slug("-teste-"), "TESTE");
  });
});
