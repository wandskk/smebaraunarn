# ETAPA 04 — Admin P0

## Status
PENDING

## Objetivo

Implementar os achados P0 do documento de Admin (`base/extratos/01-admin.md`
e `base/Plano_Evolucao_MVP_Admin_SME_Barauna.docx`) usando a fundação
compartilhada das etapas 01–03.

## Por que esta etapa existe

O Admin é o perfil com mais superfície (rede inteira) e o DOCX correspondente
já identifica que o próximo salto não é criar CRUDs novos, mas fazer as telas
responderem perguntas de gestão com rastreabilidade de período/fonte —
dependente de `NetworkScope`, freshness por módulo e componentes acadêmicos
compartilhados já existirem (etapas 01–03).

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`).

## Escopo desta etapa

- Dashboard com "Atenção agora" explicável (fato, valor, referência, período,
  motivo, deep-link — sem score opaco).
- Saúde/freshness de dados por módulo.
- `SchoolOverview` inteligente aplicado ao Admin.
- Turma com período consistente entre notas e frequência.
- Estudante com período explícito.
- Filtros úteis em escolas/estudantes/servidores/avaliações.
- `/admin/servidores/[id]` se ainda não existir.
- Capability visual Admin x Secretaria (refletindo capability real, não só
  papel).
- Sincronização com saúde por módulo e detecção de execução incompleta.
- Evitar CPF completo por padrão em listagens.

## Fora de escopo

Qualquer item marcado como P1 no documento de Admin (isso é ETAPA 10).

## Arquivos/áreas previstos

`app/admin/**`, `lib/queries/indicadores-gerais.ts`,
`lib/queries/comparativos.ts`, `lib/queries/qualidade-dados.ts`,
componentes compartilhados da ETAPA 03.

## Checklist
- [ ] Reler `base/Plano_Evolucao_MVP_Admin_SME_Barauna.docx` / extrato.
- [ ] Confirmar código atual de cada rota antes de alterar.
- [ ] Implementar "Atenção agora" explicável.
- [ ] Implementar saúde/freshness por módulo.
- [ ] Implementar período consistente em turma/estudante.
- [ ] Mascarar CPF por padrão.
- [ ] `/admin/servidores/[id]` (se ausente).

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

A visão Admin responde "onde devo olhar agora e por quê?" e todo indicador
relevante mantém rastreabilidade de período/fonte.

## Próximo passo permitido

ETAPA 05, somente mediante autorização explícita do usuário.
