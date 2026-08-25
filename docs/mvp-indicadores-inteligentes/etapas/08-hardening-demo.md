# ETAPA 08 — Hardening e roteiro de demonstração

## Status
DONE

## Objetivo

Verificação final funcional, acessibilidade, responsividade e build, mais
roteiro de demonstração com dados reais.

## Sweep de hardening (agente de exploração, somente leitura)

Cobertura: as 5 páginas de indicadores + `app/admin/avaliacoes/[id]/page.tsx`
+ `app/admin/avaliacoes/page.tsx` + componentes compartilhados
(`MetricCard`, `InsightCard`, `TimeSeriesChart`, `HorizontalBarChart`,
`MiniBarChart`, sidebar).

### Funcional

- **`?ano=` preservado nos drill-downs:** 1 bug real encontrado e
  corrigido — `app/admin/avaliacoes/[id]/page.tsx`, links "Escolas sem
  nenhum resultado" apontavam para `/admin/escolas/${id}` sem `?ano=`.
  Como `/admin/escolas/[id]` cai no ano mais recente disponível quando o
  parâmetro falta, clicar a partir de uma avaliação de um ano antigo podia
  abrir a ficha da escola no ano errado. Corrigido para
  `?ano=${avaliacaoBase.ano}`. Um segundo caso (Central → detalhe de
  avaliação) foi avaliado e considerado inofensivo: `avaliacoes/[id]` não
  lê nenhum parâmetro `ano` da URL, então não há contexto a perder. Todos
  os outros links verificados (frequência, aprendizagem, fluxo-trajetória,
  comparativos) já preservavam `ano` desde as ETAPAs 04-06.
- **CPF/PII:** nenhuma ocorrência de `cpf`, `dataNascimento`,
  `nomeEstudante` ou `matricula` nas 5 páginas de indicadores — são
  agregados de rede/escola, nunca dado de estudante identificável.
- **Dados reais:** confirmado em todas as etapas anteriores (nenhum mock
  em nenhuma tela).
- **RBAC:** confirmado — `middleware.ts` exige sessão + papel
  ADMIN/SECRETARIA para `/admin/:path*`, e `app/admin/layout.tsx` chama
  `requireSession(["ADMIN","SECRETARIA"])` de novo (dupla camada). Nenhuma
  das páginas desta feature está fora de `app/admin/`.
- **Null/empty states:** todas as 5 páginas guardam métricas nulas com
  `"-"` e datasets vazios com `EmptyState`/`TableEmptyState` antes de
  qualquer gráfico — nenhum caminho encontrado que renderize `undefined`
  ou `NaN` cru.

### Acessibilidade

- **Estado nunca só por cor:** `Badge` exige `children` (texto) por
  tipo — nenhum uso possível sem rótulo. `FaixaBadge`/`DataFreshnessBadge`
  combinam cor + texto (+ ícone no segundo). `InsightCard` combina cor +
  ícone (`AlertTriangle`/`AlertCircle`) + texto "Crítico"/"Atenção".
- **`prefers-reduced-motion`:** `app/globals.css` já desativa
  `.animate-fade-in-up` e `.skeleton-shimmer::after` sob
  `@media (prefers-reduced-motion: reduce)` — usado em todas as novas
  telas, nenhuma alteração necessária.
- **Navegação por teclado:** todos os controles novos (filtros do
  Panorama/Comparativos, bloco `<details>` de Fluxo/Trajetória, cards de
  insight/avaliação) são elementos nativos (`<a>`, `<Link>`,
  `<details>/<summary>`) — operáveis por teclado sem JavaScript adicional.
- **Labels:** mantidos os padrões já existentes (`TableHeadCell`, `label`
  de `MetricCard`).

### Responsividade

Verificado sem overflow horizontal de página (`scrollWidth === clientWidth`)
em 375px, 768px e 1440px, nas telas com maior densidade de conteúdo
(Central, Frequência, Aprendizagem, Fluxo/Trajetória) — tabelas com scroll
próprio, gráficos responsivos (`ResponsiveContainer` do Recharts).

