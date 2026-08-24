# ETAPA 09 — Avaliações Municipais

## Status
PENDING

## Objetivo

Consolidar o módulo transversal de Avaliações Municipais e reutilizá-lo nos
perfis adequados, com uma única regra de cálculo por avaliação.

## Por que esta etapa existe

O schema (`Avaliacao`, `AvaliacaoQuestao`, `AvaliacaoResultadoAluno`, enum
`TipoAvaliacao`) já existe e há uma tela CRUD em `app/admin/avaliacoes/`
(confirmado em `docs/PLANO_DESENVOLVIMENTO.md`), mas sem item-a-item por
descritor/habilidade nem heatmap. Vários perfis (Admin, Diretor, Professor,
Aluno) precisam de visões coerentes da mesma avaliação — por isso esta etapa
vem depois das etapas P0 de cada perfil, que já preparam o encaixe.

## Pré-requisitos

ETAPAS 04, 05, 06, 07 e 08 concluídas (`DONE`).

## Escopo desta etapa

- Cobertura esperada x realizada.
- Status da avaliação (preparação/aplicação/coleta parcial/consolidada,
  quando derivável).
- Escolas/turmas pendentes.
- Paginação real (sem `take` fixo silencioso).
- Identidade por avaliação/ano/código (não agrupar só por nome).
- Editar questão/resultado quando permitido.
- Importação CSV/XLSX com preview e validação (pode virar P1 se muito
  extensa).
- Preencher/usar `respostasJson` para análise por item.
- Análise por questão/descritor.
- Fluência: níveis, palavras/minuto e evolução.
- Preparar estrutura futura de descritores/habilidades BNCC **sem inventar
  catálogo** se não houver fonte validada.

Por perfil: Admin (rede inteira), Diretor (própria escola), Professor
(turmas/disciplinas autorizadas), Aluno (próprios resultados), Servidor Geral
(sem acesso por padrão).

## Fora de escopo

Regras municipais configuráveis sem validação oficial (backlog P2).

## Arquivos/áreas previstos

`app/admin/avaliacoes/**`, `prisma/schema.prisma` (`Avaliacao`,
`AvaliacaoQuestao`, `AvaliacaoResultadoAluno`), novas rotas de avaliação nos
portais de Diretor/Professor/Aluno.

## Checklist
- [ ] Mapear estado real do CRUD de avaliações hoje.
- [ ] Implementar identidade por avaliação/ano/código.
- [ ] Implementar paginação real.
- [ ] Implementar cobertura esperada x realizada.
- [ ] Integrar visão por perfil (Admin/Diretor/Professor/Aluno).
- [ ] Testar: avaliação de mesmo nome/anos diferentes não é agrupada
      incorretamente.

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

Uma mesma avaliação produz visões coerentes e seguras nos perfis diferentes,
sem duplicar regra de cálculo.

## Próximo passo permitido

ETAPA 10, somente mediante autorização explícita do usuário.
