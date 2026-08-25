# MVP de Indicadores Inteligentes — Centro de Inteligência Educacional

**Fonte do plano:** [`PLANO_MVP_INDICADORES_INTELIGENTES.md`](../../PLANO_MVP_INDICADORES_INTELIGENTES.md) (raiz do repositório).

## Objetivo

Transformar a Central de Indicadores (`/admin/indicadores`) em uma experiência
executiva que responda, em menos de 60 segundos, quatro perguntas:

1. Como está a rede municipal agora?
2. O que mudou recentemente?
3. Onde a gestão deve investigar primeiro?
4. Posso confiar nos dados exibidos?

Não é um redesign visual geral (isso já foi feito em
[`docs/redesign-visual/`](../redesign-visual/PLANO_REDESIGN_VISUAL.md), V0-V9
DONE) nem um chatbot/IA generativa. É hierarquia de informação, contexto,
tendência temporal, priorização explicável (regras determinísticas) e
drill-down, reaproveitando o motor "Atenção agora" e as queries/componentes
que já existem.

## Regra de execução

Execução **uma ETAPA por vez**, com **auto-avanço**: ao final de cada etapa,
atualizar o Markdown da etapa + este índice (`PROGRESSO.md`), rodar
`npm test && npm run typecheck && npm run lint && npm run build`, verificar
visualmente (mobile/desktop), `git commit` + `git push origin main`, e
seguir direto para a próxima etapa **sem parar para autorização** — mesmo
padrão de `docs/redesign-visual/`. Só parar se surgir uma decisão de
produto/design que exija o usuário.

## O que já existe e NÃO deve ser reconstruído

Confirmado por auditoria de código na ETAPA 00 (ver
[`etapas/00-auditoria.md`](etapas/00-auditoria.md)):

- **Componentes:** `MetricCard` (`components/ui/metric-card.tsx`), `InsightCard`
  (`components/ui/insight-card.tsx`), `RingProgress`, `DonutChart`,
  `MiniBarChart`, `Sparkline`, `AttendanceHeatmap` (todos em
  `components/ui/charts/`), `EmptyState`, `DataFreshnessBadge`,
  `ComparisonDelta`, `DataTable` (`components/ui/table.tsx`). Recharts já
  instalado (`^3.10.1`).
- **Motores de análise:** `lib/analytics/atencao.ts` (Atenção agora),
  `lib/analytics/frequencia.ts`, `lib/analytics/distorcao.ts`,
  `lib/analytics/explicabilidade.ts`, `lib/analytics/comparativos.ts`,
  `lib/analytics/qualidade-dados.ts`, `lib/analytics/avaliacoes.ts`,
  `lib/analytics/estatistica.ts`.
- **Queries:** `getInsightsAtencao`/`getInsightsAtencaoEscola`
  (`lib/queries/atencao.ts`), `getFrequenciaPorEscola`,
  `getEstudantesEmSequenciaDeFaltas`,
  `getContagemFaltasConsecutivasPorEscola` (`lib/queries/frequencia.ts`),
  `getDesempenhoPorEscola` (`lib/queries/desempenho.ts`),
  `getComparativosPorEscola` (`lib/queries/comparativos.ts`),
  `getAvaliacoesResumo`, `getAnaliseItensAvaliacao`, `getAvaliacaoDetalhe`
  (`lib/queries/avaliacoes.ts`), `getStatusSincronizacao`,
  `getCompletudeDados`, `getColisoesCodigoTurma`
  (`lib/queries/qualidade-dados.ts`), `getDistorcaoPorEscolaESerie`
  (`lib/queries/distorcao.ts`).

**Regra:** nenhuma etapa pode criar uma segunda versão de componente ou
cálculo que já exista. Ver detalhamento completo (assinaturas, parâmetros,
onde cada um é usado hoje) em
[`etapas/00-auditoria.md`](etapas/00-auditoria.md).

## O que genuinamente falta (confirmado, não é duplicação)

- `getEvolucaoFrequenciaRede(...)` — série temporal de frequência da rede
  (ETAPA 02).
- `TimeSeriesChart` (`components/ui/charts/time-series-chart.tsx`) — só criar
  com 2 usos reais confirmados (Central + página de Frequência).
- Campo `categoria` explícito em `InsightAtencao`
  (`"frequencia" | "aprendizagem" | "trajetoria" | "dados"`) — hoje a
  categoria só existe implicitamente no prefixo do `id` de cada insight.
- `ExecutiveSummary` — resumo textual determinístico, só criar com 2 usos
  reais confirmados.

## Estrutura da documentação

- [`PROGRESSO.md`](PROGRESSO.md) — estado de cada etapa.
- [`REFERENCIAS_21ST.md`](REFERENCIAS_21ST.md) — pesquisa de inspiração UX via
  MCP 21st.dev.
- `etapas/00-auditoria.md` até `etapas/08-hardening-demo.md` — um arquivo por
  etapa, com escopo, checklist, testes executados e critérios de aceite.

## Princípios de produto (resumo — ver plano completo para detalhe)

1. A tela começa pela decisão (frequência, aprendizagem, fluxo, faltas
   consecutivas, atenção, avaliações, confiabilidade), não pelo cadastro
   (totais de turma/escola/servidor viram contexto secundário).
2. Inteligência explicável: todo insight expõe fato, valor, referência,
   período, motivo e deep-link — nunca só "Escola em risco".
3. Sem ranking de "melhor/pior escola" e sem score opaco.
4. Sem inventar regra pedagógica oficial — usar as faixas já documentadas no
   código ou rotular como "parâmetro de trabalho atual".
5. Sem IA generativa (chatbot, previsão por LLM, texto gerado por API
   externa) — tudo determinístico e auditável.
