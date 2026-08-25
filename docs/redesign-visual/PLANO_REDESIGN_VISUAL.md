# Plano de Redesign Visual — Dashboards do SME Baraúna

**Criado em:** 2026-08-25
**Status geral:** PENDING (nenhuma etapa iniciada — aguardando autorização para a ETAPA V0)

Este documento existe para **não precisar repetir a pesquisa de inspiração a
cada tela**. Ele registra: (1) o que já foi pesquisado e onde reaproveitar
cada referência, (2) os princípios visuais combinados, (3) a biblioteca de
componentes reutilizáveis a construir uma única vez, e (4) o roteiro tela a
tela para chegar lá sem retrabalho.

Este plano é **independente** de
[`docs/plano-evolucao-sme/`](../plano-evolucao-sme/README.md) (que trata de
escopo funcional/dados, e está com as 12 etapas concluídas). Aqui o escopo é
puramente visual/UX: nenhuma tela muda de comportamento, dado ou regra de
autorização — só a apresentação.

## Regras de execução (iguais ao plano funcional)

1. **Uma etapa por vez.** Cada etapa da seção "Roteiro por tela" só começa
   depois que a anterior está `DONE` e autorizada pelo usuário. A execução
   para ao final de cada etapa e aguarda sinal verde para a próxima.
2. **Sem mudança de dado, query ou regra de negócio.** Redesign visual não
   adiciona indicador novo nem muda fórmula — só como o dado existente é
   apresentado. Se uma tela "precisar" de um dado que não existe hoje, isso
   vira uma nota de decisão, não uma implementação improvisada.
3. **Reaproveitar sempre os tokens de `app/globals.css` e `tailwind.config.ts`**
   (`primary`, `success`, `warning`, `danger`, `info`, `education`,
   `attendance` + variantes `-subtle`). Já são pastéis e já têm significado
   de domínio fixado (aprendizagem = violeta, frequência = ciano, etc. — ver
   comentário em `components/ui/metric-card.tsx:7-12`). **Não inventar cor
   nova** sem necessidade real.
4. **Estado nunca só por cor.** Regra já estabelecida em
   `components/ui/badge.tsx:23-26` — todo gráfico/indicador novo precisa de
   rótulo textual, não só tom de cor (acessibilidade/daltonismo).
5. **Um componente novo só é criado depois de ter 2 usos reais previstos**
   (mesmo critério já usado nas ETAPAs 02/03 do plano funcional para
   `CapabilityGate`/`AcademicContextBar`). Evita biblioteca inchada com
   componente de uso único.
6. Cada etapa termina com: `npm run typecheck`, `npm run lint`, `npm run
   build` limpos, e checagem visual real no browser (mobile + desktop) antes
   de pedir autorização para a próxima.

## Estado atual (auditoria antes de desenhar)

O projeto **já tem uma base de design consideravelmente madura** — não é um
redesign do zero:

- **Tokens de cor** em `app/globals.css:24-82`: paleta pastel por domínio já
  existe (`--primary-subtle`, `--success-subtle`, `--education-subtle`,
  `--attendance-subtle`, etc.), fruto de uma "Fase 7" anterior pedida pelo
  cliente ("visual mais colorido, cores variadas, tom pastel").
- **Componentes reutilizáveis existentes**: [`MetricCard`](../../components/ui/metric-card.tsx),
  [`InsightCard`](../../components/ui/insight-card.tsx), [`Card`/`SectionCard`](../../components/ui/card.tsx),
  [`Badge`](../../components/ui/badge.tsx), [`ComparisonDelta`](../../components/ui/comparison-delta.tsx),
  [`DataFreshnessBadge`](../../components/ui/data-freshness-badge.tsx),
  [`FaixaBadge`](../../components/admin/faixa-badge.tsx), sidebars com grupos
  coloridos por seção (`components/admin/sidebar.tsx`,
  `components/portal/sidebar.tsx`).
