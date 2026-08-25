# ETAPA 05 — Aprendizagem e Desempenho

## Status
PENDING

## Objetivo

Reformular `/admin/indicadores/aprendizagem` ("Aprendizagem e Desempenho"):
KPIs, histograma de distribuição de notas, barra por escola, tabela
estatística mantida (mediana/P25/P75 nunca removidos em favor só da média),
resumo determinístico, filtros existentes preservados (ano/disciplina/
unidade).

## Escopo (seção 10 do plano)

- KPIs: desempenho médio da rede; total de notas (ou mediana, se barata);
  % de notas abaixo do parâmetro; escolas com sinal de atenção em
  aprendizagem.
- Gráfico 1: histograma simples, faixas 0-2/2-4/4-6/6-8/8-10 como
  agrupamento visual (não regra pedagógica).
- Gráfico 2: barra horizontal por escola vs. referência da rede; se 28
  escolas pesarem a visualização, mostrar 10 com menor média + texto
  "Menores médias no recorte" (nunca "Piores escolas") + tabela completa
  abaixo.
- Tabela: manter média, mediana, P25/P75, amplitude, % abaixo do parâmetro.

## Regra

Média nunca é a única leitura.

## Arquivos prováveis

- `app/admin/indicadores/aprendizagem/page.tsx`
- `lib/queries/desempenho.ts`

## Próximo passo permitido

ETAPA 06, somente mediante autorização explícita do usuário.
