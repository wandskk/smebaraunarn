# ETAPA 03 — Componente de gráfico de evolução histórica

## Status
DONE

## Objetivo

Generalizar o padrão de "evolução entre anos" já provado no painel CAEd
(barras categóricas via `MiniBarChart`, buscando todos os anos disponíveis
de uma métrica) num componente compartilhado, reutilizável pelas próximas
etapas de rollout (frequência, aprendizagem, distorção, avaliações do
município).

## Escopo desta etapa

1. `components/ui/charts/historical-evolution-chart.tsx` (novo).
2. Extensão aditiva em `MiniBarChartProps` (`valueFormatter?`).
3. Migrar `app/admin/avaliacoes/caed/page.tsx` para usar o componente novo no
   lugar do `MiniBarChart` direto, provando que reproduz o resultado atual
   sem regressão.
4. Verificação visual com dado real (logado como ADMIN), não só leitura de
   código — esta etapa introduz um cruzamento Server→Client Component novo
   que só um erro em runtime revela.

## Fora de escopo

- Queries de evolução histórica para frequência/notas/distorção (ETAPA 04).
- Aplicar em qualquer página de indicador nova (ETAPA 05+).

## Decisões técnicas

- **Barras, não linha.** Com tipicamente 2-6 anos (pontos discretos), barras
  categóricas são mais legíveis que uma linha, que sugeriria uma
  continuidade temporal fina que não existe — mesma escolha já validada
  visualmente no painel CAEd. `TimeSeriesChart` continua reservado para
  séries diárias contínuas (frequência dos últimos 30 dias).
- **Regra de exibição**: só renderiza o gráfico com >1 ponto não-nulo;
  com 0-1, mostra `EmptyState` ("Ainda não há anos suficientes para
  comparar") — mesmo padrão já usado em `app/admin/indicadores/page.tsx`
  para `evolucaoFrequenciaRede.length < 2`.
- **Texto de transparência obrigatório**: `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL`
  exportado do componente, mas composto por cada página com seu próprio
  contexto (não injetado automaticamente pelo componente) — mitiga a
  preocupação já registrada em
  `docs/plano-evolucao-sme/etapas/09-avaliacoes-municipais.md` (decisão
  técnica 6) sobre não comparar coortes incompatíveis silenciosamente.
- **`valueFormatter` em `MiniBarChartProps`**: aditivo — formata o valor do
  tooltip (ex.: "34.0%"); quem já usa `MiniBarChart` sem essa prop mantém o
  comportamento atual (tooltip com número cru), sem regressão nos outros
  usos existentes (habilidades do CAEd, histograma de notas, etc.).

## Bug real encontrado e corrigido durante a verificação

`HistoricalEvolutionChart` foi escrito inicialmente sem `"use client"`
(mesmo padrão de `LevelDistributionBar`, presentacional e sem hooks). Mas,
diferente daquele componente, ele **constrói uma função** (`valueFormatter`,
derivada de `unidade`) e a repassa como prop para `MiniBarChart` (Client
Component). Um Server Component não pode passar uma função como prop para
um Client Component — React/Next.js recusa em runtime com "Functions cannot
be passed directly to Client Components", quebrando a página inteira
(erro só aparece ao carregar `/admin/avaliacoes/caed` de verdade, nem
`typecheck` nem `build` pegam isso, porque a função existe e é chamável do
ponto de vista do TypeScript — é uma regra de serialização do React Server
Components, não de tipos). **Corrigido** adicionando `"use client"` ao
componente — agora a função é criada e consumida inteiramente no cliente,
sem cruzar a fronteira Server→Client.

Esse achado confirma por que o critério de pronto desta etapa exige
verificação visual com dado real, não só `typecheck`/`build`: esse tipo de
erro só se manifesta ao renderizar a árvore de componentes de verdade.

## Verificação com dado real (logado como ADMIN)

Com o dev server local e login como ADMIN, testei `/admin/avaliacoes/caed`
com o filtro padrão (1º ano · Língua Portuguesa Leitura, 7 ciclos
importados entre 2024-2026):

- Antes do fix: página quebrava com o erro de serialização acima (`GET
  /admin/avaliacoes/caed` retornava 200, mas a árvore de React falhava em
  runtime — `NotFoundErrorBoundary` capturava o erro, seção "Evolução"
  ficava em branco).
- Depois do fix: 7 barras renderizadas (`Ciclo I 2024` … `Ciclo II 2026`),
  com alturas proporcionais e distintas correspondendo aos `mediaAdequado`
  reais de cada ciclo (confirmado via inspeção do SVG renderizado, não só
  da árvore de acessibilidade) — mesmo resultado visual que o `MiniBarChart`
  direto já produzia antes desta etapa, sem regressão.
- Testei também uma combinação com menos dado (5º ano · Fluência, 2 ciclos)
  para confirmar que o componente continua funcionando com um número
  diferente de pontos (2 barras, ainda acima do limiar de 1 que dispara o
  `EmptyState`) — não encontrei uma combinação real no banco atual com 0-1
  ciclo pra exercitar o `EmptyState` de fato; a lógica (`filter().length <=
  1`) é idêntica à já usada em produção em `app/admin/indicadores/page.tsx`
  para o mesmo tipo de guarda, então não foi tratada como risco.
- Nenhum erro de console novo após o fix (os erros que apareciam no console
  do browser eram do carregamento anterior ao fix, confirmado comparando
  com os logs do servidor, que já não registravam mais o erro).

## Testes executados

```bash
npm test        # 277/277 (sem testes novos — componente presentacional, mesmo critério já usado no projeto para não exigir teste de componente sem lógica de negócio)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 63 rotas
```

## Critério de pronto

- [x] `HistoricalEvolutionChart` criado, reaproveitando `MiniBarChart`.
- [x] `MiniBarChartProps.valueFormatter` aditivo, sem regressão nos usos
      existentes.
- [x] `caed/page.tsx` migrado, reproduzindo o resultado atual sem regressão
      — confirmado com dado real no browser, logado como ADMIN.
- [x] Bug real de fronteira Server/Client encontrado e corrigido antes do
      commit.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.

## Próximo passo permitido

ETAPA 04 — aguardando autorização explícita do usuário.
