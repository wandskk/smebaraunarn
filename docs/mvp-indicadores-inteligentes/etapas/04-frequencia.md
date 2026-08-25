# ETAPA 04 — Frequência e Permanência

## Status
DONE

## Objetivo

Reformular `/admin/indicadores/frequencia`: novo título/descrição, 4 KPIs,
tendência temporal (já entregue na ETAPA 02), donut mantido, novo bloco de
faltas consecutivas, tabela existente preservada com hierarquia, `ano`
preservado em todos os drill-downs.

## O que foi implementado

**`app/admin/indicadores/frequencia/page.tsx`:**
- Título "Frequência por Escola" → "Frequência e Permanência"; descrição
  trocada pelo texto executivo da seção 9 do plano.
- 4 KPIs novos (topo da página, `MetricCard`, nenhum componente novo):
  1. Frequência média da rede — mesma agregação de 30 dias já usada no
     Bloco B da Central (ETAPA 01), com `ComparisonDelta`.
  2. Escolas em atenção/crítica — contagem sobre `escolas` já carregado
     (`e.faixa === "atencao" || "critica"`).
  3. Escolas em queda no período — contagem sobre `e.variacao?.tendencia
     === "queda"`.
  4. Faltas consecutivas agora — soma de `.total` de
     `getContagemFaltasConsecutivasPorEscola` (já existente), só para o
     ano corrente (mesma regra já usada na tabela).
- Novo bloco "Ausências que exigem investigação": top 5 escolas por
  `contagem.total`, card com "N estudante(s) com sequência recente de
  faltas" + "M deles na faixa mais grave definida pelo motor atual" quando
  `contagem.critico > 0` — texto quase literal do exemplo da seção 9 do
  plano. Sem ranking/score: só ordena pela contagem bruta já existente,
  mesmo dado da coluna "Faltas consecutivas agora" da tabela. Só aparece no
  ano corrente (mesma condição do resto do sinal "agora").
- Gráfico 1 (evolução) e Gráfico 2 (donut "Escolas por faixa") mantidos
  como já estavam desde a ETAPA 02/antes.
- Tabela existente mantida (Escola/Estudantes/Frequência atual/Tendência/
  Faixa/Faltas consecutivas), ordenação inalterada (já era "pior primeiro").
- Heatmap de rede: **não adicionado**, conforme regra explícita do plano —
  `AttendanceHeatmap` continua só em estudante/turma (drill-down existente).

## Correção — `ano` não preservado em 2 links (achado durante esta etapa)

Os links da coluna "Escola" e da coluna "Faltas consecutivas agora" da
tabela, e o link "Central de Indicadores" no topo da página, apontavam para
`/admin/escolas/${id}` e `/admin/indicadores` **sem** `?ano=`, violando a
regra 11 do master prompt ("Preservar `ano`/contexto temporal nos
drill-downs"). Não era escopo desta etapa, mas foi corrigido aqui por estar
no mesmo arquivo e ser trivial (usar o `comAno()` helper já usado em outras
páginas). Verificado no browser com `?ano=2025`: o link de volta para a
Central e os 28 links de escola na tabela levam `?ano=2025` (confirmado via
`document.querySelectorAll` — o `read_page` do browser tool não estava
listando as linhas da tabela, mas o DOM real confirma os `href`s corretos).

## Testes executados

```bash
npm test        # 214/214 (sem teste novo — mudança é composição de UI, não regra pura nova)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npx next build     # sucesso, 63 rotas (preview parado antes de rodar)
```

## Verificação visual

Preview reiniciado, dados reais em `/admin/indicadores/frequencia?ano=2026`:
4 KPIs corretos (86,0% / -1,1 p.p.; 10 escolas atenção/crítica de 28; 13 em
queda; 212 faltas consecutivas), bloco de investigação com 5 escolas reais
(Manoel de Barros no topo — 66 estudantes, 26 críticos), tabela e gráficos
sem regressão. Testado também com `?ano=2025` (ano sem histórico de janela
de 30 dias, dado real do ambiente): KPIs mostram corretamente "-"/"sem
histórico suficiente"/"só disponível para o ano letivo corrente", bloco de
investigação e coluna de faltas consecutivas somem (não aparecem "0"
enganosos), `EmptyState` do gráfico de evolução aparece. Sem erros de
console em nenhum dos dois anos, desktop e mobile (375px).

## Não implementado (conforme plano)

- Predição de abandono.
- Intervenção automática.
- Heatmap da rede sem pergunta clara.

## Critério de pronto

- [x] 4 KPIs, tendência real, donut mantido, bloco de faltas consecutivas,
      tabela preservada.
- [x] `ano` preservado em todos os drill-downs da página (incluindo 2
      links que já estavam quebrados antes desta etapa).
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual sem erros de console (2 anos, desktop + mobile).

## Próximo passo permitido

ETAPA 05 — auto-avanço, conforme instrução do usuário de 2026-08-25.
