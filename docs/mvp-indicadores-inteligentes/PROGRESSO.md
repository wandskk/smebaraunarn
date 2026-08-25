# Progresso — MVP de Indicadores Inteligentes

**Última atualização:** 2026-08-25 (ETAPA 05 concluída)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento ou concluída. Ao final de cada etapa, atualizar esta tabela junto
com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Auditoria e baseline | **DONE** | 2026-08-25 |
| 01 | Central Executiva | **DONE** | 2026-08-25 |
| 02 | Tendência temporal de frequência | **DONE** | 2026-08-25 |
| 03 | Atenção Agora + Panorama | **DONE** | 2026-08-25 |
| 04 | Frequência e Permanência | **DONE** | 2026-08-25 |
| 05 | Aprendizagem e Desempenho | **DONE** | 2026-08-25 |
| 06 | Fluxo e Trajetória + Comparativos | PENDING | — |
| 07 | Avaliações Municipais | PENDING | — |
| 08 | Hardening e roteiro de demonstração | PENDING | — |

## Resumo da ETAPA 00

Baseline registrado (206 testes / 43 suítes, todos passando; typecheck e
lint sem erros; build de produção com sucesso — 63 rotas). Inventário
completo de componentes/queries/motores existentes registrado em
[`etapas/00-auditoria.md`](etapas/00-auditoria.md) — nada precisa ser
recriado do zero, exceto o que já era esperado como novo pelo plano
(`getEvolucaoFrequenciaRede`, `TimeSeriesChart`, campo `categoria` em
`InsightAtencao`, `ExecutiveSummary`). Status desatualizado corrigido em
`docs/redesign-visual/PLANO_REDESIGN_VISUAL.md` (linha 4, dizia `PENDING`
quando V0-V9 já estavam `DONE`). Pesquisa de UX no MCP 21st.dev concluída e
registrada em [`REFERENCIAS_21ST.md`](REFERENCIAS_21ST.md). Nenhuma feature
ou schema foi alterado nesta etapa.

## Resumo da ETAPA 01

`/admin/indicadores` virou o "Centro de Inteligência Educacional":
cabeçalho renomeado, linha discreta de contexto (Bloco A), 4 KPIs do
"Pulso da rede" (frequência com janela de 30 dias + delta, desempenho + %
abaixo do parâmetro, distorção em percentual + contagem, faltas
consecutivas agora), seção compacta de avaliações municipais recentes
(Bloco F) e confiabilidade dos dados (Bloco G). Nenhum componente novo
criado — só `helpText` do `MetricCard` ampliado para `ReactNode` (aditivo)
e um campo novo em `getIndicadoresGeraisRede`. "Números da página inicial"
movido para a sidebar (grupo Administração). Verificado com dados reais no
browser (desktop + mobile, sem erros de console). Detalhe completo em
[`etapas/01-central-executiva.md`](etapas/01-central-executiva.md).

## Resumo da ETAPA 02

Nova query `getEvolucaoFrequenciaRede` (série diária de frequência da rede,
`lib/queries/frequencia.ts`) + transformação pura testada
`calcularEvolucaoFrequencia` (`lib/analytics/frequencia.ts`, 4 testes
novos) + novo componente `TimeSeriesChart`
(`components/ui/charts/time-series-chart.tsx`, Recharts, mesma convenção
visual dos gráficos existentes). Usado no Bloco E da Central e no Gráfico 1
de `/admin/indicadores/frequencia`, com `EmptyState` quando não há
histórico suficiente. Um bug real foi pego na verificação visual (função
como prop de Server → Client Component) e corrigido antes do commit — ver
detalhe em [`etapas/02-tendencia-frequencia.md`](etapas/02-tendencia-frequencia.md),
que também registra um incidente de ambiente (`next build` concorrente com
`next dev` corrompeu `.next`) e o aprendizado guardado em memória para não
repetir.

## Resumo da ETAPA 03

Campo `categoria` adicionado a `InsightAtencao` (decisão da ETAPA 00,
implementada agora — aditivo, preenchido pelos 4 geradores já existentes).
Nova função pura `agruparInsightsPorEscola` + nova query
`getPainelAtencaoEscolas` (mesmas 3 regras por escola, sem corte de 5)
alimentam o Bloco C "Atenção agora" (5 insights reais, com rótulo de
categoria e CTA no `InsightCard`) e o Bloco D "Panorama das escolas"
(tabela com badges de sinal por categoria, filtros por categoria via
`searchParams`, ordenação por contagem de sinais — nunca score somado).
Verificado com dados reais: 5 insights (2 frequência crítico, 1 trajetória
crítico, 1 qualidade de dados crítico, 1 frequência atenção), Panorama com
28 escolas ordenadas corretamente, filtro por categoria funcionando. Sem
regressão em `/admin` (Painel), que já usava `InsightCard`. Detalhe
completo em [`etapas/03-atencao-panorama.md`](etapas/03-atencao-panorama.md).

## Resumo da ETAPA 04

`/admin/indicadores/frequencia` renomeada para "Frequência e Permanência",
com 4 KPIs novos no topo (frequência média + delta, escolas em atenção/
crítica, escolas em queda, faltas consecutivas agora) e um novo bloco
"Ausências que exigem investigação" (top 5 escolas por contagem de faltas
consecutivas, sem ranking/score). De quebra, corrigidos 2 links que não
preservavam `?ano=` nos drill-downs (achado durante a etapa, regra 11 do
master prompt). Verificado com dados reais em 2026 (ano corrente) e 2025
(ano sem histórico de 30 dias, exercitando os estados vazios). Detalhe
completo em [`etapas/04-frequencia.md`](etapas/04-frequencia.md).

## Resumo da ETAPA 05

`/admin/indicadores/aprendizagem` renomeada para "Aprendizagem e
Desempenho", com 4 KPIs (desempenho médio, notas lançadas, % abaixo do
parâmetro, escolas com sinal de atenção — reaproveitando
`getPainelAtencaoEscolas` da ETAPA 03), histograma de distribuição de
notas (nova `getDistribuicaoNotasRede` + `calcularHistograma` pura) e
gráfico de barras horizontais por escola com referência de rede (novo
componente `HorizontalBarChart`, já pensado para reuso na ETAPA 07). Rede
com 18-28 escolas conforme filtro → mostra as 10 menores médias + tabela
completa abaixo, nunca "piores escolas". Detalhe completo em
[`etapas/05-aprendizagem.md`](etapas/05-aprendizagem.md).

## Regra de avanço

Nunca pular etapa. Cada etapa termina atualizando seu próprio
`etapas/NN-*.md` (status, alterações, testes, decisões) e esta tabela, então
`git commit` + `git push origin main`, seguindo **automaticamente** para a
próxima etapa sem parar para autorização — instrução do usuário em
2026-08-25 ("sempre que concluir uma etapa, pode subir, e continuar").
