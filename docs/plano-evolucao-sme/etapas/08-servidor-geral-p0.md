# ETAPA 08 — Servidor Geral P0

## Status
PENDING

## Objetivo

Entregar uma ficha funcional confiável para o Servidor Geral, sem
overengineering (sem RH/contracheque/ponto/férias sem fonte de dados real).

## Por que esta etapa existe

O documento de Servidor Geral (`base/extratos/05-servidor-geral.md`) aponta
que `turno`/`carga_trabalho` podem ser perdidos quando o servidor não tem
turma (hoje persistidos via `ServidorTurma`) e que `pendenciaPedagogica`
precisa ter seu público/significado validado antes de ser exibido de forma
ampla. `SERVIDOR_GERAL` é um papel de fallback (`lib/roles.ts`) que cobre
cargos heterogêneos — a modelagem de lotação/dados funcionais precisa ser
avaliada antes de expandir a ficha.

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`).

## Escopo desta etapa

- Revisar perda de `turno` e `carga_trabalho` para servidores sem turma.
- Distinguir dado funcional de atribuição pedagógica.
- Avaliar necessidade de `ServidorLotacao` ou estrutura equivalente antes de
  migrar (decisão documentada antes de qualquer migração).
- Mostrar fonte/atualização dos dados.
- Revisar `pendenciaPedagogica` e seu público.
- Capabilities por tipo de função, somente quando houver necessidade real.
- Manter `Minha Conta` compartilhada.

## Fora de escopo

Qualquer módulo de RH, contracheque, ponto ou férias — não criar sem fonte de
dados e requisito explícito (regra explícita do master prompt).

## Arquivos/áreas previstos

`app/portal/servidor/**`, `prisma/schema.prisma` (somente se migração for
decidida e documentada), `app/conta/**` (Minha Conta compartilhada).

## Checklist
- [ ] Reler `base/Plano_Evolucao_MVP_Servidor_Geral_SME_Barauna.docx` / extrato.
- [ ] Confirmar código atual antes de alterar.
- [ ] Investigar perda de `turno`/`carga_trabalho` sem turma.
- [ ] Decidir e documentar (se necessário) modelagem de lotação.
- [ ] Validar público de `pendenciaPedagogica`.
- [ ] Testar: Servidor Geral não abre rota acadêmica.

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

A ficha funcional exibe somente dados confiáveis e o perfil não recebe
acesso acadêmico por padrão.

## Próximo passo permitido

ETAPA 09, somente mediante autorização explícita do usuário.
