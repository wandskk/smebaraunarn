# Progresso — Observação Multi-Ano nos Indicadores + Avaliações do Município

**Última atualização:** 2026-09-10 (ETAPA 08 concluída — aguardando autorização
para iniciar a ETAPA 09)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento ou concluída. Ao final de cada etapa, atualizar esta tabela junto
com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Fonte única de "anos letivos disponíveis" | **DONE** | 2026-09-10 |
| 01 | Corrigir contagem de população histórica | **DONE** | 2026-09-10 |
| 02 | Seletor de ano persistente (URL + cookie) | **DONE** | 2026-09-10 |
| 03 | Componente de gráfico de evolução histórica | **DONE** | 2026-09-10 |
| 04 | Queries de evolução histórica por indicador | **DONE** | 2026-09-10 |
| 05 | Rollout: Frequência e Aprendizagem | **DONE** | 2026-09-10 |
| 06 | Rollout: Fluxo-Trajetória e Comparativos | **DONE** | 2026-09-10 |
| 07 | Rollout: Portal da Direção | **DONE** | 2026-09-10 |
| 08 | Nova página `/admin/indicadores/avaliacoes` | **DONE** | 2026-09-10 |
| 09 | Atualizar a Central (`/admin/indicadores`) | PENDENTE | |
| 10 | Validação final e fechamento | PENDENTE | |

## Resumo da ETAPA 00

Nova `getAnosLetivosDisponiveis(scope?: {escolaId})` em
`lib/queries/anos-letivos.ts`, combinando `DISTINCT ano` de `NotaEstudante` e
`Avaliacao` com o ano extraído de `FrequenciaEstudante.data` (reduzido em
memória, sem SQL cru). Substituiu `prisma.estudante.groupBy({by:["ano"]})` em
10 páginas: `app/admin/indicadores/page.tsx`, `aprendizagem/page.tsx`,
`frequencia/page.tsx`, `comparativos/page.tsx`, `fluxo-trajetoria/page.tsx`,
`app/portal/direcao/page.tsx`, `app/admin/escolas/[id]/page.tsx`,
`app/admin/page.tsx`, `app/admin/turmas/page.tsx`, `app/admin/estudantes/page.tsx`.
(`app/admin/avaliacoes/page.tsx` e `app/portal/aluno/boletim/page.tsx` já
derivavam anos corretamente de `Avaliacao`/`NotaEstudante` próprios — não
precisaram de alteração.) Imports de `prisma` removidos nos 5 arquivos onde
ficaram sem outro uso.

Com o dataset atual, a nova fonte retornou a mesma lista que a antiga
(`[2026, 2025, 2024]` nos dois casos) — o problema de "anos que somem da
lista" é uma condição de borda que ainda não se manifestou nos dados de hoje,
mas a fonte antiga continuava estruturalmente errada (dependia de
`Estudante.ano`, um snapshot sobrescrito) e agora está corrigida na raiz.

**Achado quantificado nesta etapa (vira a ETAPA 01):** comparando
`prisma.estudante.count({where:{ano}})` (fonte ingênua, hoje usada em
`getIndicadoresGeraisRede`) com `resolverMatriculaPorAno(ano).size` (fonte
correta, já usada para distorção na mesma função) com o banco real:

| Ano | Contagem ingênua | Contagem correta | Subcontagem |
|---|---|---|---|
| 2024 | 737 | 2088 | ~65% |
| 2025 | 608 | 1933 | ~68% |
| 2026 (corrente) | 3936 | 3936 | 0% |

Confirma que `totalEstudantes`/`escolasAtivas`/`totalTurmas` da Central estão
fortemente errados para qualquer ano histórico hoje — invisível até agora
porque nenhuma página deixava o usuário escolher um ano histórico de
propósito.

## Testes executados

```bash
npm test        # 263/263
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 63 rotas
```

Verificação adicional: script temporário (`npx tsx --conditions=react-server`)
comparando fonte antiga vs. nova diretamente no Postgres local, removido após
uso (não fica no repositório).

## Critério de pronto

- [x] `getAnosLetivosDisponiveis` criada e testada contra o banco real.
- [x] As 10 páginas afetadas migradas, sem import não usado sobrando.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Bug da ETAPA 01 quantificado com dado real (não só suspeitado).

