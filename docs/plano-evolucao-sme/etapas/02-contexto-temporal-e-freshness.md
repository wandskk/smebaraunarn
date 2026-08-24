# ETAPA 02 — Contexto temporal e Data Freshness

## Status
DONE

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
- [x] Mapear todos os pontos que hoje usam "N registros mais recentes" em vez
      de período real.
- [x] Mapear todos os pontos que hoje usam freshness genérica em vez de por
      módulo.
- [ ] Implementar `AcademicContextBar`/`AnalysisScopeBar` — **adiado**, ver
      Decisões técnicas item 4.
- [x] Implementar `DataFreshnessBadge` por fonte/módulo.
- [x] Implementar utilitários de período (30/60/90 dias) — reaproveitando e
      consolidando o que já existia, em vez de criar um segundo mecanismo
      paralelo (ver Decisões técnicas item 1). Bimestre **não** foi
      implementado — segue sem calendário letivo modelado (ver
      `docs/PLANO_DESENVOLVIMENTO.md` §8, item 2).
- [x] Implementar estado "Sem dados no período".
- [ ] Implementar `MethodologyNote` — **adiado**, ver Decisões técnicas item 5.
- [x] Corrigir os pontos mapeados de mistura de período (os 3 reais
      encontrados — ver Alterações realizadas).

## Alterações realizadas

**Mapeamento (antes de alterar código):**
- `take: 90` (registros mais recentes, não período) encontrado em exatamente
  2 lugares: [`lib/queries/academico.ts`](../../../lib/queries/academico.ts)
  (`getAlunoDetalheCompleto`, usado por Aluno/Direção/Professor via
  `AlunoDetalhe`) e
  [`app/portal/aluno/frequencia/page.tsx`](../../../app/portal/aluno/frequencia/page.tsx).
  Nenhum outro `take` numérico em `lib/queries/**` combinado com
  `orderBy: { data: ... }` foi encontrado sobre `FrequenciaEstudante`.
- Fallback perigoso "sem dado = 100%" (viola a regra 7.4 do master prompt)
  encontrado em exatamente 1 lugar:
  `app/portal/aluno/frequencia/page.tsx:25` (`totalAulas > 0 ? ... : 100`).
  Confirmado por grep que `calcularPercentualFrequencia` (que já retorna
  `null`, nunca 100, para zero aulas) é usado em todos os outros pontos do
  código (`lib/queries/{indicadores-gerais,frequencia,comparativos}.ts`) —
  este era o único lugar com uma segunda implementação divergente da fórmula.
- Freshness "de qualquer módulo" usada para validar indicadores de módulos
  diferentes: encontrado em
  [`app/admin/indicadores/page.tsx`](../../../app/admin/indicadores/page.tsx)
  (`prisma.logSincronizacao.findFirst({ orderBy: { createdAt: "desc" } })`
  sem filtro de módulo, reutilizado como `dataAtualizacao` para indicadores
  de Estudantes/Frequência/Notas simultaneamente). `getStatusSincronizacao()`
  (`lib/queries/qualidade-dados.ts`) já calcula freshness corretamente por
  módulo e já era usada assim em `/admin/indicadores/qualidade` — a
  ferramenta certa já existia, só não estava sendo usada aqui.
- Contexto (ano letivo) não preservado nos deep-links: os 4 links de
  drill-down de `/admin/indicadores` (Frequência, Aprendizagem,
  Fluxo-trajetória, Comparativos) não propagavam `?ano=`, apesar de todas as
  4 páginas de destino já aceitarem e usarem esse parâmetro
  (`resolverAnoLetivo`).

**Novo utilitário puro** em
[`lib/analytics/frequencia.ts`](../../../lib/analytics/frequencia.ts):
`calcularJanelaDias(referencia, dias)` — janela de calendário real (`{inicio,
fim}` em ISO `YYYY-MM-DD`, compatível com o campo `FrequenciaEstudante.data`,
que é `String`, não `DateTime`). Testado em
[`lib/analytics/frequencia.test.ts`](../../../lib/analytics/frequencia.test.ts)
(3 novos testes). `calcularJanelaComparativaPadrao`
(`lib/queries/frequencia.ts`, já existente e já usada por
`/admin/indicadores/frequencia` e `/admin/indicadores/comparativos`) foi
refatorada para reaproveitar essa função em vez de duplicar a mesma
matemática de datas — comportamento preservado (verificado por raciocínio
sobre aritmética de datas + suíte de testes completa passando).

**Novo componente de UI**
[`components/ui/data-freshness-badge.tsx`](../../../components/ui/data-freshness-badge.tsx)
(`DataFreshnessBadge`) — extrai o badge de situação de sincronização que
antes era uma função local (`SituacaoBadge`) duplicada dentro de
`app/admin/indicadores/qualidade/page.tsx`. Passou a ser reutilizado (não só
criado): a própria página de Qualidade dos Dados agora importa o componente
central em vez de manter sua cópia local.

