# ETAPA 00 — Auditoria e baseline

## Status
DONE

## Objetivo

Ler toda a base relevante, confirmar o que já existe (para não duplicar),
registrar o baseline de testes/lint/typecheck/build, corrigir status
documental desatualizado e pesquisar referências de UX no MCP 21st.dev —
sem alterar nenhuma feature.

## Escopo desta etapa

1. Ler os arquivos listados na seção 0 do plano
   (`PLANO_MVP_INDICADORES_INTELIGENTES.md`).
2. Confirmar branch/commit atual.
3. Registrar componentes existentes.
4. Registrar queries existentes.
5. Rodar `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
6. Registrar baseline.
7. Corrigir status documental desatualizado em `docs/redesign-visual/`.
8. Pesquisar 21st.dev (categorias A-E).
9. Criar `REFERENCIAS_21ST.md`.
10. Não alterar UI.

## Branch/commit no início da etapa

- Branch: `main`
- Commit: `82faf63` — "docs(sme): redesign visual ETAPA V9 — auditoria de
  Administracao (sem mudanca de codigo)"

## Inventário — componentes já existentes (não recriar)

| Componente | Arquivo |
|---|---|
| `MetricCard` | `components/ui/metric-card.tsx` |
| `InsightCard` | `components/ui/insight-card.tsx` |
| `DataTable` + primitivas | `components/ui/table.tsx` |
| `TableEmptyState` | `components/ui/table-empty-state.tsx` |
| `EmptyState` | `components/ui/empty-state.tsx` |
| `DataFreshnessBadge` | `components/ui/data-freshness-badge.tsx` |
| `ComparisonDelta` | `components/ui/comparison-delta.tsx` |
| `AnimatedNumber` | `components/ui/animated-number.tsx` |
| `Badge` | `components/ui/badge.tsx` |
| `PageHeader`, `PageContainer` | `components/ui/page-header.tsx`, `page-container.tsx` |
| `RingProgress` | `components/ui/charts/ring-progress.tsx` |
| `DonutChart` | `components/ui/charts/donut-chart.tsx` |
| `MiniBarChart` | `components/ui/charts/mini-bar-chart.tsx` |
| `Sparkline` | `components/ui/charts/sparkline.tsx` |
| `AttendanceHeatmap` | `components/ui/charts/attendance-heatmap.tsx` (hoje usado só em `components/portal/aluno-detalhe.tsx` e `app/portal/aluno/frequencia/page.tsx` — nível estudante, não rede) |
| `ACCENT_COLOR`/`ACCENT_TRACK_COLOR`/`ChartAccent` | `components/ui/charts/accent-colors.ts` |

**Não existem ainda** (confirmado por grep, não é duplicação criar):
`TimeSeriesChart`, `ExecutiveSummary`.

## Inventário — queries já existentes (não recriar)

| Função | Arquivo | Parâmetros principais |
|---|---|---|
| `getInsightsAtencao(anoLetivo, limite=5)` | `lib/queries/atencao.ts:23` | `anoLetivo`, `limite?` |
| `getInsightsAtencaoEscola(escolaId, anoLetivo, limite=5)` | `lib/queries/atencao.ts:76` | `escolaId`, `anoLetivo`, `limite?` |
| `getFrequenciaPorEscola(filtro)` | `lib/queries/frequencia.ts:181` | `FiltroFrequenciaPorEscola` |
| `calcularJanelaComparativaPadrao(hoje, diasPorJanela=30)` | `lib/queries/frequencia.ts:262` | `hoje`, `diasPorJanela?` |
| `getEstudantesEmSequenciaDeFaltas(escolaId, turma, hoje)` | `lib/queries/frequencia.ts:61` | `escolaId`, `turma`, `hoje?` |
| `getContagemFaltasConsecutivasPorEscola(hoje)` | `lib/queries/frequencia.ts:97` | `hoje?` |
| `getDesempenhoPorEscola(filtro)` | `lib/queries/desempenho.ts:53` | `FiltroDesempenhoPorEscola` |
| `getDisciplinasComNota(anoLetivo)` | `lib/queries/desempenho.ts:97` | `anoLetivo` |
| `getComparativosPorEscola(filtro)` | `lib/queries/comparativos.ts:52` | `FiltroComparativos` |
| `getAvaliacoesResumo(scope)` | `lib/queries/avaliacoes.ts:228` | `AvaliacaoScope` (`{kind:"rede"}` etc.) |
| `getCoberturaResumoPorAvaliacoes(avaliacaoIds)` | `lib/queries/avaliacoes.ts:303` | `avaliacaoIds[]` |
| `getAvaliacaoDetalhe(avaliacaoId, scope, filtro)` | `lib/queries/avaliacoes.ts:347` | `avaliacaoId`, `scope`, `filtro` |
| `getAnaliseItensAvaliacao(avaliacaoId, scope)` | `lib/queries/avaliacoes.ts:474` | `avaliacaoId`, `scope` |
| `getStatusSincronizacao()` | `lib/queries/qualidade-dados.ts:57` | — |
| `getColisoesCodigoTurma()` | `lib/queries/qualidade-dados.ts:125` | — |
| `getCompletudeDados()` | `lib/queries/qualidade-dados.ts:214` | — |
| `getEscolasNaoMapeadas()` | `lib/queries/qualidade-dados.ts:300` | — |
| `getDistorcaoPorEscolaESerie(filtro)` | `lib/queries/distorcao.ts` | `FiltroDistorcao` |
| `getIndicadoresGeraisRede(filtro)` | `lib/queries/indicadores-gerais.ts` | `{anoLetivo}` |

**Não existe ainda** (confirmado, genuinamente novo trabalho da ETAPA 02):
`getEvolucaoFrequenciaRede(...)`.

## Inventário — motores de análise (`lib/analytics/`)

- `atencao.ts`: `InsightAtencao` (interface — **sem campo `categoria` hoje**,
  ver decisão abaixo), `SeveridadeAtencao`, `gerarInsightsFrequencia`,
  `gerarInsightsDesempenho`, `gerarInsightsDistorcao`,
  `gerarInsightSincronizacao`, `combinarInsightsAtencao`.
- `frequencia.ts`: `calcularVariacaoFrequencia`, `identificarSequenciasDeFaltas`,
  `faltasConsecutivasAtuais`, `classificarGravidadeFaltasConsecutivas`,
  `calcularPercentualFrequencia`, `calcularJanelaDias`,
  `classificarFaixaFrequencia` (faixas: adequada ≥85, atenção ≥75, senão
  crítica).
- `distorcao.ts`: `calcularIdadeEmAnos`, `calcularDistorcaoIdadeSerie`,
  `classificarIntensidadeDefasagem` (metodologia INEP,
  `LIMIAR_DISTORCAO_ANOS=2`, severa ≥4 anos).
- `explicabilidade.ts`: `montarFichaIndicador`, `descreverContexto`,
  `DICIONARIO_INDICADORES` (cobre hoje: `frequenciaMedia`,
  `estudantesAbaixoFaixaFrequencia`, `faltasConsecutivas`,
  `distorcaoIdadeSerie`, `desempenhoMedio`, `escolasAtivas`).
- `estatistica.ts`: `calcularMediana`, `calcularPercentil`,
  `calcularAmplitude`, `calcularProporcaoAbaixoDe`.
- `avaliacoes.ts`: `deriveStatusAvaliacao`, `calcularAnalisePorItem`,
  `STATUS_AVALIACAO_LABEL`.
- `qualidade-dados.ts`: `classificarSituacaoSincronizacao`,
  `execucaoIncompleta`, `possuiDivergenciaDeSerie`.
- `comparativos.ts`: `calcularMediaPonderada`, `calcularDiferencaParaRede`.

## Decisão registrada — campo `categoria` em `InsightAtencao`

Hoje `InsightAtencao` (`lib/analytics/atencao.ts:15-24`) é:

```ts
export interface InsightAtencao {
  id: string;
  severidade: SeveridadeAtencao; // "critico" | "atencao"
  titulo: string;
  motivo: string;
  periodo: string;
  href: string;
}
```

Não há campo `categoria`. Cada gerador (`gerarInsightsFrequencia`,
`gerarInsightsDesempenho`, `gerarInsightsDistorcao`,
`gerarInsightSincronizacao`) já sabe implicitamente sua categoria (prefixo do
`id`: `frequencia-`, `desempenho-`, `distorcao-`, `sincronizacao`), mas isso
nunca é exposto como campo tipado. Adicionar `categoria` é aditivo (um campo
novo, preenchido literalmente dentro de cada gerador que já existe) — **não
duplica lógica**. Fica para a ETAPA 03, que é onde o tipo será consumido pela
UI (filtros de categoria no Panorama).

Nota de nomenclatura: o plano usa `"aprendizagem"` no union sugerido, mas o
código usa `"desempenho"` como nome de domínio (`gerarInsightsDesempenho`,
`id: desempenho-${escolaId}`). Decisão a confirmar na ETAPA 03: manter
`"aprendizagem"` (linguagem de produto, como o resto do plano) mesmo com o
código internamente usando `desempenho` — não é ambiguidade bloqueante, só
alinhar ao implementar.

## Status documental corrigido

`docs/redesign-visual/PLANO_REDESIGN_VISUAL.md` linha 4 dizia
`Status geral: PENDING (nenhuma etapa iniciada...)`, desatualizado — a
própria tabela de status (linhas 250-261) e a linha 477
("Roteiro de telas V1-V9 concluído.") já mostravam V0-V9 `DONE`. Corrigido
para `DONE — roteiro V0-V9 concluído em 2026-08-25`.

`docs/plano-evolucao-sme/PROGRESSO.md` verificado — já está consistente
(todas as etapas 00-11 `DONE`, sem `PENDING` no roteiro obrigatório). Nenhuma
correção necessária.

## Testes executados

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Resultado dos testes (baseline)

- `npm test`: **206 testes, 43 suítes, 206 passaram, 0 falharam.**
- `npm run typecheck` (`tsc --noEmit`): sem erros.
- `npm run lint` (`next lint`): sem warnings/erros.
- `npm run build` (`prisma generate && next build`): **sucesso** — 63 rotas
  geradas (estáticas `○` e dinâmicas `ƒ`), compilação e geração de páginas
  estáticas sem erro.
  - Nota: a primeira tentativa de `npm run build` falhou com
    `EPERM: operation not permitted, unlink ...query_engine-windows.dll.node`
    durante `prisma generate`. Isso é um lock de arquivo do Windows (processo
    `node.exe` local segurando a DLL do client já gerado — não uma falha de
    código). Confirmado rodando `npx next build` isoladamente (sem
    regenerar o client Prisma): compilação e geração de todas as 63 rotas
    concluídas sem erro. Nenhuma alteração de código foi feita para
    "corrigir" isso — é ambiente local, não branch.

## Pesquisa 21st.dev

Executada categorias A-E (Central executiva, Panorama por escola, Frequência,
Aprendizagem, Avaliações). Resultado completo e curado em
[`../REFERENCIAS_21ST.md`](../REFERENCIAS_21ST.md). Conclusão: nenhuma
referência exige nova dependência de charting/UI — o projeto já cobre os
padrões vistos com Recharts + tokens `ChartAccent` existentes.

## Fora de escopo desta etapa

- Qualquer alteração de UI, query ou motor de análise.
- Qualquer migração de schema Prisma.
- Implementação do campo `categoria` em `InsightAtencao` (decisão registrada,
  implementação é ETAPA 03).

## Critério de pronto

- [x] Baseline conhecido (testes/typecheck/lint/build).
- [x] Inventário de componentes, queries e motores registrado.
- [x] Referências 21st.dev registradas.
- [x] Status documental desatualizado corrigido.
- [x] Nenhuma feature alterada.

## Próximo passo permitido

ETAPA 01 — Central Executiva, **somente mediante autorização explícita do
usuário**.
