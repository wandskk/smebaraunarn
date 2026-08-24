# ETAPA 05 — Diretor P0

## Status
DONE

## Objetivo

Transformar a Direção em cockpit da própria escola, reutilizando o núcleo do
Admin com `SchoolScope`, não duplicando como mini-Admin.

## Por que esta etapa existe

O documento de Diretor (`base/extratos/03-diretor.md`) identifica que a Home
deve reutilizar `SchoolOverview` do Admin e que hoje há riscos de mistura de
período (histórico x ano atual) e truncamento silencioso em avaliações
(`take: 100`). Depende de `SchoolScope` (ETAPA 01) e dos componentes
compartilhados (ETAPA 03) já existirem.

## Pré-requisitos

ETAPAS 01, 02, 03 e 04 concluídas (`DONE`).

## Escopo desta etapa

- Home reutilizando `SchoolOverview` com `SchoolScope`.
- Turmas com frequência/aprendizagem alinhadas temporalmente.
- Lista/ficha de estudantes usando componente compartilhado.
- Avaliações sem truncamento silencioso (`take: 100` como se fosse visão
  completa).
- Agrupar avaliação por identidade real (`avaliacaoId`/código/ano), não só
  nome.
- Cobertura esperada x realizada.
- Vínculo Diretor → Escola claramente tratado (visível e confiável).
- Consistência de rotas de estudantes (avaliar `/alunos/[id]` →
  `/estudantes/[id]` quando seguro).

## Fora de escopo

Itens P1 do documento de Diretor (ETAPA 10).

## Arquivos/áreas previstos

`app/portal/direcao/**`, `lib/queries/*` consumidas por essas rotas,
componentes compartilhados da ETAPA 03.

## Checklist
- [x] Reler `base/Plano_Evolucao_MVP_Diretor_SME_Barauna.docx` / extrato.
- [x] Confirmar código atual de cada rota antes de alterar.
- [x] Reutilizar `SchoolOverview` com `SchoolScope` na Home.
- [x] Corrigir truncamento silencioso em avaliações.
- [x] Corrigir agrupamento de avaliação por identidade.
- [x] Validar/tratar vínculo Diretor → Escola ausente/quebrado (já satisfeito, sem alteração).

## Alterações realizadas

### Plano de execução (registrado antes de editar)

Levantamento do código atual (turma-detalhe.tsx, alunos/[id], estudantes/page.tsx,
avaliacoes/page.tsx, layout.tsx, portal/direcao/page.tsx) mostrou que parte do
escopo já está satisfeita por trabalho de etapas anteriores, propagado
automaticamente por reaproveitamento:

- "Turmas com frequência/aprendizagem alinhadas temporalmente" — **já
  satisfeito**: `TurmaDetalheView` (ETAPA 03) + fix de janela (ETAPA 04
  sub-lote 1) são compartilhados por Admin e Direção; nenhuma mudança
  necessária aqui.
- "Lista/ficha de estudantes usando componente compartilhado" — **já
  satisfeito**: `AlunoDetalhe` (ETAPA 03) e `getAlunoDetalheCompleto` (janela
  real de 90 dias, ETAPA 02) já são usados por `/portal/direcao/alunos/[id]`.
- "Vínculo Diretor → Escola claramente tratado" — **já satisfeito**:
  `app/portal/direcao/layout.tsx` já bloqueia acesso e orienta o usuário
  quando `session.escolaId` é nulo. Não alterado.

Trabalho real desta etapa, em 3 sub-lotes pequenos e testáveis:

1. **Avaliações sem truncamento silencioso + identidade real + cobertura** —
   maior bug P0 do documento de Diretor. Nova query
   `lib/queries/avaliacoes.ts`, catálogo em `/portal/direcao/avaliacoes` e
   nova rota `/portal/direcao/avaliacoes/[id]` com resultados paginados.
2. **Consistência de rotas de estudantes** — `/portal/direcao/estudantes/[id]`
   passa a ser a rota canônica; `/portal/direcao/alunos/[id]` vira redirect.
