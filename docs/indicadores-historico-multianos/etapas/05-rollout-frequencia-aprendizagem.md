# ETAPA 05 — Rollout: Frequência e Aprendizagem

## Status
DONE

## Objetivo

Realizar o rollout do seletor persistente de ano letivo (`AnosLetivosFiltro` + cookie `sme_anos_letivos`, ETAPA 02) e do gráfico de evolução histórica (`HistoricalEvolutionChart`, ETAPA 03) alimentado pelas queries batch multi-ano (`getEvolucaoFrequenciaPorAno` e `getEvolucaoDesempenhoPorAno`, ETAPA 04) nas páginas `/admin/indicadores/frequencia` e `/admin/indicadores/aprendizagem`.

## Por que esta etapa existe

Substituir o seletor legado não-persistente (`resolverAnoLetivo` + `<Select>` local) nas duas principais páginas analíticas da Secretaria de Educação. Habilitar a observação da série histórica (2024, 2025, 2026) sem perder a referência pontual nos KPIs e tabelas, garantindo que a seleção persista na navegação via sidebar ou recarregamento, e mantendo íntegros os filtros complementares (disciplina e unidade em Aprendizagem).

## Escopo desta etapa

1. `app/admin/indicadores/frequencia/page.tsx`:
   - Leitura de cookies `sme_anos_letivos` e resolução com `resolverSelecaoAnosLetivos`.
   - Derivação de `anoLetivo = anoReferencia(selecao)` e `anosParaGrafico = anosParaEvolucao(selecao)`.
   - Consulta em paralelo via `Promise.all` incluindo `getEvolucaoFrequenciaPorAno(anosParaGrafico)`.
   - Inclusão do `AnosLetivosFiltro` no `PageHeader`.
   - Nova seção "Evolução por ano letivo — Frequência média da rede" com `HistoricalEvolutionChart` (`accent="attendance"`, `unidade="percentual"`) e texto de transparência obrigatório.
2. `app/admin/indicadores/aprendizagem/page.tsx`:
   - Leitura de cookies `sme_anos_letivos` e resolução com `resolverSelecaoAnosLetivos`.
   - Derivação de `anoLetivo = anoReferencia(selecao)` e `anosParaGrafico = anosParaEvolucao(selecao)`.
   - Consulta em paralelo via `Promise.all` incluindo `getEvolucaoDesempenhoPorAno(anosParaGrafico, { disciplina, unidade })`.
   - Inclusão do `AnosLetivosFiltro` no `PageHeader` com `preservarQueryParams={{ disciplina, unidade }}`.
   - Nova seção "Evolução por ano letivo — Desempenho médio da rede" com `HistoricalEvolutionChart` (`accent="education"`, `unidade="numero"`) e texto de transparência obrigatório.
   - Atualização do `<form method="get">` para preservar a seleção de `anos` em hidden inputs ao filtrar por disciplina/unidade.
   - Atualização do link "Limpar filtros" para manter os anos selecionados ao limpar os filtros de disciplina/unidade.
3. Atualização do `docs/indicadores-historico-multianos/PROGRESSO.md`.

## Fora de escopo

- Alteração nas páginas de Fluxo-Trajetória e Comparativos (ETAPA 06).
- Portal da Direção (ETAPA 07).
- Indicadores de avaliações municipais (ETAPA 08) e Central de Indicadores (ETAPA 09).

## Decisões técnicas

- **KPIs pontuais vs. Evolução multi-ano**:
  - `anoReferencia(selecao)` determina o ano letivo utilizado para calcular os cards de topo (MetricCards), detalhamento por escola e tabelas. No modo "único", é o ano escolhido; nos modos "múltiplos" ou "todos", é o ano mais recente selecionado (mantendo a consistência com os recortes operacionais mais imediatos).
  - `anosParaEvolucao(selecao)` fornece o array ordenado cronologicamente de anos que alimentam o gráfico de barras multi-ano (`HistoricalEvolutionChart`).
- **Preservação bidirecional de parâmetros em Aprendizagem**:
  - Quando o usuário altera os anos pelo popover `AnosLetivosFiltro`, os parâmetros `disciplina` e `unidade` são enviados via `extra_*` e preservados no redirecionamento da Server Action.
  - Quando o usuário submete o formulário de filtros pedagógicos (disciplina/unidade), os inputs ocultos preservam `anos=todos`, múltiplos `<input name="anos">` ou o ano único, evitando reset involuntário do contexto temporal.
  - O link "Limpar filtros" constrói a URL de limpeza preservando a seleção ativa de `anos`.
- **Texto de transparência obrigatório**:
  - Ambas as páginas exibem `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL` ("Comparação entre o conjunto de estudantes/turmas de cada ano — não acompanha os mesmos estudantes ao longo do tempo"), atendendo ao compromisso metodológico de não induzir comparações de coortes transversais como se fossem longitudinais.
- **Formatação de unidades e acentos de cores**:
  - Frequência utiliza `unidade="percentual"` (sufixo `%` com 1 casa decimal) e `accent="attendance"`.
  - Aprendizagem utiliza `unidade="numero"` (1 casa decimal) e `accent="education"`.

## Verificação

- `npm test`: 295/295 testes passando.
- `npm run typecheck`: 0 erros de compilação TypeScript.
- `npm run lint`: 0 avisos ou erros de linting.
- `npm run build`: compilação completa sem erros, gerando as rotas da aplicação.

## Critério de pronto

- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/frequencia`.
- [x] Gráfico `HistoricalEvolutionChart` com `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL` em `/admin/indicadores/frequencia`.
- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/aprendizagem` com `preservarQueryParams`.
- [x] Gráfico `HistoricalEvolutionChart` com `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL` em `/admin/indicadores/aprendizagem`.
- [x] Filtro de disciplina e unidade em `/admin/indicadores/aprendizagem` preserva a seleção de anos ao filtrar e ao limpar.
- [x] Bateria de testes e verificações (`npm test`, `typecheck`, `lint`, `build`) 100% verde.