**Correção dos 3 pontos mapeados:**
1. [`lib/queries/academico.ts`](../../../lib/queries/academico.ts)
   (`getAlunoDetalheCompleto`): `take: 90` → janela de 90 dias corridos
   (`DIAS_FREQUENCIA_FICHA_ALUNO`, via `calcularJanelaDias`), filtrando por
   `data: { gte, lte }`. `AlunoDetalheCompleto` ganhou o campo
   `janelaFrequencia` para a UI poder mostrar o período real em vez de "N
   registros".
2. [`app/portal/aluno/frequencia/page.tsx`](../../../app/portal/aluno/frequencia/page.tsx):
   mesma correção de janela; `percentualPresenca` agora usa
   `calcularPercentualFrequencia` (a mesma função usada pelos outros
   perfis) em vez de uma fórmula local com fallback para `100`; UI mostra
   "Sem dados no período" (com as datas do período) em vez de inventar
   100% ou omitir o motivo.
3. [`components/portal/aluno-detalhe.tsx`](../../../components/portal/aluno-detalhe.tsx)
   (componente compartilhado por Aluno/Direção/Professor): mesma correção —
   reaproveita `calcularPercentualFrequencia`, título "Frequência (N
   registro(s))" → "Frequência ({período})", estado vazio agora diz "Sem
   dados no período" com as datas, em vez de um "-" mudo ou mensagem
   genérica.
4. [`app/admin/indicadores/page.tsx`](../../../app/admin/indicadores/page.tsx):
   troca a busca de sincronização global por `getStatusSincronizacao()`;
   cada `MetricCard.explicacao` agora cita a data de atualização do módulo
   correto (Estudantes/Ativas e Distorção → `ESTUDANTES`; Frequência e
   Estudantes abaixo da faixa → `FREQUENCIA`; Desempenho → `NOTAS`); os 4
   links de drill-down e o link inline de "Comparativos" agora propagam
   `?ano=` via um helper local `comAno()`; a descrição do cabeçalho não cita
   mais uma única "última sincronização" (afirmação que já era falsa para
   uma página com 3 fontes de dados diferentes).

## Decisões técnicas

1. **Não foi criado um `lib/periodo.ts` novo.** `lib/queries/frequencia.ts`
   já tinha `calcularJanelaComparativaPadrao`/`resolverDataReferenciaJanela`
   — funções puras, só posicionadas num arquivo de queries. Em vez de
   duplicar esse conceito num módulo novo, o utilitário genérico
   (`calcularJanelaDias`) foi adicionado a `lib/analytics/frequencia.ts`
   (mesmo módulo de `calcularPercentualFrequencia`, já o lugar certo para
   "regra de negócio pura" no projeto — ver
   `docs/PLANO_DESENVOLVIMENTO.md` princípio 2) e a função existente passou
   a reaproveitá-lo. `calcularJanelaComparativaPadrao`/`resolverDataReferenciaJanela`
   não foram movidas de arquivo — mover exigiria atualizar imports em 2
   páginas que já funcionam, por um ganho só organizacional; não valia o
   risco para esta etapa.
2. **A janela padrão de frequência do Aluno ficou em 90 dias corridos**
   (`DIAS_FREQUENCIA_FICHA_ALUNO`), mantendo o mesmo número que já existia
   como contagem de registros — só trocando a semântica de "90 registros"
   para "90 dias de calendário". Não foi feita nenhuma tentativa de
   adivinhar se 90 é o valor certo para o produto (isso é decisão de
   negócio, não uma correção técnica) — só a correção do que o número
   *significa*.
3. **Equivalência do refactor de `calcularJanelaComparativaPadrao` verificada
   por raciocínio matemático, não só pelos testes.** A função original
   calculava a data "anterior" a partir de `atualInicio` com o horário
   original de `hoje` preservado; a nova versão reconstrói `atual.inicio` a
   partir da string ISO (`T00:00:00Z`) antes de subtrair. Como todas as
   subtrações envolvidas são múltiplos inteiros de 24h, o componente de
   hora não afeta a data resultante — as duas formas produzem exatamente a
   mesma data em qualquer caso. Não havia teste automatizado prévio para
   esta função (só é usada em 2 páginas, sem `lib/queries/frequencia.test.ts`);
   não foi criado um agora porque o objetivo da função já é coberto
   indiretamente pelos novos testes de `calcularJanelaDias`, sua base.
