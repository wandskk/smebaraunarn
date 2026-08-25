# ETAPA 02 — Tendência temporal de frequência

## Status
DONE

## Objetivo

Adicionar contexto temporal real à frequência da rede: query de série
temporal, `TimeSeriesChart` compartilhado (Recharts, sem nova dependência),
usado na Central (Bloco E) e na página de Frequência (Gráfico 1).

## O que foi implementado

**`lib/analytics/frequencia.ts`:** nova função pura
`calcularEvolucaoFrequencia(registrosDiarios)` — recebe
`{data, aulas, faltas}[]` já agregados por dia (groupBy), devolve
`PontoEvolucaoFrequencia[]` (`{data, percentual}`) ordenado por data
ascendente, reaproveitando `calcularPercentualFrequencia` (já existente,
já testado) para cada dia. 4 testes novos em `frequencia.test.ts`.

**`lib/queries/frequencia.ts`:** nova query
`getEvolucaoFrequenciaRede({inicio, fim})` — uma única
`prisma.frequenciaEstudante.groupBy({by: ["data"], ...})` agregando
aulas/faltas de toda a rede por dia, delegando a transformação para
`calcularEvolucaoFrequencia`. Só retorna dias com ao menos uma aula
registrada (sem preencher fins de semana/recesso com pontos vazios).

**`components/ui/charts/time-series-chart.tsx` (novo componente):**
`TimeSeriesChart` — Recharts `AreaChart` com eixos (X = data, Y = valor),
gradiente e tooltip por ponto, seguindo a mesma convenção visual de
`Sparkline`/`MiniBarChart` já existentes (tokens `ChartAccent`, sem nova
biblioteca). Criado só agora por ter os 2 usos reais exigidos pelo plano
(Central + Frequência).

**Usado em:**
- `app/admin/indicadores/page.tsx` — novo Bloco E "Evolução da frequência",
  posicionado entre o placeholder de "Atenção agora" (Bloco C) e
  "Avaliações municipais" (Bloco F), respeitando a ordem obrigatória da
  seção 3 do plano. Resumo textual abaixo do gráfico reaproveita a mesma
  `variacaoFrequenciaRede` já calculada na ETAPA 01 para o KPI 1 (mesmo
  número em dois lugares da mesma tela, não uma segunda conta).
- `app/admin/indicadores/frequencia/page.tsx` — novo "Gráfico 1 — Evolução
  da rede", acima do donut "Escolas por faixa" já existente (Gráfico 2).

Estado sem histórico suficiente (`< 2` pontos) em ambas as telas usa
`EmptyState` (não texto solto) com o texto literal do plano: "Ainda não há
histórico suficiente para calcular tendência. O gráfico aparecerá
automaticamente quando houver dados comparáveis."

## Decisão técnica — `unidade` em vez de `valueFormatter`

Primeira versão do `TimeSeriesChart` aceitava um prop `valueFormatter:
(v: number) => string`. Isso quebrou em runtime: `TimeSeriesChart` é
`"use client"`, e Next.js não permite passar uma função como prop de um
Server Component (a página) para um Client Component — erro "Functions
cannot be passed directly to Client Components". Corrigido trocando por um
prop serializável `unidade?: "percentual" | "numero"`, com a formatação
resolvida dentro do próprio componente cliente. Bug pego na verificação
visual (server error 500 ao abrir `/admin/indicadores`), não no
typecheck/lint/build (esses não capturam essa classe de erro de
server/client boundary).

## Incidente de ambiente durante a verificação

Ao rodar `npx next build` com o servidor de preview desta sessão (`next
dev`) ainda ativo, o `.next` compartilhado corrompeu (`Cannot find module
'./8948.js'`), derrubando o dev server com erro 500. Corrigido parando o
preview, apagando `.next` e reiniciando o dev server do zero. Registrado
como aprendizado operacional (memória `feedback-next-build-dev-server-
conflict`): daqui em diante, `next build` só roda com o preview desta
sessão parado.

## Testes executados

```bash
npm test        # 210/210 passaram (4 novos: calcularEvolucaoFrequencia)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npx next build     # sucesso, 63 rotas (preview parado antes de rodar)
```

## Verificação visual

Preview reiniciado, login como Admin, verificado em aba nova (console
limpo, sem erros) em `/admin/indicadores` (Bloco E renderiza 12 pontos, dias
28/07-24/08, eixo Y fixo 0-100%, resumo "A frequência média caiu 1,1 p.p.
em relação aos 30 dias anteriores.") e em
`/admin/indicadores/frequencia?ano=2026` (mesmo gráfico acima do donut
"Escolas por faixa", dados reais, sem erros de rede/console).

## Critério de pronto

- [x] Nenhum sparkline/gráfico usa dado mockado em produção (série vem de
      `getEvolucaoFrequenciaRede`, dados reais).
- [x] Sem histórico suficiente → `EmptyState` explicativo (testado
      logicamente: `< 2` pontos; não exercitado com dado real porque a
      rede já tem histórico suficiente no ambiente atual).
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual sem erros de console em aba nova.

## Próximo passo permitido

ETAPA 03 — auto-avanço, conforme instrução do usuário de 2026-08-25.