- **Lacunas reais identificadas** (o que este plano resolve):
  - **Nenhum gráfico** no projeto inteiro — todo indicador é número + badge
    de texto, mesmo quando uma distribuição/tendência ajudaria muito
    (ex.: distribuição de notas em `/admin/indicadores/aprendizagem`,
    composição de status em `/admin/sincronizacao`).
  - **Nenhum estado de loading** — não existe um único `loading.tsx` em
    `app/` (confirmado por busca). Toda navegação troca de tela "seca",
    sem esqueleto, mesmo em páginas que fazem várias queries Prisma em
    paralelo.
  - **Nenhuma animação/microinteração** — sem `framer-motion` nem CSS
    keyframe custom no projeto; cards aparecem estáticos.
  - **Nenhum "empty state" ilustrado** — hoje é sempre a mesma caixa
    tracejada com texto cinza (ex.: `app/admin/page.tsx:43-46`,
    `components/portal/school-overview.tsx:49-53`). Funciona, mas é o
    elemento mais repetido e mais "sem graça" do sistema.
  - **Sem indicador circular/anel** para percentuais (frequência, cobertura
    de avaliação, completude de dados) — hoje são só texto (`87.3%`), sem
    peso visual proporcional ao valor.
- **Dependências disponíveis hoje**: `lucide-react` (ícones, já em uso em
  toda parte), `clsx`/`tailwind-merge` (via `cn()` em `lib/utils.ts`),
  Tailwind puro. **Nada de gráfico ou motion está instalado.**

## Decisão: biblioteca de gráfico — `recharts`

**Decidido com o usuário em 2026-08-25: `recharts`**, não SVG artesanal.
Motivo dado: resultado visual mais bonito e variedade de gráficos prontos
(tooltip, legenda, responsividade), o que pesa mais aqui do que o custo de
dependência.

Consequências práticas para a ETAPA V0:

- `recharts` entra como dependência de produção (`npm install recharts`).
- Todo componente em `components/ui/charts/*.tsx` que usar `recharts` é
  `"use client"` (a lib usa hooks/context internamente) — as páginas que os
  chamam continuam Server Components normalmente, só o gráfico em si vira
  ilha client, igual ao `AdminSidebar` já faz hoje.
- `RingProgress` usa `RadialBarChart`; `DonutChart` usa `PieChart` com
  `innerRadius`; `MiniBarChart`/`Sparkline` usa `BarChart`/`LineChart` sem
  eixos (`hide` nos eixos, versão "mini"); tendência maior (ex. frequência
  30 dias com eixo visível) usa `AreaChart`.
- **`AttendanceHeatmap` continua fora do recharts** — a lib não tem tipo de
  gráfico heatmap/calendário; permanece grade CSS/SVG artesanal (única
  exceção, já prevista desde a pesquisa inicial).
- Toda cor de série vem dos tokens HSL existentes (`hsl(var(--education))`,
  `hsl(var(--attendance))`, etc.) via `getComputedStyle`/CSS var direta no
  `stroke`/`fill` do recharts — nunca cor nova hardcoded.
- Legenda/rótulo textual continua obrigatório ao lado de qualquer gráfico
  (regra 4 das regras de execução) — o tooltip do recharts não substitui
  isso, é complemento.

Para animação: **CSS puro** (`@keyframes` em `globals.css` + classes
utilitárias, ex. fade-in/slide-up com stagger via `animation-delay` inline,
respeitando `prefers-reduced-motion`) em vez de `framer-motion` — mesmo
raciocínio de dependência mínima, e a maioria das animações necessárias aqui
é entrada de card/contagem de número, não gestos complexos.

## Inspirações pesquisadas (21st.dev) — por categoria

Cada categoria abaixo já foi pesquisada; **não repetir a busca** — usar como
referência visual ao construir o componente correspondente na ETAPA V0.

### Stat/KPI cards com tendência
- KPI Card (`nayan_radadiya6`) — variante de tendência negativa/positiva.
- Progress Metric Card (`makviesainte`) — número grande + gráfico pequeno
  embutido (curva ou barras), trocável.
- Statistics Card 10/12 (`sean0205`) — variações de layout de card de
  métrica para admin panel.
- **Como aplicar**: evoluir `MetricCard` para aceitar um `trend`/sparkline
  opcional (não obrigatório — só onde há série temporal real, ex.
  frequência dos últimos 30 dias).

### Loading skeletons e spinners
- Stat Cards Skeleton (`felipemenezes098`) — placeholder de grid de KPI com
  label/valor/linha de tendência.
- Animated Loading Skeleton / Skeleton Loader (shimmer) — efeito de brilho
  correndo, leve de replicar só com CSS gradient + `@keyframes`.
- Skeleton Swap (`ddoemonn`) — crossfade do skeleton pro conteúdo real sem
  layout shift (reservar altura antes de saber o conteúdo).
- **Como aplicar**: `components/ui/skeleton.tsx` (bloco base) +
  `loading.tsx` por grupo de rota (`app/admin/loading.tsx`,
  `app/portal/*/loading.tsx`), cada um espelhando o layout real da página
  (mesmas colunas/cards, só em cinza pulsando).