## Resumo da ETAPA 01

`resolverMatriculaPorAno` (`lib/queries/distorcao.ts`) generalizado para
`resolverMatriculaPorAnos(anos[])`, batchando as 3 consultas
independentes-de-ano (estudantes, escolas, turma→série) uma única vez para N
anos; a versão de 1 ano virou wrapper fino. `getIndicadoresGeraisRede`
corrigido para derivar `totalEstudantes`/`escolasAtivas`/`totalTurmas` do
mesmo mapa já usado para distorção, eliminando a segunda fonte de verdade.
Confirmado com dado real: `totalEstudantes` de 2024 subiu de 737 → **2088**,
2025 de 608 → **1933** (2026, ano corrente, permanece em 3936 — sem
mudança). Revisão adversarial (4 dimensões + verificação independente de
cada achado) encontrou 1 risco real (moderado): `escolasAtivas` passou a
depender de match exato de nome de escola, sem normalização nem sinal
visível de falha — corrigido com `.trim()` nos dois lados da comparação;
risco residual de nome divergente (acentuação/renomeação futura) documentado
e aceito, sem impacto no dataset atual. `npm test` (263/263),
`typecheck`/`lint`/`build` seguem limpos após o fix. Detalhe completo em
[`etapas/01-corrigir-contagem-populacao-historica.md`](etapas/01-corrigir-contagem-populacao-historica.md).

## Resumo da ETAPA 02

Infraestrutura de seletor de ano persistente: `SelecaoAnosLetivos` +
`resolverSelecaoAnosLetivos` (prioridade `?anos=` → `?ano=` legado → cookie
→ default) em `lib/queries/anos-letivos.ts`; Server Action
`salvarSelecaoAnosLetivosAction` (`lib/actions/anos-letivos.ts`) gravando o
cookie `sme_anos_letivos` no mesmo padrão de `lib/auth.ts`; componente
`AnosLetivosFiltro` (`components/ui/anos-letivos-filtro.tsx`), justificado
pelos 7+ usos reais deste roadmap (limite que `docs/plano-evolucao-sme`
usava pra adiar um componente equivalente com só 1 uso). 14 testes novos
para a lógica de prioridade. Revisão adversarial (3 dimensões) encontrou 6
achados reais, todos corrigidos: um gap de open-redirect no `pathname` da
Server Action, checkboxes que não refletiam visualmente "Todos os anos",
estado local que ficava desatualizado após o redirect pra mesma rota (React
não remonta o Client Component), ausência de rótulo com só 1 ano
disponível, acessibilidade do popover (role/foco) e ausência de guarda de
estado pendente no botão — mais um achado secundário (redirect descartava
outros query params da página). Todos os 6 fixes foram verificados **ao
vivo no browser** (página de teste temporária, removida ao final), incluindo
uma tentativa real de open-redirect que confirmou o bloqueio funcionando.
`npm test` (277/277), `typecheck`/`lint`/`build` limpos. Detalhe completo em
[`etapas/02-seletor-ano-persistente.md`](etapas/02-seletor-ano-persistente.md).

## Resumo da ETAPA 03

Novo `HistoricalEvolutionChart` (`components/ui/charts/historical-evolution-chart.tsx`),
generalizando o padrão de evolução do painel CAEd: recebe `{ano, valor,
label?}[]`, filtra nulos, plota com `MiniBarChart` (barras, não linha —
poucos pontos discretos). Extensão aditiva `valueFormatter?` em
`MiniBarChartProps` pro tooltip formatar "%"/decimais. `caed/page.tsx`
migrado pra usar o componente novo no lugar do `MiniBarChart` direto.
**Bug real pego na verificação** (não em `typecheck`/`build`, só em
runtime): o componente foi escrito sem `"use client"` mas construía uma
função (`valueFormatter`) e repassava pra um Client Component — React
Server Components não permite função como prop cruzando essa fronteira.
Corrigido com `"use client"`. Verificado com dado real, logado como ADMIN:
7 ciclos (2024-2026) renderizando corretamente após o fix, mesmo resultado
visual de antes da migração. `npm test` (277/277), `typecheck`/`lint`/`build`
limpos. Detalhe completo em
[`etapas/03-grafico-evolucao-historica.md`](etapas/03-grafico-evolucao-historica.md).

