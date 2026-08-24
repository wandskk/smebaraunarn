# Matriz de Reaproveitamento — Núcleo x Perfil

**Status:** preliminar (ETAPA 00, atualizada na ETAPA 01). Baseada em
inspeção do código real (`app/`, `components/`, `lib/`,
`prisma/schema.prisma`) e nos 5 DOCX em `base/`. Deve continuar sendo
revisada nas etapas 02–03, à medida que contexto temporal/freshness e
componentes acadêmicos compartilhados forem efetivamente implementados.

## 1. Scopes conceituais — implementados na ETAPA 01

O master prompt define 5 scopes conceituais. Desde a ETAPA 01, eles existem
como código central e testado em [`lib/authz/scope.ts`](../../lib/authz/scope.ts)
(tipo `Scope`, união discriminada, e `scopeFromSession`) e
[`lib/authz/authorize.ts`](../../lib/authz/authorize.ts) (predicados
`canViewEscola`/`canViewTurma`/`canViewEstudante`/`canViewServidor`). A
autorização por papel isolado (`lib/require-session.ts`) continua existindo
como primeira camada (autenticação + prefixo de rota permitido); o scope
central é a segunda camada, que decide *qual entidade* dentro da rota já
permitida por papel. Ver [`etapas/01-scopes-e-capabilities.md`](etapas/01-scopes-e-capabilities.md)
para o detalhamento completo.

| Scope | Papel(éis) | Estado no código (ETAPA 01) |
|---|---|---|
| `NetworkScope` | ADMIN, SECRETARIA | `{ kind: "network" }` — vê qualquer escola/turma/estudante/servidor. Ainda não há distinção de capability entre ADMIN e SECRETARIA na autorização por entidade (só existe para a ação `usuarios:manage`, em `lib/authz/capabilities.ts`). |
| `SchoolScope` | DIRETOR | `{ kind: "school", escolaId }`. Aplicado em `app/portal/direcao/alunos/[id]/page.tsx` via `canViewEstudante`. Outras rotas de Direção (`turmas/[turma]`, `estudantes`, `servidores`) ainda filtram por `escolaId` direto na query, não via o módulo — consolidação prevista para a ETAPA 03. |
| `ProfessorScope` | PROFESSOR | `{ kind: "professor", escolaId, turmas }`. Aplicado em `app/portal/professor/turma/[id]/page.tsx`. Turmas vêm de `ServidorTurma` (sem `escolaId` próprio — a checagem de escola usa `Servidor.escolaId`, não a turma). Ainda **não** resolve o caso de um professor com mais de uma disciplina na mesma turma (`ServidorTurma` não modela isso) — decisão explícita de adiar a migração de schema para a ETAPA 06. O bug conhecido "professor sem turma recebe contagem de todos os alunos da escola" (`app/portal/professor/page.tsx`) **não foi corrigido** na ETAPA 01 — está reservado para a ETAPA 06 (Professor P0), que é onde o master prompt o lista. |
| `StudentSelfScope` | ALUNO | `{ kind: "student-self", estudanteId }`. Definido no módulo; ainda não há nenhum ponto no código do Aluno onde um `estudanteId` de outrem precisaria ser bloqueado (o portal do Aluno hoje só busca o próprio registro via `getEstudanteBySession`), então não houve refatoração de página nesta etapa. |
| `StaffSelfScope` | SERVIDOR_GERAL | `{ kind: "staff-self", servidorId }`. `canViewEstudante` retorna sempre `false` para este scope — reforça em código a regra 7.7 do master prompt (Servidor Geral não recebe dados acadêmicos por lotação). |

## 2. Componentes de design system já existentes (`components/ui/`)

Estes já existem e devem ser **reaproveitados**, não recriados:

- `page-header.tsx`, `page-container.tsx` — equivalentes a `PageHeader`/parte de `AppShell`.
- `metric-card.tsx` — equivalente a `MetricCard`.
- `table.tsx`, `table-empty-state.tsx`, `list-toolbar.tsx`, `pagination.tsx`, `page-size-select.tsx`, `search-input.tsx` — base de `DataTable`.
- `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx` — primitivos de formulário/UI.
- `form-field.tsx`, `form-message.tsx` — equivalente a `FormField`.
- `user-menu.tsx`.

Não há hoje um componente único chamado `AppShell`; o shell de layout está
distribuído entre os layouts de `app/admin/` e `app/portal/*` — a
consolidação (se fizer sentido) é decisão a avaliar na ETAPA 03, não uma
lacuna a ser corrigida às pressas.

## 3. Componentes acadêmicos compartilhados citados no master prompt — nenhum existe ainda como componente isolado