### Gráficos (donut, barra, radar, linha)
- Donut Chart (`ravikatiyar162`) — composição categórica com legenda
  colorida.
- Bar Chart (`LegionWebDev`, `SubframeApp`, `bklitai`) — várias variações de
  peso de barra/espaçamento.
- Weekly KPI Chart (`isaiahbjork`) — linha fina + gradiente para tendência
  diária (bom para frequência/30 dias).
- **Como aplicar**: `DonutChart` (composição — ex. situação de sincronização
  por módulo, distribuição de faixa de frequência), `MiniBarChart`
  (distribuição de notas em `/admin/indicadores/aprendizagem`), `Sparkline`
  (tendência de frequência).

### Progresso circular (ring)
- Circular Progress with Custom Color / Animated Circular Progress Bar /
  Circle Progress — anel com rótulo central, cor customizável.
- **Como aplicar**: `RingProgress` (recharts `RadialBarChart`) — substituir o
  número solto de percentual (frequência, cobertura de avaliação,
  completude de dados) por número + anel proporcional, cor = accent de
  domínio já existente.

### Heatmap de calendário (frequência)
- Monthly/GitHub-style Heatmap Calendar, Streak Calendar — grade de dias
  com intensidade de cor por valor, tooltip por dia.
- **Como aplicar**: `AttendanceHeatmap` — visão mensal de presença/falta por
  estudante ou turma, reaproveitando `frequenciaEstudante` já consultado
  (sem nova query, só nova apresentação do mesmo dado diário que hoje só
  vira um percentual agregado). Maior ganho de "informativo e intuitivo"
  do plano inteiro — mostra padrão (ex. faltas concentradas numa
  segunda-feira) que o percentual único esconde.

### Empty states
- Empty / EmptyState / Interactive Empty State — bloco composto
  ícone+título+descrição+CTA opcional, em vez de caixa tracejada genérica.
- **Como aplicar**: `EmptyState` único em `components/ui/empty-state.tsx`,
  substitui as ~6 ocorrências hoje duplicadas de
  `"rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted"`.

### Sidebar/navegação
- Sidebar Nav Group, Animated Sidebar — grupos colapsáveis, indicador de
  item ativo animado.
- **Como aplicar**: referência só estética (indicador ativo com leve
  transição) — a estrutura de grupos coloridos já existe e funciona bem em
  `components/admin/sidebar.tsx`; não precisa reconstruir, só polir a
  transição do item ativo.

## Biblioteca de componentes a construir — ETAPA V0

Antes de tocar qualquer tela final, uma etapa só de fundação (testável
isoladamente, sem risco de regressão visual em produção):

1. `components/ui/skeleton.tsx` — `Skeleton` (bloco base com shimmer CSS) +
   `MetricCardSkeleton`, `TableSkeleton`, `ChartSkeleton` (formas prontas).
2. `app/*/loading.tsx` (admin, portal/aluno, portal/professor,
   portal/direcao, portal/servidor) usando os skeletons acima, espelhando o
   grid real de cada dashboard.
3. `components/ui/charts/ring-progress.tsx` — `RingProgress` (SVG, aceita
   `accent` igual ao `MetricCardAccent` já existente).
4. `components/ui/charts/donut-chart.tsx` — `DonutChart` (composição, com
   legenda textual obrigatória — regra 4 acima).
5. `components/ui/charts/mini-bar-chart.tsx` — `MiniBarChart`/`Sparkline`.
6. `components/ui/charts/attendance-heatmap.tsx` — `AttendanceHeatmap`.
7. `components/ui/empty-state.tsx` — `EmptyState`.
8. `components/ui/animated-number.tsx` — contagem de 0 até o valor final no
   mount (`prefers-reduced-motion` desativa, mostra valor final direto).
9. `globals.css` — `@keyframes fade-in-up`, `@keyframes shimmer`, classes
   utilitárias `.animate-fade-in-up` (com `animation-delay` via CSS var para
   stagger em grid de cards).
10. `MetricCard` ganha prop opcional `trend?: { data: number[]; }` (sparkline
    embutido) — **aditivo**, não quebra nenhum uso atual (todas as ~15
    chamadas existentes continuam funcionando sem a prop).

Critério de pronto da ETAPA V0: todos os componentes acima existem, têm pelo
menos 1 uso de exemplo real (não uma tela "showcase" à parte — usar direto
numa tela pequena de baixo risco, ex. `/admin/indicadores/qualidade`, como
primeira prova de conceito) e passam `typecheck`/`lint`/`build`.