4. **`AcademicContextBar`/`AnalysisScopeBar` não foi criada nesta etapa.**
   O único ponto de "contexto ano/período preservado no drill-down"
   corrigido concretamente (`/admin/indicadores` → suas 4 subpáginas) já
   tinha toda a UI de seletor de ano pronta em cada página de destino
   (`resolverAnoLetivo` + `<Select>`); o que faltava era só propagar o
   parâmetro, não uma barra de contexto nova. Construir um componente
   `AcademicContextBar` genérico sem um segundo caso de uso real para
   validar a API seria repetir o risco descrito na seção 6 do master
   prompt ("não crie um componente só porque o nome aparece"). Fica como
   candidato natural da ETAPA 03 (componentes acadêmicos compartilhados),
   quando mais pontos de drill-down (Direção, Professor) forem revisados
   e a API do componente puder ser desenhada a partir de 2+ usos reais, não
   de 1.
5. **`MethodologyNote` não foi criado nesta etapa.** O mecanismo de
   explicabilidade "fonte, fórmula, atualização, limitações" já existe e
   está em produção via `lib/analytics/explicabilidade.ts`
   (`descreverContexto`) renderizado como tooltip nativo em `MetricCard`
   (prop `explicacao`, ícone `Info`) — é isso que ficou correto nesta etapa
   ao trocar a fonte da data de atualização de global para por módulo. Um
   `MethodologyNote` como bloco de rodapé de página (não tooltip por card)
   é um formato de apresentação diferente do que já existe, não uma
   correção — decidido não construir um segundo mecanismo de
   explicabilidade em paralelo ao já usado em produção sem antes decidir,
   com o usuário, se o tooltip atual deve ser substituído ou
   complementado.
6. **Escopo dos "3 pontos mapeados" foi mantido estritamente ao que veio de
   grep/leitura de código, não de suposição.** Antes de editar, foi
   confirmado por grep que `take: 90`/`: 100` de fallback existiam em
   exatamente esses lugares — nenhuma outra tela foi tocada "por via das
   dúvidas". `app/portal/direcao/frequencia/page.tsx`,
   `app/admin/indicadores/frequencia/page.tsx` e outras páginas de
   frequência já usavam `calcularPercentualFrequencia` e janelas de data
   reais (`gte`/`lte`) — não precisavam de correção.

## Testes executados

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Resultado dos testes

- `npm test`: **143 testes, 29 suítes, 143 passaram, 0 falharam** (140
  anteriores + 3 novos em `lib/analytics/frequencia.test.ts` para
  `calcularJanelaDias`).
- `npm run typecheck`: sem erros.
- `npm run lint`: sem warnings/erros.
- `npm run build`: sucesso, as mesmas 46 rotas continuam gerando.

Validação end-to-end via browser (login real de Aluno com/sem frequência no
período, e conferência visual de `/admin/indicadores` com módulos
dessincronizados em datas diferentes) **não foi executada** — mesma
limitação já registrada na ETAPA 01 (sem credenciais de teste disponíveis
nesta sessão). Fica pendente para a ETAPA 11.

## Riscos e pendências

1. **Validação end-to-end logada não foi feita** (ver acima).
2. **`AcademicContextBar` e `MethodologyNote` não existem ainda** — decisão
   deliberada de adiar (ver Decisões técnicas 4 e 5); a ETAPA 03 é o
   próximo ponto natural para revisitar essa decisão com mais casos de uso
   reais.
3. **Bimestre/calendário letivo continua não modelado** — janelas de
   período seguem sendo "N dias corridos", não "1º bimestre 2026" etc.,
   porque a Secretaria ainda não confirmou o calendário oficial (achado
   pré-existente, ver `docs/PLANO_DESENVOLVIMENTO.md` §8, item 2). Não é
   algo que esta etapa poderia resolver sozinha.
4. **`DIAS_FREQUENCIA_FICHA_ALUNO = 90` não foi validado com a Secretaria**
   como o período "certo" para a ficha do aluno — é o mesmo número que já
   existia (antes como contagem de registros), agora com o significado
   correto (dias). Se 90 dias não for o período que faz sentido para o
   produto, isso é uma decisão de negócio para a ETAPA 07 (Aluno P0), não
   uma pendência técnica desta etapa.
5. **Outras telas de frequência por perfil** (`app/portal/direcao/frequencia`,
   `app/admin/indicadores/frequencia`, etc.) não foram auditadas por completo
   nesta etapa além de confirmar que não têm o padrão `take: N` — uma
   auditoria mais profunda de cada uma (ex.: se todas propagam contexto de
   filtro corretamente) fica para as etapas por perfil (04–08).

## Critérios de aceite

Nenhuma tela alterada nesta etapa deve comparar períodos distintos
silenciosamente nem apresentar dado sem indicar seu contexto quando isso
afeta interpretação.

## Próximo passo permitido

ETAPA 03, somente mediante autorização explícita do usuário.
