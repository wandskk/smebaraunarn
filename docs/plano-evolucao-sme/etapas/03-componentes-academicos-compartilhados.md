# ETAPA 03 — Componentes acadêmicos compartilhados

## Status
DONE

## Objetivo

Consolidar os componentes/fórmulas usados por vários perfis antes de evoluir
cada portal individualmente.

## Por que esta etapa existe

A ETAPA 00 confirmou que nenhum componente acadêmico compartilhado nomeado
(`SchoolOverview`, `TurmaDetail`, `GradeTable`, etc.) existe hoje — cada
portal implementa sua própria view sobre `lib/queries/*`. Extrair essa base
antes das etapas por perfil (04–08) evita duplicar a mesma fórmula com
pequenas divergências entre Admin/Diretor/Professor/Aluno.

## Pré-requisitos

ETAPA 02 concluída (`DONE`).

## Escopo desta etapa

Avaliar e extrair/evoluir, conforme o código real (não criar componente só
porque o nome aparece no master prompt — confirmar equivalente existente
primeiro):

- `SchoolOverview`
- `TurmaDetail`
- `StudentAcademicDetail`
- `GradeTable`
- `AttendanceSummary`
- `AttendanceTable`
- `ComparisonDelta`
- `CoverageCard`
- `InsightCard`
- `EvaluationSummary`

## Fora de escopo

- Refatoração puramente estética sem redução de duplicação de regra.
- Funcionalidades novas que não existam em nenhum perfil hoje (isso é
  ETAPA 04–10).

## Arquivos/áreas previstos

- `components/` (novos componentes compartilhados, localização a definir).
- `lib/queries/academico.ts`, `lib/queries/frequencia.ts`,
  `lib/queries/desempenho.ts` e demais queries hoje duplicadas entre
  `app/admin/*`, `app/portal/direcao/*`, `app/portal/professor/*`,
  `app/portal/aluno/*`.

## Checklist
- [x] Mapear duplicação real de cálculo/fórmula entre perfis (não assumir,
      confirmar no código).
- [x] Definir qual componente resolve qual duplicação encontrada.
- [x] Extrair/evoluir componentes um de cada vez, com teste antes/depois
      (`typecheck`/`test`/`lint`/`build` completos após cada extração).
- [x] Validar que Admin/Diretor/Professor/Aluno usam a mesma fórmula para a
      mesma entidade após a extração.

## Alterações realizadas

**Mapeamento (antes de extrair qualquer componente):**
1. `app/admin/escolas/[id]/turmas/[turma]/page.tsx` (Admin) e
   `app/portal/direcao/turmas/[turma]/page.tsx` (Direção) eram quase
   idênticas — mesma `getTurmaDetalhe`, mesmos 3 cards, mesma tabela de
   médias por disciplina, mesma lista de alunos com busca/paginação.
   Diferiam só em breadcrumb, link de destino do aluno, base da paginação e
   no componente visual do card (`Card` simples no Admin vs `MetricCard`
   com ícone na Direção).
2. `components/portal/aluno-detalhe.tsx` (Admin/Direção/Professor) e
   `app/portal/aluno/boletim/page.tsx` (Aluno) recalculavam a mesma tabela
   de boletim (disciplina × 1ª–4ª unidade × média) de forma independente.
3. `app/admin/indicadores/frequencia/page.tsx` (`TendenciaCell`, variação
   temporal) e `app/admin/indicadores/comparativos/page.tsx`
   (`DiferencaRede`, variação espacial escola×rede) tinham cada um sua
   própria versão quase idêntica de "seta + texto colorido" para variação —
   mesmo ícone (`TrendingUp`/`TrendingDown`/`Minus`), mesma lógica de
   cor por favorabilidade.
4. `app/portal/direcao/frequencia/page.tsx` tinha uma **terceira**
   implementação inline da fórmula de percentual de frequência
   (`totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : null`)
   — já correta quanto a não virar 100% sem dado, mas duplicando a mesma
   conta que `lib/analytics/frequencia.ts:calcularPercentualFrequencia` já
   faz e já é usada pelos outros perfis.
5. `formatarDataIso` (formatação de data ISO → dd/MM/yyyy) tinha sido
   duplicada em dois arquivos na própria ETAPA 02
   (`components/portal/aluno-detalhe.tsx` e
   `app/portal/aluno/frequencia/page.tsx`) — consolidada nesta etapa.

**Componentes extraídos:**

