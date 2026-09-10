# ETAPA 06 — Rollout: Fluxo-Trajetória e Comparativos

## Status
DONE

## Objetivo

Realizar o rollout do seletor persistente de ano letivo (`AnosLetivosFiltro` + cookie `sme_anos_letivos`, ETAPA 02) nas páginas `/admin/indicadores/fluxo-trajetoria` e `/admin/indicadores/comparativos`. Em Fluxo-Trajetória, adicionar a seção "Evolução por ano letivo — Distorção idade-série da rede" com `HistoricalEvolutionChart` (ETAPA 03) alimentada por `getEvolucaoDistorcaoPorAno` (ETAPA 04). Em Comparativos, introduzir o seletor pela primeira vez com seção de navegação guiada para os gráficos dedicados de evolução de cada indicador, respeitando a decisão arquitetural de não duplicar três gráficos na mesma tela e não inventar um ranking histórico de escolas.

## Por que esta etapa existe

Completar o rollout do seletor persistente em todas as 4 páginas analíticas da Central de Indicadores (`/frequencia`, `/aprendizagem`, `/fluxo-trajetoria`, `/comparativos`). Em Fluxo-Trajetória, a evolução histórica de distorção (construída sobre `resolverMatriculaPorAnos` sem N+1) fica disponível para visualização ano a ano. Em Comparativos (que antes sequer possuía seletor próprio), a seleção de anos passa a controlar a referência municipal e os filtros temporais persistem ao filtrar por escolas com sinal de atenção e ao navegar para os detalhamentos.

## Escopo desta etapa

1. `lib/queries/anos-letivos.ts`:
   - Criação do helper puro `montarQueryStringAnos(selecao: SelecaoAnosLetivos): string` para formatar os parâmetros de busca (`anos=todos`, `anos=2024&anos=2025` ou `anos=2024`).
   - Testes unitários para os 3 modos de seleção em `lib/queries/anos-letivos.test.ts`.
2. `app/admin/indicadores/fluxo-trajetoria/page.tsx`:
   - Leitura de cookies `sme_anos_letivos` e resolução com `resolverSelecaoAnosLetivos`.
   - Derivação de `anoLetivo = anoReferencia(selecao)` e `anosParaGrafico = anosParaEvolucao(selecao)`.
   - Consulta em paralelo via `Promise.all` incluindo `getEvolucaoDistorcaoPorAno(anosParaGrafico)`.
   - Inclusão do `AnosLetivosFiltro` no `PageHeader`.
   - Nova seção "Evolução por ano letivo — Distorção idade-série da rede" com `HistoricalEvolutionChart` (`accent="warning"`, `unidade="percentual"`) e texto de transparência obrigatório.
3. `app/admin/indicadores/comparativos/page.tsx`:
   - Leitura de cookies `sme_anos_letivos` e resolução com `resolverSelecaoAnosLetivos`.
   - Derivação de `anoLetivo = anoReferencia(selecao)`.
   - Inclusão do `AnosLetivosFiltro` no `PageHeader` com `preservarQueryParams={{ ...(somenteComSinal ? { sinal: "1" } : {}) }}`.
   - Preservação de `queryStringAnos` nos botões de alternância de visualização ("Todas as escolas" e "Só com sinal de atenção").
   - Nova seção "Evolução histórica por indicador" com links diretos preservando a seleção temporal para `/frequencia`, `/aprendizagem` e `/fluxo-trajetoria`.
4. Atualização de `docs/indicadores-historico-multianos/PROGRESSO.md`.

## Fora de escopo

- Rollout no Portal da Direção (ETAPA 07).
- Indicadores de avaliações municipais (ETAPA 08) e Central de Indicadores (ETAPA 09).

## Decisões técnicas

- **Não duplicação de gráficos em Comparativos**:
  - A página Comparativos foca na relação transversal escola vs. rede no ano de referência. Em vez de entulhar a tela com 3 gráficos de evolução paralelos ou inventar um "ranking histórico de escolas" nunca solicitado, ela fornece links contextuais diretos para as páginas específicas com a seleção temporal integralmente preservada na query string.
- **Preservação bidirecional de filtros em Comparativos**:
  - A alternância entre "Todas as escolas" e "Só com sinal de atenção" mantém `queryStringAnos` na URL (`href="/admin/indicadores/comparativos?${queryStringAnos}&sinal=1"`).
  - A troca de anos no popover `AnosLetivosFiltro` repassa `preservarQueryParams={{ ...(somenteComSinal ? { sinal: "1" } : {}) }}`, mantendo o filtro de sinal ativo no redirect da Server Action.
- **Consistência visual e metodológica em Fluxo-Trajetória**:
  - O gráfico `HistoricalEvolutionChart` utiliza `accent="warning"` (padrão visual de distorção idade-série na aplicação) e `unidade="percentual"`.
  - Exibe `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL` ("Comparação entre o conjunto de estudantes/turmas de cada ano — não acompanha os mesmos estudantes ao longo do tempo").

## Verificação

- `npm test`: 298/298 testes passando (+3 testes novos para `montarQueryStringAnos`).
- `npm run typecheck`: 0 erros de compilação TypeScript.
- `npm run lint`: 0 avisos ou erros de linting.
- `npm run build`: compilação completa sem erros, gerando as 52 rotas da aplicação.

## Critério de pronto

- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/fluxo-trajetoria`.
- [x] Gráfico `HistoricalEvolutionChart` com `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL` em `/admin/indicadores/fluxo-trajetoria`.
- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/admin/indicadores/comparativos` com `preservarQueryParams`.
- [x] Preservação de anos nos links de alternância de sinal em `/admin/indicadores/comparativos`.
- [x] Seção de navegação para evolução histórica dos 3 indicadores em `/admin/indicadores/comparativos`.
- [x] Bateria de testes e verificações (`npm test`, `typecheck`, `lint`, `build`) 100% verde.
