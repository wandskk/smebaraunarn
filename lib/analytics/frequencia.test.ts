import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calcularVariacaoFrequencia,
  identificarSequenciasDeFaltas,
  faltasConsecutivasAtuais,
  classificarGravidadeFaltasConsecutivas,
  classificarFaixaFrequencia,
  calcularPercentualFrequencia,
  FAIXAS_PADRAO_FREQUENCIA,
  LIMIARES_PADRAO_FALTAS_CONSECUTIVAS,
  type RegistroDiario,
} from "./frequencia";

describe("calcularVariacaoFrequencia", () => {
  test("detecta queda além do limiar de estabilidade", () => {
    const resultado = calcularVariacaoFrequencia(80, 96);
    assert.equal(resultado.tendencia, "queda");
    assert.equal(resultado.diferencaPontosPercentuais, -16);
  });

  test("detecta alta além do limiar de estabilidade", () => {
    const resultado = calcularVariacaoFrequencia(90, 82);
    assert.equal(resultado.tendencia, "alta");
  });

  test("trata pequenas oscilações como estável", () => {
    const resultado = calcularVariacaoFrequencia(90.2, 90);
    assert.equal(resultado.tendencia, "estavel");
  });

  test("é simétrica: mesmo valor nos dois períodos é sempre estável", () => {
    const resultado = calcularVariacaoFrequencia(70, 70);
    assert.equal(resultado.tendencia, "estavel");
    assert.equal(resultado.diferencaPontosPercentuais, 0);
  });
});

describe("identificarSequenciasDeFaltas", () => {
  test("retorna lista vazia sem registros", () => {
    assert.deepEqual(identificarSequenciasDeFaltas([]), []);
  });

  test("ignora dias de presença", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-02", faltou: false },
      { data: "2026-03-03", faltou: false },
    ];
    assert.deepEqual(identificarSequenciasDeFaltas(registros), []);
  });

  test("agrupa faltas consecutivas em uma única sequência", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-02", faltou: true },
      { data: "2026-03-03", faltou: true },
      { data: "2026-03-04", faltou: true },
    ];
    const sequencias = identificarSequenciasDeFaltas(registros);
    assert.equal(sequencias.length, 1);
    assert.deepEqual(sequencias[0], {
      dataInicio: "2026-03-02",
      dataFim: "2026-03-04",
      duracaoDias: 3,
    });
  });

  test("uma presença no meio quebra a sequência em duas", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-02", faltou: true },
      { data: "2026-03-03", faltou: false },
      { data: "2026-03-04", faltou: true },
      { data: "2026-03-05", faltou: true },
    ];
    const sequencias = identificarSequenciasDeFaltas(registros);
    assert.equal(sequencias.length, 2);
    assert.equal(sequencias.at(0)?.duracaoDias, 1);
    assert.equal(sequencias.at(1)?.duracaoDias, 2);
  });

  test("funciona independente da ordem de entrada", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-04", faltou: true },
      { data: "2026-03-02", faltou: true },
      { data: "2026-03-03", faltou: true },
    ];
    const sequencias = identificarSequenciasDeFaltas(registros);
    assert.equal(sequencias.length, 1);
    assert.equal(sequencias.at(0)?.duracaoDias, 3);
  });
});

describe("faltasConsecutivasAtuais", () => {
  test("retorna 0 sem registros", () => {
    assert.equal(faltasConsecutivasAtuais([]), 0);
  });

  test("retorna 0 quando o último dia registrado é presença", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-02", faltou: true },
      { data: "2026-03-03", faltou: false },
    ];
    assert.equal(faltasConsecutivasAtuais(registros), 0);
  });

  test("conta a sequência em andamento até o último registro", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-01", faltou: false },
      { data: "2026-03-02", faltou: true },
      { data: "2026-03-03", faltou: true },
    ];
    assert.equal(faltasConsecutivasAtuais(registros), 2);
  });

  test("não conta uma sequência de falta antiga já encerrada", () => {
    const registros: RegistroDiario[] = [
      { data: "2026-03-01", faltou: true },
      { data: "2026-03-02", faltou: true },
      { data: "2026-03-03", faltou: false },
      { data: "2026-03-04", faltou: false },
    ];
    assert.equal(faltasConsecutivasAtuais(registros), 0);
  });
});

describe("classificarGravidadeFaltasConsecutivas", () => {
  test("usa os limiares padrão do documento de visão (3/5/10)", () => {
    assert.equal(classificarGravidadeFaltasConsecutivas(0), "nenhuma");
    assert.equal(classificarGravidadeFaltasConsecutivas(2), "nenhuma");
    assert.equal(classificarGravidadeFaltasConsecutivas(3), "atencao");
    assert.equal(classificarGravidadeFaltasConsecutivas(4), "atencao");
    assert.equal(classificarGravidadeFaltasConsecutivas(5), "alerta");
    assert.equal(classificarGravidadeFaltasConsecutivas(9), "alerta");
    assert.equal(classificarGravidadeFaltasConsecutivas(10), "critico");
    assert.equal(classificarGravidadeFaltasConsecutivas(20), "critico");
  });

  test("aceita limiares customizados por rede", () => {
    const limiaresCustom = { atencao: 2, alerta: 4, critico: 6 };
    assert.equal(classificarGravidadeFaltasConsecutivas(2, limiaresCustom), "atencao");
    assert.equal(classificarGravidadeFaltasConsecutivas(6, limiaresCustom), "critico");
  });

  test("os limiares padrão exportados batem com os usados por default", () => {
    assert.deepEqual(LIMIARES_PADRAO_FALTAS_CONSECUTIVAS, { atencao: 3, alerta: 5, critico: 10 });
  });
});

describe("classificarFaixaFrequencia", () => {
  test("classifica nos limites exatos das faixas padrão", () => {
    assert.equal(classificarFaixaFrequencia(100), "adequada");
    assert.equal(classificarFaixaFrequencia(85), "adequada");
    assert.equal(classificarFaixaFrequencia(84.9), "atencao");
    assert.equal(classificarFaixaFrequencia(75), "atencao");
    assert.equal(classificarFaixaFrequencia(74.9), "critica");
    assert.equal(classificarFaixaFrequencia(0), "critica");
  });

  test("aceita faixas customizadas por rede", () => {
    const faixasCustom = { minimoAdequada: 90, minimoAtencao: 80 };
    assert.equal(classificarFaixaFrequencia(85, faixasCustom), "atencao");
  });

  test("as faixas padrão exportadas batem com as usadas por default", () => {
    assert.deepEqual(FAIXAS_PADRAO_FREQUENCIA, { minimoAdequada: 85, minimoAtencao: 75 });
  });
});

describe("calcularPercentualFrequencia", () => {
  test("calcula o percentual de presença", () => {
    assert.equal(calcularPercentualFrequencia(100, 10), 90);
    assert.equal(calcularPercentualFrequencia(4, 0), 100);
    assert.equal(calcularPercentualFrequencia(4, 4), 0);
  });

  test("retorna null quando não há aulas registradas", () => {
    assert.equal(calcularPercentualFrequencia(0, 0), null);
  });

  test("retorna null para total de aulas negativo (dado corrompido)", () => {
    assert.equal(calcularPercentualFrequencia(-1, 0), null);
  });
});
