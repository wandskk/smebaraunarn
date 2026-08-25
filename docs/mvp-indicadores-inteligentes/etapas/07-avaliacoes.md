# ETAPA 07 — Avaliações Municipais

## Status
PENDING

## Objetivo

Integrar avaliações municipais à narrativa executiva sem criar um "novo
módulo de avaliação inteligente" — reaproveitar `getAvaliacoesResumo` e
`getAnaliseItensAvaliacao`, já existentes.

## Escopo (seções 7 e 14 do plano)

- Seção "Avaliações municipais" na Central: 3-4 avaliações mais recentes com
  resultado, usando `getAvaliacoesResumo({kind:"rede"})`.
- Melhorar leitura executiva do detalhe (`app/admin/avaliacoes/[id]/page.tsx`):
  resumo da aplicação (ex.: "82% dos estudantes esperados... possuem
  resultado registrado").
- Aba Análise: itens/descritores com menor % de acerto (`getAnaliseItensAvaliacao`),
  barra horizontal máximo 10.
- Fluência leitora (quando `NivelFluencia` aplicável): distribuição por
  nível, quantidade, palavras por minuto quando houver dado — sem ranking de
  estudantes.

## Regra

Não prescrever ação pedagógica — só apontar onde investigar.

## Arquivos prováveis

- `app/admin/indicadores/page.tsx` (seção avaliações na Central)
- `app/admin/avaliacoes/[id]/page.tsx`
- `lib/queries/avaliacoes.ts`

## Próximo passo permitido

ETAPA 08, somente mediante autorização explícita do usuário.
