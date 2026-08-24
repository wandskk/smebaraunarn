# Matriz de Reaproveitamento — Núcleo x Perfil

**Status:** atualizada pela última vez na ETAPA 08. Baseada em inspeção do
código real (`app/`, `components/`, `lib/`, `prisma/schema.prisma`) e nos 5
DOCX em `base/`.

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
| `ProfessorScope` | PROFESSOR | **Desde a ETAPA 06**: `{ kind: "professor", atribuicoes: { escolaId, turma }[] }` — cada atribuição carrega sua própria escola, não mais um `escolaId` único do scope. `ServidorTurma` ganhou coluna `escolaId` própria (migração aplicada em produção, backfill 611/611 linhas) e `lib/sync/sigeduc-sync.ts` grava esse valor por linha a cada sincronização. `canViewTurma`/`canViewEstudante`/`canViewEscola` checam a tupla `(escolaId, turma)` exata — fecha o risco de um código de turma colidindo entre duas escolas (57 casos confirmados na base real) liberar escopo indevido. Aplicado em `app/portal/professor/{page,turmas/page,turmas/[turma]/page,estudantes/[id]/page}.tsx`. Ainda **não** resolve o caso de um professor com mais de uma disciplina na mesma turma (`@@unique([servidorId, escolaId, turma])` continua limitando a 1 disciplina por turma) — decisão explícita de adiar essa parte para a ETAPA 10 (P1), pendente de confirmar a cardinalidade real da API do SIGEduc. |
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

## 3. Componentes acadêmicos compartilhados citados no master prompt

Estado desde a ETAPA 04 (ver `etapas/03-componentes-academicos-compartilhados.md`
e `etapas/04-admin-p0.md` para o mapeamento completo de duplicação/achados
que motivou cada extração):

| Componente | Estado |
|---|---|
| `CapabilityGate` | Existe desde a ETAPA 01 (`components/ui/capability-gate.tsx`); em uso desde a ETAPA 04 em `/admin/usuarios` (lista e detalhe), gate por `usuarios:manage`. |
| `DataFreshnessBadge` | Existe desde a ETAPA 02 (`components/ui/data-freshness-badge.tsx`); usado em `/admin/indicadores/qualidade` e no dashboard `/admin` (ETAPA 04). |
| `TurmaDetail` | Existe como `TurmaDetalheView` (`components/portal/turma-detalhe.tsx`, ETAPA 03), usado por Admin e Direção. |
| `GradeTable` | Existe (`components/portal/grade-table.tsx`, ETAPA 03), usado por `AlunoDetalhe` (Admin/Direção/Professor) e pelo portal do Aluno. **ETAPA 07** adicionou prop opcional `mostrarCompletude` (coluna "Situação": Final/Parcial x/4 unidades) — ligado só no boletim do Aluno; os demais consumidores continuam com o comportamento anterior. |
| `ComparisonDelta` | Existe (`components/ui/comparison-delta.tsx`, ETAPA 03); consumido por `/admin/indicadores/frequencia`, `/admin/indicadores/comparativos` e, desde a ETAPA 04, por `/admin/escolas/[id]` — a classificação de favorabilidade continua em cada página, só a apresentação é compartilhada. |
| `InsightCard` | Existe desde a ETAPA 04 (`components/ui/insight-card.tsx`), consumido pelo bloco "Atenção agora" do dashboard `/admin` (`lib/analytics/atencao.ts` + `lib/queries/atencao.ts`). |
| `StudentAcademicDetail` | Já existia antes da ETAPA 03 como `AlunoDetalhe` (`components/portal/aluno-detalhe.tsx`), usado por Admin/Direção/Professor. |
| `SchoolOverview` | **Extraído na ETAPA 05** (`components/portal/school-overview.tsx`) — núcleo "comparação com a rede" (frequência/desempenho/distorção vs. referência de rede), usado por `/admin/escolas/[id]` (Admin escolhe a escola) e pela Home da Direção (`SchoolScope`, escola fixa na sessão). Ainda **sem** as tabs completas (Turmas/Servidores/Estudantes/Avaliações) do DOCX — cada perfil continua tendo suas próprias rotas de turmas/estudantes/avaliações; só o bloco de comparação com a rede é o núcleo compartilhado hoje. |
| `AttendanceSummary`, `AttendanceTable`, `AcademicContextBar`/`AnalysisScopeBar`, `MethodologyNote`, `FunctionalDataCard`, `AssignmentSummary` | Avaliados nas ETAPAs 02/03/05 e **deliberadamente não criados** — sem duplicação real hoje para consolidar. |
| `CoverageCard`, `EvaluationSummary` | Ainda não extraídos como componente — a ETAPA 05 implementou cobertura (esperado × realizado por turma) inline em `/portal/direcao/avaliacoes/[id]` (só um caso de uso até agora). `lib/queries/avaliacoes.ts` (`TIPO_AVALIACAO_LABEL`/`NIVEL_FLUENCIA_LABEL`) já tem 3 consumidores (Admin, Diretor, e desde a ETAPA 07, Aluno via `getAvaliacoesResultadosPorEstudante`) — a query está pronta, falta extrair a apresentação quando o Admin ganhar uma tela equivalente (ETAPA 09). |