## Roteiro por tela — ETAPAS V1 a V9

Ordem pensada por valor (telas mais vistas primeiro) e por risco (telas
simples antes das mais complexas), reaproveitando a cada etapa o que já foi
validado na anterior.

| Etapa | Telas | Foco visual principal |
|---|---|---|
| **V1** | `/admin` (dashboard) | Primeira tela "vitrine": `RingProgress` na saúde da base, `AnimatedNumber` nos 4 cards de números da rede, entrada em stagger dos `InsightCard` |
| **V2** | `/admin/indicadores` + 5 subpáginas (frequência, aprendizagem, qualidade, comparativos, fluxo-trajetória) | `DonutChart`/`MiniBarChart` para distribuições hoje só em tabela/número; `AttendanceHeatmap` em frequência |
| **V3** | `/portal/direcao` (home) + `SchoolOverview` | Reaproveita tudo de V1/V2 (mesmo componente compartilhado) — ganho quase "de graça" |
| **V4** | `/portal/professor` (home) + turmas | Foco em `TurmaDetalheView` compartilhado (Admin/Direção/Professor herdam junto) |
| **V5** | `/portal/aluno` (home, frequência, boletim) | `AttendanceHeatmap` pessoal (maior ganho de clareza para o próprio aluno/responsável), `RingProgress` na frequência |
| **V6** | `/portal/servidor` (home) | Menor prioridade (perfil mais simples) — aplica só os componentes já prontos, sem novo componente |
| **V7** | Listagens e fichas (`/admin/escolas*`, `/admin/turmas`, `/admin/estudantes*`, `/admin/servidores*`) | Padronizar `EmptyState`/skeleton em todas; sem gráfico novo (são telas de lista/detalhe, não dashboard) |
| **V8** | Avaliações Municipais (catálogo + abas de `/admin/avaliacoes/[id]`, espelhado em Direção/Professor/Aluno) | `RingProgress` na cobertura, `DonutChart` na distribuição de desempenho, mantendo a Análise por item já existente |
| **V9** | Administração (`/admin/usuarios`, `/admin/sincronizacao`, `/admin/posts`, `/admin/documentos`) | Menor prioridade visual (telas operacionais, não "dashboard") — só `EmptyState`/skeleton, sem gráfico |

Cada etapa V1-V9, ao ser autorizada, segue o mesmo formato de execução do
plano funcional: escopo confirmado → implementação → `typecheck`/`lint`/
`build` limpos → validação visual real no browser (desktop + mobile) →
resumo registrado neste documento → parar para autorização da próxima.

**Fora deste plano por enquanto**: a landing page pública (`app/page.tsx`,
`components/site/*`) usa Tailwind puro (slate) deliberadamente separado do
design system administrativo (ver comentário em `app/globals.css:14-19`) —
não está nas dores descritas pelo usuário (dashboards internos) e entra só
se pedido explicitamente depois.

## Log de progresso

| Etapa | Status | Concluída em |
|---|---|---|
| V0 — Fundação (biblioteca de componentes) | **DONE** | 2026-08-25 |
| V1 — Dashboard Admin | **DONE** | 2026-08-25 |
| V2 — Central de Indicadores | **DONE** | 2026-08-25 |
| V3 — Home Direção | PENDING | — |
| V4 — Home/turmas Professor | PENDING | — |
| V5 — Home/frequência/boletim Aluno | PENDING | — |
| V6 — Home Servidor Geral | PENDING | — |
| V7 — Listagens e fichas | PENDING | — |
| V8 — Avaliações Municipais | PENDING | — |
| V9 — Administração (usuários/sync/CMS) | PENDING | — |

_(Atualizar esta tabela e adicionar um resumo por etapa, no mesmo formato de
`docs/plano-evolucao-sme/PROGRESSO.md`, conforme cada uma for concluída.)_

## Resumo da ETAPA V0

**Decisão confirmada com o usuário**: gráficos com `recharts` (não SVG
artesanal — ver seção de decisão acima), instalado como dependência de
produção.

**Biblioteca criada** (todos `"use client"` só onde o recharts exige;
`AttendanceHeatmap` e `EmptyState` continuam Server Component):

1. `components/ui/charts/accent-colors.ts` — `ChartAccent`/`ACCENT_COLOR`/
   `ACCENT_TRACK_COLOR`, ponte entre os tokens HSL existentes e os
   componentes de gráfico.
