# ETAPA 06 — Fluxo e Trajetória + Comparativos

## Status
PENDING

## Objetivo

Reformular `/admin/indicadores/fluxo-trajetoria` ("Fluxo e Trajetória
Escolar") e consolidar `/admin/indicadores/comparativos` ("Comparação entre
Escolas e Rede") como drill-down completo.

## Escopo (seções 11 e 12 do plano)

**Fluxo e Trajetória:**
- KPIs: percentual da rede; estudantes em distorção; defasagem severa 4+
  anos; estudantes fora do escopo do cálculo.
- Gráfico por série (evoluir para componente consistente se melhorar
  responsividade/acessibilidade).
- Tabela por escola: Escola / Elegíveis / Em distorção / % / severa 4+ /
  fora do escopo, ordenada por maior % primeiro; adicionar comparação com a
  rede via `getComparativosPorEscola` quando disponível.
- Texto de explicabilidade (elegibilidade) em tooltip/bloco "Como este
  indicador é calculado", não no topo da tela.

**Comparativos:**
- Manter frequência/desempenho/distorção da rede + tabela completa.
- Filtro por "sinal de atenção" só se reaproveitar o mesmo motor de
  `lib/analytics/atencao.ts`.

## Fora do MVP (explícito no plano)

Scatter plot frequência × desempenho, radar chart, índice composto, ranking
geral — não implementar.

## Arquivos prováveis

- `app/admin/indicadores/fluxo-trajetoria/page.tsx`
- `app/admin/indicadores/comparativos/page.tsx`
- `lib/queries/distorcao.ts`, `lib/queries/comparativos.ts`

## Próximo passo permitido

ETAPA 07, somente mediante autorização explícita do usuário.
