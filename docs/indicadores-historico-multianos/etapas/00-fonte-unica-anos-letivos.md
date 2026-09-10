# ETAPA 00 — Fonte única de "anos letivos disponíveis"

## Status
DONE

## Objetivo

Substituir `prisma.estudante.groupBy({by:["ano"]})` — usado em ~10 páginas
para descobrir quais anos letivos têm dado — por uma função central que olha
para as tabelas que de fato guardam histórico por ano (`NotaEstudante`,
`FrequenciaEstudante`, `Avaliacao`), não para `Estudante.ano`, que é só o
snapshot de matrícula mais recente de cada aluno.

## Por que esta etapa existe

`Estudante.ano` é sobrescrito a cada sincronização
(`upsertEstudante`, `lib/sync/sigeduc-sync.ts:264-274`) para refletir só o
ano letivo mais recente conhecido daquele aluno. Um aluno que migrou de
2024 para 2026 deixa de "aparecer" como tendo dado em 2024 em qualquer
`groupBy`/`where` sobre `Estudante.ano`, mesmo que as notas e a frequência
dele de 2024 continuem intactas no banco. Isso precisa estar correto antes
de expor um seletor multi-ano na UI (ETAPA 02) — senão o próprio seletor
esconderia anos com dado real.

## Escopo desta etapa

1. Criar `getAnosLetivosDisponiveis(scope?: {escolaId})` em
   `lib/queries/anos-letivos.ts`.
2. Migrar as páginas que hoje calculam `anosDisponiveis` via
   `prisma.estudante.groupBy`.
3. Confirmar, com dado real do banco local, que a nova fonte é pelo menos tão
   completa quanto a antiga.
4. Quantificar (não corrigir ainda) o impacto do mesmo problema dentro de
   `getIndicadoresGeraisRede`, para virar a ETAPA 01.

## Fora de escopo

- Seletor de ano multi-seleção/persistente na UI (ETAPA 02).
- Corrigir `getIndicadoresGeraisRede` (ETAPA 01) — só medir o impacto aqui.
- Qualquer gráfico de evolução histórica (ETAPA 03+).

## Decisões técnicas

- **Sem SQL cru.** `NotaEstudante` e `Avaliacao` têm `ano` como coluna
  nativa — `findMany({distinct:["ano"]})` resolve direto. `FrequenciaEstudante.data`
  é string (`YYYY-MM-DD`); em vez de raw SQL para extrair o ano no banco,
  usei `findMany({distinct:["data"]})` (no máximo ~200-250 linhas por ano
  letivo — 1 por dia de aula da rede, não por aluno) e reduzi para ano em
  memória (`Number(data.slice(0,4))`). Volume irrelevante no dataset atual.
- **Escopo por escola** (usado por `app/portal/direcao/page.tsx` e
  `app/admin/escolas/[id]/page.tsx`): `NotaEstudante`/`FrequenciaEstudante`
  filtram por `{OR: [{escola: nomeEscola}, {escola: null, estudante: {escolaId}}]}`
  — mesmo fallback já usado em `resolverMatriculaPorAno`
  (`lib/queries/distorcao.ts`) para dado antigo sem a coluna `escola`
  preenchida. `Avaliacao` não tem `escolaId` direto — escopei via
  `resultados`/`resultadosTurma` (`AvaliacaoResultadoAluno`/`AvaliacaoResultadoTurma.escolaId`).
- **Duas páginas que pareciam candidatas NÃO foram alteradas**, por já
  derivarem anos corretamente de tabelas próprias, não de `Estudante.ano`:
  `app/admin/avaliacoes/page.tsx` (`prisma.avaliacao.groupBy` — está listando
  o catálogo de avaliações, não "anos letivos da rede") e
  `app/portal/aluno/boletim/page.tsx` (`prisma.notaEstudante.groupBy` já
  escopado ao próprio aluno).

## Arquivos alterados

- `lib/queries/anos-letivos.ts` (novo).
- `app/admin/indicadores/page.tsx`, `aprendizagem/page.tsx`,
  `frequencia/page.tsx`, `comparativos/page.tsx`, `fluxo-trajetoria/page.tsx`
  — troca da fonte de `anosDisponiveis`; import de `prisma` removido (sem
  outro uso no arquivo).
- `app/portal/direcao/page.tsx`, `app/admin/escolas/[id]/page.tsx` — troca
  escopada por `escolaId`.
- `app/admin/page.tsx`, `app/admin/turmas/page.tsx`,
  `app/admin/estudantes/page.tsx` — troca sem escopo.

## Achado que vira a ETAPA 01

`getIndicadoresGeraisRede` (`lib/queries/indicadores-gerais.ts:62-66`) conta
`totalEstudantes`/`escolasAtivas`/`totalTurmas` via
`prisma.estudante.findMany({where:{ano:anoLetivo}})` — a mesma fonte ingênua
corrigida nesta etapa para o seletor, mas ainda presente **dentro do cálculo
do indicador**. Medido contra o Postgres local:

| Ano | `Estudante.ano = X` (ingênuo) | `resolverMatriculaPorAno(X)` (correto, já usado para distorção na mesma função) |
|---|---|---|
| 2024 | 737 | 2088 |
| 2025 | 608 | 1933 |
| 2026 (corrente) | 3936 | 3936 |

Para o ano corrente os números batem (por isso o bug nunca apareceu); para
anos históricos a contagem ingênua reporta menos de um terço da população
real. Corrigido na ETAPA 01.

## Testes executados

```bash
npm test        # 263/263
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 63 rotas
```

Verificação da equivalência de fonte (script `tsx` temporário, removido após
uso): `getAnosLetivosDisponiveis()` retornou `[2026, 2025, 2024]`, idêntico à
fonte antiga no dataset atual — a nova fonte não regride nenhum caso hoje
visível e corrige a causa raiz para quando um aluno migrar de ano/escola no
futuro.

## Critério de pronto

- [x] `getAnosLetivosDisponiveis` criada, sem SQL cru, com fallback de escola
      consistente com `resolverMatriculaPorAno`.
- [x] 10 páginas migradas; 2 páginas confirmadas como já corretas e deixadas
      intactas.
- [x] Nenhum import não usado (`prisma`) deixado para trás.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Impacto do bug de `getIndicadoresGeraisRede` quantificado com dado real.

## Próximo passo permitido

ETAPA 01 — aguardando autorização explícita do usuário.