2. `components/ui/charts/ring-progress.tsx` — `RingProgress`
   (`RadialBarChart`).
3. `components/ui/charts/donut-chart.tsx` — `DonutChart` (`PieChart` +
   legenda textual obrigatória).
4. `components/ui/charts/mini-bar-chart.tsx` — `MiniBarChart` (`BarChart`
   sem eixo Y).
5. `components/ui/charts/sparkline.tsx` — `Sparkline` (`AreaChart` sem
   eixos, `useId` no gradiente para não colidir quando há mais de um na
   mesma página).
6. `components/ui/charts/attendance-heatmap.tsx` — `AttendanceHeatmap`
   (grade CSS, sem recharts — a lib não tem heatmap de calendário).
7. `components/ui/skeleton.tsx` — `Skeleton`, `MetricCardSkeleton`,
   `TableSkeleton`, `ChartSkeleton`, `DashboardSkeleton` (composto, usado
   pelos 5 `loading.tsx`).
8. `components/ui/empty-state.tsx` — `EmptyState`.
9. `components/ui/animated-number.tsx` — `AnimatedNumber`.
10. `MetricCard` ganhou prop opcional `trend?: number[]` (sparkline
    embutido) — aditivo, todos os ~15 usos existentes continuam
    funcionando sem a prop.
11. `app/globals.css` — `@keyframes shimmer`/`fade-in-up`, classes
    `.skeleton-shimmer`/`.animate-fade-in-up`, ambas desligadas por
    `prefers-reduced-motion`.
12. `app/admin/loading.tsx`, `app/portal/{aluno,professor,direcao,servidor}/loading.tsx`
    — primeiro `loading.tsx` do projeto (não existia nenhum antes).

**Prova de conceito em tela real** (não uma tela "showcase" à parte, por
regra do plano): `/admin/indicadores/qualidade` ganhou `DonutChart`
(situação de sincronização por módulo), `MiniBarChart` (erros por módulo em
7 dias), `RingProgress` (completude por campo, substituindo o percentual
solto), `EmptyState` (colisões de turma zeradas) e `AnimatedNumber` (contagem
de colisões). Validado logado como ADMIN contra a base real — sem erro de
console, cores e legendas corretas.

**Bug real encontrado e corrigido antes de fechar**: `AnimatedNumber`
recebia inicialmente uma prop `format` do tipo função (`format={formatNumber}`)
passada de um Server Component — React/Next.js rejeita função como prop de
Client Component nesse limite ("Functions cannot be passed directly to
Client Components"), quebrando a página inteira em runtime (só aparecia no
console do navegador, não no `typecheck`/`lint`, que não pegam esse tipo de
erro). Corrigido removendo o parâmetro `format` — `AnimatedNumber` formata
pt-BR internamente (`Intl.NumberFormat`) em vez de aceitar uma função de
fora. Vale como lição para as próximas etapas: **nenhum componente client
deste redesign deve aceitar função como prop quando for renderizado a
partir de uma page.tsx (Server Component)** — só primitivos serializáveis
(string, number, boolean, objeto/array simples).

**Correção de escopo durante a etapa**: cheguei a aplicar `EmptyState` +
`AnimatedNumber` + entrada em stagger diretamente em `app/admin/page.tsx`
(dashboard) antes de perceber que isso já é escopo da ETAPA V1, não da V0
— revertido para o estado original antes de fechar. `app/admin/page.tsx`
segue intocado; a ETAPA V1 reaproveita esse mesmo desenho.

**Não verificado nesta etapa**: `npm run build` de produção — havia um
`next dev` já rodando localmente (fora desta sessão) travando o engine do
Prisma (`EPERM` no `.dll.node`, mesmo sintoma já documentado na ETAPA 11 do
plano funcional). `typecheck` e `lint` estão limpos, e a validação visual
foi feita direto no servidor de dev já ativo (logado como ADMIN, sem erro
de console). Build de produção fica pendente — rodar depois que o dev
server for encerrado.

Baseline: `npm run typecheck` limpo, `npm run lint` limpo (0 warnings/erros).

## Resumo da ETAPA V1

Dashboard `/admin` (`app/admin/page.tsx`) reescrito para consumir a
biblioteca da V0, sem tocar em nenhuma query/dado:

- **"Atenção agora"**: caixa tracejada trocada por `EmptyState`; os cards de
  insight (quando existem) entram em `animate-fade-in-up` com stagger de
  60ms entre eles.
