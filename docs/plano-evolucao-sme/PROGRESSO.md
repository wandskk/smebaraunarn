# Progresso — Evolução Incremental do SME Baraúna

**Última atualização:** 2026-08-24 (ETAPA 03)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento, bloqueada ou concluída. Ao final de cada etapa, este arquivo deve
ser atualizado junto com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Auditoria, baseline e documentação | **DONE** | 2026-08-24 |
| 01 | Scopes e Capabilities | **DONE** | 2026-08-24 |
| 02 | Contexto temporal e Data Freshness | **DONE** | 2026-08-24 |
| 03 | Componentes acadêmicos compartilhados | **DONE** | 2026-08-24 |
| 04 | Admin P0 | PENDING | — |
| 05 | Diretor P0 | PENDING | — |
| 06 | Professor P0 | PENDING | — |
| 07 | Aluno P0 | PENDING | — |
| 08 | Servidor Geral P0 | PENDING | — |
| 09 | Avaliações Municipais | PENDING | — |
| 10 | P1: evolução funcional | PENDING | — |
| 11 | Hardening, regressão e fechamento | PENDING | — |

## Próxima etapa autorizada a iniciar

Nenhuma. **Aguardando autorização explícita do usuário para iniciar a ETAPA 04.**

## Resumo da ETAPA 03

- 4 pontos reais de duplicação de fórmula/tela entre perfis, todos
  mapeados por leitura de código antes de extrair qualquer componente:
  1. `TurmaDetalheView` (`components/portal/turma-detalhe.tsx`, novo):
     consolida a ficha de turma do Admin e da Direção (~145 linhas cada →
     ~30), padronizando em `MetricCard`.
  2. `GradeTable` (`components/portal/grade-table.tsx`, novo): consolida a
     tabela de boletim de `AlunoDetalhe` e de `/portal/aluno/boletim`.
  3. `ComparisonDelta` (`components/ui/comparison-delta.tsx`, novo):
     consolida a apresentação (seta+cor+texto) de variação entre
     `/admin/indicadores/frequencia` e `/admin/indicadores/comparativos` —
     a classificação de favorabilidade continua em cada página, só a
     renderização foi compartilhada.
  4. `app/portal/direcao/frequencia/page.tsx` tinha uma terceira
     implementação inline do percentual de frequência — trocada por
     `calcularPercentualFrequencia`.
- `lib/format-date.ts` (`formatarDataIso`, novo) consolida uma duplicação
  que eu mesmo introduzi na ETAPA 02. Efeito colateral verificado (não
  planejado): corrige um viés de fuso horário de até 1 dia na exibição de
  datas (`new Date("YYYY-MM-DD")` é UTC pela spec; `T00:00:00` sem `Z` é
  local) — ver detalhes em `etapas/03-componentes-academicos-compartilhados.md`.
- `SchoolOverview`, `AttendanceTable`, `InsightCard`, `CoverageCard`,
  `EvaluationSummary` **não foram extraídos** — avaliados e descartados
  com justificativa (não há duplicação real hoje, ou dependem de telas que
  ainda não existem), não esquecidos.
- Baseline pós-mudança: `npm test` 143/143 (sem testes novos — mudanças são
  apresentacionais), `typecheck` limpo, `lint` limpo, `build` com sucesso
  (mesmas 46 rotas).
- Validação visual via browser **não foi executada** — mesma limitação de
  credenciais já registrada nas etapas 01/02.

Detalhes completos: [`etapas/03-componentes-academicos-compartilhados.md`](etapas/03-componentes-academicos-compartilhados.md).

## Resumo da ETAPA 02

- Novo utilitário puro `calcularJanelaDias(referencia, dias)` em
  `lib/analytics/frequencia.ts` (janela de calendário real em ISO, testado)
  — `calcularJanelaComparativaPadrao` (já existente em
  `lib/queries/frequencia.ts`) foi refatorada para reaproveitá-lo em vez de
  duplicar a matemática de datas.
- Novo componente `components/ui/data-freshness-badge.tsx`
  (`DataFreshnessBadge`), extraído do que era uma função local duplicada em
  `/admin/indicadores/qualidade` — agora reutilizado por essa página.
- 3 bugs concretos de período/freshness corrigidos, todos previamente
  mapeados por grep (nenhuma tela tocada "por via das dúvidas"):
  1. `lib/queries/academico.ts` (`getAlunoDetalheCompleto`) e
     `app/portal/aluno/frequencia/page.tsx`: `take: 90` **registros** →
     janela real de 90 **dias** corridos.
  2. `app/portal/aluno/frequencia/page.tsx`: fallback perigoso
     `totalAulas > 0 ? ... : 100` (frequência sem dado virando 100%) →
     `calcularPercentualFrequencia` (retorna `null`) + estado explícito
     "Sem dados no período". Também corrigido em
     `components/portal/aluno-detalhe.tsx` (componente compartilhado por
     Aluno/Direção/Professor), que tinha uma segunda implementação local
     da mesma fórmula.
  3. `app/admin/indicadores/page.tsx`: freshness "de qualquer módulo"
     (`logSincronizacao.findFirst` sem filtro) usada para todos os
     indicadores → `getStatusSincronizacao()`, com cada indicador citando a
     data de atualização do módulo correto (Frequência/Notas/Estudantes).
     Os 4 links de drill-down passaram a propagar `?ano=`.