## Resumo da ETAPA 04

Implementação das 3 queries de evolução histórica por indicador sem N+1:
- `getEvolucaoFrequenciaPorAno(anos, escolaId?)` (`lib/queries/frequencia.ts`):
  1 único `groupBy(by: ["data"])` cobrindo todos os anos pedidos (~600 linhas
  agregadas para 3 anos em vez de 2,6 milhões de registros individuais), reduzido
  em memória pelo motor puro `calcularEvolucaoFrequenciaPorAno`
  (`lib/analytics/frequencia.ts`).
- `getEvolucaoDesempenhoPorAno(anos, filtro?)` (`lib/queries/desempenho.ts`):
  1 único `groupBy(by: ["ano"])` direto no PostgreSQL com `_avg: { nota: true }`,
  com suporte a filtro por disciplina, unidade e `escolaId`.
- `getEvolucaoDistorcaoPorAno(anos, escolaId?)` (`lib/queries/distorcao.ts`):
  construída sobre `resolverMatriculaPorAnos(anos)` (ETAPA 01), que faz apenas 3
  queries no banco para os $N$ anos pedidos de uma única vez, e calcula a
  distorção em memória ano a ano via `calcularEvolucaoDistorcaoPorAno`
  (`lib/analytics/distorcao.ts`). Sem nenhum loop por ano sobre
  `getDistorcaoPorEscolaESerie`.

**Verificação com dado real (Postgres local):**
Paridade 100% exata confirmada contra cálculos individuais: frequência 2024
(88.9%), 2025 (89.7%), 2026 (87.8%); desempenho 2024 (6.86), 2025 (7.27), 2026
(7.04); distorção 2024 (11.7%), 2025 (10.3%), 2026 (6.9%). Testado também com
escopo por escola (`escolaId: 52266078` - CEJAB, EJA), retornando 0 elegíveis e
`valor: null` em paridade com a query individual.

Testes unitários adicionados com fixtures multi-ano (2024-2026): 18 novos
testes, totalizando 295/295 testes passando. Detalhe completo em
[`etapas/04-queries-evolucao-historica.md`](etapas/04-queries-evolucao-historica.md).

## Testes executados

```bash
npm test        # 295/295 (18 novos testes de fixtures multi-ano)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 52 rotas estáticas
```

## Critério de pronto

- [x] `getEvolucaoFrequenciaPorAno` implementada sem N+1.
- [x] `getEvolucaoDesempenhoPorAno` implementada sem N+1.
- [x] `getEvolucaoDistorcaoPorAno` implementada sobre `resolverMatriculaPorAnos` sem N+1.
- [x] Paridade exata confirmada contra agregações individuais no banco real.
- [x] 18 testes unitários cobrindo 2-3 anos de fixture e casos de borda adicionados.
- [x] `npm test`/`typecheck`/`lint`/`build` passam limpos.

## Próximo passo permitido

ETAPA 05 — Rollout: Frequência e Aprendizagem (aguardando autorização explícita do usuário).

## Resumo da ETAPA 05

Rollout do seletor persistente de ano letivo (`AnosLetivosFiltro` + cookie
`sme_anos_letivos`, ETAPA 02) e do gráfico de evolução histórica
(`HistoricalEvolutionChart`, ETAPA 03) alimentado pelas queries batch
multi-ano (ETAPA 04) nas páginas `/admin/indicadores/frequencia` e
`/admin/indicadores/aprendizagem`:
- `/admin/indicadores/frequencia`: integrado `AnosLetivosFiltro` no
  `PageHeader`, `anoReferencia(selecao)` ancorando KPIs pontuais e tabelas, e
  nova seção "Evolução por ano letivo — Frequência média da rede" com
  `HistoricalEvolutionChart` (`accent="attendance"`, `unidade="percentual"`),
  acompanhado de `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL`.
- `/admin/indicadores/aprendizagem`: integrado `AnosLetivosFiltro` com
  `preservarQueryParams={{ disciplina, unidade }}`, `anoReferencia(selecao)`
  para cards e tabela, e nova seção "Evolução por ano letivo — Desempenho médio da
  rede" com `HistoricalEvolutionChart` (`accent="education"`, `unidade="numero"`),
  também com `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL`.
