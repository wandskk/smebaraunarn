# Referências de UX — MCP 21st.dev

Pesquisa executada na ETAPA 00 via `mcp__21st__search`, conforme seção 16 do
plano. Uso estritamente como **inspiração de composição/hierarquia/espaçamento/
densidade**, nunca como substituição do design system atual (tokens, dark
mode, `MetricCard`/`InsightCard`/`RingProgress`/`DonutChart`/`MiniBarChart`/
`Sparkline`/`EmptyState`/`DataFreshnessBadge`/`ComparisonDelta`/`DataTable`
continuam sendo os componentes reais usados). Nenhum destes componentes será
instalado via `shadcn add` nem sua dependência adicionada ao projeto — são
referência visual, não código a importar.

---

## Pesquisa A — Central executiva

Buscas: `executive analytics dashboard`, `KPI trend dashboard`,
`dashboard attention alerts insight cards`.

| Componente | URL | O que será reaproveitado | O que NÃO será copiado | Tela |
|---|---|---|---|---|
| Advanced Stats (`uilayout.contact`) | https://21st.dev/@uilayout.contact/components/advanced-stats | Composição vertical: área de gráfico de tendência + grade de KPI cards abaixo, no mesmo bloco visual | Animações de "scroll-triggered reveal" (o app não usa esse padrão) e biblioteca de animação externa | Central — Bloco B (Pulso da rede) |
| Progress Metric Card (`makviesainte`) | https://21st.dev/@makviesainte/components/progress-metric-card | Ideia de número grande dominante + gráfico de apoio pequeno ao lado/abaixo, reforçando hierarquia número > gráfico | O componente inteiro (já temos `MetricCard` com `trend`/`Sparkline` equivalente) | Central — KPI 1-4 |
| Alert with Actions in Frame (`cnippet.dev`) | https://21st.dev/@cnippet.dev/components/v-alert-9 | Painel com moldura suave (borda + fundo levemente diferenciado) agrupando ícone + título + descrição + ação inline — referência de como destacar "Atenção agora" sem ser agressivo | Cores/ícones do exemplo (usar tokens de severidade já existentes: crítico/atenção) | Central — Bloco C (Atenção agora) |

## Pesquisa B — Panorama por escola

Buscas: `comparison data table status badges`,
`performance comparison table dashboard`.

| Componente | URL | O que será reaproveitado | O que NÃO será copiado | Tela |
|---|---|---|---|---|
| Card Frame Table (`cnippet.dev`) | https://21st.dev/@cnippet.dev/components/v-table-3 | Tabela dentro de moldura de card, com badges de status por linha — referência de densidade/agrupamento de badges na coluna "Sinais" | Footer de totais (não se aplica ao Panorama) | Central — Bloco D (Panorama das escolas) |
| Comparison Table (`ruixen.ui`) | https://21st.dev/@ruixen.ui/components/comparison-table | Padrão de linha com múltiplos indicadores lado a lado e leitura rápida por coluna | Botões de seleção "Compare/Remove" (não faz parte do escopo do MVP) | Página Comparativos |
| Performance Benchmark Card | https://21st.dev/@kavikatiyar/components/performance-benchmark-card | Ideia visual de "métrica vs. referência" em uma única linha compacta — usar como inspiração para a coluna "vs. rede" | O card isolado (já usamos `ComparisonDelta` para isso) | Panorama das escolas / Comparativos |

## Pesquisa C — Frequência

Buscas: `time series KPI chart trend area chart`,
`attendance analytics risk alert cards`.

