# ETAPA 03 — Componentes acadêmicos compartilhados

## Status
PENDING

## Objetivo

Consolidar os componentes/fórmulas usados por vários perfis antes de evoluir
cada portal individualmente.

## Por que esta etapa existe

A ETAPA 00 confirmou que nenhum componente acadêmico compartilhado nomeado
(`SchoolOverview`, `TurmaDetail`, `GradeTable`, etc.) existe hoje — cada
portal implementa sua própria view sobre `lib/queries/*`. Extrair essa base
antes das etapas por perfil (04–08) evita duplicar a mesma fórmula com
pequenas divergências entre Admin/Diretor/Professor/Aluno.

## Pré-requisitos

ETAPA 02 concluída (`DONE`).

## Escopo desta etapa

Avaliar e extrair/evoluir, conforme o código real (não criar componente só
porque o nome aparece no master prompt — confirmar equivalente existente
primeiro):

- `SchoolOverview`
- `TurmaDetail`
- `StudentAcademicDetail`
- `GradeTable`
- `AttendanceSummary`
- `AttendanceTable`
- `ComparisonDelta`
- `CoverageCard`
- `InsightCard`
- `EvaluationSummary`

## Fora de escopo

- Refatoração puramente estética sem redução de duplicação de regra.
- Funcionalidades novas que não existam em nenhum perfil hoje (isso é
  ETAPA 04–10).

## Arquivos/áreas previstos

- `components/` (novos componentes compartilhados, localização a definir).
- `lib/queries/academico.ts`, `lib/queries/frequencia.ts`,
  `lib/queries/desempenho.ts` e demais queries hoje duplicadas entre
  `app/admin/*`, `app/portal/direcao/*`, `app/portal/professor/*`,
  `app/portal/aluno/*`.

## Checklist
- [ ] Mapear duplicação real de cálculo/fórmula entre perfis (não assumir,
      confirmar no código).
- [ ] Definir qual componente resolve qual duplicação encontrada.
- [ ] Extrair/evoluir componentes um de cada vez, com teste antes/depois.
- [ ] Validar que Admin/Diretor/Professor/Aluno usam a mesma fórmula para a
      mesma entidade após a extração.

## Alterações realizadas

_(preencher ao concluir a etapa)_

## Decisões técnicas

_(preencher ao concluir a etapa)_

## Testes executados

_(preencher ao concluir a etapa)_

## Resultado dos testes

_(preencher ao concluir a etapa)_

## Riscos e pendências

_(preencher ao concluir a etapa)_

## Critérios de aceite

Admin/Diretor/Professor/Aluno passam a poder consumir a mesma base de
componentes acadêmicos sem duplicar fórmulas.

## Próximo passo permitido

ETAPA 04, somente mediante autorização explícita do usuário.
