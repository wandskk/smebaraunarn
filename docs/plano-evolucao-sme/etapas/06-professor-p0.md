# ETAPA 06 — Professor P0

## Status
PENDING

## Objetivo

Corrigir primeiro o modelo de escopo pedagógico do Professor e só então
aprofundar o portal.

## Por que esta etapa existe

Esta é a etapa de maior risco de segurança/escopo identificada na ETAPA 00: a
Home hoje pode contar todos os alunos da escola quando o professor não tem
turma, e `ServidorTurma` não tem `escolaId` nem modela disciplina na chave de
unicidade — o que é estruturalmente frágil quando códigos de turma se repetem
entre escolas (achado confirmado no schema real, ver
`etapas/00-auditoria-e-baseline.md` e `MATRIZ_REAPROVEITAMENTO.md`).

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`). Não depende de 04/05 estarem
concluídas, mas é recomendável já ter passado por elas para reaproveitar
padrões.

## Escopo desta etapa

1. Corrigir contagem da Home quando não há turmas.
2. Revisar `ProfessorScope`.
3. Validar professor atuando em múltiplas escolas.
4. Revisar `ServidorTurma` e necessidade de `escolaId`/disciplina na
   identidade (decisão de migração, se necessária, documentada antes de
   executar — seção 7.8 do master prompt).
5. Se houver migração: documentar/backfill/testar antes de aplicar.
6. Criar verdadeira visão de "Minhas Turmas".
7. Separar rota conceitual de turma e rota de estudante (hoje
   `/portal/professor/turma/[id]` representa estudante, não turma).
8. Estudante detalhado deve respeitar disciplina/capability do professor.
9. Preparar encaixe de Avaliações Municipais das próprias turmas.

## Fora de escopo

Implementação completa do módulo de Avaliações Municipais (ETAPA 09) — aqui
só se prepara o encaixe.

## Arquivos/áreas previstos

`app/portal/professor/**`, `prisma/schema.prisma` (somente se migração for
decidida e documentada), scope de professor da ETAPA 01.

## Checklist
- [ ] Reler `base/Plano_Evolucao_MVP_Professor_SME_Barauna.docx` / extrato.
- [ ] Confirmar código atual de cada rota antes de alterar.
- [ ] Corrigir contagem da Home sem turma.
- [ ] Decidir e documentar (se necessário) migração de `ServidorTurma`.
- [ ] Separar rota de turma da rota de estudante.
- [ ] Testar: professor não abre estudante de turma não autorizada via URL
      direta.

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

Um professor jamais vê aluno/turma/disciplina fora da atribuição efetivamente
permitida, inclusive por URL direta.

## Próximo passo permitido

ETAPA 07, somente mediante autorização explícita do usuário.
