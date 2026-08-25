# ETAPA 01 — Central Executiva

## Status
PENDING

## Objetivo

Transformar `/admin/indicadores` no "Centro de Inteligência Educacional":
novo título/copy, contexto da rede compacto (Bloco A), 4 KPIs do "Pulso da
rede" (Bloco B), remover protagonismo dos cards estruturais (totais de
turma/escola/servidor), manter explicabilidade/freshness, integrar
avaliações recentes e resumo compacto de qualidade dos dados.

## Escopo (seção 3 e ETAPA 01 do plano)

- Cabeçalho: título "Centro de Inteligência Educacional" + texto de
  contexto + seletor `Ano letivo` + ações `Qualidade dos dados` /
  `Comparar escolas`.
- Bloco A — linha discreta de contexto (`[N] estudantes · [N] escolas ·
  [N] turmas · Ano letivo [AAAA]`).
- Bloco B — 4 KPIs (Frequência média, Desempenho médio, Distorção
  idade-série, Faltas consecutivas agora), cada um com valor dominante +
  delta/complemento + CTA, reaproveitando `MetricCard`.
- Mover "Números da página inicial" para área secundária/administração.

## Arquivos prováveis

- `app/admin/indicadores/page.tsx`
- `lib/queries/indicadores-gerais.ts`
- Possivelmente `lib/queries/indicadores-executivos.ts` — **só criar se a
  composição não puder ser feita limpamente com as queries existentes**
  (ver inventário em `../etapas/00-auditoria.md`).

## Fora de escopo desta etapa

- Bloco C (Atenção agora) e Bloco D (Panorama) — ETAPA 03.
- Bloco E (tendência de frequência) — ETAPA 02.
- Qualquer novo score ou ranking.

## Critério de pronto

Em uma captura da tela, sem rolar muito, o usuário entende frequência,
desempenho, distorção, faltas recentes e principais atenções.

## Próximo passo permitido

ETAPA 02, somente mediante autorização explícita do usuário.
