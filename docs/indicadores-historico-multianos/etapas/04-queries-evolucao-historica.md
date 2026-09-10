# ETAPA 04 — Queries de evolução histórica por indicador

## Status
DONE

## Objetivo

Construir as queries de evolução histórica por indicador para a rede inteira (e escopadas por escola quando aplicável): `getEvolucaoFrequenciaPorAno`, `getEvolucaoDesempenhoPorAno` e `getEvolucaoDistorcaoPorAno`, fornecendo séries temporais discretizadas por ano letivo no formato `{ ano, valor }` esperado pelo `HistoricalEvolutionChart` (ETAPA 03).

## Por que esta etapa existe

As páginas de indicadores (`/admin/indicadores/frequencia`, `/aprendizagem`, `/fluxo-trajetoria` e `/portal/direcao`) hoje calculam métricas para um único ano letivo por vez. Para exibir o gráfico de evolução multi-ano com o seletor persistente (rollout a partir da ETAPA 05), precisamos buscar a série histórica de cada indicador.

Se isso fosse feito de forma ingênua chamando as queries unitárias existentes em um loop por ano, incorreria em **N+1 severo**:
- Em distorção, repetiria a leitura de todos os estudantes e escolas da rede a cada ano pedido.
- Em frequência, rodaria consultas pontuais de agregação repetidas.
- Em notas, dispararia queries individuais desnecessárias.

Esta etapa constrói as consultas agregadas de forma batchada e eficiente na raiz.

## Escopo desta etapa

1. `lib/queries/frequencia.ts`: `getEvolucaoFrequenciaPorAno(anos, escolaId?)` com motor puro `calcularEvolucaoFrequenciaPorAno` em `lib/analytics/frequencia.ts`.
2. `lib/queries/desempenho.ts`: `getEvolucaoDesempenhoPorAno(anos, filtro?)` com `mapearEvolucaoDesempenho` e suporte a `disciplina`, `unidade` e `escolaId`.
3. `lib/queries/distorcao.ts`: `getEvolucaoDistorcaoPorAno(anos, escolaId?)` com motor puro `calcularEvolucaoDistorcaoPorAno` em `lib/analytics/distorcao.ts`.
4. Testes unitários com fixtures multi-ano (2024-2026).
5. Verificação com dado real contra o banco PostgreSQL local.

## Fora de escopo

- Alterar as páginas de indicadores da UI (ETAPA 05 e seguintes).
- Indicador de avaliações do município (ETAPA 08).
- Central de Indicadores (ETAPA 09).

## Decisões técnicas

- **Frequência sem N+1**: 1 único `prisma.frequenciaEstudante.groupBy({ by: ["data"], where: { AND: [...] }, _sum: { falta: true, quantidadeAula: true } })` cobrindo o intervalo de todos os anos pedidos (`gte: YYYY-01-01`, `lte: YYYY-12-31`). Retorna apenas ~200 datas por ano letivo (~600 linhas agregadas para 3 anos) em vez de varrer 2,6 milhões de registros individuais. O motor puro `calcularEvolucaoFrequenciaPorAno` agrupa as datas por ano em memória e calcula o percentual ponderado `((aulas - faltas) / aulas) * 100`.
- **Desempenho direto no Postgres**: 1 único `prisma.notaEstudante.groupBy({ by: ["ano"], where: { ano: { in: anos } }, _avg: { nota: true } })` aproveitando a coluna nativa `ano` indexada. O helper puro `mapearEvolucaoDesempenho` formata o resultado garantindo ordenação cronológica e preenchimento de `valor: null` para anos sem notas.
- **Distorção sem N+1 (ponto mais crítico do plano)**: construída sobre `resolverMatriculaPorAnos(anos)` (já criada na ETAPA 01), que faz apenas 3 consultas no banco para resolver as coortes de todos os $N$ anos pedidos de uma única vez (`Estudante`, `Escola`, `getSeriePorTurma` 1 vez só, e `NotaEstudante` filtrada por `ano: { in: anos }`). O motor puro `calcularEvolucaoDistorcaoPorAno` calcula a distorção em memória por ano via `calcularDistorcaoIdadeSerie` e a referência padrão `${ano}-03-31` e limiar padrão de 2 anos. **Nenhum loop sobre `getDistorcaoPorEscolaESerie`**.
- **Filtro consistente por escola**: quando `escolaId` é fornecido (para o Portal da Direção ou visão de escola), frequência e notas aplicam o mesmo padrão de fallback `{ OR: [{ escola: nomeEscola }, { escola: null, estudante: { escolaId } }] }`, e distorção filtra `dados.escolaId === escolaId`.
- **Separação analítica pura vs. I/O**: cálculo matemático e transformações ficam em `lib/analytics/` sem I/O, permitindo 100% de cobertura determinística em testes unitários.
- **Compatibilidade estrutural com o componente de UI**: as três queries retornam `PontoEvolucaoAnual[]` (`{ ano: number; valor: number | null }`), que atende diretamente a prop `data: EvolucaoAnualPonto[]` de `HistoricalEvolutionChart` (ETAPA 03). Anos são sempre ordenados em ordem ascendente (cronológica) e anos sem dados retornam `valor: null`.

