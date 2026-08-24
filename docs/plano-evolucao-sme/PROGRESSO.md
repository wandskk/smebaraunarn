# Progresso — Evolução Incremental do SME Baraúna

**Última atualização:** 2026-08-24 (ETAPA 01)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento, bloqueada ou concluída. Ao final de cada etapa, este arquivo deve
ser atualizado junto com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Auditoria, baseline e documentação | **DONE** | 2026-08-24 |
| 01 | Scopes e Capabilities | **DONE** | 2026-08-24 |
| 02 | Contexto temporal e Data Freshness | PENDING | — |
| 03 | Componentes acadêmicos compartilhados | PENDING | — |
| 04 | Admin P0 | PENDING | — |
| 05 | Diretor P0 | PENDING | — |
| 06 | Professor P0 | PENDING | — |
| 07 | Aluno P0 | PENDING | — |
| 08 | Servidor Geral P0 | PENDING | — |
| 09 | Avaliações Municipais | PENDING | — |
| 10 | P1: evolução funcional | PENDING | — |
| 11 | Hardening, regressão e fechamento | PENDING | — |

## Próxima etapa autorizada a iniciar

Nenhuma. **Aguardando autorização explícita do usuário para iniciar a ETAPA 02.**

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