- Preservação bidirecional de parâmetros em Aprendizagem: o `<form method="get">`
  preserva a seleção de anos (`selecao.modo` com `anos=todos`, múltiplos inputs
  ou ano único) ao filtrar por disciplina/unidade, e o link "Limpar filtros"
  mantém os anos ativos ao limpar os filtros pedagógicos.

Detalhe completo em
[`etapas/05-rollout-frequencia-aprendizagem.md`](etapas/05-rollout-frequencia-aprendizagem.md).

## Testes executados

```bash
npm test        # 295/295 testes passando
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 52 rotas geradas
```

## Critério de pronto

- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/frequencia`.
- [x] Gráfico `HistoricalEvolutionChart` com texto de transparência em `/admin/indicadores/frequencia`.
- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/aprendizagem` com `preservarQueryParams`.
- [x] Gráfico `HistoricalEvolutionChart` com texto de transparência em `/admin/indicadores/aprendizagem`.
- [x] Preservação da seleção de anos no filtro e limpeza de disciplina/unidade.
- [x] `npm test`/`typecheck`/`lint`/`build` 100% limpos.

## Próximo passo permitido

ETAPA 06 — Rollout: Fluxo-Trajetória e Comparativos (aguardando autorização explícita do usuário).

## Resumo da ETAPA 06

Rollout do seletor persistente de ano letivo (`AnosLetivosFiltro` + cookie
`sme_anos_letivos`, ETAPA 02) nas páginas `/admin/indicadores/fluxo-trajetoria`
e `/admin/indicadores/comparativos`:
- `lib/queries/anos-letivos.ts`: adicionado helper puro
  `montarQueryStringAnos(selecao)` com 3 testes unitários novos cobrindo os modos
  `todos`, `multiplos` e `unico`.
- `/admin/indicadores/fluxo-trajetoria`: integrado `AnosLetivosFiltro` no
  `PageHeader`, `anoReferencia(selecao)` ancorando KPIs pontuais, distribuição por
  série e tabela de escolas, e nova seção "Evolução por ano letivo — Distorção
  idade-série da rede" com `HistoricalEvolutionChart` (`accent="warning"`,
  `unidade="percentual"`), alimentada por `getEvolucaoDistorcaoPorAno` (ETAPA 04)
  e acompanhada de `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL`.
- `/admin/indicadores/comparativos`: adicionado pela primeira vez o seletor
  persistente `AnosLetivosFiltro` no `PageHeader` com
  `preservarQueryParams={{ sinal: "1" }}`. Os botões de alternância de visualização
  ("Todas as escolas" e "Só com sinal de atenção") preservam `queryStringAnos` na URL.
  Nova seção "Evolução histórica por indicador" que guia o usuário com links
  diretos para as visualizações dedicadas de evolução (`/frequencia`,
  `/aprendizagem`, `/fluxo-trajetoria`) mantendo a seleção temporal ativa, sem
  duplicar 3 gráficos e sem criar ranking artificial de escolas.

Detalhe completo em
[`etapas/06-rollout-fluxo-comparativos.md`](etapas/06-rollout-fluxo-comparativos.md).

## Testes executados

```bash
npm test        # 298/298 testes passando (+3 testes novos de query string)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 52 rotas geradas
```

## Critério de pronto

- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/fluxo-trajetoria`.
- [x] Gráfico `HistoricalEvolutionChart` com texto de transparência em `/admin/indicadores/fluxo-trajetoria`.
- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/comparativos` com `preservarQueryParams`.
- [x] Preservação da seleção de anos na alternância de visualização de Comparativos.
- [x] Seção de navegação para evolução histórica dos 3 indicadores em Comparativos.
- [x] `npm test`/`typecheck`/`lint`/`build` 100% limpos.

## Próximo passo permitido

ETAPA 07 — Rollout: Portal da Direção (aguardando autorização explícita do usuário).

## Resumo da ETAPA 07

