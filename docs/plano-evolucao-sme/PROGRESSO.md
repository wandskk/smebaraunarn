# Progresso — Evolução Incremental do SME Baraúna

**Última atualização:** 2026-08-24 (ETAPA 10, rodada 2 — importação real de
avaliações concluída após o fechamento da ETAPA 11)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento, bloqueada ou concluída. Ao final de cada etapa, este arquivo deve
ser atualizado junto com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Auditoria, baseline e documentação | **DONE** | 2026-08-24 |
| 01 | Scopes e Capabilities | **DONE** | 2026-08-24 |
| 02 | Contexto temporal e Data Freshness | **DONE** | 2026-08-24 |
| 03 | Componentes acadêmicos compartilhados | **DONE** | 2026-08-24 |
| 04 | Admin P0 | **DONE** | 2026-08-24 |
| 05 | Diretor P0 | **DONE** | 2026-08-24 |
| 06 | Professor P0 | **DONE** | 2026-08-24 |
| 07 | Aluno P0 | **DONE** | 2026-08-24 |
| 08 | Servidor Geral P0 | **DONE** | 2026-08-24 |
| 09 | Avaliações Municipais | **DONE** | 2026-08-24 |
| 10 | P1: evolução funcional | **DONE** (rodadas 1 e 2 — ver resumo) | 2026-08-24 |
| 11 | Hardening, regressão e fechamento | **DONE** | 2026-08-24 |

## Estado final da rodada

**As 12 etapas do master prompt (00-11) estão concluídas**, incluindo uma
2ª rodada da ETAPA 10 (Importação de avaliações) pedida explicitamente
pelo usuário depois do fechamento inicial. Não há etapa `PENDING` no
roteiro obrigatório. O que resta é opcional e só entra mediante pedido
explícito do usuário:

- Uma nova rodada da ETAPA 10 com um dos 2 blocos P1 ainda não
  selecionados (comunicação/documentos, itens específicos de
  Direção/Aluno).
