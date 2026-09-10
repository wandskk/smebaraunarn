# ETAPA 08 — Nova página `/admin/indicadores/avaliacoes`

## Status
DONE

## Objetivo

Criar a página analítica de indicadores de avaliações do município (`/admin/indicadores/avaliacoes`), unificando a visão gerencial e histórica de todos os tipos de avaliação da rede (CAEd, Fluência Leitora, SPADEB, Simulados e Provas Municipais) com suporte multi-ano persistente e evolução temporal.

## Por que esta etapa existe

Anteriormente, o sistema contava apenas com o catálogo operacional de avaliações (`/admin/avaliacoes`) e com o painel específico do CAEd (`/admin/avaliacoes/caed`). A Central de Indicadores (`/admin/indicadores`) continha apenas uma lista simples de cards com as avaliações mais recentes, sem indicadores agregados de rede, sem KPIs de participação e sem gráficos de evolução histórica ao longo dos anos. A nova rota `/admin/indicadores/avaliacoes` preenche essa lacuna, proporcionando uma análise integrada e comparativa das avaliações municipais.

## Escopo desta etapa

1. `lib/analytics/avaliacoes.ts`:
   - Adicionada a interface pura `PontoEvolucaoAnual` (`{ ano: number; valor: number | null }`).
   - Implementadas as funções analíticas puras:
     - `calcularEvolucaoCaedPorAno`: agrega resultados de turmas calculando o % ponderado de aprendizagem adequada (usando contagem exata quando disponível ou percentual aproximado).
     - `calcularEvolucaoPontuacaoPorAno`: calcula a pontuação média ponderada por participantes para avaliações com escala numérica (SPADEB, Simulados, Provas Municipais).
     - `calcularEvolucaoFluenciaPorAno`: calcula o % de estudantes classificados como "Leitor Fluente" sobre o total com nível diagnosticado.
2. `lib/analytics/avaliacoes.test.ts`:
   - 7 novos testes unitários cobrindo cálculos ponderados, casos com turmas vazias, anos sem dados (`valor: null`) e ordenação cronológica.
3. `lib/queries/avaliacoes.ts`:
   - `getEvolucaoCaedPorAno(anos, escolaId?)`: busca avaliações CAEd nos anos selecionados e agrega `AvaliacaoResultadoTurma` em batch (2 queries no total, sem N+1).
   - `getEvolucaoPontuacaoPorAno(anos, tipo, escolaId?)`: agrega médias por avaliação diretamente no banco via `groupBy` em `AvaliacaoResultadoAluno`.
   - `getEvolucaoFluenciaPorAno(anos, escolaId?)`: agrupa contagens por nível de fluência via `groupBy`.
   - `getResumoIndicadoresAvaliacoes(anoLetivo, escolaId?)`: compila em lote o resumo do ano letivo de referência, combinando resultados de turmas (CAEd) e resultados individuais de alunos (Fluência, SPADEB, etc.), gerando lista analítica detalhada e KPIs de participação e cobertura.
4. `app/admin/indicadores/avaliacoes/page.tsx`:
   - Nova página com navegação de retorno à Central de Indicadores, `PageHeader` com `AnosLetivosFiltro` persistente e botão para o catálogo.
   - Cards de resumo do ano de referência: Total de Avaliações, CAEd (% Adequado), Fluência Leitora (% Fluentes) e Participações na Rede / Cobertura.
   - Seções dedicadas por tipo de avaliação com seus respectivos gráficos de evolução histórica (`HistoricalEvolutionChart`), destaques do ano e o texto obrigatório `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL`.
   - Tabela analítica completa de todas as avaliações aplicadas no ano de referência com situação (Badge), métrica principal e links de ação.
5. Atualização de `docs/indicadores-historico-multianos/PROGRESSO.md`.

## Fora de escopo

- Atualização da Central de Indicadores (`/admin/indicadores`) com o MetricCard e links para a nova página (ETAPA 09).
- Alteração no menu lateral (sidebar continua apontando para `/admin/avaliacoes`, o catálogo operacional).

## Decisões técnicas

- **Sem score único sintetizado entre instrumentos incompatíveis**:
  - Cada tipo de avaliação opera com métricas metodologicamente distintas (CAEd com % adequado agregado por turma; SPADEB/Simulados com pontuação numérica contínua; Fluência Leitora com níveis qualitativos). Criar uma nota média unificada falsificaria a escala. A página organiza as informações **por tipo de avaliação**, com cada bloco exibindo sua métrica nativa.
- **Suporte híbrido a resultados por turma e por aluno**:
  - A consulta `getResumoIndicadoresAvaliacoes` consolida tanto dados de `AvaliacaoResultadoTurma` (utilizados por fontes externas como CAEd) quanto de `AvaliacaoResultadoAluno` (lançamentos de fluência e provas municipais), garantindo que avaliações de anos anteriores (como 2024 e 2025) não desapareçam da listagem.
- **Zero N+1 em consultas históricas**:
  - Todas as agregações multi-ano utilizam agrupamentos no PostgreSQL (`groupBy` ou `in: anos`) em batch, reduzindo os pontos para o gráfico em memória por funções puras.
- **Transparência metodológica obrigatória**:
  - Todas as seções com gráficos de evolução histórica exibem explicitamente o texto `TEXTO_TRANSPARENCIA_EVOLUCAO_ANUAL` ("Comparação entre o conjunto de estudantes/turmas de cada ano — não acompanha os mesmos estudantes ao longo do tempo").

## Verificação

- `npm test`: 305/305 testes passando (+7 testes novos de analytics de avaliações).
- `npm run typecheck`: 0 erros de tipagem TypeScript (`tsc --noEmit`).
- `npm run lint`: 0 erros ou avisos ESLint.
- `npm run build`: Next.js build compilado com sucesso gerando 53 rotas estáticas/dinâmicas.
- Verificação em runtime via script de teste com token de sessão ADMIN autenticado:
  - `GET /admin/indicadores/avaliacoes` -> Status 200 OK.
  - `GET /admin/indicadores/avaliacoes?ano=2025` -> Status 200 OK.
  - `GET /admin/indicadores/avaliacoes?ano=2024` -> Status 200 OK.
  - `GET /admin/indicadores/avaliacoes?anos=todos` -> Status 200 OK.

## Critério de pronto

- [x] Funções puras de evolução histórica de avaliações criadas e testadas.
- [x] Queries multi-ano e de resumo implementadas em `lib/queries/avaliacoes.ts` sem N+1.
- [x] Nova página `/admin/indicadores/avaliacoes` criada com seletor persistente, cards de KPI, gráficos por tipo e tabela.
- [x] Todos os testes e verificações automatizadas (`npm test`, `typecheck`, `lint`, `build`) 100% limpos.