- **"Números da rede"**: os 4 `MetricCard` (Publicações, Servidores,
  Estudantes, Avaliações) contam de 0 até o valor real via `AnimatedNumber`
  (formatado em pt-BR), também em stagger. `MetricCardProps.value` mudou de
  `string` para `ReactNode` para aceitar isso — mudança aditiva, nenhum dos
  outros ~15 usos existentes quebra (string continua sendo um `ReactNode`
  válido).
- **"Saúde da base"**: o ícone estático (escudo/alerta) virou `RingProgress`
  mostrando o % de módulos em dia (5/6 = 83,3% na base real) — mesma
  informação que já existia no texto ao lado, agora com peso visual
  proporcional.
- **Sem gráfico novo de série temporal** (`Sparkline`) nesta tela — os 4
  números da rede são contagens simples, sem histórico diário disponível
  sem uma query nova (fora do escopo do redesign, regra 2 do plano).
  `AttendanceHeatmap` também fica para a V2/V5, que são as telas com dado
  diário de frequência.

Validado logado como ADMIN contra a base real: números finais corretos
(1 / 754 / 5.269 / 9), anel em 83,3%, sem erro de console, `npm run build`
limpo (66 rotas, mesma contagem — só mudança de apresentação).

Baseline: `npm run typecheck` limpo, `npm run lint` limpo, `npm run build`
limpo (parei o `next dev` que travava o Prisma, rodei o build, e subi o
dev de novo pela config `dev` de `.claude/launch.json`).

## Resumo da ETAPA V2

As 5 subpáginas da Central de Indicadores (`/admin/indicadores` + 4
drill-downs), sem mudar nenhuma query/dado — só reaproveitando o que cada
página já buscava do banco:

- **`/admin/indicadores` (index)**: só stagger `animate-fade-in-up` nos 7
  `MetricCard` (mesmo tratamento da V1). Decisão deliberada de **não**
  adicionar gráfico novo aqui — são 7 KPIs agregados de rede (um número
  cada), sem lista por escola nesta página para derivar uma distribuição
  real sem query nova (proibido pela regra 2 do plano).
- **`/admin/indicadores/frequencia`**: `DonutChart` novo resumindo escolas
  por faixa (Adequada/Atenção/Crítica — direto de `escola.faixa`, já
  calculado) + `RingProgress` por linha na coluna "Frequência atual",
  colorido pela mesma faixa (reaproveita `FaixaFrequencia`, não inventa
  classificação nova).
- **`/admin/indicadores/aprendizagem`**: `RingProgress` por linha na coluna
  "Abaixo de X" — accent fixo `education` (cor de domínio já estabelecida,
  sem inventar limiar de severidade que não existe no código).
- **`/admin/indicadores/comparativos`**: `RingProgress` nos cards de
  Frequência e Distorção da rede (Desempenho fica só texto — não é
  percentual); `DonutChart` novo "Escolas × rede — frequência" agrupando
  acima/estável/abaixo, reaproveitando literalmente a mesma regra de
  favorabilidade (`Math.abs(diferenca) < 0.05`) já usada em `DiferencaRede`
  nesta mesma página — não uma classificação nova.
- **`/admin/indicadores/fluxo-trajetoria`**: `RingProgress` por linha na
  coluna "% distorção" — accent fixo `warning` (mesma cor que a barra por
  série já usava). A barra horizontal por série existente **não foi
  trocada** por `MiniBarChart` — já cumpria bem o papel e criar uma
  variante horizontal do componente só para esta tela violaria a regra
  "2 usos reais antes de criar componente novo".

**Bug real encontrado e corrigido, fora do escopo original mas achado ao
navegar `/admin/indicadores` durante a etapa**: `PageHeader`
(`components/ui/page-header.tsx`) — o container de ações (`shrink-0`) ao
lado do título/descrição (`min-w-0`, sem `flex-grow`) fazia com que, em
páginas com muitas ações (esta tinha 4: seletor de ano + 3 botões), 100%
do espaço faltante fosse absorvido pelo título/descrição, colapsando o
texto pra uma palavra por linha. Corrigido com `flex-wrap` no container
externo (ações agora quebram para uma segunda linha quando não cabem, em
vez de espremer o texto) + `flex-1` no bloco de título. Afeta **todas** as
páginas que usam `PageHeader` — corrigido uma vez, na origem.

Validado logado como ADMIN nas 5 páginas contra a base real (números e
cores batendo com os dados, incluindo o caso "Estável" com 0 escolas
corretamente omitido do donut de comparativos). `npm run build` limpo (66
rotas, mesma contagem).