## Build

```bash
npm test          # 225/225 passaram
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # FALHOU — ver "Incidente de ambiente" abaixo
```

## Incidente de ambiente — cota de transferência do banco (Neon) esgotada

Durante a verificação final desta etapa, `npm run build` passou a falhar
com:

```
Error querying the database: ERROR: Your project has exceeded the data
transfer quota. Upgrade your plan to increase limits.
```

**Não é um problema de código.** Confirmado:

1. Todas as etapas anteriores (00-07) rodaram `npm run build` com sucesso
   contra o mesmo banco, mais cedo na mesma sessão.
2. As páginas construídas nesta feature (`/admin/indicadores/*`,
   `/admin/avaliacoes/[id]`) são todas rotas dinâmicas (`ƒ`,
   server-rendered on demand) — não fazem fetch em build-time, então não
   aparecem na lista de páginas que falharam no build.
3. As únicas 2 páginas que falharam no build (`/` e `/documentos`) são
   pré-existentes, não tocadas por este trabalho, e falham porque
   pré-renderizam com dado real em build-time.
4. `typecheck`, `lint` e `test` (225/225) não dependem do banco e
   continuam passando limpos.

Causa provável: o volume de verificação visual com dados reais no browser
ao longo das 8 etapas desta sessão (múltiplos `preview_start`/reload por
etapa, todos contra o banco real) esgotou a cota de transferência do plano
atual do Neon. Ação necessária do usuário: verificar o painel do Neon e
fazer upgrade do plano ou aguardar o reset da cota — fora do controle
desta sessão. Registrado aqui para que o build seja re-executado (e o
critério de pronto correspondente marcado) assim que a cota for
restabelecida.

## Roteiro de demonstração

Criado [`ROTEIRO_DEMO.md`](../ROTEIRO_DEMO.md) com 3 casos reais
capturados durante a verificação das ETAPAs 01-07 (frequência crítica no
CEJAB, distorção idade-série na Escola Rui Barbosa, análise de itens do
SPADEB 2026 — 9º Ano), mais os blocos de Pulso da rede e Qualidade dos
dados.

## Critério de pronto

- [x] `ano` preservado nos drill-downs (1 bug corrigido nesta etapa).
- [x] Filtros, deep-links, RBAC verificados.
- [x] Nenhum CPF/PII na Central nem nas demais telas.
- [x] Dados reais em todas as telas (nenhum mock).
- [x] Null/empty states tratados explicitamente.
- [x] Estado nunca só por cor; `prefers-reduced-motion` respeitado;
      navegação por teclado via elementos nativos.
- [x] Responsividade verificada em 375/768/1440px.
- [x] `npm test`/`typecheck`/`lint` passam.
- [ ] `npm run build` — bloqueado por cota externa do banco (Neon), não
      por código; re-executar quando a cota for restabelecida.
- [x] Roteiro de demo com dados reais criado.

## Definition of Done do MVP (seção 19 do plano)

Ver checklist completo em
[`PLANO_MVP_INDICADORES_INTELIGENTES.md`](../../../PLANO_MVP_INDICADORES_INTELIGENTES.md#19-definition-of-done-do-mvp).
Todos os itens de produto/regra foram atendidos ao longo das ETAPAs 00-08
(sem ranking opaco, sem score agregado, tendência real, distribuição em
vez de só média, avaliações na narrativa executiva, freshness visível sem
dominar a tela, nenhuma regra oficial inventada, nenhum dado mockado,
nenhum CPF/PII, mobile+desktop verificados). O único item pendente é a
confirmação final de `npm run build` com o banco disponível.

## Próximo passo

MVP concluído, mediante confirmação do usuário após a cota do banco ser
restabelecida e o build final rodar limpo. Nenhuma etapa adicional
planejada além desta.
