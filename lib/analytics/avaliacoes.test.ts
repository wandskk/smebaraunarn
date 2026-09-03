import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  deriveStatusAvaliacao,
  calcularAnalisePorItem,
  calcularDistribuicaoFluencia,
  calcularResumoResultadosTurma,
  faixaAcertoHabilidade,
  ordemCicloCaed,
  type ResultadoTurmaInput,
} from "./avaliacoes";

describe("deriveStatusAvaliacao", () => {
  test("sem nenhum resultado -> preparacao", () => {
    const status = deriveStatusAvaliacao({ esperado: 0, realizado: 0, turmasCompletas: 0, turmasParciais: 0 });
    assert.equal(status, "preparacao");
  });

  test("resultados mas nenhuma turma completa -> em_aplicacao", () => {
    const status = deriveStatusAvaliacao({ esperado: 30, realizado: 5, turmasCompletas: 0, turmasParciais: 2 });
    assert.equal(status, "em_aplicacao");
  });

  test("alguma turma completa e outra pendente -> coleta_parcial", () => {
    const status = deriveStatusAvaliacao({ esperado: 30, realizado: 20, turmasCompletas: 1, turmasParciais: 1 });
    assert.equal(status, "coleta_parcial");
  });

  test("todas as turmas tocadas completas -> consolidada", () => {
    const status = deriveStatusAvaliacao({ esperado: 30, realizado: 30, turmasCompletas: 2, turmasParciais: 0 });
    assert.equal(status, "consolidada");
  });
});

describe("calcularAnalisePorItem", () => {
  const questoes = [
    { numero: 1, descritor: "D01", gabaritoCorreto: "A" },
    { numero: 2, descritor: "D01", gabaritoCorreto: "B" },
    { numero: 3, descritor: "D02", gabaritoCorreto: null },
  ];

  test("calcula % de acerto por questão a partir de respostasJson", () => {
    const resultados: { respostasJson: Record<string, string> | null }[] = [
      { respostasJson: { "1": "A", "2": "B" } },
      { respostasJson: { "1": "C", "2": "B" } },
      { respostasJson: { "1": "A" } },
    ];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);

    const q1 = porQuestao.find((q) => q.numero === 1)!;
    assert.equal(q1.respondidas, 3);
    assert.equal(q1.acertos, 2);
    assert.equal(q1.percentualAcerto, (2 / 3) * 100);

    const q2 = porQuestao.find((q) => q.numero === 2)!;
    assert.equal(q2.respondidas, 2);
    assert.equal(q2.acertos, 2);
    assert.equal(q2.percentualAcerto, 100);
  });

  test("questão sem gabarito não produz percentual inventado", () => {
    const resultados = [{ respostasJson: { "3": "A" } }];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);
    const q3 = porQuestao.find((q) => q.numero === 3)!;
    assert.equal(q3.respondidas, 0);
    assert.equal(q3.percentualAcerto, null);
  });

  test("resultado sem resposta para a questão não conta como respondida", () => {
    const resultados: { respostasJson: Record<string, string> | null }[] = [
      { respostasJson: null },
      { respostasJson: {} },
      { respostasJson: { "1": "" } },
    ];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);
    const q1 = porQuestao.find((q) => q.numero === 1)!;
    assert.equal(q1.respondidas, 0);
    assert.equal(q1.percentualAcerto, null);
  });

  test("agrega por descritor somando questões do mesmo descritor", () => {
    const resultados = [
      { respostasJson: { "1": "A", "2": "X" } },
      { respostasJson: { "1": "X", "2": "B" } },
    ];
    const { porDescritor } = calcularAnalisePorItem(questoes, resultados);
    const d01 = porDescritor.find((d) => d.descritor === "D01")!;
    assert.equal(d01.respondidas, 4);
    assert.equal(d01.acertos, 2);
    assert.equal(d01.percentualAcerto, 50);
  });

  test("comparação de gabarito ignora espaços e caixa", () => {
    const resultados = [{ respostasJson: { "1": " a " } }];
    const { porQuestao } = calcularAnalisePorItem(questoes, resultados);
    const q1 = porQuestao.find((q) => q.numero === 1)!;
    assert.equal(q1.acertos, 1);
  });
});

