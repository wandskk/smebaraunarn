# ETAPA 05 — Aprendizagem e Desempenho

## Status
DONE

## Objetivo

Reformular `/admin/indicadores/aprendizagem`: KPIs, histograma de
distribuição de notas, barra por escola vs. referência de rede, tabela
estatística mantida, filtros existentes preservados.

## O que foi implementado

**`lib/analytics/estatistica.ts`:** nova função pura genérica
`calcularHistograma(valores, faixas)` — agrupa valores em faixas `[min,
max)`, última faixa inclui o `max`. 5 testes novos.

**`lib/queries/desempenho.ts`:** `FAIXAS_HISTOGRAMA_NOTAS_PADRAO` (0-2,
2-4, 4-6, 6-8, 8-10 — agrupamento visual, não regra pedagógica) + nova
`getDistribuicaoNotasRede(filtro)`, mesmo filtro (ano/disciplina/unidade)
de `getDesempenhoPorEscola`, busca os valores brutos (não expostos pela
query por escola) e delega a contagem ao `calcularHistograma`.

**`components/ui/charts/horizontal-bar-chart.tsx` (novo componente):**
`HorizontalBarChart` — Recharts `BarChart layout="vertical"`, com linha de
referência opcional (`referencia`, tracejada). Segue a mesma restrição já
aprendida na ETAPA 02 (nada de função como prop — `valueLabel` é string
pré-formatada no server). Criado agora por já ter 2 usos reais previstos:
esta etapa (desempenho por escola) e a ETAPA 07 (itens/descritores de
avaliação com menor % de acerto).

**`app/admin/indicadores/aprendizagem/page.tsx`:**
- Título "Aprendizagem por Escola" → "Aprendizagem e Desempenho";
  descrição trocada pelo texto da seção 10 do plano.
- 4 KPIs novos: desempenho médio da rede (`calcularMediaPonderada`, mesmo
  padrão de `lib/queries/comparativos.ts`), notas lançadas no recorte
  (soma simples — decisão abaixo), % abaixo do parâmetro (mesma
  `calcularMediaPonderada`, mesmo padrão da ETAPA 01), escolas com sinal
  de atenção em aprendizagem (`getPainelAtencaoEscolas`, já existente da
  ETAPA 03 — mesmo motor, sem duplicar regra).
- Gráfico 1 "Distribuição de notas": `MiniBarChart` (já existente,
  reaproveitado) com as 5 faixas.
- Gráfico 2 "Desempenho por escola" / "Menores médias no recorte":
  `HorizontalBarChart` com linha de referência na média da rede. Rede tem
  18-28 escolas com nota conforme o filtro — acima do limite de 10
  (seção 10 do plano), então mostra as 10 menores médias + texto explícito
  "Menores médias no recorte" (nunca "Piores escolas") + nota "a tabela
  completa está abaixo". Sem o filtro ativo, todas cabem, mostra todas.
- Tabela existente mantida sem alteração de colunas (média, mediana,
  P25/P75, amplitude, % abaixo do esperado).
- Links de escola e "Central de Indicadores" agora preservam `?ano=`
  (mesmo padrão da ETAPA 04).

## Decisão técnica — "notas lançadas" em vez de mediana da rede

O plano permite substituir "total de notas no recorte" por "mediana da
rede" **se puder ser calculada sem query excessivamente cara**. A mediana
por escola já existe (`getDesempenhoPorEscola`), mas ela é calculada a
partir do array de notas *daquela escola apenas*, descartado depois — não
dá para combinar medianas de escolas diferentes numa mediana de rede
correta sem os valores brutos de todas juntas. Como `getDistribuicaoNotasRede`
já busca esses valores brutos para o histograma, dava para reaproveitá-los
aqui — decisão foi manter "notas lançadas no recorte" mesmo assim, porque é
a leitura mais direta de "quão grande é a amostra por trás dos outros 3
KPIs" (contexto sobre confiabilidade dos outros números), enquanto uma
mediana de rede duplicaria parcialmente a leitura já coberta por "Abaixo do
parâmetro". Documentado aqui para não reabrir a decisão sem necessidade.

## Regra

Média nunca é a única leitura — mediana, P25/P75 e amplitude continuam
todos na tabela, e o histograma mostra a forma da distribuição, não só o
KPI de média.

## Testes executados

```bash
npm test        # 219/219 (5 novos: calcularHistograma)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npx next build     # sucesso, 63 rotas (preview parado antes de rodar)
```

## Verificação visual

Dados reais em `/admin/indicadores/aprendizagem?ano=2026`: 4 KPIs corretos
(7,0 desempenho médio; 30.051 notas; 17% abaixo do parâmetro; 0 escolas com
sinal — plausível, nenhuma cruza os 2 limiares da regra de "Atenção agora"
neste recorte), histograma com as 5 faixas, gráfico de barras mostrando "10
menores médias de 18 escolas" com nota explicativa. Testado também com
filtro `?disciplina=Matemática` (valores mudam corretamente: 6,6 médio,
3.449 notas, 25% abaixo). Sem erros de console em nenhum caso, desktop e
mobile (375px).

## Critério de pronto

- [x] KPIs, distribuição/histograma, barra por escola, tabela estatística
      mantida, resumo determinístico, filtros existentes.
- [x] Média nunca é a única leitura (mediana/P25/P75 preservados).
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual sem erros de console (com e sem filtro, desktop +
      mobile).

## Próximo passo permitido

ETAPA 06 — auto-avanço, conforme instrução do usuário de 2026-08-25.
