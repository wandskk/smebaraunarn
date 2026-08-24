# ETAPA 11 — Hardening, regressão e fechamento

## Status
PENDING

## Objetivo

Fechar a rodada de evolução sem dívida técnica oculta.

## Por que esta etapa existe

Depois de 11 etapas de mudança incremental, é necessário uma varredura final
de autorização, PII, qualidade (lint/typecheck/testes/build) e estados de
UI antes de considerar a rodada encerrada — e registrar explicitamente o que
fica para depois (P2).

## Pré-requisitos

ETAPAS 00 a 10 concluídas (`DONE`).

## Escopo desta etapa

- Revisão de autorização por URL direta em todas as rotas sensíveis.
- Revisão de exposição de PII (CPF, dados pessoais).
- Lint.
- Typecheck.
- Testes unitários.
- Testes de integração disponíveis.
- Build de produção.
- Smoke test das rotas principais (se houver ferramenta de navegador
  disponível no ambiente).
- Verificar estados vazio/loading/error.
- Verificar mobile nos componentes alterados.
- Verificar acessibilidade básica.
- Revisar documentação (`docs/plano-evolucao-sme/**`,
  `docs/PLANO_DESENVOLVIMENTO.md`).
- Consolidar decisões em `decisoes/`.
- Atualizar `PROGRESSO.md` para o estado final.
- Gerar lista separada de P2/futuro, sem implementá-la automaticamente.

### P2 conhecido para backlog (do master prompt, não implementar aqui)

- `AlertaAnalitico` persistente, somente após validar regras dinâmicas.
- `IntervencaoPedagogica`.
- `MetaEducacional`.
- `LogAuditoriaLGPD`.
- Descritor/habilidade BNCC estruturado.
- `lastLoginAt`/trilha de segurança.
- Histórico/coortes avançadas.
- Regras municipais configuráveis após validação oficial.

## Fora de escopo

Implementar qualquer item do backlog P2 listado acima.

## Arquivos/áreas previstos

Todo o repositório (varredura), sem escopo de arquivo único previsto.

## Checklist
- [ ] Autorização por URL direta revisada em todas as rotas sensíveis.
- [ ] PII revisada (CPF, dados pessoais).
- [ ] `npm run lint` limpo.
- [ ] `npm run typecheck` limpo.
- [ ] `npm test` passando.
- [ ] `npm run build` com sucesso.
- [ ] Smoke test das rotas principais.
- [ ] Estados vazio/loading/error verificados.
- [ ] Mobile verificado nos componentes alterados.
- [ ] Acessibilidade básica verificada.
- [ ] `PROGRESSO.md` atualizado para o estado final.
- [ ] Lista de P2/futuro gerada.

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

Repositório sem dívida oculta conhecida na rodada, documentação e
`PROGRESSO.md` refletindo o estado final, backlog P2 registrado sem
implementação.

## Próximo passo permitido

Nenhum — esta é a última etapa da rodada. Apresentar relatório final ao
usuário.
