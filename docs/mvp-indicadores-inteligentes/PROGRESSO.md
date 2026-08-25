# Progresso — MVP de Indicadores Inteligentes

**Última atualização:** 2026-08-25 (ETAPA 00 concluída)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento ou concluída. Ao final de cada etapa, atualizar esta tabela junto
com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Auditoria e baseline | **DONE** | 2026-08-25 |
| 01 | Central Executiva | PENDING | — |
| 02 | Tendência temporal de frequência | PENDING | — |
| 03 | Atenção Agora + Panorama | PENDING | — |
| 04 | Frequência e Permanência | PENDING | — |
| 05 | Aprendizagem e Desempenho | PENDING | — |
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

## Regra de avanço

Nunca pular etapa. Cada etapa termina atualizando seu próprio
`etapas/NN-*.md` (status, alterações, testes, decisões) e esta tabela, então
`git commit` + `git push origin main`, seguindo **automaticamente** para a
próxima etapa sem parar para autorização — instrução do usuário em
2026-08-25 ("sempre que concluir uma etapa, pode subir, e continuar").