- [`components/portal/turma-detalhe.tsx`](../../../components/portal/turma-detalhe.tsx)
  (`TurmaDetalheView`, novo): busca `getTurmaDetalhe`, filtra/pagina os
  alunos e renderiza a ficha completa da turma. Recebe como prop só o que
  realmente varia por perfil (`breadcrumb`, `alunoHref`,
  `paginationBasePath`). Consumida por
  [`app/admin/escolas/[id]/turmas/[turma]/page.tsx`](<../../../app/admin/escolas/[id]/turmas/[turma]/page.tsx>)
  e
  [`app/portal/direcao/turmas/[turma]/page.tsx`](<../../../app/portal/direcao/turmas/[turma]/page.tsx>),
  que caíram de ~145 linhas cada para ~30. Padronizado no `MetricCard` (já
  usado pela Direção e por todo `/admin/indicadores`) em vez do `Card`
  simples que o Admin usava — mesmo componente de design system, não uma
  segunda camada visual.
- [`components/portal/grade-table.tsx`](../../../components/portal/grade-table.tsx)
  (`GradeTable`, novo): tabela de boletim pura (recebe `notas` + mensagem de
  estado vazio). Consumida por `AlunoDetalhe` e por
  [`app/portal/aluno/boletim/page.tsx`](../../../app/portal/aluno/boletim/page.tsx).
  Não controla margem externa — cada tela mantém seu próprio espaçamento.
- [`components/ui/comparison-delta.tsx`](../../../components/ui/comparison-delta.tsx)
  (`ComparisonDelta`, novo): só a apresentação (seta + cor + texto). A
  classificação (o que conta como "favorável", limiar de estabilidade)
  permanece em cada página — `TendenciaCell` (frequência, favorável =
  tendência alta) e `DiferencaRede` (comparativos, favorável depende de
  `maiorEhMelhor`) continuam existindo como funções locais pequenas, agora
  só chamando `ComparisonDelta` para renderizar.
- [`lib/format-date.ts`](../../../lib/format-date.ts) (`formatarDataIso`,
  novo): consolida a duplicação introduzida na própria ETAPA 02.

**Correção de duplicação de fórmula (sem componente novo):**
- [`app/portal/direcao/frequencia/page.tsx`](../../../app/portal/direcao/frequencia/page.tsx):
  troca a fórmula inline por `calcularPercentualFrequencia` — agora todos os
  pontos do código que calculam percentual de frequência usam a mesma
  função.

**Efeito colateral verificado (correção de fuso, não planejada):** ao
consolidar a formatação de data em `formatarDataIso`, as duas tabelas que
antes usavam `format(new Date(campo.data), ...)` diretamente (sem hora)
passam a usar `new Date(`${data}T00:00:00`)`. `new Date("YYYY-MM-DD")` é
interpretado como UTC pela especificação ECMAScript, então em qualquer
ambiente com fuso atrás de UTC (ex.: Brasil, UTC-3) a data podia aparecer um
dia **antes** do real; `new Date("YYYY-MM-DDT00:00:00")` (sem `Z`) é
interpretado no fuso local, corrigindo isso. Confirmado por leitura da
especificação, não por teste automatizado (é formatação de exibição, não
lógica em `lib/analytics/`).

## Decisões técnicas

1. **`TurmaDetalheView` faz a própria busca de dados (`getTurmaDetalhe`), não
   só a renderização.** As duas páginas de origem tinham a mesma lógica de
   busca + filtro + paginação duplicada, não só o JSX — extrair só a
   apresentação teria deixado a parte que mais importa (a query e o filtro)
   duplicada. Cada página continua responsável pelo que é
   inerentemente specific per perfil: sessão/autorização, resolução do
   `escolaId` (via `params.id` no Admin, via `session.escolaId` na
   Direção) e os 3 pontos que realmente variam (breadcrumb, link do aluno,
   base da paginação).
2. **Padronizado em `MetricCard` em vez de manter dois estilos.** O Admin
   usava `Card` simples nesta tela especificamente (inconsistente com o
   resto do próprio `/admin/indicadores`, que já usa `MetricCard`
   amplamente). Escolher `MetricCard` como padrão único não é
   "refatoração puramente estética" proibida pelo escopo — é reduzir de 2
   padrões visuais para 1 na mesma entidade (turma), com o mesmo dado.
3. **`ComparisonDelta` não decide o que é "favorável".** As duas fórmulas de
   origem calculam favorabilidade de formas diferentes e corretas cada uma
   no seu contexto: `TendenciaCell` usa o `tendencia` já classificado por
   `calcularVariacaoFrequencia` (limiar de 0.5 p.p., testado); `DiferencaRede`
   usa um limiar próprio (0.05) e o parâmetro `maiorEhMelhor` (distorção
   idade-série inverte a leitura). Unificar essa classificação dentro do
   componente compartilhado teria exigido escolher um limiar único e
   arriscava mudar o resultado exibido nas bordas (ex.: variação exatamente
   no limiar). Por isso só a parte 100% presentacional (seta, cor, texto)
   foi extraída — a regra de negócio de cada indicador continua onde já
   estava, testada.
