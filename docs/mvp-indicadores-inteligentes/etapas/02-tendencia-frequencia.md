# ETAPA 02 — Tendência temporal de frequência

## Status
PENDING

## Objetivo

Adicionar contexto temporal real à frequência da rede: query de série
temporal, `TimeSeriesChart` compartilhado (Recharts, sem nova dependência),
usado na Central (Bloco E) e na página de Frequência (Gráfico 1).

## Escopo (seção 6 do plano)

- `getEvolucaoFrequenciaRede(...)` — nova query (confirmado que não existe,
  ver `../etapas/00-auditoria.md`).
- Testes da transformação temporal (dados → pontos do gráfico).
- `components/ui/charts/time-series-chart.tsx` — só criar por ter os 2 usos
  reais confirmados (Central + Frequência).
- Estado explicativo quando não há histórico suficiente (nunca mock).

## Nota de dados

README/auditoria ETAPA 00 aponta que a sincronização de Frequência é
incremental (janela de ~3 dias), não backfill retroativo — a profundidade
real de histórico disponível pode ser menor que "últimos 30 dias" no início;
tratar isso com o mesmo estado explicativo do plano ("Ainda não há histórico
suficiente...").

## Arquivos prováveis

- `lib/queries/frequencia.ts` (nova função) ou novo arquivo dedicado.
- `components/ui/charts/time-series-chart.tsx`
- `app/admin/indicadores/page.tsx` (Bloco E)
- `app/admin/indicadores/frequencia/page.tsx` (Gráfico 1)

## Critério de pronto

Nenhum sparkline/gráfico usa dado mockado em produção. Sem histórico
suficiente → estado explicativo, nunca gráfico vazio silencioso.

## Próximo passo permitido

ETAPA 03, somente mediante autorização explícita do usuário.