describe("calcularDistribuicaoFluencia", () => {
  const niveis = ["NAO_LEITOR", "LEITOR_DE_SILABAS", "LEITOR_FLUENTE"];

  test("conta resultados por nível, na ordem recebida (não a de chegada)", () => {
    const resultado = calcularDistribuicaoFluencia(
      [
        { nivelDesempenho: "LEITOR_FLUENTE", palavrasPorMin: null },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
      ],
      niveis,
    );
    assert.deepEqual(
      resultado.porNivel.map((n) => n.quantidade),
      [2, 0, 1],
    );
  });

  test("nível com zero resultados aparece com quantidade 0, não fica ausente da lista", () => {
    const resultado = calcularDistribuicaoFluencia([{ nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null }], niveis);
    assert.equal(resultado.porNivel.length, 3);
    assert.equal(resultado.porNivel.find((n) => n.nivel === "LEITOR_FLUENTE")!.quantidade, 0);
  });

  test("resultado sem nível conta em semNivel, não é descartado nem quebra a contagem por nível", () => {
    const resultado = calcularDistribuicaoFluencia(
      [
        { nivelDesempenho: null, palavrasPorMin: null },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
      ],
      niveis,
    );
    assert.equal(resultado.semNivel, 1);
    assert.equal(resultado.porNivel.find((n) => n.nivel === "NAO_LEITOR")!.quantidade, 1);
  });

  test("calcula média/mínimo/máximo de palavras por minuto só sobre quem tem o dado", () => {
    const resultado = calcularDistribuicaoFluencia(
      [
        { nivelDesempenho: "LEITOR_FLUENTE", palavrasPorMin: 100 },
        { nivelDesempenho: "LEITOR_FLUENTE", palavrasPorMin: 80 },
        { nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null },
      ],
      niveis,
    );
    assert.equal(resultado.palavrasPorMinuto.media, 90);
    assert.equal(resultado.palavrasPorMinuto.minimo, 80);
    assert.equal(resultado.palavrasPorMinuto.maximo, 100);
    assert.equal(resultado.palavrasPorMinuto.totalComDado, 2);
  });

  test("sem nenhum dado de palavras por minuto, estatísticas ficam null, não zero", () => {
    const resultado = calcularDistribuicaoFluencia([{ nivelDesempenho: "NAO_LEITOR", palavrasPorMin: null }], niveis);
    assert.equal(resultado.palavrasPorMinuto.media, null);
    assert.equal(resultado.palavrasPorMinuto.totalComDado, 0);
  });

  test("lista vazia retorna todos os níveis zerados", () => {
    const resultado = calcularDistribuicaoFluencia([], niveis);
    assert.ok(resultado.porNivel.every((n) => n.quantidade === 0));
    assert.equal(resultado.semNivel, 0);
  });
});