Rollout do seletor persistente de ano letivo (`AnosLetivosFiltro` + cookie
`sme_anos_letivos`, ETAPA 02) na Home do Portal da Direção
(`/portal/direcao`):
- `/portal/direcao/page.tsx`: substituído o formulário local legado (`<Select>` +
  `<Button>` + `resolverAnoLetivo`) pelo seletor persistente `AnosLetivosFiltro` no
  `PageHeader`.
- Escopo estrito por escola: a lista de anos disponíveis em
  `getAnosLetivosDisponiveis({ escolaId })` permanece filtrada pela escola do
  Diretor autenticado (`session.escolaId`), garantindo que o gestor nunca veja anos
  sem histórico para a sua unidade.
- Remoção limpa de código não utilizado: eliminados os imports locais de
  `Select`, `Button` e `resolverAnoLetivo`.
- Ancoragem pontual: `anoReferencia(selecao)` mantém os insights de atenção, a
  comparação da escola com a rede (`SchoolOverview`) e os recortes temporais
  ancorados no ano de referência.

Detalhe completo em
[`etapas/07-rollout-portal-direcao.md`](etapas/07-rollout-portal-direcao.md).

## Testes executados

```bash
npm test        # 298/298 testes passando
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 52 rotas geradas
```

## Critério de pronto

- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/portal/direcao`.
- [x] Anos disponíveis filtrados por `escolaId` da sessão do Diretor.
- [x] Remoção do formulário local legado (`<Select>` / `<Button>` / `resolverAnoLetivo`).
- [x] `npm test`/`typecheck`/`lint`/`build` 100% limpos.

## Próximo passo permitido

ETAPA 08 — Nova página `/admin/indicadores/avaliacoes` (aguardando autorização explícita do usuário).

## Resumo da ETAPA 08

Criação da nova página analítica de avaliações municipais
(`/admin/indicadores/avaliacoes`):
- `lib/analytics/avaliacoes.ts`: implementadas funções analíticas puras
  `calcularEvolucaoCaedPorAno`, `calcularEvolucaoPontuacaoPorAno` e
  `calcularEvolucaoFluenciaPorAno`, acompanhadas da interface `PontoEvolucaoAnual`.
- `lib/analytics/avaliacoes.test.ts`: adicionados 7 novos testes unitários
  cobrindo cálculos ponderados por avaliados, anos sem registros (`valor: null`),
  turmas vazias e ordenação cronológica.
- `lib/queries/avaliacoes.ts`: implementadas as queries batch multi-ano sem N+1
  `getEvolucaoCaedPorAno`, `getEvolucaoPontuacaoPorAno` e `getEvolucaoFluenciaPorAno`,
  além de `getResumoIndicadoresAvaliacoes(anoLetivo, escolaId?)`, que consolida
  dados de `AvaliacaoResultadoTurma` (CAEd) e `AvaliacaoResultadoAluno` (Fluência,
  SPADEB, Simulados e Provas Municipais).
- `app/admin/indicadores/avaliacoes/page.tsx`: nova página construída com
  `AnosLetivosFiltro` persistente, cards de KPI do ano de referência (Total de
  Avaliações, CAEd % Adequado, Fluência % Fluentes e Cobertura da Rede), seções
  dedicadas por instrumento com `HistoricalEvolutionChart` e
  `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL`, além de tabela analítica completa de todas
  as avaliações aplicadas no ano selecionado.
- Detalhe completo em
  [`etapas/08-pagina-indicadores-avaliacoes.md`](etapas/08-pagina-indicadores-avaliacoes.md).

## Testes executados

```bash
npm test        # 305/305 testes passando (+7 testes novos de analytics de avaliações)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 53 rotas geradas
```

## Critério de pronto

- [x] Funções puras de evolução histórica de avaliações criadas e testadas.
- [x] Queries multi-ano e de resumo implementadas em `lib/queries/avaliacoes.ts` sem N+1.
- [x] Nova página `/admin/indicadores/avaliacoes` criada com seletor persistente, cards de KPI, gráficos por tipo e tabela.
- [x] Verificação em runtime validada (HTTP 200 em 2024, 2025, 2026 e anos=todos).
- [x] `npm test`/`typecheck`/`lint`/`build` 100% limpos.

## Próximo passo permitido

ETAPA 09 — Atualizar a Central (`/admin/indicadores`) (aguardando autorização explícita do usuário).





