# ETAPA 07 — Avaliações Municipais

## Status
DONE

## Objetivo

Integrar avaliações municipais à narrativa executiva sem criar um "novo
módulo de avaliação inteligente" — reaproveitar `getAvaliacoesResumo` e
`getAnaliseItensAvaliacao`, já existentes.

## O que já estava pronto (ETAPA 01)

Seção "Avaliações municipais" na Central (Bloco F, `getAvaliacoesResumo({
kind: "rede" })`) já foi entregue na ETAPA 01 — nada novo aqui.

## O que foi implementado nesta etapa

**`lib/analytics/avaliacoes.ts`:** nova função pura
`calcularDistribuicaoFluencia(resultados, niveisOrdenados)` — distribuição
por nível de fluência (contagem, nunca lista/ranking de estudante) +
estatísticas de palavras/minuto (média/mínimo/máximo, só sobre quem tem o
dado). Segue o mesmo padrão de `calcularHistograma` (ETAPA 05): a ordem
dos níveis vem do chamador, a função não conhece o enum `NivelFluencia` do
Prisma. 6 testes novos.

**`lib/queries/avaliacoes.ts`:** nova `getDistribuicaoFluencia(avaliacaoId,
scope)` — busca todos os resultados do escopo (não paginado, mesmo padrão
de `getAnaliseItensAvaliacao`) e delega à função pura.

**`app/admin/avaliacoes/[id]/page.tsx`:**
- Aba **Visão Geral**: nova frase-resumo executiva acima dos KPIs — "X%
  dos estudantes esperados nas turmas já iniciadas possuem resultado
  registrado" (texto quase literal do exemplo da seção 14 do plano),
  computada a partir de `avaliacao.cobertura.percentual` já existente.
- Aba **Análise**:
  - Novos gráficos `HorizontalBarChart` (componente compartilhado da
    ETAPA 05 — 3º uso real) "Itens com menor percentual de acerto" e
    "Descritores com menor percentual de acerto", máximo 10, ordenados do
    pior para o melhor. Tabelas completas (`Por questão`/`Por descritor`)
    mantidas abaixo, sem alteração.
  - Texto explicativo obrigatório adicionado literal: "Estes são os
    itens/descritores com menor percentual de acerto nesta avaliação. O
    painel não prescreve intervenção pedagógica; ele aponta onde
    investigar."
  - Nova seção "Fluência leitora — distribuição por nível", só quando
    `avaliacaoBase.tipo === "FLUENCIA_LEITORA"`: `MiniBarChart` (já
    existente) com a distribuição por nível + card de estatísticas de
    palavras/minuto. Nunca lista estudante por estudante (regra da seção
    14). O `EmptyState` "Nenhuma questão cadastrada" agora só aparece para
    avaliações que não são de fluência (fluência raramente tem
    questões/gabarito — o indicador real dela é o nível, não % de acerto).

## Regra

Não prescrever ação pedagógica — o painel só aponta onde investigar (texto
literal adicionado). Nenhuma lista/ranking de estudante na distribuição de
fluência — só contagens agregadas por nível.

## Testes executados

```bash
npm test        # 225/225 (6 novos: calcularDistribuicaoFluencia)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npx next build     # sucesso, 63 rotas (preview parado antes de rodar)
```

## Verificação visual

Testado com 2 avaliações reais: "Avaliação Diagnóstica de Fluência Leitora
— PARC" (tipo Fluência Leitora, 0 questões, 188 resultados) — resumo "48%
dos estudantes esperados..." correto, distribuição por nível renderizada
(6 níveis, todos com contagem, sem dado de palavras/minuto nesta aplicação
→ estado vazio correto), nenhum EmptyState indevido de "questão
cadastrada". E "SPADEB 2026 — 9º Ano" (40 questões, 139 resultados) —
gráficos de itens/descritores com menor acerto renderizados corretamente
ordenados (pior no topo: Questão 35 com 19%, depois 38/23%, 11/24%...),
tabelas completas preservadas abaixo. Sem regressão na Central (Bloco F).
Sem erros de console em nenhum caso, desktop e mobile (375px).

## Critério de pronto

- [x] Seção de avaliações recentes na Central (já da ETAPA 01).
- [x] Resumo executivo da aplicação no detalhe.
- [x] Itens/descritores com menor % de acerto, gráfico + texto de não
      prescrição.
- [x] Distribuição de fluência quando aplicável, sem ranking de estudante.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Verificação visual sem erros de console (2 tipos de avaliação,
      desktop + mobile).

## Próximo passo permitido

ETAPA 08 — auto-avanço, conforme instrução do usuário de 2026-08-25.
