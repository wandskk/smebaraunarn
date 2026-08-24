# ETAPA 02 — Contexto temporal e Data Freshness

## Status
PENDING

## Objetivo

Impedir interpretações erradas causadas por períodos ou fontes de dados
incompatíveis sendo comparados/misturados silenciosamente.

## Por que esta etapa existe

O master prompt e os 5 DOCX apontam casos concretos já existentes no código
(ex.: frequência do aluno usando os "90 registros mais recentes" em vez de um
período real; freshness única para todos os módulos em vez de por fonte).
Resolver isso antes da ETAPA 03 (componentes compartilhados) evita propagar
o mesmo problema para os componentes extraídos.

## Pré-requisitos

ETAPA 01 concluída (`DONE`).

## Escopo desta etapa

- `AcademicContextBar` / `AnalysisScopeBar` reutilizável.
- Ano/período na URL quando fizer sentido (query params).
- Preservação de filtros nos deep-links.
- `DataFreshnessBadge` por fonte/módulo (não "última sincronização de
  qualquer módulo").
- Utilitários comuns para 30/60/90 dias ou bimestres.
- Remoção de comparações "90 registros = 90 dias".
- Estado explícito "Sem dados no período".
- Metodologia/limitações via `MethodologyNote` ou equivalente.

## Fora de escopo

- Extração de componentes acadêmicos maiores (ETAPA 03).
- Correções específicas de cada perfil que não sejam sobre período/freshness
  (isso é ETAPA 04–08).

## Arquivos/áreas previstos

- `lib/analytics/` (utilitários de período, se necessário).
- `lib/queries/frequencia.ts`, `lib/queries/academico.ts` e demais queries que
  hoje usam recortes implícitos (ex.: "últimos N registros").
- Componentes novos de contexto/freshness em `components/`.
- Telas que hoje comparam períodos incompatíveis (a mapear na investigação).

## Checklist
- [ ] Mapear todos os pontos que hoje usam "N registros mais recentes" em vez
      de período real.
- [ ] Mapear todos os pontos que hoje usam freshness genérica em vez de por
      módulo.
- [ ] Implementar `AcademicContextBar`/`AnalysisScopeBar`.
- [ ] Implementar `DataFreshnessBadge` por fonte/módulo.
- [ ] Implementar utilitários de período (30/60/90 dias, bimestre).
- [ ] Implementar estado "Sem dados no período".
- [ ] Implementar `MethodologyNote` ou equivalente.
- [ ] Corrigir os pontos mapeados de mistura de período.

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

Nenhuma tela alterada nesta etapa deve comparar períodos distintos
silenciosamente nem apresentar dado sem indicar seu contexto quando isso
afeta interpretação.

## Próximo passo permitido

ETAPA 03, somente mediante autorização explícita do usuário.
