# ETAPA 05 — Diretor P0

## Status
PENDING

## Objetivo

Transformar a Direção em cockpit da própria escola, reutilizando o núcleo do
Admin com `SchoolScope`, não duplicando como mini-Admin.

## Por que esta etapa existe

O documento de Diretor (`base/extratos/03-diretor.md`) identifica que a Home
deve reutilizar `SchoolOverview` do Admin e que hoje há riscos de mistura de
período (histórico x ano atual) e truncamento silencioso em avaliações
(`take: 100`). Depende de `SchoolScope` (ETAPA 01) e dos componentes
compartilhados (ETAPA 03) já existirem.

## Pré-requisitos

ETAPAS 01, 02, 03 e 04 concluídas (`DONE`).

## Escopo desta etapa

- Home reutilizando `SchoolOverview` com `SchoolScope`.
- Turmas com frequência/aprendizagem alinhadas temporalmente.
- Lista/ficha de estudantes usando componente compartilhado.
- Avaliações sem truncamento silencioso (`take: 100` como se fosse visão
  completa).
- Agrupar avaliação por identidade real (`avaliacaoId`/código/ano), não só
  nome.
- Cobertura esperada x realizada.
- Vínculo Diretor → Escola claramente tratado (visível e confiável).
- Consistência de rotas de estudantes (avaliar `/alunos/[id]` →
  `/estudantes/[id]` quando seguro).

## Fora de escopo

Itens P1 do documento de Diretor (ETAPA 10).

## Arquivos/áreas previstos

`app/portal/direcao/**`, `lib/queries/*` consumidas por essas rotas,
componentes compartilhados da ETAPA 03.

## Checklist
- [ ] Reler `base/Plano_Evolucao_MVP_Diretor_SME_Barauna.docx` / extrato.
- [ ] Confirmar código atual de cada rota antes de alterar.
- [ ] Reutilizar `SchoolOverview` com `SchoolScope` na Home.
- [ ] Corrigir truncamento silencioso em avaliações.
- [ ] Corrigir agrupamento de avaliação por identidade.
- [ ] Validar/tratar vínculo Diretor → Escola ausente/quebrado.

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

Tudo que o Diretor vê está restrito à própria escola e usa o mesmo cálculo do
Admin para a mesma entidade.

## Próximo passo permitido

ETAPA 06, somente mediante autorização explícita do usuário.
