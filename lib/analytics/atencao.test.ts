import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  gerarInsightsFrequencia,
  gerarInsightsDesempenho,
  gerarInsightsDistorcao,
  gerarInsightSincronizacao,
  combinarInsightsAtencao,
  agruparInsightsPorEscola,
  type EscolaAtencaoInput,
  type InsightAtencao,
} from "./atencao";

function escolaBase(overrides: Partial<EscolaAtencaoInput> = {}): EscolaAtencaoInput {
  return {
    escolaId: 1,
    nomeEscola: "Escola Teste",
    frequenciaPercentual: 90,
    frequenciaFaixa: "adequada",
    frequenciaVariacao: null,
    desempenhoDiferencaRede: 0,
    percentualAbaixoDoEsperado: 0,
    distorcaoPercentual: 0,
    distorcaoDiferencaRede: 0,
    ...overrides,
  };
}

describe("gerarInsightsFrequencia", () => {
  test("gera insight para escola em faixa crítica e em queda", () => {
    const escola = escolaBase({
      frequenciaPercentual: 68,
      frequenciaFaixa: "critica",
      frequenciaVariacao: { diferencaPontosPercentuais: -6.1, tendencia: "queda" },
    });
    const insights = gerarInsightsFrequencia([escola], 2026);
    assert.equal(insights.length, 1);
    assert.equal(insights[0]!.severidade, "critico");
    assert.equal(insights[0]!.categoria, "frequencia");
    assert.match(insights[0]!.titulo, /68\.0%/);
    assert.match(insights[0]!.titulo, /-6\.1 p\.p\./);
    assert.equal(insights[0]!.href, "/admin/escolas/1?ano=2026");
  });

  test("não gera insight para escola adequada mesmo em queda", () => {
    const escola = escolaBase({
      frequenciaFaixa: "adequada",
      frequenciaVariacao: { diferencaPontosPercentuais: -1, tendencia: "queda" },
    });
    assert.deepEqual(gerarInsightsFrequencia([escola], 2026), []);
  });

  test("não gera insight para escola em faixa ruim mas estável ou em alta", () => {
    const estavel = escolaBase({
      frequenciaFaixa: "atencao",
      frequenciaVariacao: { diferencaPontosPercentuais: 0.1, tendencia: "estavel" },
    });
    const emAlta = escolaBase({
      frequenciaFaixa: "critica",
      frequenciaVariacao: { diferencaPontosPercentuais: 3, tendencia: "alta" },
    });
    assert.deepEqual(gerarInsightsFrequencia([estavel, emAlta], 2026), []);
  });

  test("não gera insight sem histórico de variação (sem dado no período anterior)", () => {
    const escola = escolaBase({ frequenciaFaixa: "critica", frequenciaVariacao: null });
    assert.deepEqual(gerarInsightsFrequencia([escola], 2026), []);
  });

  test("faixa 'atencao' gera severidade 'atencao', não 'critico'", () => {
    const escola = escolaBase({
      frequenciaFaixa: "atencao",
      frequenciaVariacao: { diferencaPontosPercentuais: -2, tendencia: "queda" },
    });
    assert.equal(gerarInsightsFrequencia([escola], 2026)[0]!.severidade, "atencao");
  });

  test("linkBuilder customizado substitui o href padrão do Admin (uso pela Direção, ETAPA 05)", () => {
    const escola = escolaBase({
      frequenciaFaixa: "critica",
      frequenciaVariacao: { diferencaPontosPercentuais: -6.1, tendencia: "queda" },
    });
    const insights = gerarInsightsFrequencia([escola], 2026, () => "/portal/direcao/frequencia");
    assert.equal(insights[0]!.href, "/portal/direcao/frequencia");
  });
});

describe("gerarInsightsDesempenho", () => {
  test("gera insight quando abaixo da rede E proporção elevada abaixo do parâmetro", () => {
    const escola = escolaBase({ desempenhoDiferencaRede: -1.2, percentualAbaixoDoEsperado: 55 });
    const insights = gerarInsightsDesempenho([escola], 2026);
    assert.equal(insights.length, 1);
    assert.equal(insights[0]!.severidade, "atencao");
    assert.equal(insights[0]!.categoria, "aprendizagem");
  });

  test("severidade crítica quando proporção abaixo do parâmetro é muito alta", () => {
    const escola = escolaBase({ desempenhoDiferencaRede: -2, percentualAbaixoDoEsperado: 75 });
    assert.equal(gerarInsightsDesempenho([escola], 2026)[0]!.severidade, "critico");
  });

  test("não gera insight se só um dos dois critérios for verdadeiro", () => {
    const soAbaixoRede = escolaBase({ desempenhoDiferencaRede: -2, percentualAbaixoDoEsperado: 10 });
    const soProporcaoAlta = escolaBase({ desempenhoDiferencaRede: 1, percentualAbaixoDoEsperado: 80 });
    assert.deepEqual(gerarInsightsDesempenho([soAbaixoRede, soProporcaoAlta], 2026), []);
  });

  test("não gera insight sem dado suficiente (null)", () => {
    const escola = escolaBase({ desempenhoDiferencaRede: null, percentualAbaixoDoEsperado: null });
    assert.deepEqual(gerarInsightsDesempenho([escola], 2026), []);
  });

  test("linkBuilder customizado substitui o href padrão do Admin", () => {
    const escola = escolaBase({ desempenhoDiferencaRede: -2, percentualAbaixoDoEsperado: 75 });
    const insights = gerarInsightsDesempenho([escola], 2026, undefined, undefined, () => "/portal/direcao/notas");
    assert.equal(insights[0]!.href, "/portal/direcao/notas");
  });
});

