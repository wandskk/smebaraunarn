# ETAPA 07 — Aluno P0

## Status
PENDING

## Objetivo

Tornar o portal individual do Aluno/Responsável claro e semanticamente
correto.

## Por que esta etapa existe

O documento de Aluno (`base/extratos/02-aluno.md`) identifica o achado mais
citado no master prompt: frequência sem registros não pode virar 100%. Também
aponta o uso de "90 registros mais recentes" em vez de período real — que a
ETAPA 02 já deve ter corrigido de forma genérica; aqui se aplica ao portal do
Aluno especificamente.

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`).

## Escopo desta etapa

- Frequência sem dados = "Sem dados", nunca 100%.
- Período temporal explícito.
- Revisar conceito de "faltas abonadas" (hoje conta registros marcados como
  abonados, não necessariamente a quantidade de faltas abonadas).
- Boletim com ano selecionável e média parcial/final clara.
- Home focada no resumo acadêmico do período.
- Reduzir destaque de NIS/filiação na Home.
- Integrar Avaliações Municipais próprias (sem ranking público).
- Não criar ranking de estudantes.

## Fora de escopo

Implementação completa do módulo de Avaliações Municipais (ETAPA 09) — aqui
só se integra a visão própria do aluno, se já houver dado disponível.

## Arquivos/áreas previstos

`app/portal/aluno/**`, `lib/queries/frequencia.ts`,
`lib/analytics/frequencia.ts`, componentes compartilhados da ETAPA 03.

## Checklist
- [ ] Reler `base/Plano_Evolucao_MVP_Aluno_SME_Barauna.docx` / extrato.
- [ ] Confirmar código atual de cada rota antes de alterar.
- [ ] Garantir que frequência sem dados nunca aparece como 100%.
- [ ] Revisar cálculo de faltas abonadas.
- [ ] Adicionar seletor de ano/período no boletim.
- [ ] Reduzir NIS/filiação na Home.
- [ ] Testar: aluno sem frequência não recebe 100%.

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

Aluno/responsável consegue entender notas, frequência, atualização e
avaliações sem ambiguidade de período.

## Próximo passo permitido

ETAPA 08, somente mediante autorização explícita do usuário.
