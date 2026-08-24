# ETAPA 01 — Scopes e Capabilities

## Status
PENDING

## Objetivo

Centralizar autorização contextual (escola/turma/disciplina/vínculo/entidade,
não apenas `role`) antes de ampliar qualquer tela.

## Por que esta etapa existe

Hoje a autorização (`lib/require-session.ts`, `lib/roles.ts`) é baseada
apenas em `role`. A ETAPA 00 confirmou, no schema real, que `ServidorTurma`
não tem `escolaId` e não modela disciplina na chave de unicidade — ou seja, o
sistema não tem hoje como verificar com segurança que um professor só acessa
a escola/turma/disciplina a que está de fato atribuído. Ampliar telas antes de
resolver isso arrisca expor dados fora do escopo permitido.

## Pré-requisitos

ETAPA 00 concluída (`DONE`).

## Escopo desta etapa

- Representação de `NetworkScope`, `SchoolScope`, `ProfessorScope`,
  `StudentSelfScope`, `StaffSelfScope`.
- Helper(s) de capability/autorização reutilizáveis.
- `CapabilityGate` apenas como complemento de UI (a checagem real deve ser
  no servidor).
- Checagem equivalente no servidor/query/action, não só na UI.
- Compatibilidade com o RBAC atual (`Role` do Prisma, `lib/auth.ts`,
  `middleware.ts`).

## Fora de escopo

- Reescrever telas de perfil (isso é ETAPA 04–08).
- Qualquer migração de `ServidorTurma` que não seja estritamente necessária
  para representar `ProfessorScope` com segurança — se necessária, deve ser
  proposta como decisão técnica separada (seção 7.8 do master prompt) antes
  de ser executada.

## Arquivos/áreas previstos

- Novo módulo de scopes/capabilities (local exato a definir na investigação
  desta etapa — provável candidato: `lib/authz/` ou equivalente).
- `lib/require-session.ts`, `lib/roles.ts`, `middleware.ts` (avaliação de
  integração, não necessariamente reescrita).
- `prisma/schema.prisma` (somente se a investigação confirmar necessidade de
  migração para `ProfessorScope`, documentada antes de executar).

## Checklist
- [ ] Investigar pontos de autorização atuais (`middleware.ts`,
      `lib/require-session.ts`, layouts de `/admin` e `/portal/*`).
- [ ] Definir representação de cada scope.
- [ ] Implementar helper(s) de capability reutilizáveis.
- [ ] Implementar `CapabilityGate` de UI.
- [ ] Garantir checagem equivalente no servidor/query/action.
- [ ] Avaliar necessidade de migração em `ServidorTurma` para `ProfessorScope`
      seguro; se necessária, documentar decisão antes de migrar.
- [ ] Adicionar testes para os cenários críticos (professor sem turma,
      diretor preso à escola, servidor geral sem dados acadêmicos, etc.).

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

A autorização contextual passa a ter uma fonte central reutilizável e há
testes para os cenários críticos.

## Próximo passo permitido

ETAPA 02, somente mediante autorização explícita do usuário.