3. **Home cockpit reaproveitando SchoolOverview/Atenção agora/Freshness** —
   extração de `SchoolOverview` (usado hoje só em `/admin/escolas/[id]`) para
   `components/portal/school-overview.tsx`, reaproveitado pela Home da
   Direção com `SchoolScope`; `getInsightsAtencaoEscola` novo em
   `lib/queries/atencao.ts` (mesmas 3 regras de rede, escopadas a 1 escola);
   badges de freshness por módulo.

### Arquivos alterados/criados

- Novo `lib/queries/avaliacoes.ts` — `getAvaliacoesResumoPorEscola`,
  `getAvaliacaoDetalhePorEscola`, `TIPO_AVALIACAO_LABEL`,
  `NIVEL_FLUENCIA_LABEL`.
- Novo `app/portal/direcao/avaliacoes/[id]/page.tsx` — cobertura por turma +
  resultados paginados com filtro de turma/nível.
- Reescrito `app/portal/direcao/avaliacoes/page.tsx` — catálogo por
  avaliação (antes: lista de resultados soltos agrupada por nome).
- Novo `app/portal/direcao/estudantes/[id]/page.tsx` (conteúdo movido de
  `alunos/[id]`); `app/portal/direcao/alunos/[id]/page.tsx` agora é
  redirect.
- `app/portal/direcao/estudantes/page.tsx`,
  `app/portal/direcao/turmas/[turma]/page.tsx`,
  `components/portal/turma-detalhe.tsx` — links atualizados para a nova
  rota.
- Novo `components/portal/school-overview.tsx` (`SchoolOverview`) —
  extraído de `app/admin/escolas/[id]/page.tsx` (comportamento idêntico,
  só mudou de lugar).
- Reescrito `app/portal/direcao/page.tsx` — cockpit (Atenção agora +
  SchoolOverview + freshness por módulo + estrutura da escola), no lugar
  dos 5 MetricCards de contagem.
- `lib/analytics/atencao.ts` — `gerarInsightsFrequencia`/
  `gerarInsightsDesempenho`/`gerarInsightsDistorcao` ganham parâmetro
  opcional `linkBuilder` (default preserva o comportamento atual do
  Admin).
- Novo `getInsightsAtencaoEscola` em `lib/queries/atencao.ts`.
- `app/admin/avaliacoes/page.tsx` e `app/admin/avaliacoes/[id]/page.tsx` —
  `TIPO_LABEL`/`NIVEL_LABEL` locais (duplicados) trocados pelos
  equivalentes centralizados em `lib/queries/avaliacoes.ts`.

## Decisões técnicas

1. **Cobertura de avaliação usa só turmas já tocadas pela aplicação, não o
   total de matriculados da escola.** O modelo `Avaliacao` não guarda
   turmas/série-alvo (não existe uma tabela de aplicabilidade
   avaliação↔turma). Definir "esperado" como todos os matriculados da
   escola inflaria o denominador com turmas que talvez nem devessem ser
   avaliadas (ex.: série errada para o tipo de avaliação); a rede 7.6 do
   master prompt também veda inventar categoria sem fonte confiável. A
   cobertura calculada (matriculados nas turmas que já têm ≥1 resultado)
   é honesta sobre sua limitação — documentada na própria tela — mas não
   detecta turmas 100% pendentes (zero aplicação). Fica registrado como
   limitação conhecida, não como bug.
2. **`linkBuilder` opcional em vez de duplicar o motor de insights.** As 3
   regras puras de `lib/analytics/atencao.ts` (frequência/desempenho/
   distorção) já eram exatamente o que a Direção precisa — só o
   deep-link muda (Admin vai para `/admin/escolas/[id]`, Direção não tem
   essa rota). Um parâmetro com default mantém 100% de compatibilidade
   com os 16 testes existentes da ETAPA 04 e evita copiar as 3 funções.