As telas de Admin/Diretor/Professor/Aluno continuam, fora desses pontos já
consolidados, implementando suas próprias views sobre `lib/queries/*`
diretamente — a extração é incremental, dirigida por duplicação real
encontrada, não por completar a lista de nomes do master prompt de uma vez.

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

Pontos já confirmados como estruturalmente frágeis:

- `ServidorTurma { servidorId, escolaId, turma, serie?, turno?, disciplina?, cargaTrabalho? }`
  com `@@unique([servidorId, escolaId, turma])` — **`escolaId` adicionado na
  ETAPA 06** (antes não existia; a checagem de escola usava
  `Servidor.escolaId`, único por servidor e frágil para professores em mais
  de uma escola). `turma` continua string livre, consistente com o achado de
  que **códigos de turma se repetem entre escolas** (57 casos confirmados).
  A unicidade atual ainda **não** comporta um professor com mais de uma
  disciplina na mesma turma — pendente de confirmar a cardinalidade real da
  API do SIGEduc antes de migrar de novo (ETAPA 10/P1).
- `Servidor.pendenciaPedagogica` — campo existe no schema, mas seu
  significado/público de exibição ainda não foi validado (achado do DOCX de
  Servidor Geral; a ETAPA 08 amenizou a apresentação, não a semântica —
  segue pendente de confirmação da Secretaria).
- `Servidor.turno`/`Servidor.cargaTrabalho` — **adicionados na ETAPA 08**
  como fallback funcional para servidores sem turma (a origem manda esses
  campos por linha, independente de `turma`, mas antes só iam para
  `ServidorTurma`). Não confundir com `ServidorTurma.turno`/`cargaTrabalho`
  — aqueles são atribuição pedagógica (podem variar por turma), estes são
  lotação funcional (um valor só, quando não há turma).

## 7. Próxima revisão desta matriz

Scopes reais (ETAPA 01), componentes acadêmicos reais (ETAPA 03), a
extração de `SchoolOverview`/`getInsightsAtencaoEscola` com `SchoolScope`
(ETAPA 05), a migração de `ServidorTurma`/`ProfessorScope` para atribuições
por tupla `(escolaId, turma)` (ETAPA 06) e o encerramento da política "90
registros" no último perfil que ainda a usava dessa forma — o Aluno, já
corrigido na ETAPA 02, a ETAPA 07 tratou o restante do escopo (faltas
abonadas, seletor de período/ano, completude do boletim, avaliações
próprias) — já foram incorporados às seções 1, 3 e 6 acima. A coluna
"Aluno" da matriz da seção 5 ganhou sua própria tela de Avaliações
Municipais (antes só Admin/Diretor/Professor tinham visão de avaliação). A
ETAPA 08 fechou o último perfil individual: fallback `Servidor.turno`/
`cargaTrabalho` para lotação sem turma (seção 6) e ficha funcional com
freshness/contato/divergência de escola (seção 5, coluna Servidor). Todos
os 5 perfis (Admin, Diretor, Professor, Aluno, Servidor Geral) já tiveram
sua rodada P0 individual. Próxima revisão prevista ao final da ETAPA 09
(Avaliações Municipais) — primeira etapa transversal, que deve consolidar
`AvaliacaoResultadoAluno`/`lib/queries/avaliacoes.ts` (hoje com 3
consumidores: Admin, Diretor, Aluno) num núcleo único reaproveitado também
por Professor, e é onde `CoverageCard`/`EvaluationSummary` (seção 3) têm o
segundo caso de uso real para finalmente serem extraídos.