`SchoolOverview`, `TurmaDetail`, `StudentAcademicDetail`, `GradeTable`,
`AttendanceSummary`, `AttendanceTable`, `AcademicContextBar`/`AnalysisScopeBar`,
`DataFreshnessBadge`, `InsightCard`, `ComparisonDelta`, `CoverageCard`,
`MethodologyNote`, `EvaluationSummary`, `FunctionalDataCard`,
`AssignmentSummary`, `CapabilityGate` — **nenhum destes existe hoje como
componente nomeado** em `components/`. As telas de Admin/Diretor/Professor/Aluno
(`app/admin/estudantes/[id]`, `app/portal/direcao/*`, `app/portal/professor/*`,
`app/portal/aluno/*`) hoje implementam suas próprias views, cada uma
consumindo `lib/queries/*` diretamente. A ETAPA 03 deve avaliar, tela a tela,
qual lógica já está duplicada (ex.: cálculo de frequência exibido em mais de
um portal) antes de extrair qualquer componente novo.

## 4. Camada analítica (`lib/analytics/`) — já compartilhada e testada

Diferente dos componentes de UI, a camada de cálculo já é compartilhada e tem
cobertura de teste (107 testes, ver baseline em `etapas/00-auditoria-e-baseline.md`):

- `frequencia.ts` — cálculo de percentual de frequência, classificação de faixa.
- `distorcao.ts` — distorção idade-série.
- `estatistica.ts` — estatística de aprendizagem (média, mediana, percentis).
- `explicabilidade.ts` — metadados de explicabilidade de indicadores.
- `qualidade-dados.ts` — qualidade de dados / situação de sincronização.
- `comparativos.ts` — comparativos ponderados escola x rede.
- `mapeamento-serie.ts` — normalização de série/ano escolar.

Essas funções são puras (sem I/O, sem Prisma) e já são o núcleo reutilizável
real do sistema — o trabalho das próximas etapas é garantir que **todos os
perfis consumam a mesma fórmula através delas**, em vez de duplicar cálculo
em `lib/queries/*` específicas por perfil.

## 5. Matriz conceitual núcleo x perfil (do master prompt, seção 6)

| Núcleo | Admin | Diretor | Professor | Aluno | Servidor Geral |
|---|---|---|---|---|---|
| Escola | rede + detalhe | própria escola | contexto | contexto | lotação |
| Turma | todas | escola | próprias | própria | só se atribuído |
| Aluno | todos | escola | turmas autorizadas | próprio | não por padrão |
| Notas | analítico | escola | escopo pedagógico | próprias | não |
| Frequência | analítico | escola | escopo pedagógico | própria | não |
| Avaliações | rede | escola | turmas/disciplina quando aplicável | próprias | não por padrão |
| Dados funcionais | gestão | servidores escola | próprio | não | próprio |
| Freshness/metodologia | sim | sim | sim | sim | sim |
| Minha Conta | sim | sim | sim | sim | sim |

Esta matriz é a meta funcional; a coluna "Professor" é a que hoje tem maior
risco de violação (ver P0 do master prompt e `etapas/00-auditoria-e-baseline.md`),
porque `ServidorTurma` não carrega `escolaId` nem modela disciplina de forma
que a autorização por turma+disciplina seja hoje verificável com segurança.

## 6. Modelos Prisma relevantes (estado real do schema em 2026-08-24)

`User`, `Escola`, `Cargo`, `Servidor`, `ServidorTurma`, `Estudante`,
`NotaEstudante`, `FrequenciaEstudante`, `Post`, `DocumentoPublico`,
`IndicadoresLanding`, `Avaliacao`, `AvaliacaoQuestao`,
`AvaliacaoResultadoAluno`, `LogSincronizacao`.

Pontos já confirmados como estruturalmente frágeis (não alterar nesta etapa,
apenas registrar):

- `ServidorTurma { servidorId, turma, serie?, turno?, disciplina?, cargaTrabalho? }`
  com `@@unique([servidorId, turma])` — sem `escolaId`; `turma` é string livre,
  o que é consistente com o achado do master prompt de que **códigos de turma
  se repetem entre escolas**. A unicidade atual também não comporta um
  professor com mais de uma disciplina na mesma turma.
- `Servidor.pendenciaPedagogica` — campo existe no schema, mas seu
  significado/público de exibição ainda não foi validado (achado do DOCX de
  Servidor Geral).

## 7. Próxima revisão desta matriz

Esta matriz deve ser revisada ao final da ETAPA 01 (scopes reais) e da ETAPA 03
(componentes acadêmicos reais), substituindo as seções "implícito"/"nenhum
existe ainda" por referências a código concreto.