3. **Regra de sincronização (regra 4) não entra no "Atenção agora" da
   Direção.** A Direção não tem painel de sincronização para agir sobre
   isso — é uma ação da Secretaria. A mesma informação já aparece,
   passiva, no bloco "Atualização dos dados" com `DataFreshnessBadge` por
   módulo (regra 7.5).
4. **`SchoolOverview` extraído agora, não antes.** A ETAPA 04 já tinha
   avaliado extrair esse núcleo e decidido esperar um segundo caso de uso
   real (ver `etapas/04-admin-p0.md`) — esta etapa é esse segundo caso. A
   extração foi puramente mecânica (mesmo JSX, mesmos cálculos), sem
   mudança de comportamento em `/admin/escolas/[id]`.
5. **`/portal/direcao/alunos/[id]` vira redirect, não é removida.**
   Preserva links/favoritos já compartilhados (achado P1 do documento de
   Diretor, tabela 7), com custo mínimo (uma rota a mais no build).
6. **Vínculo Diretor → Escola não foi alterado.** Levantamento do código
   mostrou que `app/portal/direcao/layout.tsx` já bloqueia acesso e
   orienta o usuário quando `session.escolaId` é nulo — o requisito da
   ETAPA 05 (que é sobre o lado Direção, `app/portal/direcao/**`) já
   estava satisfeito. Exibir a origem do vínculo (SIGEduc vs. manual) e o
   filtro "Diretor sem escola" em `/admin/usuarios` são itens do lado
   Admin (fora da área prevista desta etapa) — registrados como
   candidatos a P1/P2, não esquecidos.

## Testes executados

- `npm test` (suíte completa).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.

## Resultado dos testes

- `npm test`: **180/180** (177 pré-existentes + 3 novos — cobrem o
  parâmetro `linkBuilder` nas 3 regras de `gerarInsights*`). Não foram
  adicionados testes para `lib/queries/avaliacoes.ts`: seguindo o padrão já
  estabelecido no projeto, funções em `lib/queries/*` que fazem I/O via
  Prisma não têm suíte própria (só as funções puras de `lib/analytics/*`
  são testadas por `node:test`).
- `npm run typecheck`: limpo.
- `npm run lint`: limpo (0 warnings/erros).
- `npm run build`: sucesso — 49 rotas (2 novas:
  `/portal/direcao/avaliacoes/[id]` e `/portal/direcao/estudantes/[id]`;
  `/portal/direcao/alunos/[id]` continua existindo, agora como redirect).
- Validação end-to-end logada (login real DIRETOR navegando pelas telas)
  **não foi executada** — mesma limitação de credenciais de teste já
  registrada nas etapas 01–04; fica pendente para a ETAPA 11.

## Riscos e pendências

- Cobertura de avaliação não detecta turmas com **zero** aplicação (só
  mede dentro das turmas já tocadas) — ver decisão técnica 1. Se a rede
  quiser essa visão completa, precisa de uma fonte real de
  turmas-alvo por avaliação (ex.: nova tabela de aplicabilidade), fora do
  escopo desta etapa.
- Itens do documento de Diretor que dependem do lado Admin (origem do
  vínculo Diretor→Escola, filtro "Diretor sem escola" em
  `/admin/usuarios`) não foram tratados aqui — não estavam em
  `app/portal/direcao/**`, a área prevista desta etapa.
- `/portal/direcao/notas` e `/portal/direcao/frequencia` (páginas
  específicas, não o cockpit da Home) não foram alteradas — não estavam no
  escopo P0 explícito da ETAPA 05 no master prompt (parte dos achados
  correspondentes é P1, ETAPA 10: seletor de unidade/bimestre em Notas,
  períodos 7/30/60/90 dias em Frequência).
- Validação visual/E2E autenticada como DIRETOR real continua pendente
  (ETAPA 11), mesma limitação já registrada desde a ETAPA 01.

## Critérios de aceite

Tudo que o Diretor vê está restrito à própria escola e usa o mesmo cálculo do
Admin para a mesma entidade.

## Próximo passo permitido

ETAPA 06, somente mediante autorização explícita do usuário.
