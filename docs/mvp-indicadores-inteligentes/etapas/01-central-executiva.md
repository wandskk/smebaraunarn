# ETAPA 01 — Central Executiva

## Status
DONE

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
- Bloco F (avaliações municipais recentes) e Bloco G (confiabilidade dos
  dados) compactos, antecipados desta etapa por já constarem no escopo
  "Implementar" da ETAPA 01 do plano (a ETAPA 07 aprofunda avaliações).

## O que foi implementado

**`app/admin/indicadores/page.tsx` (reescrita):**
- Título "Centro de Inteligência Educacional" + descrição executiva
  (texto literal da seção 2 do plano).
- Ações do cabeçalho: seletor Ano letivo, `Qualidade dos dados`,
  `Comparar escolas` (antes "Comparativos"). Botão "Números da página
  inicial" removido do cabeçalho.
- Bloco A: linha discreta `[N] estudantes · [N] escolas · [N] turmas · Ano
  letivo [AAAA]`, substituindo os 3 `MetricCard`s estruturais gigantes que
  ocupavam a primeira posição.
- Bloco B — 4 KPIs via `MetricCard` (nenhum componente novo criado):
  1. **Frequência média da rede** — agora usa a mesma janela de 30 dias de
     `/admin/indicadores/frequencia` (não mais a média do ano inteiro),
     para poder mostrar `ComparisonDelta` com a variação em p.p. vs. os 30
     dias anteriores + CTA "Ver frequência →". Decisão registrada abaixo.
  2. **Desempenho médio** — valor inalterado (média do ano); complemento
     novo: % das notas abaixo do parâmetro de trabalho, calculado com
     `getDesempenhoPorEscola` + `calcularMediaPonderada` (mesmo padrão já
     usado em `lib/queries/comparativos.ts`, matematicamente equivalente à
     soma bruta de notas abaixo / total).
  3. **Distorção idade-série** — trocado de "contagem absoluta" para
     "percentual + contagem" (`14,8% / 312 estudantes... em distorção`),
     usando o novo campo `estudantesElegiveisDistorcao`.
  4. **Faltas consecutivas agora** — nova, usa
     `getContagemFaltasConsecutivasPorEscola` (já existente, mesma usada em
     `/admin/indicadores/frequencia`), somando `.total`/`.critico` de todas
     as escolas. Só calculada para o ano letivo corrente (mesma regra já
     usada na página de Frequência).
  Removida a antiga MetricCard standalone "Estudantes abaixo da faixa
  adequada de frequência" — vira insight em "Atenção agora" na ETAPA 03,
  não KPI isolado (Bloco B tem no máximo 4, conforme regra do plano).
- Bloco F — "Avaliações municipais": até 4 cards mais recentes via
  `getAvaliacoesResumo({kind:"rede"})`, com badge de status
  (`STATUS_AVALIACAO_LABEL`), tipo/etapa/ano, cobertura e data de
  atualização — link para `/admin/avaliacoes/[id]`.
- Bloco G — "Confiabilidade dos dados": card compacto "X de Y módulos em
  dia" + badges dos módulos atrasados (`DataFreshnessBadge`) + CTA "Abrir
  qualidade dos dados →". Não duplica `/admin/indicadores/qualidade`.
- Bloco C (Atenção agora) mantido como placeholder explicativo — build
  completo é ETAPA 03, conforme fora de escopo abaixo.

**`lib/queries/indicadores-gerais.ts`:** adicionado campo aditivo
`estudantesElegiveisDistorcao` (denominador do percentual de distorção) —
reaproveita o mesmo loop que já existia, sem segunda query.

**`components/ui/metric-card.tsx`:** `helpText` alterado de `string` para
`ReactNode` — mudança aditiva/retrocompatível (todo uso existente já
passava `string`, que continua válido) para permitir compor
delta (`ComparisonDelta`) + texto de CTA na mesma célula sem criar um
segundo componente.

**`components/admin/sidebar.tsx`:** adicionado item "Números da Página
Inicial" (`/admin/indicadores/portal-publico`) ao grupo "Administração" —
mantém a funcionalidade alcançável sem competir com o cabeçalho da
Central.

## Decisão técnica — janela da "Frequência média da rede" no KPI 1

Antes desta etapa, o valor exibido era a média do ano letivo inteiro
(`getIndicadoresGeraisRede`). Trocado para a mesma janela de 30 dias usada
por `/admin/indicadores/frequencia` e `/admin/indicadores/comparativos`
(`calcularJanelaComparativaPadrao` + `resolverDataReferenciaJanela`), para:
(1) poder responder "o que mudou recentemente?" (pergunta 2 do plano) com
um delta real vs. período anterior, e (2) manter o mesmo número em todas as
telas que já usam essa janela — antes, a Central mostrava um número
diferente do resto do produto para "frequência da rede". Nenhuma query nova
foi criada: a soma de `aulasAtual/faltasAtual/aulasAnterior/faltasAnterior`
de `getFrequenciaPorEscola` (já usada) é feita diretamente na página, mesmo
padrão de agregação de `lib/queries/comparativos.ts`.

## Fora de escopo desta etapa

- Bloco C (Atenção agora) e Bloco D (Panorama) — ETAPA 03.
- Bloco E (tendência de frequência) — ETAPA 02.
- Aprofundamento de avaliações (resumo de aplicação, itens/descritores) —
  ETAPA 07.
- Qualquer novo score ou ranking.

## Testes executados

```bash
npm test        # 206/206 passaram
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npx next build     # sucesso, 63 rotas
```

## Verificação visual

Servidor de desenvolvimento (`.claude/launch.json`, config `dev`) aberto no
Browser pane, login como Admin (seed), `/admin/indicadores` real (ano
2026): 4 KPIs com dados reais (86,0% frequência / -1,1 p.p.; 7,0 desempenho
/ 17% abaixo do parâmetro; 6,9% distorção / 160 estudantes; 212 faltas
consecutivas / 41 crítico), Bloco F com 4 avaliações reais, Bloco G "5 de 6
módulos em dia" com badge do módulo atrasado. Sem erros no console, sem
requisições com falha. Verificado também em viewport mobile (375px) — sem
erros, mesmo conteúdo. Item "Números da Página Inicial" confirmado na
sidebar (grupo Administração) e página `/admin/indicadores/portal-publico`
continua acessível e funcional. Drill-down `/admin/indicadores/frequencia`
verificado sem regressão (28 escolas, mesma contagem de antes).

## Critério de pronto

- [x] Em uma captura da tela, sem rolar muito, o usuário entende
      frequência, desempenho, distorção, faltas recentes.
- [x] "Principais atenções" — placeholder explícito até a ETAPA 03 (não
      fabricado).
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual desktop + mobile sem erros de console.

## Próximo passo permitido

ETAPA 02 — auto-avanço, conforme instrução do usuário de 2026-08-25.
