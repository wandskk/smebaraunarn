# ETAPA 03 — Atenção Agora + Panorama

## Status
DONE

## Objetivo

Colocar o motor "Atenção agora" (já existente em `lib/analytics/atencao.ts`
+ `lib/queries/atencao.ts`) no centro da experiência (Bloco C), e construir o
Panorama das escolas (Bloco D) reaproveitando `getComparativosPorEscola` e
`getDesempenhoPorEscola`, sem duplicar cálculo.

## O que foi implementado

**`lib/analytics/atencao.ts`:**
- Novo campo `categoria: CategoriaInsight` (`"frequencia" | "aprendizagem" |
  "trajetoria" | "dados"`) em `InsightAtencao` — decisão já registrada na
  ETAPA 00, implementada agora. Preenchido literalmente pelos 4 geradores
  (`gerarInsightsFrequencia` → `"frequencia"`, `gerarInsightsDesempenho` →
  `"aprendizagem"`, `gerarInsightsDistorcao` → `"trajetoria"`,
  `gerarInsightSincronizacao` → `"dados"`) — aditivo, não muda nenhuma regra
  de classificação existente.
- Novo campo opcional `escolaId?: number` em `InsightAtencao`, preenchido
  pelos 3 geradores por escola (ausente no de sincronização, que é da rede).
- Nova função pura `agruparInsightsPorEscola(insights)` → `Map<escolaId,
  SinaisEscola>` (`SinaisEscola = Partial<Record<categoria, severidade>>`).
  Só reagrupa insights já gerados pelas mesmas 3 regras — nenhum cálculo
  novo, nenhum score somado (cada categoria mantém sua própria severidade).
  5 testes novos.

**`lib/queries/atencao.ts`:**
- Extraído `construirEscolasAtencaoInput(anoLetivo)` — a busca+mapeamento
  que já existia dentro de `getInsightsAtencao`, agora compartilhada.
- `getInsightsAtencao` refatorado para usar o helper (comportamento
  idêntico, mesma saída).
- Nova `getPainelAtencaoEscolas(anoLetivo)` — roda as MESMAS 3 regras por
  escola, mas sem o corte de 5 (`combinarInsightsAtencao`), porque o
  Panorama precisa saber de toda escola com sinal, não só as mais graves da
  rede. Retorna uma linha por escola: todo o `ComparativoEscola` (frequência/
  desempenho/distorção vs. rede, já existente) + `sinais` (via
  `agruparInsightsPorEscola`).

**`components/ui/insight-card.tsx`:** adicionado rótulo de categoria (ex.
"Frequência · Crítico") acima do título, e CTA por categoria ("Investigar
escola", "Ver desempenho", "Ver trajetória", "Ver sincronização" — texto
literal da seção 4 do plano) com seta, no rodapé do card. Mudança visual
aditiva — `/admin` (Painel) já usa `InsightCard` e continua funcionando sem
alteração de código lá.

**`app/admin/indicadores/page.tsx`:**
- Bloco C "Atenção agora": placeholder substituído por
  `getInsightsAtencao(anoLetivo)` (máximo 5), grid de `InsightCard`, com
  `EmptyState` quando não há nenhuma situação (nunca "0" solto).
- Bloco D "Panorama das escolas": tabela com as colunas da seção 5 do
  plano (Escola, Frequência, Tendência, Desempenho, vs. rede, Distorção,
  Sinais, Ações), badges de sinal independentes por categoria (nunca "score
  X"), filtros "Todas / Com sinais / Frequência / Aprendizagem /
  Trajetória" via link + `searchParams.painel` (preserva `ano`), CTA "Ver
  escola" por linha. Ordenação: mais sinais críticos → mais sinais de
  atenção → nome (função pura `ordenarPainel`, só conta por severidade, não
  soma pontuação).

## Regra

Nenhum score agregado — confirmado por `assert.deepEqual` nos testes de
`agruparInsightsPorEscola` (cada categoria mantém sua severidade
independente) e visualmente (badges por categoria, nunca um número único
por escola).

## Testes executados

```bash
npm test        # 214/214 passaram (7 novos: agruparInsightsPorEscola + categoria/escolaId nos 4 geradores)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npx next build     # sucesso, 63 rotas (preview parado antes de rodar)
```

## Verificação visual

Preview reiniciado (nova porta, `preview_stop`/`preview_start` — sessão de
cookies persistiu entre portas), login como Admin, dados reais em
`/admin/indicadores`: 5 insights reais em "Atenção agora" (2 Frequência
crítico, 1 Trajetória crítico, 1 Qualidade dos dados crítico — sincronização
de Estudantes travada em "PROCESSANDO" —, 1 Frequência atenção), Panorama
com 28 escolas, ordenação correta (críticos primeiro, empate resolvido por
nome), filtro `?painel=frequencia` reduzindo corretamente para as 5 escolas
com sinal de frequência. `/admin` (Painel) verificado sem regressão — mesmo
`InsightCard`, agora com rótulo de categoria e CTA. Sem erros de console em
nenhuma das duas telas, desktop e mobile (375px).

## Critério de pronto

- [x] "Atenção agora" e Panorama funcionando com dados reais, sem score,
      com filtros por categoria.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual sem erros de console (desktop + mobile).

## Próximo passo permitido

ETAPA 04 — auto-avanço, conforme instrução do usuário de 2026-08-25.