describe("calcularResumoResultadosTurma", () => {
  function linha(overrides: Partial<ResultadoTurmaInput>): ResultadoTurmaInput {
    return {
      escolaId: 1,
      escolaNome: "Escola A",
      turma: "5A",
      previstos: null,
      avaliados: null,
      percentualParticipacao: 100,
      percentualDefasagem: 20,
      percentualIntermediario: 30,
      percentualAdequado: 50,
      quantidadeDefasagem: null,
      quantidadeIntermediario: null,
      quantidadeAdequado: null,
      acertoPorHabilidade: null,
      ...overrides,
    };
  }

  test("calcula a média simples de cada percentual entre as linhas", () => {
    const resumo = calcularResumoResultadosTurma([
      linha({ percentualAdequado: 40 }),
      linha({ percentualAdequado: 60 }),
    ]);
    assert.equal(resumo.mediaAdequado, 50);
    assert.equal(resumo.mediaParticipacao, 100);
  });

  test("ignora linhas com percentual null ao calcular a média, não trata como zero", () => {
    const resumo = calcularResumoResultadosTurma([
      linha({ percentualAdequado: 80 }),
      linha({ percentualAdequado: null }),
    ]);
    assert.equal(resumo.mediaAdequado, 80);
  });

  test("lista vazia retorna médias null, nunca zero ou NaN", () => {
    const resumo = calcularResumoResultadosTurma([]);
    assert.equal(resumo.mediaParticipacao, null);
    assert.equal(resumo.mediaAdequado, null);
    assert.deepEqual(resumo.porHabilidade, []);
  });

  test("ordena porEscola por nome da escola e depois por turma", () => {
    const resumo = calcularResumoResultadosTurma([
      linha({ escolaNome: "Escola B", turma: "1A" }),
      linha({ escolaNome: "Escola A", turma: "2A" }),
      linha({ escolaNome: "Escola A", turma: "1A" }),
    ]);
    assert.deepEqual(
      resumo.porEscola.map((l) => `${l.escolaNome}/${l.turma}`),
      ["Escola A/1A", "Escola A/2A", "Escola B/1A"],
    );
  });

  test("agrega acertoPorHabilidade em média por habilidade através das linhas que a reportam", () => {
    const resumo = calcularResumoResultadosTurma([
      linha({ acertoPorHabilidade: { H01: 80, H02: 40 } }),
      linha({ acertoPorHabilidade: { H01: 60 } }),
      linha({ acertoPorHabilidade: null }),
    ]);
    assert.deepEqual(resumo.porHabilidade, [
      { habilidade: "H01", percentualMedioAcerto: 70 },
      { habilidade: "H02", percentualMedioAcerto: 40 },
    ]);
  });

  test("soma previstos/avaliados das linhas que têm o dado", () => {
    const resumo = calcularResumoResultadosTurma([
      linha({ previstos: 30, avaliados: 28 }),
      linha({ previstos: 10, avaliados: 9 }),
    ]);
    assert.equal(resumo.totalPrevistos, 40);
    assert.equal(resumo.totalAvaliados, 37);
  });

  test("totalPrevistos/totalAvaliados null quando nenhuma linha traz o dado (fonte antiga)", () => {
    const resumo = calcularResumoResultadosTurma([linha({ previstos: null, avaliados: null })]);
    assert.equal(resumo.totalPrevistos, null);
    assert.equal(resumo.totalAvaliados, null);
  });

  test("média ponderada por estudante avaliado difere da média simples entre escolas com tamanhos desiguais", () => {
    // escola pequena (3 avaliados) com 100% adequado, escola grande (76 avaliados) com 34% — igual ao caso real
    // observado (5º ano/LP Leitura) que motivou este cálculo: a média simples esconde o peso real de cada escola.
    const resumo = calcularResumoResultadosTurma([
      linha({ avaliados: 3, percentualAdequado: 100 }),
      linha({ avaliados: 76, percentualAdequado: 34 }),
    ]);
    assert.equal(resumo.mediaAdequado, 67); // média simples: (100+34)/2
    const esperadoPonderado = (3 * 100 + 76 * 34) / (3 + 76);
    assert.ok(Math.abs(resumo.mediaAdequadoPonderada! - esperadoPonderado) < 0.001);
    assert.ok(resumo.mediaAdequadoPonderada! < 40); // bem mais próximo da escola grande
  });

  test("média ponderada null quando nenhuma linha tem avaliados, mesmo com percentual presente", () => {
    const resumo = calcularResumoResultadosTurma([linha({ avaliados: null, percentualAdequado: 80 })]);
    assert.equal(resumo.mediaAdequadoPonderada, null);
    assert.equal(resumo.mediaDefasagemPonderada, null);
    assert.equal(resumo.mediaIntermediarioPonderada, null);
  });

  test("média ponderada ignora só as linhas sem avaliados, sem descartar o resto", () => {
    const resumo = calcularResumoResultadosTurma([
      linha({ avaliados: 10, percentualAdequado: 50 }),
      linha({ avaliados: null, percentualAdequado: 90 }),
    ]);
    assert.equal(resumo.mediaAdequadoPonderada, 50);
  });

  test("média ponderada usa a contagem exata (quantidadeAdequado) quando disponível, não aproxima", () => {
    // 6 avaliados, 6 adequado (100%) — contagem exata bate com o percentual aqui, caso simples.
    const resumo = calcularResumoResultadosTurma([linha({ avaliados: 6, quantidadeAdequado: 6, percentualAdequado: 100 })]);
    assert.equal(resumo.mediaAdequadoPonderada, 100);
  });

  test("contagem exata e aproximação por percentual se combinam quando linhas diferentes têm fontes diferentes", () => {
    // linha 1: contagem exata (API nova). linha 2: só percentual (CSV antigo). As duas entram na mesma ponderação.
    const resumo = calcularResumoResultadosTurma([
      linha({ avaliados: 10, quantidadeAdequado: 10, percentualAdequado: 100 }),
      linha({ avaliados: 10, quantidadeAdequado: null, percentualAdequado: 0 }),
    ]);
    assert.equal(resumo.mediaAdequadoPonderada, 50); // (10 exatos + 0 aproximados) / 20 avaliados
  });
});

describe("faixaAcertoHabilidade", () => {
  test("até 40% -> danger", () => {
    assert.equal(faixaAcertoHabilidade(0), "danger");
    assert.equal(faixaAcertoHabilidade(40), "danger");
  });

  test("41 a 60% -> warning", () => {
    assert.equal(faixaAcertoHabilidade(41), "warning");
    assert.equal(faixaAcertoHabilidade(60), "warning");
  });

  test("61 a 80% -> info", () => {
    assert.equal(faixaAcertoHabilidade(61), "info");
    assert.equal(faixaAcertoHabilidade(80), "info");
  });

  test("acima de 80% -> success", () => {
    assert.equal(faixaAcertoHabilidade(81), "success");
    assert.equal(faixaAcertoHabilidade(100), "success");
  });
});

describe("ordemCicloCaed", () => {
  test("extrai o número do ciclo pra ordenação (AV1 < AV2 < AV3)", () => {
    assert.equal(ordemCicloCaed("AV1"), 1);
    assert.equal(ordemCicloCaed("AV2"), 2);
    assert.equal(ordemCicloCaed("AV3"), 3);
  });

  test("código desconhecido vai pro final da ordenação, nunca lança", () => {
    assert.equal(ordemCicloCaed("XYZ"), Number.MAX_SAFE_INTEGER);
  });
});