- `AcademicContextBar`/`AnalysisScopeBar` e `MethodologyNote` **não foram
  criados** — decisão deliberada de não construir componente novo sem um
  segundo caso de uso real para validar a API (mesmo critério já usado para
  `CapabilityGate` na ETAPA 01); ver decisões técnicas 4 e 5 em
  `etapas/02-contexto-temporal-e-freshness.md`.
- Baseline pós-mudança: `npm test` 143/143 (140 pré-existentes + 3 novos),
  `typecheck` limpo, `lint` limpo, `build` com sucesso (mesmas 46 rotas).
- Validação end-to-end logada **não foi executada** — mesma limitação de
  credenciais já registrada na ETAPA 01; pendência para a ETAPA 11.

Detalhes completos: [`etapas/02-contexto-temporal-e-freshness.md`](etapas/02-contexto-temporal-e-freshness.md).

## Resumo da ETAPA 01

- Novo módulo `lib/authz/` (sem I/O, funções puras): `scope.ts`
  (`Scope` — `NetworkScope`/`SchoolScope`/`ProfessorScope`/`StudentSelfScope`/`StaffSelfScope`
  — e `scopeFromSession`), `authorize.ts` (`canViewEscola`, `canViewTurma`,
  `canViewEstudante`, `canViewServidor`) e `capabilities.ts` (`hasCapability`,
  documentando a única distinção real hoje entre ADMIN e SECRETARIA:
  `usuarios:manage`).
- Novo componente `components/ui/capability-gate.tsx` (`CapabilityGate`) —
  criado e testado por typecheck, ainda sem uso em nenhuma tela (aplicação
  visual é escopo da ETAPA 04).
- 33 novos testes (`lib/authz/{scope,authorize,capabilities}.test.ts`),
  cobrindo os cenários críticos da seção 12 do master prompt.
- Duas páginas refatoradas para consumir o módulo central em vez de
  checagem inline duplicada, comportamento preservado:
  `app/portal/direcao/alunos/[id]/page.tsx` e
  `app/portal/professor/turma/[id]/page.tsx`.
- `ServidorTurma` **não foi migrado** — decisão explícita de adiar para a
  ETAPA 06 (ver decisão técnica 1 em `etapas/01-scopes-e-capabilities.md`);
  o `ProfessorScope` atual já cobre o caso de turma com código repetido em
  outra escola, mas não múltiplas disciplinas na mesma turma.
- Baseline pós-mudança: `npm test` 140/140 (107 pré-existentes + 33 novos),
  `typecheck` limpo, `lint` limpo, `build` com sucesso (mesmas 46 rotas).
- Validação end-to-end logada (login real DIRETOR/PROFESSOR navegando para
  URL fora do escopo) **não foi executada** — sem credenciais de teste
  disponíveis nesta sessão; fica registrada como pendência para a ETAPA 11.

Detalhes completos: [`etapas/01-scopes-e-capabilities.md`](etapas/01-scopes-e-capabilities.md).

## Resumo da ETAPA 00

- Branch `main`, working tree limpo (apenas `claude_code_sme_base/` estava
  untracked — os 5 DOCX de origem e o próprio master prompt).
- Package manager: `npm` (`package-lock.json` presente; sem `yarn.lock`/`pnpm-lock.yaml`).
- Scripts confirmados em `package.json`: `dev`, `build`, `start`, `lint`,
  `typecheck`, `test`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `db:seed`.
- Estrutura `docs/plano-evolucao-sme/` criada por completo (`base/`,
  `base/extratos/`, `etapas/`, `decisoes/`).
- 5 DOCX copiados de `claude_code_sme_base/docs_base/` para
  `docs/plano-evolucao-sme/base/` (originais preservados no local de origem).
- 5 extratos Markdown gerados em `base/extratos/` a partir do XML interno de
  cada DOCX (sem `python-docx` disponível no ambiente Windows local).
- Baseline de testes registrado (ver `etapas/00-auditoria-e-baseline.md`):
  `npm test` (107/107 passando), `npm run typecheck` (limpo), `npm run lint`
  (limpo), `npm run build` (sucesso, 46 rotas).
- Nenhum comportamento funcional foi alterado.

Detalhes completos: [`etapas/00-auditoria-e-baseline.md`](etapas/00-auditoria-e-baseline.md).
