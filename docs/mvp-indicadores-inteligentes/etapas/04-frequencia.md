# ETAPA 04 — Frequência e Permanência

## Status
PENDING

## Objetivo

Reformular `/admin/indicadores/frequencia` ("Frequência e Permanência"): 4
KPIs, tendência temporal (reaproveitando `TimeSeriesChart` da ETAPA 02),
donut atual mantido, bloco de faltas consecutivas, tabela existente com
hierarquia melhorada.

## Escopo (seção 9 do plano)

- KPIs: frequência média da rede; escolas em atenção/crítica; escolas em
  queda no período; estudantes com sequência de 3+ faltas.
- Gráfico 1: `TimeSeriesChart` compartilhado.
- Gráfico 2: manter donut atual.
- Bloco "Ausências que exigem investigação": top escolas por quantidade
  atual de estudantes em sequência de faltas, sem score.
- Tabela: Escola / Estudantes / Frequência atual / Variação / Faixa / Faltas
  consecutivas, ordenada por frequência mais baixa primeiro.
- `AttendanceHeatmap`: **não** usar agregado de rede nesta etapa — só faz
  sentido em drill-down (estudante/turma/escola), que já é onde está hoje.

## Não implementar

- Predição de abandono.
- Intervenção automática.
- Heatmap da rede sem pergunta clara.

## Arquivos prováveis

- `app/admin/indicadores/frequencia/page.tsx`
- `lib/queries/frequencia.ts`

## Próximo passo permitido

ETAPA 05, somente mediante autorização explícita do usuário.