4. **`GradeTable` não recebe `ano`.** O componente só sabe renderizar notas
   já filtradas; qual ano foi filtrado é responsabilidade de quem busca os
   dados (`getAlunoDetalheCompleto` já recebe `ano`; `boletim/page.tsx` já
   filtra por `ano` na própria query Prisma). Isso evita o componente
   precisar decidir textos como "Boletim — {ano}" vs "Boletim Escolar" —
   que já são de responsabilidade de cada tela hoje.
5. **`AttendanceTable` (tabela de registros de frequência dia a dia) não foi
   extraída.** `AlunoDetalhe` mostra uma coluna "Situação" (Falta/Presente)
   pensada para leitura por terceiros (Direção/Professor/Admin);
   `app/portal/aluno/frequencia/page.tsx` mostra "Aulas" e "Faltas"
   separadamente, mais detalhado, pensado para o próprio aluno/responsável
   conferir a contagem. São públicos e propósitos de leitura diferentes,
   não a mesma tabela com nomes de coluna diferentes — forçar um componente
   único aqui exigiria uma API com colunas opcionais case a case, sem um
   ganho real de "mesmo cálculo" (não há cálculo nessa tabela, é listagem
   crua). Avaliado e descartado, não esquecido.
6. **`SchoolOverview`, `AttendanceSummary`, `InsightCard`, `CoverageCard`,
   `EvaluationSummary` não foram extraídos.** Confirmado por leitura de
   código (não suposição) que não há hoje duplicação real desses conceitos
   entre perfis: "Atenção agora"/`InsightCard` ainda não existe em nenhuma
   tela (`app/admin/indicadores/page.tsx` documenta isso explicitamente,
   fica para a ETAPA 04); cobertura de avaliação/`CoverageCard` e
   `EvaluationSummary` dependem do módulo de Avaliações Municipais, ainda
   sem consolidação nenhuma para comparar (ETAPA 09); `SchoolOverview` só
   faz sentido depois que a Direção tiver uma Home no mesmo formato do
   Admin (ETAPA 05, ainda não existe). Criar esses componentes agora seria
   exatamente o que a seção 6 do master prompt pede para evitar: "não crie
   um componente só porque o nome aparece".

## Testes executados

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Resultado dos testes

- `npm test`: **143 testes, 29 suítes, 143 passaram, 0 falharam** — sem
  testes novos nesta etapa (os componentes extraídos são apresentacionais/
  Server Components sem regra de negócio nova; a única fórmula tocada,
  `calcularPercentualFrequencia`, já tinha cobertura completa desde antes).
- `npm run typecheck`: sem erros.
- `npm run lint`: sem warnings/erros.
- `npm run build`: sucesso, as mesmas 46 rotas continuam gerando.

Validação visual via browser (conferir que as telas de Admin e Direção
continuam idênticas ao antes, e que a correção de fuso não quebrou nenhuma
data exibida) **não foi executada** — mesma limitação de credenciais já
registrada nas etapas 01/02.

## Riscos e pendências

1. **Validação visual/end-to-end logada não foi feita** (ver acima).
2. **Efeito colateral de fuso na formatação de data** (ver "Alterações
   realizadas") foi raciocinado a partir da especificação ECMAScript, não
   confirmado visualmente num ambiente com fuso diferente de UTC. Vale
   conferir uma tela de frequência em produção após o deploy.
3. **`AttendanceTable` avaliada e descartada** — se um caso de uso futuro
   precisar da mesma tabela com colunas configuráveis, reavaliar (ver
   Decisões técnicas item 5).
4. **`SchoolOverview`/`InsightCard`/`CoverageCard`/`EvaluationSummary`**
   ficam para quando as etapas que os motivam (04, 05, 09) criarem um
   segundo caso de uso real.

## Critérios de aceite

Admin/Diretor/Professor/Aluno passam a poder consumir a mesma base de
componentes acadêmicos sem duplicar fórmulas — cumprido para os 4 pontos
de duplicação real encontrados (turma, boletim, indicador de variação,
percentual de frequência da Direção); os componentes ainda não extraídos
foram avaliados e documentados como decisão consciente de adiar, não como
lacuna esquecida.

## Critérios de aceite

Admin/Diretor/Professor/Aluno passam a poder consumir a mesma base de
componentes acadêmicos sem duplicar fórmulas.

## Próximo passo permitido

ETAPA 04, somente mediante autorização explícita do usuário.