| Componente | URL | O que será reaproveitado | O que NÃO será copiado | Tela |
|---|---|---|---|---|
| Area Chart (`reaviz`) | https://21st.dev/@reaviz/components/area-chart-2 | Referência de proporção/altura de um area chart de série temporal com tooltip por ponto — inspiração para o novo `TimeSeriesChart` | Biblioteca `reaviz` (o projeto usa Recharts, já instalado; não adicionar nova dependência de charting) | Central — Bloco E / Frequência — Gráfico 1 |
| Weekly KPI Chart (`isaiahbjork`) | https://21st.dev/@isaiahbjork/components/weekly-kpi-chart | Combinação de resumo textual curto abaixo do gráfico ("a frequência caiu X p.p.") | Estilo de "linhas verticais minimalistas com gradiente animado" | Frequência — resumo textual sob o gráfico |
| Health Stat Card (`ruhith369`) | https://21st.dev/@ruhith369/components/health-stat-card | Ideia de tooltip detalhado por ponto/barra ao hover, reforçando explicabilidade | Efeitos 3D/hover "bubble-style" e Framer Motion (fora do padrão visual atual) | Frequência — bloco "Ausências que exigem investigação" |

## Pesquisa D — Aprendizagem

Buscas: `distribution chart dashboard histogram`,
`horizontal bar analytics assessment dashboard`.

| Componente | URL | O que será reaproveitado | O que NÃO será copiado | Tela |
|---|---|---|---|---|
| Horizontal Bar Medium (`reaviz`) | https://21st.dev/@reaviz/components/horizontal-bar-medium | Proporção e espaçamento de barras horizontais com rótulo à esquerda — inspiração para "Desempenho por escola" e "Itens com menor % de acerto" | Biblioteca `reaviz` — implementar com `MiniBarChart`/Recharts existente | Aprendizagem — Gráfico 2 / Avaliações — Análise |
| Bar Chart (`bklitai`) | https://21st.dev/@bklitai/components/bar-chart | Referência de espaçamento "no-gap" entre barras para histogramas de faixa (0-2, 2-4, ...) | Paleta de cores do exemplo | Aprendizagem — Gráfico 1 (distribuição de notas) |
| Skills Progress Dashboard (`shadcnspace`) | https://21st.dev/@shadcnspace/components/progress-03 | Card compacto com múltiplas barras de progresso coloridas por categoria — inspiração para agrupar estatísticas (mediana/P25/P75) de forma compacta | Efeito de preenchimento animado por entrada | Aprendizagem — bloco de estatísticas |

## Pesquisa E — Avaliações

Buscas: `test results dashboard question analysis bar chart coverage progress`.

| Componente | URL | O que será reaproveitado | O que NÃO será copiado | Tela |
|---|---|---|---|---|
| Advanced Stats (`uilayout.contact`) | https://21st.dev/@uilayout.contact/components/advanced-stats | Mesmo padrão da Pesquisa A: cabeçalho + gráfico + grade de métricas, aplicado ao card de avaliação (nome/tipo/etapa/ano/cobertura/status) | Animações de entrada | Avaliações — cards recentes na Central |
| Bar Chart (`bklitai`) | https://21st.dev/@bklitai/components/bar-chart | Barras horizontais para itens/descritores com menor % de acerto, máximo 10, ordenadas | Paleta de cores | Avaliações — Aba Análise |
| Donut Chart (`ravikatiyar162`) | https://21st.dev/@ravikatiyar162/components/donut-chart | Confirma o padrão já usado pelo `DonutChart` interno para cobertura/status — nenhuma mudança necessária, apenas validação de que a composição atual já segue boas práticas | O componente (já existe `DonutChart` equivalente) | Avaliações — cobertura |

---

## Conclusão da pesquisa

Nenhuma referência exige nova dependência de UI/charting — o projeto já cobre
os padrões vistos (Recharts + tokens `ACCENT_COLOR`/`ChartAccent`). As
referências mais úteis para as próximas etapas são: (1) o padrão "moldura
suave + ícone + ação inline" para cards de alerta (Pesquisa A), (2) a
proporção de area chart com tooltip por ponto para o `TimeSeriesChart` novo
(Pesquisa C), e (3) espaçamento "no-gap" para o histograma de notas
(Pesquisa D).