describe("gerarInsightsDistorcao", () => {
  test("gera insight quando distorção está bem acima da rede", () => {
    const escola = escolaBase({ distorcaoPercentual: 25, distorcaoDiferencaRede: 12 });
    const insights = gerarInsightsDistorcao([escola], 2026);
    assert.equal(insights.length, 1);
    assert.equal(insights[0]!.severidade, "critico");
    assert.equal(insights[0]!.categoria, "trajetoria");
  });

  test("não gera insight quando diferença para a rede é pequena", () => {
    const escola = escolaBase({ distorcaoPercentual: 12, distorcaoDiferencaRede: 1 });
    assert.deepEqual(gerarInsightsDistorcao([escola], 2026), []);
  });

  test("linkBuilder customizado substitui o href padrão do Admin", () => {
    const escola = escolaBase({ distorcaoPercentual: 25, distorcaoDiferencaRede: 12 });
    const insights = gerarInsightsDistorcao([escola], 2026, undefined, () => "/portal/direcao");
    assert.equal(insights[0]!.href, "/portal/direcao");
  });
});

describe("gerarInsightSincronizacao", () => {
  test("nenhum insight quando todos os módulos estão em dia e sem execução travada", () => {
    assert.deepEqual(
      gerarInsightSincronizacao([
        { situacao: "em-dia", rotulo: "Frequência", execucaoIncompleta: false },
        { situacao: "em-dia", rotulo: "Notas", execucaoIncompleta: false },
      ]),
      [],
    );
  });

  test("um insight agregando todos os módulos com problema", () => {
    const insights = gerarInsightSincronizacao([
      { situacao: "atrasado", rotulo: "Frequência", execucaoIncompleta: false },
      { situacao: "sem-sincronizacao", rotulo: "Notas", execucaoIncompleta: false },
      { situacao: "em-dia", rotulo: "Escolas", execucaoIncompleta: false },
    ]);
    assert.equal(insights.length, 1);
    assert.match(insights[0]!.titulo, /Frequência/);
    assert.match(insights[0]!.titulo, /Notas/);
    assert.doesNotMatch(insights[0]!.titulo, /Escolas/);
    assert.equal(insights[0]!.severidade, "critico"); // sem-sincronizacao presente
    assert.equal(insights[0]!.categoria, "dados");
  });

  test("severidade 'atencao' quando nenhum módulo está totalmente sem sincronização nem travado", () => {
    const insights = gerarInsightSincronizacao([{ situacao: "atrasado", rotulo: "Frequência", execucaoIncompleta: false }]);
    assert.equal(insights[0]!.severidade, "atencao");
  });

  test("módulo 'em-dia' mas com execução travada ainda gera insight crítico", () => {
    const insights = gerarInsightSincronizacao([
      { situacao: "em-dia", rotulo: "Frequência", execucaoIncompleta: true },
    ]);
    assert.equal(insights.length, 1);
    assert.equal(insights[0]!.severidade, "critico");
    assert.match(insights[0]!.motivo, /travada/);
    assert.match(insights[0]!.motivo, /Frequência/);
  });
});

describe("combinarInsightsAtencao", () => {
  test("prioriza crítico sobre atenção", () => {
    const atencao = { id: "a", categoria: "dados" as const, severidade: "atencao" as const, titulo: "A", motivo: "", periodo: "", href: "" };
    const critico = { id: "c", categoria: "dados" as const, severidade: "critico" as const, titulo: "C", motivo: "", periodo: "", href: "" };
    const resultado = combinarInsightsAtencao([[atencao], [critico]]);
    assert.equal(resultado[0]!.id, "c");
    assert.equal(resultado[1]!.id, "a");
  });

  test("limita ao total pedido", () => {
    const insights = Array.from({ length: 10 }, (_, i) => ({
      id: `i${i}`,
      categoria: "dados" as const,
      severidade: "atencao" as const,
      titulo: "",
      motivo: "",
      periodo: "",
      href: "",
    }));
    assert.equal(combinarInsightsAtencao([insights], 3).length, 3);
  });
});

describe("agruparInsightsPorEscola", () => {
  function insight(overrides: Partial<InsightAtencao> = {}): InsightAtencao {
    return {
      id: "x",
      categoria: "frequencia",
      severidade: "atencao",
      titulo: "",
      motivo: "",
      periodo: "",
      href: "",
      escolaId: 1,
      ...overrides,
    };
  }

  test("agrupa cada categoria separadamente por escola, sem somar nem criar score", () => {
    const mapa = agruparInsightsPorEscola([
      insight({ escolaId: 1, categoria: "frequencia", severidade: "critico" }),
      insight({ escolaId: 1, categoria: "trajetoria", severidade: "atencao" }),
      insight({ escolaId: 2, categoria: "aprendizagem", severidade: "critico" }),
    ]);

    assert.deepEqual(mapa.get(1), { frequencia: "critico", trajetoria: "atencao" });
    assert.deepEqual(mapa.get(2), { aprendizagem: "critico" });
    assert.equal(mapa.get(3), undefined);
  });

  test("ignora insight de categoria 'dados' (sincronização é da rede, não de uma escola)", () => {
    const mapa = agruparInsightsPorEscola([insight({ categoria: "dados" })]);
    assert.equal(mapa.size, 0);
  });

  test("ignora insight sem escolaId mesmo que a categoria seja de escola", () => {
    const mapa = agruparInsightsPorEscola([insight({ categoria: "frequencia", escolaId: undefined })]);
    assert.equal(mapa.size, 0);
  });

  test("lista vazia retorna mapa vazio", () => {
    assert.equal(agruparInsightsPorEscola([]).size, 0);
  });
});
