# ETAPA 06 — Fluxo e Trajetória + Comparativos

## Status
DONE

## Objetivo

Reformular `/admin/indicadores/fluxo-trajetoria` e consolidar
`/admin/indicadores/comparativos` como drill-down completo.

## O que foi implementado

### Fluxo e Trajetória (`app/admin/indicadores/fluxo-trajetoria/page.tsx`)

- Título "Fluxo e Trajetória — Distorção Idade-Série" → "Fluxo e Trajetória
  Escolar"; descrição reduzida à pergunta executiva da seção 11 do plano
  (o texto longo sobre elegibilidade foi movido, ver abaixo).
- 4 KPIs novos: distorção idade-série da rede (soma bruta
  emDistorcao/elegíveis, não média de percentuais já arredondados),
  estudantes em distorção, defasagem severa (4+ anos), fora do escopo do
  cálculo.
- Bloco `<details>`/`<summary>` "Como este indicador é calculado" — o
  parágrafo longo sobre elegibilidade que antes ocupava o topo da tela
  inteira, agora colapsado e fora do fluxo principal (elemento HTML
  nativo, acessível por teclado, sem nova dependência).
- Gráfico "Por série" evoluído de barras manuais (`<div>` com `width%`)
  para `HorizontalBarChart` (componente compartilhado criado na ETAPA 05)
  — mais consistente e acessível (tooltip, leitura por teclado/leitor de
  tela via SVG semântico do Recharts) que o HTML solto anterior.
- Tabela "Por escola": nova coluna "vs. rede", usando
  `distorcaoDiferencaRede` já calculado por `getComparativosPorEscola`
  (nenhum cálculo novo) — reaproveita `ComparisonDelta`. Ordenação
  inalterada (já era maior % primeiro).
- Link de escola e "Central de Indicadores" agora preservam `?ano=` (mesma
  correção das ETAPAs 04/05).

### Comparativos (`app/admin/indicadores/comparativos/page.tsx`)

- Título "Comparativos — Escola × Rede" → "Comparação entre Escolas e
  Rede"; descrição trocada pelo texto da seção 12 do plano.
- Novo filtro "Todas as escolas" / "Só com sinal de atenção" via
  `searchParams.sinal`, reaproveitando `getPainelAtencaoEscolas` (ETAPA 03)
  — nenhuma regra nova, só filtra a lista já carregada pelas escolas que
  têm qualquer sinal.
- Link de escola e "Central de Indicadores" agora preservam `?ano=`.
- Mantido: 3 cards de referência de rede, donut de frequência × rede,
  tabela completa. **Nada do "Fora do MVP" foi adicionado** (sem scatter
  plot, radar chart, índice composto, ranking geral).

## Testes executados

```bash
npm test        # 219/219 (sem teste novo — composição de UI/reuso de queries existentes)
npm run typecheck  # sem erros
npm run lint       # 1 erro pego e corrigido (aspas retas não escapadas em JSX — react/no-unescaped-entities)
npx next build     # sucesso, 63 rotas (preview parado antes de rodar)
```

## Verificação visual

Dados reais em `/admin/indicadores/fluxo-trajetoria?ano=2026`: 4 KPIs
corretos (6,9% / 160 estudantes / 30 severa / 1.607 fora do escopo),
`<details>` colapsável funcionando, gráfico por série com 9 barras (1º-9º
Ano), tabela com nova coluna "vs. rede" populada. Em
`/admin/indicadores/comparativos?ano=2026`: filtro "Só com sinal de
atenção" testado — reduz corretamente de 28 para 6 escolas (mesmo
conjunto de escolas sinalizadas na ETAPA 03/Panorama da Central: CEJAB,
Sol Nascente, Rui Barbosa, Manoel de Barros, Francisco Silverio, Flor do
Campo). Sem erros de console em nenhuma das duas telas, desktop e mobile
(375px).

## Não implementado (conforme plano — "Fora do MVP")

- Scatter plot frequência × desempenho.
- Radar chart.
- Índice composto.
- Ranking geral.

## Critério de pronto

- [x] KPIs de distorção, visual por série consistente, tabela por escola
      com comparação de rede, copy explicativa enxuta (movida para
      `<details>`).
- [x] Comparativos com filtro por sinal de atenção reaproveitando o mesmo
      motor.
- [x] Nenhum dos itens "fora do MVP" foi adicionado.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual sem erros de console (desktop + mobile).

## Próximo passo permitido

ETAPA 07 — auto-avanço, conforme instrução do usuário de 2026-08-25.
