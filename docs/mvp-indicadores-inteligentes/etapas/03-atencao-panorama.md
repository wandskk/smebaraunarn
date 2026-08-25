# ETAPA 03 — Atenção Agora + Panorama

## Status
PENDING

## Objetivo

Colocar o motor "Atenção agora" (já existente em `lib/analytics/atencao.ts`
+ `lib/queries/atencao.ts`) no centro da experiência (Bloco C), e construir o
Panorama das escolas (Bloco D) reaproveitando `getComparativosPorEscola` e
`getDesempenhoPorEscola`, sem duplicar cálculo.

## Escopo (seções 4 e 5 do plano)

- Remover o placeholder atual de "Atenção agora" da Central.
- Chamar `getInsightsAtencao`, exibir no máximo 5 insights.
- Adicionar campo `categoria` explícito a `InsightAtencao` (decisão já
  registrada na ETAPA 00 — aditivo, não duplica lógica; confirmar
  `"aprendizagem"` vs. `"desempenho"` como nome do domínio).
- Tabela compacta do Panorama com badges de sinais independentes por escola
  (Frequência/Aprendizagem/Trajetória) — nunca "score 82".
- Filtros: Todas / Com sinais / Frequência / Aprendizagem / Trajetória.
- Se necessário, função agregadora pura que transforma os insights
  existentes em um mapa por escola (não uma nova query de banco).

## Regra

Nenhum score agregado. Ordenação: críticos → atenção → dentro da mesma
severidade, relevância já derivada da regra ou magnitude do fato.

## Arquivos prováveis

- `lib/analytics/atencao.ts` (campo `categoria`)
- `lib/analytics/atencao.test.ts` (atualizar se o tipo mudar)
- `app/admin/indicadores/page.tsx` (Blocos C e D)
- Possível novo agregador puro em `lib/analytics/` ou `lib/queries/`

## Critério de pronto

"Atenção agora" e Panorama funcionando com dados reais, sem score, com
filtros por categoria.

## Próximo passo permitido

ETAPA 04, somente mediante autorização explícita do usuário.
