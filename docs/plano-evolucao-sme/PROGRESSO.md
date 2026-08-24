# Progresso — Evolução Incremental do SME Baraúna

**Última atualização:** 2026-08-24 (ETAPA 00)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento, bloqueada ou concluída. Ao final de cada etapa, este arquivo deve
ser atualizado junto com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Auditoria, baseline e documentação | **DONE** | 2026-08-24 |
| 01 | Scopes e Capabilities | PENDING | — |
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

Nenhuma. **Aguardando autorização explícita do usuário para iniciar a ETAPA 01.**

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
