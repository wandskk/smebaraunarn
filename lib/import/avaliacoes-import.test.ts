import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validarLinhasQuestao, interpretarNivelFluencia, extrairRespostasPorItem } from "./avaliacoes-import";

describe("validarLinhasQuestao", () => {
  test("aceita linha válida com número e peso padrão", () => {
    const [linha] = validarLinhasQuestao([{ numero: "1", descritor: "D01", gabarito: "A" }]);
    assert.equal(linha!.erro, null);
    assert.equal(linha!.numero, 1);
    assert.equal(linha!.peso, 1);
    assert.equal(linha!.gabaritoCorreto, "A");
  });

  test("rejeita número ausente", () => {
    const [linha] = validarLinhasQuestao([{ descritor: "D01" }]);
    assert.match(linha!.erro ?? "", /ausente ou inválido/);
  });

  test("rejeita número duplicado dentro do próprio arquivo", () => {
    const linhas = validarLinhasQuestao([{ numero: "1" }, { numero: "1" }]);
    assert.equal(linhas[0]!.erro, null);
    assert.match(linhas[1]!.erro ?? "", /duplicado/);
  });

  test("rejeita peso inválido", () => {
    const [linha] = validarLinhasQuestao([{ numero: "1", peso: "abc" }]);
    assert.match(linha!.erro ?? "", /Peso inválido/);
  });

  test("aceita cabeçalho alternativo para número e gabarito", () => {
    const [linha] = validarLinhasQuestao([{ "n": "5", "resposta_correta": "C" }]);
    assert.equal(linha!.numero, 5);
    assert.equal(linha!.gabaritoCorreto, "C");
  });

  test("numera linhas a partir de 1, na ordem do arquivo", () => {
    const linhas = validarLinhasQuestao([{ numero: "1" }, { numero: "2" }, { numero: "3" }]);
    assert.deepEqual(linhas.map((l) => l.linha), [1, 2, 3]);
  });
});

describe("interpretarNivelFluencia", () => {
  test("aceita o valor bruto do enum", () => {
    assert.equal(interpretarNivelFluencia("LEITOR_FLUENTE"), "LEITOR_FLUENTE");
  });

  test("aceita o rótulo em português, sem diferenciar caixa", () => {
    assert.equal(interpretarNivelFluencia("leitor fluente"), "LEITOR_FLUENTE");
    assert.equal(interpretarNivelFluencia("Não leitor"), "NAO_LEITOR");
  });

  test("retorna null para texto vazio ou não reconhecido, nunca lança", () => {
    assert.equal(interpretarNivelFluencia(""), null);
    assert.equal(interpretarNivelFluencia("nível inexistente"), null);
  });
});

describe("extrairRespostasPorItem", () => {
  test("extrai colunas resposta_N em um objeto numero->resposta", () => {
    const respostas = extrairRespostasPorItem({ nome: "Ana", resposta_1: "A", resposta_2: "C" });
    assert.deepEqual(respostas, { "1": "A", "2": "C" });
  });

  test("aceita os prefixos alternativos q e questao_", () => {
    const respostas = extrairRespostasPorItem({ q1: "B", questao_2: "D" });
    assert.deepEqual(respostas, { "1": "B", "2": "D" });
  });

  test("ignora colunas vazias e colunas que não são de resposta", () => {
    const respostas = extrairRespostasPorItem({ nome: "Ana", resposta_1: "", resposta_2: "C", turma: "6A" });
    assert.deepEqual(respostas, { "2": "C" });
  });

  test("não confunde uma coluna 'q' sem número com resposta", () => {
    const respostas = extrairRespostasPorItem({ qualquer: "X" });
    assert.deepEqual(respostas, {});
  });
});
