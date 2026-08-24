# ETAPA 07 — Aluno P0

## Status
DONE

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
- [x] Reler `base/Plano_Evolucao_MVP_Aluno_SME_Barauna.docx` / extrato.
- [x] Confirmar código atual de cada rota antes de alterar.
- [x] Garantir que frequência sem dados nunca aparece como 100% (já
      satisfeito desde a ETAPA 02).
- [x] Revisar cálculo de faltas abonadas.
- [x] Adicionar seletor de ano/período no boletim (e período na
      frequência).
- [x] Reduzir NIS/filiação na Home.
- [x] Testar: aluno sem frequência não recebe 100% (cobertura já existente
      em `lib/analytics/frequencia.test.ts:199-201` desde antes desta
      etapa — `calcularPercentualFrequencia(0, 0)` retorna `null`, e a
      página usa esse retorno para renderizar "Sem dados no período").

## Alterações realizadas

### Plano de execução (registrado antes de editar)

Levantamento do código atual mostrou que 2 dos achados P0 do documento
("frequência sem aulas retorna 100%" e "janela de 90 registros em vez de
90 dias") **já foram corrigidos na ETAPA 02** — `app/portal/aluno/frequencia/page.tsx`
já usa `calcularJanelaDias`/`calcularPercentualFrequencia` com período real.
Trabalho real desta etapa, em 4 sub-lotes:

1. **Frequência**: corrigir "faltas abonadas" (hoje conta registros, não a
   quantidade real de faltas abonadas) + seletor de período (7/30/60/90
   dias, hoje fixo em 90) + freshness de FREQUENCIA.
2. **Boletim**: seletor de ano visível (hoje só aceita `?ano` sem UI) +
   média parcial vs. final + completude por disciplina (x/4 unidades) +
   freshness de NOTAS.
3. **Home**: resumo do período (frequência atual, disciplinas com notas,
   última avaliação) + mover NIS/filiação para bloco recolhível + remover
   ranking (não havia).
4. **Avaliações Municipais próprias**: nova `/portal/aluno/avaliacoes`
   (lista) + `/portal/aluno/avaliacoes/[id]` (detalhe), reaproveitando
   `lib/queries/avaliacoes.ts` (ETAPA 05), sem ranking/posição.

### Arquivos alterados/criados

- `app/portal/aluno/frequencia/page.tsx`: faltas abonadas somando `falta`
  dos registros abonados (não mais contando linhas); seletor de período
  (7/30/60/90 dias, form `?dias=`); `DataFreshnessBadge` de FREQUENCIA.
- `app/portal/aluno/boletim/page.tsx`: seletor de ano visível
  (`resolverAnoLetivo`, mesmo padrão do Admin/Diretor); aviso de médias
  parciais; `DataFreshnessBadge` de NOTAS.
- `components/portal/grade-table.tsx` (`GradeTable`): novo prop opcional
  `mostrarCompletude` — coluna "Situação" (Final/Parcial x/4) só quando
  pedido explicitamente; comportamento inalterado para quem não passa o
  prop (Admin/Direção/Professor/portal do Aluno antes desta etapa).
- `app/portal/aluno/page.tsx`: reescrita — resumo de 30 dias (frequência,
  disciplinas com nota no ano, última avaliação municipal) no topo;
  atalhos abaixo; NIS/filiação/responsável movidos para `<details>`
  recolhível "Dados cadastrais".
- Novo `lib/queries/avaliacoes.ts` (`getAvaliacoesResultadosPorEstudante`)
  — reaproveita `TIPO_AVALIACAO_LABEL`/`NIVEL_FLUENCIA_LABEL` já criados
  na ETAPA 05.
- Novas `app/portal/aluno/avaliacoes/page.tsx` (lista) e
  `app/portal/aluno/avaliacoes/[id]/page.tsx` (detalhe + evolução pessoal
  por tipo de avaliação, sem ranking).
- `components/portal/sidebar.tsx`: item "Avaliações Municipais" adicionado
  à navegação do Aluno.

## Decisões técnicas

1. **Resumo da Home usa janela própria de 30 dias, diferente dos 90 dias
   padrão da página de Frequência.** O documento de Aluno cita exemplos
   de mensagem curta e recente ("nenhuma falta nos últimos 7 dias"); um
   resumo de "situação agora" pede uma janela mais curta que a ficha
   analítica completa. Rotulado explicitamente ("Resumo dos últimos 30
   dias") para não ser confundido com o percentual da página de
   Frequência, que usa período selecionável (padrão 90 dias) — os dois
   números podem legitimamente divergir, e por isso cada um informa seu
   próprio período (regra 7.3 do master prompt).
2. **`mostrarCompletude` do `GradeTable` é opt-in, não o padrão novo.** A
   ficha do estudante usada por Admin/Direção/Professor
   (`components/portal/aluno-detalhe.tsx`) não pediu essa mudança nesta
   etapa; adicionar a coluna "Situação" ali sem necessidade real
   contrariaria o princípio de não fazer refatoração estética sem ganho
   (regra geral do master prompt, seção 13). Fica disponível para os
   outros perfis adotarem quando fizer sentido.
3. **Avaliações do Aluno reaproveitam a query em vez de duplicar
   TIPO_AVALIACAO_LABEL/NIVEL_FLUENCIA_LABEL.** Mesma direção da ETAPA 05
   (centralizar em `lib/queries/avaliacoes.ts`) — terceira tela a usar
   esses rótulos (Admin, Diretor, agora Aluno) sem repetir o `Record<...>`.
4. **Sem filtros na lista de avaliações do Aluno.** O documento marca
   filtros por ano/tipo como conveniência (não P0), e a lista de um único
   estudante tende a ser pequena — adicionar filtro agora seria
   complexidade sem necessidade real comprovada ainda.
5. **Declaração de matrícula não foi tocada.** Fora do escopo P0 explícito
   do master prompt para esta etapa (a rota já "resolve bem a tarefa
   principal" segundo o próprio documento); fica candidata a P1 (seletor
   de ano, mensagens de erro orientadas) na ETAPA 10.

## Testes executados

- `npm test` (suíte completa).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.

## Resultado dos testes

- `npm test`: **184/184** (sem testes novos — mudanças desta etapa são
  apresentacionais/agregação simples em componentes de página, seguindo o
  padrão já estabelecido do projeto de só cobrir com `node:test` a
  camada pura `lib/analytics/*`; a correção de "faltas abonadas" é um
  `reduce` de duas linhas direto na página, no mesmo nível de
  granularidade do código que substituiu).
- `npm run typecheck`: limpo.
- `npm run lint`: limpo (0 warnings/erros).
- `npm run build`: sucesso — 63 rotas (2 novas:
  `/portal/aluno/avaliacoes` e `/portal/aluno/avaliacoes/[id]`).
- Validação end-to-end logada como ALUNO real **não foi executada** —
  mesma limitação de credenciais de teste já registrada desde a ETAPA 01;
  fica pendente para a ETAPA 11.

## Riscos e pendências

- **Faixa oficial de frequência ainda provisória** (`FAIXAS_PADRAO_FREQUENCIA`,
  85%/75%) — não é um problema desta etapa; o Aluno intencionalmente não
  expõe faixa/badge de frequência (só o percentual + "Sem dados no
  período" quando aplicável). `FaixaBadge` foi avaliado como linguagem
  mais adequada à gestão (Admin/Diretor) do que ao Aluno/responsável.
- Declaração de matrícula sem seletor de ano nem mensagens de erro
  orientadas — registrado como P1 explícito (decisão técnica 5).
- Filtros de avaliações (ano/tipo) não implementados — ver decisão
  técnica 4; reavaliar se o número de resultados por estudante crescer.
- Validação visual/E2E autenticada como ALUNO real continua pendente
  (ETAPA 11), mesma limitação já registrada desde a ETAPA 01.

## Critérios de aceite

Aluno/responsável consegue entender notas, frequência, atualização e
avaliações sem ambiguidade de período.

## Próximo passo permitido

ETAPA 08, somente mediante autorização explícita do usuário.