## Verificação com dado real (Postgres local)

Comparação entre o cálculo batch das novas queries e as agregações/queries individuais já existentes no banco local:

| Indicador | Ano | Cálculo Batch (Nova Query) | Cálculo Individual (Referência) | Status |
|---|---|---|---|---|
| **Frequência** | 2024 | 88.9% (1.812.519 aulas / 201.809 faltas) | 88.9% (1.812.519 aulas / 201.809 faltas) | Idêntico |
| | 2025 | 89.7% (725.719 aulas / 74.893 faltas) | 89.7% (725.719 aulas / 74.893 faltas) | Idêntico |
| | 2026 | 87.8% (907.150 aulas / 110.564 faltas) | 87.8% (907.150 aulas / 110.564 faltas) | Idêntico |
| **Desempenho** | 2024 | 6.86 | 6.86 | Idêntico |
| | 2025 | 7.27 | 7.27 | Idêntico |
| | 2026 | 7.04 | 7.04 | Idêntico |
| **Distorção** | 2024 | 11.7% (191 em distorção / 1.634 elegíveis) | 11.7% (191 em distorção / 1.634 elegíveis) | Idêntico |
| | 2025 | 10.3% (167 em distorção / 1.618 elegíveis) | 10.3% (167 em distorção / 1.618 elegíveis) | Idêntico |
| | 2026 | 6.9% (160 em distorção / 2.319 elegíveis) | 6.9% (160 em distorção / 2.319 elegíveis) | Idêntico |

Também verificado com escopo de escola (`escolaId: 52266078` - CEJAB, escola de EJA): ambas as fontes retornaram 0/0 elegíveis e `undefined%`/`null` para distorção, confirmando consistência de filtros e tratamento correto de coortes fora de escopo.

## Testes executados

```bash
npm test        # 295/295 testes (18 novos cobrindo fixtures multi-ano e casos de borda)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 52 rotas estáticas geradas
```

Novos testes unitários adicionados:
- `lib/analytics/frequencia.test.ts`: 6 novos testes para `calcularEvolucaoFrequenciaPorAno` (vazio, multi-ano ponderado, ordenação, anos sem dados, exclusão de anos fora do filtro, deduplicação).
- `lib/analytics/distorcao.test.ts`: 6 novos testes para `calcularEvolucaoDistorcaoPorAno` (vazio, coortes multi-ano, ordenação, filtro por escola, exclusão de coortes fora de escopo, anos vazios).
- `lib/queries/desempenho.test.ts`: 6 novos testes para `mapearEvolucaoDesempenho` e guarda de entrada vazia de `getEvolucaoDesempenhoPorAno`.

## Critério de pronto

- [x] `getEvolucaoFrequenciaPorAno` criada com 1 único `groupBy(by: ["data"])`, sem N+1.
- [x] `getEvolucaoDesempenhoPorAno` criada com 1 único `groupBy(by: ["ano"])`, sem N+1.
- [x] `getEvolucaoDistorcaoPorAno` criada sobre `resolverMatriculaPorAnos`, sem N+1.
- [x] Paridade exata confirmada contra agregações individuais no banco real.
- [x] Testes unitários com fixtures cobrindo 2-3 anos de histórico passando.
- [x] `npm test`/`typecheck`/`lint`/`build` passam limpos.

## Próximo passo permitido

ETAPA 05 (Rollout: Frequência e Aprendizagem) — aguardando autorização explícita do usuário.