- Qualquer item do backlog P2 listado em
  [`etapas/11-hardening-regressao-e-fechamento.md`](etapas/11-hardening-regressao-e-fechamento.md#backlog-final--p1-não-selecionado-etapa-10--p2-master-prompt)
  — nenhum foi implementado, todos exigem migração de schema e/ou decisão
  de produto com a Secretaria.

## Resumo da ETAPA 10 — rodada 2 (importação de avaliações)

Pedida explicitamente pelo usuário depois do fechamento inicial da rodada
(ETAPA 11 incluída), com um pedido concreto: importar avaliações reais que
ele tinha em mãos. Duas entregas em paralelo:

1. **Funcionalidade geral reaproveitável**: nova aba "Importar" em
   `/admin/avaliacoes/[id]`, com fluxo de duas etapas (analisar → preview
   com status por linha → confirmar) para questões (gabarito) e resultados
   em lote, aceitando CSV ou XLSX (`lib/import/parse-tabular.ts` +
   `lib/import/avaliacoes-import.ts`, 13 testes novos). Resultado identifica
   o aluno por matrícula, CPF, ou nome (+ escola/turma para desambiguar).
   Dependência nova `xlsx` (SheetJS) trocada pela build oficial corrigida
   do CDN do próprio projeto depois do `npm install` acusar 2
   vulnerabilidades altas na versão do registro npm.
2. **Migração real de dois datasets externos**: o usuário forneceu dois
   dumps Postgres (`.backup`) de sistemas próprios da rede — SPADEB 2026
   (`barauna-edu-hub`, avaliação objetiva com gabarito por item) e Leitor
   Fluente Rápido (avaliação de fluência leitora) — que ele restaurou
   localmente. Inspecionados e migrados via `scripts/
   migrar-avaliacoes-externas.ts`, reaproveitando as mesmas funções da
   tela. Resultado: **9 avaliações, 320 questões, 1.831 resultados**
   gravados na base real (taxa de match ~82% por nome+escola nos dois
   datasets; 388 linhas sem correspondência clara ficaram de fora,
   listadas em log, nunca adivinhadas).

**Bug real encontrado e corrigido antes de fechar**: a primeira gravação
populou `pontuacao` com um campo do SPADEB que estava zerado em 99% dos
registros na origem (não calculado pelo sistema de origem, não uma nota
real) — pego na verificação visual pós-commit, corrigido revertendo
`pontuacao` para `null` nesses casos (a % de acerto real já é calculada
pela Análise por item da ETAPA 09, a partir de `respostasJson` + gabarito).

Baseline final: `npm test` 206/206 (193 + 13 novos), `typecheck`/`lint`/
`build` limpos (66 rotas — sem rota nova, a importação vive dentro da rota
já existente). Validação visual feita logada como Admin e como Diretor
contra a base de produção real, com o próprio dado migrado.

Detalhes completos: [`etapas/10-p1-evolucao-funcional.md`](etapas/10-p1-evolucao-funcional.md).

## Resumo da ETAPA 11

Varredura de fechamento — sem feature nova, só auditoria e documentação.
Principais achados:

- **Autorização por URL direta**: auditoria completa de todas as rotas
  dinâmicas + testes manuais reais com as 5 contas fornecidas pelo
  usuário. Nenhum gap encontrado — todo acesso a entidade por ID já é
  escopado (via `canView*`/`scopeFromSession` ou filtro direto na query
  por `session.escolaId`/atribuições).
- **PII**: CPF mascarado por padrão em listas desde a ETAPA 04; revelado
  só em fichas de detalhe (padrão deliberado, não um achado novo); nenhum
  CPF/senha em log de runtime.
- **Mobile/estados vazio-loading-erro**: verificados nas telas das ETAPAS
  09/10 — sem quebra de layout, tabelas rolam horizontalmente dentro do
  próprio container.
- **Instabilidade de ambiente durante a etapa** (não é bug de código):
  processos `next dev` remanescentes bloquearam `npm run build`
  (`EPERM` no engine do Prisma) e um `rm -rf .next` concorrente com um
  servidor de dev ativo corrompeu o cache, gerando um erro de runtime que
  o usuário reportou em `/admin/sincronizacao`. Resolvido limpando
  processos + cache; build de produção limpo confirmou 66 rotas e a tela
  voltou a renderizar normalmente.
- Backlog final consolidado num único lugar (P1 não escolhido da ETAPA 10
  + P2 do master prompt) — ver link acima.

Baseline final: `npm test` 193/193, `typecheck`/`lint`/`build` limpos (66
rotas — nenhuma nova nesta etapa).

Detalhes completos: [`etapas/11-hardening-regressao-e-fechamento.md`](etapas/11-hardening-regressao-e-fechamento.md).

## Resumo da ETAPA 10

Primeira etapa do plano com escopo explicitamente aberto ao usuário antes de
implementar — o próprio checklist da ETAPA 10 pede priorização, e o backlog
P1 dos 5 DOCX é grande demais para uma rodada só. Apresentados 4 blocos via
pergunta ao usuário; **selecionado apenas "Indicadores de rede"**.

1. **Motor de faltas consecutivas (3/5/10) conectado pela primeira vez.**
   `lib/analytics/frequencia.ts` já tinha `faltasConsecutivasAtuais`/
   `classificarGravidadeFaltasConsecutivas`, puros e testados desde etapas
   anteriores, mas nunca ligados a nenhuma query ou tela. Novas
   `getEstudantesEmSequenciaDeFaltas`/`getContagemFaltasConsecutivasPorEscola`
   os conectam a dados reais; a seção nova em `TurmaDetalheView`
   (compartilhada por Admin/Direção/Professor desde a ETAPA 03) leva o
   drill-down aos 3 perfis de uma vez. `/admin/indicadores/frequencia` ganha
   a contagem por escola como ponto de entrada do drill-down.
2. **Filtros de disciplina/unidade em `/admin/indicadores/aprendizagem`** —
   a distribuição (média/mediana/percentis/proporção) já existia; faltava só
   o recorte por componente curricular e bimestre.
3. **Completude por campo em `/admin/indicadores/qualidade`** — 6 checagens
   novas (nascimento/CPF do estudante, escola do servidor, escola/série da
   nota, escola da frequência) + lista de nomes de escola sem
   correspondência a uma `Escola` cadastrada.
4. **Nova rota `/admin/turmas`** — visão de rede por turma (escola, turno,
   estudantes, docentes, frequência com faixa, desempenho), com filtros e 3
   ordenações; cada linha abre a ficha de turma já existente.

**Deliberadamente sem score de atenção** em `/admin/turmas` (frequência e
desempenho lado a lado, não combinados — mesmo critério da ETAPA 04) e
**sem migração de schema** (todos os itens usam dados já sincronizados).

**3 dos 4 blocos apresentados ficam como backlog em aberto, não perdidos**:
importação CSV/XLSX de avaliações (ETAPA 09 já deixou `respostasJson`
pronto para recebê-la), comunicação/documentos (CMS e Documentos), e itens
específicos por perfil (Direção: servidores/notas; Aluno: declaração de
matrícula). Qualquer um pode virar uma nova rodada da ETAPA 10.

Baseline final: `npm test` 193/193 (sem teste novo — itens desta rodada são
consultas/apresentação sobre motores já testados), `typecheck`/`lint`/
`build` limpos (66 rotas — 1 nova: `/admin/turmas`).

**Validação end-to-end logada executada** nesta etapa (não mais pendente) —
o usuário forneceu contas reais dos 5 papéis. Encontrado e corrigido em
seguida um bug real de inconsistência: `getTurmasRede` atribuía frequência/
nota pela turma atual do estudante em vez do campo `turma` do próprio
registro (a mesma convenção que a ficha de turma já usava desde a ETAPA
03), fazendo a lista de rede e a ficha mostrarem números diferentes para a
mesma turma quando havia estudante com histórico de troca. Ver
[`decisoes/10-validacao-e2e-turmas-rede.md`](decisoes/10-validacao-e2e-turmas-rede.md).

Detalhes completos: [`etapas/10-p1-evolucao-funcional.md`](etapas/10-p1-evolucao-funcional.md).

## Resumo da ETAPA 09

Primeira etapa transversal do plano — em vez de aprofundar um perfil por
vez, consolidou o motor de consultas de Avaliações Municipais para ser
reaproveitado por Admin (rede), Direção (escola, já existente desde a
ETAPA 05) e Professor (turmas atribuídas, novo).

1. **`lib/queries/avaliacoes.ts` generalizado** com um `AvaliacaoScope`
   (`rede`/`escola`/`professor`) em vez de reescrever a mesma fórmula de
   cobertura 3 vezes; `getAvaliacoesResumoPorEscola`/
   `getAvaliacaoDetalhePorEscola` (Direção, ETAPA 05) viraram wrappers finos
   sobre o motor novo, sem quebrar comportamento. Efeito colateral corrigido
   ao generalizar: cobertura agora agrupa por `(escolaId, turma)`, não só
   `turma` — no escopo rede, o código de turma reutilizado entre escolas
   (achado P1 desde a ETAPA 00/04) inflaria matriculados incorretamente se
   agrupasse só por `turma`.
2. **Admin**: catálogo ganhou colunas de cobertura/status (calculado só
   para os ids da página, sem escanear toda a tabela de resultados);
   `/admin/avaliacoes/[id]` reescrita em abas (Visão Geral/Questões/
   Resultados/Análise) — corrige a página que antes buscava **todos** os
   resultados sem paginação; nova Visão Geral com escolas sem nenhum
   resultado; edição de questão (antes só criar/excluir); validação de
   número de questão duplicado (necessária agora que a Análise depende de
   número único); captura opcional de resposta por item no lançamento de
   resultado, alimentando `respostasJson` (nunca usado antes) e a nova
   Análise por questão/descritor (% de acerto vs. gabarito).
3. **Diretor**: reaproveita o badge de status derivado e ganha a mesma
   Análise por item, somente leitura, escopada à própria escola.
4. **Professor**: perfil que não tinha nenhuma rota de avaliação —
   `/portal/professor/avaliacoes` (lista) e `/portal/professor/avaliacoes/
   [id]` (detalhe), escopados no banco às turmas atribuídas
   (`ProfessorScope.atribuicoes` da ETAPA 06), somente leitura.

**Decisões deliberadas de não construir agora**: importação CSV/XLSX de
questões/resultados (o checklist da própria etapa já permite adiar — fica
para a ETAPA 10, com `respostasJson` já pronto para recebê-la);
comparação de evolução agregada entre edições no nível de rede/escola
(exigiria desenho de coorte que este plano não valida — arriscaria violar a
regra de nunca comparar grupos incompatíveis; a evolução pessoal do Aluno,
ETAPA 07, já cobre o caso seguro); catálogo estruturado de
descritores/habilidades BNCC (`descritor` segue texto livre, já agrupável).
Status da avaliação é sempre derivado da cobertura (heurística pura e
testada), nunca persistido — evita schema por conveniência e score opaco.

Baseline final: `npm test` 202/202 (193 pré-existentes + 9 novos em
`lib/analytics/avaliacoes.test.ts`), `typecheck`/`lint`/`build` limpos (65
rotas — 2 novas do Professor). Validação end-to-end logada não foi
executada — mesma limitação de credenciais das etapas anteriores; fica
pendente para a ETAPA 11.

Detalhes completos: [`etapas/09-avaliacoes-municipais.md`](etapas/09-avaliacoes-municipais.md).

## Resumo da ETAPA 08

Última etapa de perfil individual antes da consolidação transversal de
Avaliações Municipais (ETAPA 09). Achado P0 central confirmado no código:
a origem (SIGEduc) manda `turno`/`carga_trabalho` na própria linha do
servidor, independente de haver turma — mas o sync só persistia esses
valores em `ServidorTurma`, descartando-os silenciosamente para servidores
sem turma (o caso típico de `SERVIDOR_GERAL`, cargos administrativos).

1. **Migração pequena e aditiva** (autorizada explicitamente pelo
   usuário): `Servidor.turno`/`Servidor.cargaTrabalho` (nullable, sem
   backfill — dado nunca foi capturado antes). `lib/sync/sigeduc-sync.ts`
   passa a gravar esses campos no `Servidor` só quando a linha não tem
   turma, sem misturar com a atribuição pedagógica de `ServidorTurma`
   (que pode variar por turma).
2. **Ficha funcional reescrita**: usa o fallback quando não há turma;
   "Não informado pela fonte" em vez de "-"; `DataFreshnessBadge` do
   módulo SERVIDORES; seção "Contato cadastrado" (email/telefone, já
   sincronizados mas nunca exibidos antes); aviso quando `escolaNome`
   (texto da origem) diverge do vínculo estruturado; pendência
   pedagógica com tom neutro (não mais alerta laranja) + transparência de
   origem, em vez de inventar uma regra de aplicabilidade que só a
   Secretaria pode confirmar.

**Decisões deliberadas de não construir**: `ServidorLotacao` (o próprio
documento classifica como P1/P2, sem evidência de múltiplas lotações que
justifique agora); capabilities por tipo de função (nenhuma diferenciação
real identificada ainda — mesma régua da ETAPA 01 para `CapabilityGate`).

Baseline final: `npm test` 184/184 (sem testes novos — mudança de
apresentação/fallback, `lib/sync/*` segue sem suíte própria por depender
de I/O externo), `typecheck`/`lint`/`build` limpos (63 rotas, nenhuma
nova). Validação end-to-end logada como SERVIDOR_GERAL real não foi
executada — mesma limitação de credenciais das etapas anteriores; fica
pendente para a ETAPA 11.

Detalhes completos: [`etapas/08-servidor-geral-p0.md`](etapas/08-servidor-geral-p0.md).

## Resumo da ETAPA 07

Levantamento inicial mostrou que os 2 achados P0 mais citados no master
prompt para este perfil ("frequência sem aulas retorna 100%" e "90
registros em vez de período real") **já tinham sido corrigidos na ETAPA
02** — o trabalho real desta etapa foi o restante do escopo, em 4 frentes:

1. **Frequência**: "faltas abonadas" media linhas marcadas `abonada=true`,
   não a quantidade real de faltas nesses registros (um registro pode
   representar mais de uma aula/falta) — corrigido para somar `falta` só
   dos registros abonados. Seletor de período (7/30/60/90 dias, antes
   fixo em 90) + badge de atualização de FREQUENCIA.
2. **Boletim**: seletor de ano visível (antes só aceitava `?ano` sem UI) +
   aviso de médias parciais + nova coluna opcional de completude
   (`x/4 unidades`) no `GradeTable` compartilhado (opt-in, não muda
   Admin/Direção/Professor) + badge de NOTAS.
3. **Home**: reescrita para "resumo dos últimos 30 dias" (frequência,
   disciplinas com nota lançada, última avaliação municipal) no topo;
   NIS/filiação/responsável movidos para bloco `<details>` recolhível.
4. **Avaliações Municipais próprias**: novas `/portal/aluno/avaliacoes`
   (lista) e `/portal/aluno/avaliacoes/[id]` (detalhe + evolução pessoal
   por tipo, sem ranking) — reaproveita `lib/queries/avaliacoes.ts` e os
   rótulos já centralizados na ETAPA 05.

**Itens deliberadamente adiados**: filtros de ano/tipo na lista de
avaliações (lista por estudante tende a ser pequena); declaração de
matrícula (fora do escopo P0 explícito, "já resolve bem a tarefa
principal" segundo o próprio documento) — ambos candidatos a P1/ETAPA 10.

Baseline final: `npm test` 184/184 (sem testes novos — mudanças são
apresentacionais/agregação simples, mesmo padrão de granularidade do
código que substituíram), `typecheck`/`lint`/`build` limpos (63 rotas).
Validação end-to-end logada como ALUNO real não foi executada — mesma
limitação de credenciais das etapas anteriores; fica pendente para a
ETAPA 11.

Detalhes completos: [`etapas/07-aluno-p0.md`](etapas/07-aluno-p0.md).

## Resumo da ETAPA 06

A etapa de maior risco estrutural do plano até agora: além do trabalho de
tela, incluiu uma migração de schema em produção, autorizada explicitamente
pelo usuário depois de a decisão ser documentada (regra 7.8 do master
prompt).

1. **Bug P0 concreto**: Home do professor contava todos os alunos da
   escola quando não havia turma vinculada (filtro por turma era omitido
   do `where`) — corrigido para `0`.
2. **"Minhas Turmas" de verdade**: nova `/portal/professor/turmas` (lista
   de turmas, não mais alunos de todas as turmas misturados) +
   `/portal/professor/turmas/[turma]` (reaproveita `TurmaDetalheView` da
   ETAPA 03, com checagem de escopo antes de renderizar).
3. **Rota de estudante separada da rota de turma**: `turma/[id]` (que na
   verdade representava estudante) virou
   `/portal/professor/estudantes/[id]`, com redirect no caminho antigo.
4. **Notas respeitam disciplina do professor por padrão** — novo prop
   `disciplinasVisiveis` em `AlunoDetalhe`, filtra o boletim para a(s)
   disciplina(s) do professor naquela turma específica (frequência
   continua com resumo geral, política diferente por tipo de dado).
5. **Migração `ServidorTurma.escolaId`** (o item de maior risco do
   documento de Professor): auditoria confirmou 57 códigos de turma
   colidindo entre escolas diferentes na base real. `ServidorTurma` não
   tinha `escolaId` própria — `Servidor.escolaId` é único por servidor e
   sobrescrito a cada sync, perdendo a escola de cada turma individual
   para professores multi-escola. Migração manual (coluna nullable →
   backfill → `NOT NULL` → troca de unique constraint) aplicada em
   produção via `prisma migrate deploy`, confirmada 611/611 linhas
   corretas. `ProfessorScope` deixou de ser `{ escolaId, turmas: string[] }`
   e virou `{ atribuicoes: { escolaId, turma }[] }`; `canViewTurma`/
   `canViewEstudante`/`canViewEscola` passaram a checar a tupla exata em
   vez de escolaId+turma separadamente — o que efetivamente fecha o risco
   estrutural, não só a migração em si. `lib/sync/sigeduc-sync.ts` foi
   ajustado para gravar o `escolaId` correto por linha em cada
   sincronização futura.

**Itens deliberadamente adiados, com justificativa registrada**:
disciplina na identidade de `ServidorTurma` (P1 — cardinalidade da API do
SIGEduc não confirmada); `/portal/professor/avaliacoes` (fora de escopo
explícito — só "preparar o encaixe", que ficou pronto via
`ProfessorScope.atribuicoes`, para a ETAPA 09 implementar de fato).

Baseline final: `npm test` 184/184 (4 testes novos), `typecheck`/`lint`/
`build` limpos (61 rotas). Validação end-to-end logada como PROFESSOR real
não foi executada — mesma limitação de credenciais das etapas anteriores;
fica pendente para a ETAPA 11.

Detalhes completos: [`etapas/06-professor-p0.md`](etapas/06-professor-p0.md).

## Resumo da ETAPA 05

Levantamento inicial mostrou que 3 dos 8 itens do escopo já estavam
satisfeitos por reaproveitamento automático de etapas anteriores (turma
com período unificado — ETAPA 03/04; ficha de estudante compartilhada —
ETAPA 02/03; vínculo Diretor→Escola já tratado em
`app/portal/direcao/layout.tsx`). Trabalho real em 3 frentes:

1. **Avaliações sem truncamento silencioso**: a tela listava só os 100
   resultados mais recentes agrupados por `avaliacao.nome` (risco de
   misturar edições diferentes com nome igual). Nova
   `lib/queries/avaliacoes.ts` + catálogo em `/portal/direcao/avaliacoes`
   (uma linha por avaliação, agrupada por `avaliacaoId`) + nova rota
   `/portal/direcao/avaliacoes/[id]` com cobertura por turma (matriculados
   × resultados) e resultados paginados de verdade. Cobertura é calculada
   só dentro das turmas já tocadas pela aplicação — o modelo não tem
   tabela de turmas-alvo por avaliação, então "esperado" não inclui
   turmas com zero aplicação (limitação documentada, não inventada).
2. **Consistência de rotas**: `/portal/direcao/estudantes/[id]` passa a
   ser a rota canônica da ficha do estudante; `/portal/direcao/alunos/[id]`
   vira redirect (preserva links antigos).
3. **Home cockpit**: `SchoolOverview` (comparação com a rede) extraído de
   `/admin/escolas/[id]` para `components/portal/school-overview.tsx` e
   reaproveitado pela Home da Direção — a extração que a ETAPA 04 havia
   deliberadamente adiado por falta de um segundo caso de uso. Novo
   `getInsightsAtencaoEscola` reaproveita as mesmas 3 regras puras de
   "Atenção agora" da ETAPA 04, escopadas a 1 escola (a regra de
   sincronização foi propositalmente deixada de fora — a Direção não tem
   painel de sync para agir sobre ela). Freshness por módulo also exibida.

Baseline final: `npm test` 180/180 (3 testes novos), `typecheck`/`lint`/
`build` limpos. Build final: 49 rotas (46 da ETAPA 04 + 3 novas — `[id]`
de avaliações, `[id]` de estudantes; `alunos/[id]` virou redirect mas
continua contando como rota). Validação end-to-end logada como DIRETOR
real não foi executada — mesma limitação de credenciais das etapas
anteriores; pendência para a ETAPA 11.

Detalhes completos: [`etapas/05-diretor-p0.md`](etapas/05-diretor-p0.md).

## Resumo da ETAPA 04

Executada em 7 sub-lotes pequenos e testáveis (a pedido do usuário, dado o
tamanho do documento de Admin), cada um commitado e enviado ao repositório
separadamente:

1. **Bugs P0 concretos**: janela de frequência da turma alinhada ao mesmo
   ano de notas (`getTurmaDetalhe`); CPF mascarado por padrão em
   `/admin/usuarios` e `/admin/servidores` (`maskCpf`, novo); permissão
   visual Admin×Secretaria em `/admin/usuarios` via `CapabilityGate`
   (ETAPA 01, até então sem uso).
2. **Saúde da base no dashboard `/admin`**: bloco novo reaproveitando
   `getStatusSincronizacao`/`DataFreshnessBadge` (ETAPA 02).
3. **"Atenção agora"**: 4 regras dinâmicas explicáveis (frequência em
   queda, desempenho abaixo da rede, distorção elevada, sincronização
   atrasada) em `lib/analytics/atencao.ts` (puro, 16 testes) — sem
   persistir nada, sem score opaco. Novo componente `InsightCard`.
4. **Detecção de execução incompleta**: `execucaoIncompleta()` identifica
   sincronização travada em "PROCESSANDO" sem SUCESSO final — cenário que
   `classificarSituacaoSincronizacao` sozinha não detectava.
5. **Nova rota `/admin/servidores/[id]`**: ficha funcional completa
   (dados, papel explicado, contato, escola com distinção origem×manual,
   turmas/disciplinas, acesso ao portal). Confirmada ausente na ETAPA 00.
6. **Filtros analíticos** em estudantes (Escola/Ano), servidores
   (Escola/Status) e avaliações (Tipo/Ano) — todos usando dados reais, sem
   inventar categorias.
7. **`SchoolOverview` inteligente**: `/admin/escolas/[id]` ganhou
   comparação com a rede (reaproveitando `getComparativosPorEscola` e
   `ComparisonDelta`) e seletor de ano.

**Itens deliberadamente adiados, com justificativa registrada** (não
esquecidos): filtros de `/admin/escolas` (lista pequena, filtros pedidos
exigem dado derivado ainda não calculado); tabs completas de
`SchoolOverview` e "Destaques da escola" (reestruturação maior, aguarda a
ETAPA 05 dar um segundo caso de uso real para desenhar a API corretamente).

Baseline final: `npm test` 177/177 (34 testes novos ao longo da etapa),
`typecheck`/`lint`/`build` limpos em todos os 7 sub-lotes. Build final
confirma 47 rotas (uma a mais que o baseline: `/admin/servidores/[id]`).
Validação end-to-end logada não foi executada em nenhum sub-lote — mesma
limitação de credenciais das etapas 01–03; fica pendente para a ETAPA 11.

Detalhes completos: [`etapas/04-admin-p0.md`](etapas/04-admin-p0.md).

## Resumo da ETAPA 03

- 4 pontos reais de duplicação de fórmula/tela entre perfis, todos
  mapeados por leitura de código antes de extrair qualquer componente:
  1. `TurmaDetalheView` (`components/portal/turma-detalhe.tsx`, novo):
     consolida a ficha de turma do Admin e da Direção (~145 linhas cada →
     ~30), padronizando em `MetricCard`.
  2. `GradeTable` (`components/portal/grade-table.tsx`, novo): consolida a
     tabela de boletim de `AlunoDetalhe` e de `/portal/aluno/boletim`.
  3. `ComparisonDelta` (`components/ui/comparison-delta.tsx`, novo):
     consolida a apresentação (seta+cor+texto) de variação entre
     `/admin/indicadores/frequencia` e `/admin/indicadores/comparativos` —
     a classificação de favorabilidade continua em cada página, só a
     renderização foi compartilhada.
  4. `app/portal/direcao/frequencia/page.tsx` tinha uma terceira
     implementação inline do percentual de frequência — trocada por
     `calcularPercentualFrequencia`.
- `lib/format-date.ts` (`formatarDataIso`, novo) consolida uma duplicação
  que eu mesmo introduzi na ETAPA 02. Efeito colateral verificado (não
  planejado): corrige um viés de fuso horário de até 1 dia na exibição de
  datas (`new Date("YYYY-MM-DD")` é UTC pela spec; `T00:00:00` sem `Z` é
  local) — ver detalhes em `etapas/03-componentes-academicos-compartilhados.md`.
- `SchoolOverview`, `AttendanceTable`, `InsightCard`, `CoverageCard`,
  `EvaluationSummary` **não foram extraídos** — avaliados e descartados
  com justificativa (não há duplicação real hoje, ou dependem de telas que
  ainda não existem), não esquecidos.
- Baseline pós-mudança: `npm test` 143/143 (sem testes novos — mudanças são
  apresentacionais), `typecheck` limpo, `lint` limpo, `build` com sucesso
  (mesmas 46 rotas).
- Validação visual via browser **não foi executada** — mesma limitação de
  credenciais já registrada nas etapas 01/02.

Detalhes completos: [`etapas/03-componentes-academicos-compartilhados.md`](etapas/03-componentes-academicos-compartilhados.md).

## Resumo da ETAPA 02

- Novo utilitário puro `calcularJanelaDias(referencia, dias)` em
  `lib/analytics/frequencia.ts` (janela de calendário real em ISO, testado)
  — `calcularJanelaComparativaPadrao` (já existente em
  `lib/queries/frequencia.ts`) foi refatorada para reaproveitá-lo em vez de
  duplicar a matemática de datas.
- Novo componente `components/ui/data-freshness-badge.tsx`
  (`DataFreshnessBadge`), extraído do que era uma função local duplicada em
  `/admin/indicadores/qualidade` — agora reutilizado por essa página.
- 3 bugs concretos de período/freshness corrigidos, todos previamente
  mapeados por grep (nenhuma tela tocada "por via das dúvidas"):
  1. `lib/queries/academico.ts` (`getAlunoDetalheCompleto`) e
     `app/portal/aluno/frequencia/page.tsx`: `take: 90` **registros** →
     janela real de 90 **dias** corridos.
  2. `app/portal/aluno/frequencia/page.tsx`: fallback perigoso
     `totalAulas > 0 ? ... : 100` (frequência sem dado virando 100%) →
     `calcularPercentualFrequencia` (retorna `null`) + estado explícito
     "Sem dados no período". Também corrigido em
     `components/portal/aluno-detalhe.tsx` (componente compartilhado por
     Aluno/Direção/Professor), que tinha uma segunda implementação local
     da mesma fórmula.
  3. `app/admin/indicadores/page.tsx`: freshness "de qualquer módulo"
     (`logSincronizacao.findFirst` sem filtro) usada para todos os
     indicadores → `getStatusSincronizacao()`, com cada indicador citando a
     data de atualização do módulo correto (Frequência/Notas/Estudantes).
     Os 4 links de drill-down passaram a propagar `?ano=`.
- `AcademicContextBar`/`AnalysisScopeBar` e `MethodologyNote` **não foram
  criados** — decisão deliberada de não construir componente novo sem um
  segundo caso de uso real para validar a API (mesmo critério já usado para
  `CapabilityGate` na ETAPA 01); ver decisões técnicas 4 e 5 em
  `etapas/02-contexto-temporal-e-freshness.md`.
- Baseline pós-mudança: `npm test` 143/143 (140 pré-existentes + 3 novos),
  `typecheck` limpo, `lint` limpo, `build` com sucesso (mesmas 46 rotas).
- Validação end-to-end logada **não foi executada** — mesma limitação de
  credenciais já registrada na ETAPA 01; pendência para a ETAPA 11.

Detalhes completos: [`etapas/02-contexto-temporal-e-freshness.md`](etapas/02-contexto-temporal-e-freshness.md).

## Resumo da ETAPA 01

- Novo módulo `lib/authz/` (sem I/O, funções puras): `scope.ts`
  (`Scope` — `NetworkScope`/`SchoolScope`/`ProfessorScope`/`StudentSelfScope`/`StaffSelfScope`
  — e `scopeFromSession`), `authorize.ts` (`canViewEscola`, `canViewTurma`,
  `canViewEstudante`, `canViewServidor`) e `capabilities.ts` (`hasCapability`,
  documentando a única distinção real hoje entre ADMIN e SECRETARIA:
  `usuarios:manage`).
- Novo componente `components/ui/capability-gate.tsx` (`CapabilityGate`) —
  criado e testado por typecheck, ainda sem uso em nenhuma tela (aplicação
  visual é escopo da ETAPA 04).
- 33 novos testes (`lib/authz/{scope,authorize,capabilities}.test.ts`),
  cobrindo os cenários críticos da seção 12 do master prompt.
- Duas páginas refatoradas para consumir o módulo central em vez de
  checagem inline duplicada, comportamento preservado:
  `app/portal/direcao/alunos/[id]/page.tsx` e
  `app/portal/professor/turma/[id]/page.tsx`.
- `ServidorTurma` **não foi migrado** — decisão explícita de adiar para a
  ETAPA 06 (ver decisão técnica 1 em `etapas/01-scopes-e-capabilities.md`);
  o `ProfessorScope` atual já cobre o caso de turma com código repetido em
  outra escola, mas não múltiplas disciplinas na mesma turma.
- Baseline pós-mudança: `npm test` 140/140 (107 pré-existentes + 33 novos),
  `typecheck` limpo, `lint` limpo, `build` com sucesso (mesmas 46 rotas).
- Validação end-to-end logada (login real DIRETOR/PROFESSOR navegando para
  URL fora do escopo) **não foi executada** — sem credenciais de teste
  disponíveis nesta sessão; fica registrada como pendência para a ETAPA 11.

Detalhes completos: [`etapas/01-scopes-e-capabilities.md`](etapas/01-scopes-e-capabilities.md).

## Resumo da ETAPA 00

- Branch `main`, working tree limpo (apenas `claude_code_sme_base/` estava
  untracked — os 5 DOCX de origem e o próprio master prompt).
- Package manager: `npm` (`package-lock.json` presente; sem `yarn.lock`/`pnpm-lock.yaml`).
- Scripts confirmados em `package.json`: `dev`, `build`, `start`, `lint`,
  `typecheck`, `test`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `db:seed`.
- Estrutura `docs/plano-evolucao-sme/` criada por completo (`base/`,
  `base/extratos/`, `etapas/`, `decisoes/`).
- 5 DOCX copiados de `claude_code_sme_base/docs_base/` para
  `docs/plano-evolucao-sme/base/` (originais preservados no local de origem).
- 5 extratos Markdown gerados em `base/extratos/` a partir do XML interno de
  cada DOCX (sem `python-docx` disponível no ambiente Windows local).
- Baseline de testes registrado (ver `etapas/00-auditoria-e-baseline.md`):
  `npm test` (107/107 passando), `npm run typecheck` (limpo), `npm run lint`
  (limpo), `npm run build` (sucesso, 46 rotas).
- Nenhum comportamento funcional foi alterado.

Detalhes completos: [`etapas/00-auditoria-e-baseline.md`](etapas/00-auditoria-e-baseline.md).
