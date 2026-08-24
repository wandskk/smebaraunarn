# ETAPA 09 — Avaliações Municipais

## Status
DONE

## Objetivo

Consolidar o módulo transversal de Avaliações Municipais e reutilizá-lo nos
perfis adequados, com uma única regra de cálculo por avaliação.

## Por que esta etapa existe

O schema (`Avaliacao`, `AvaliacaoQuestao`, `AvaliacaoResultadoAluno`, enum
`TipoAvaliacao`) já existe e há uma tela CRUD em `app/admin/avaliacoes/`
(confirmado em `docs/PLANO_DESENVOLVIMENTO.md`), mas sem item-a-item por
descritor/habilidade nem heatmap. Vários perfis (Admin, Diretor, Professor,
Aluno) precisam de visões coerentes da mesma avaliação — por isso esta etapa
vem depois das etapas P0 de cada perfil, que já preparam o encaixe.

## Pré-requisitos

ETAPAS 04, 05, 06, 07 e 08 concluídas (`DONE`).

## Escopo desta etapa

- Cobertura esperada x realizada.
- Status da avaliação (preparação/aplicação/coleta parcial/consolidada,
  quando derivável).
- Escolas/turmas pendentes.
- Paginação real (sem `take` fixo silencioso).
- Identidade por avaliação/ano/código (não agrupar só por nome).
- Editar questão/resultado quando permitido.
- Importação CSV/XLSX com preview e validação (pode virar P1 se muito
  extensa).
- Preencher/usar `respostasJson` para análise por item.
- Análise por questão/descritor.
- Fluência: níveis, palavras/minuto e evolução.
- Preparar estrutura futura de descritores/habilidades BNCC **sem inventar
  catálogo** se não houver fonte validada.

Por perfil: Admin (rede inteira), Diretor (própria escola), Professor
(turmas/disciplinas autorizadas), Aluno (próprios resultados), Servidor Geral
(sem acesso por padrão).

## Fora de escopo

Regras municipais configuráveis sem validação oficial (backlog P2).

## Arquivos/áreas previstos

`app/admin/avaliacoes/**`, `prisma/schema.prisma` (`Avaliacao`,
`AvaliacaoQuestao`, `AvaliacaoResultadoAluno`), novas rotas de avaliação nos
portais de Diretor/Professor/Aluno.

## Checklist
- [x] Mapear estado real do CRUD de avaliações hoje.
- [x] Implementar identidade por avaliação/ano/código (já correto desde
      antes desta etapa no catálogo Admin; preservado em todas as consultas
      novas — sempre agrupado por `avaliacaoId`).
- [x] Implementar paginação real (já correta no catálogo e nas rotas de
      Direção/Aluno; corrigida nesta etapa em `/admin/avaliacoes/[id]`, que
      antes buscava todos os resultados sem `take`).
- [x] Implementar cobertura esperada x realizada (rede/escola/professor,
      motor único).
- [x] Integrar visão por perfil (Admin/Diretor/Professor/Aluno — Aluno já
      entregue na ETAPA 07).
- [x] Testar: avaliação de mesmo nome/anos diferentes não é agrupada
      incorretamente (garantido estruturalmente por agrupar sempre por
      `avaliacaoId`, nunca por nome — sem regressão em nenhuma consulta
      alterada).

## Alterações realizadas

### Plano registrado no início da etapa

Levantamento do estado real (antes de editar):

- `Avaliacao`/`AvaliacaoQuestao`/`AvaliacaoResultadoAluno` já existem no schema,
  sem mudança de schema necessária nesta etapa.
- Catálogo `/admin/avaliacoes` **já** identifica por `avaliacaoId` (uma linha
  por `Avaliacao`, nunca agrupado por nome) e **já** usa paginação real via
  `parsePaginationParams`/Prisma `skip`/`take` — os dois itens do checklist
  mais citados no master prompt para esta etapa já estavam corretos antes de
  qualquer mudança.
- `/admin/avaliacoes/[id]` (detalhe) busca **todos** os `resultados` sem
  `take` — não é truncamento silencioso, mas não escala para avaliação de
  rede inteira; precisa de paginação real.
- ETAPA 05 já entregou `getAvaliacoesResumoPorEscola`/
  `getAvaliacaoDetalhePorEscola` (Diretor) com cobertura por turma e
  paginação real — vira a base a generalizar para Admin (rede) e Professor
  (turmas atribuídas), em vez de reescrever a mesma lógica 3x.
- ETAPA 07 já entregou a visão do Aluno (`/portal/aluno/avaliacoes`), com
  evolução pessoal por tipo — não é tocada nesta etapa.
- `respostasJson` existe no schema mas nunca é lido nem escrito por nenhum
  fluxo atual.
- Professor não tem nenhuma rota de avaliações ainda (ETAPA 06 só preparou
  `ProfessorScope.atribuicoes`).

Plano de execução em lotes pequenos e testáveis:

1. **Fundação de queries/analytics compartilhada**: função pura
   `deriveStatusAvaliacao` (Preparação/Em aplicação/Coleta parcial/
   Consolidada) em `lib/analytics/avaliacoes.ts` com testes; generalizar
   `getAvaliacoesResumoPorEscola`/`getAvaliacaoDetalhePorEscola` para aceitar
   um `AvaliacaoScope` (rede/escola/professor) sem quebrar a API existente
   usada pela Direção; nova consulta de pendências (escolas sem nenhum
   resultado) para o escopo rede.
2. **Admin**: catálogo ganha cobertura/status por linha; `/admin/avaliacoes/
   [id]` reorganizado em abas (Visão Geral/Questões/Resultados/Análise) via
   query param `?tab=`, resultados paginados de verdade, escolas pendentes
   na Visão Geral, edição de questão (só havia criar/excluir), captura
   opcional de resposta por item (`respostasJson`) no lançamento de
   resultado quando a avaliação tem questões cadastradas, e análise (%
   acerto por questão/descritor) a partir de `respostasJson` + gabarito.
3. **Diretor**: reaproveita o badge de status e a análise por item/descritor
   (somente leitura) nas rotas já existentes.
4. **Professor**: novas rotas `/portal/professor/avaliacoes` (lista, só
   avaliações com resultado em turma atribuída) e `/portal/professor/
   avaliacoes/[id]` (detalhe restrito às turmas atribuídas do professor
   naquela escola), somente leitura, reaproveitando a mesma consulta
   generalizada do item 1.
5. Testes, lint, typecheck, build; atualizar este Markdown e o
   `PROGRESSO.md`.

**Decisões de escopo deliberadas (não esquecidas — ver seção "Decisões
técnicas" ao final)**: importação CSV/XLSX fica para a ETAPA 10, exatamente
como o próprio checklist desta etapa já permite ("pode virar P1 se muito
extensa"); catálogo de descritores/habilidades BNCC não é inventado (campo
`descritor` continua texto livre, só passa a ser agrupável na Análise);
comparação de evolução agregada (rede/escola) entre edições de uma mesma
avaliação fica fora — comparar coortes de estudantes diferentes ano a ano
sem desenho longitudinal correto arriscaria violar a regra 7.3 do master
prompt (nunca comparar períodos/grupos incompatíveis silenciosamente); a
evolução pessoal do Aluno (ETAPA 07) já cobre o caso onde a comparação é
segura (mesmo estudante).

### Arquivos alterados/criados

Novos:
- `lib/analytics/avaliacoes.ts` (+ `.test.ts`) — `deriveStatusAvaliacao` e
  `calcularAnalisePorItem`, puros e testados.
- `app/portal/professor/avaliacoes/page.tsx` — lista escopada às turmas
  atribuídas ao professor.
- `app/portal/professor/avaliacoes/[id]/page.tsx` — detalhe read-only,
  escopado no banco (não só na UI).

Alterados:
- `lib/queries/avaliacoes.ts` — generalizado com `AvaliacaoScope`
  (`rede`/`escola`/`professor`); `getAvaliacoesResumoPorEscola`/
  `getAvaliacaoDetalhePorEscola` viram wrappers finos (`@deprecated`,
  mantidos pela Direção); novas `getAvaliacoesResumo`, `getAvaliacaoDetalhe`,
  `getCoberturaResumoPorAvaliacoes`, `getAnaliseItensAvaliacao`; cobertura
  agora agrupa por tupla `(escolaId, turma)`, não só `turma` (turmas de
  códigos iguais em escolas diferentes não se misturam mais, mesmo no
  escopo rede).
- `app/admin/avaliacoes/page.tsx` — colunas de cobertura/status por
  avaliação (via `getCoberturaResumoPorAvaliacoes`, calculado só para os ids
  da página atual).
- `app/admin/avaliacoes/[id]/page.tsx` — reescrita: abas Visão Geral/
  Questões/Resultados/Análise via `?tab=`; resultados agora paginados de
  verdade (antes buscava todos sem `take`); escolas pendentes na Visão
  Geral; análise por questão/descritor.
- `app/admin/avaliacoes/[id]/questao-form.tsx` — mesmo form agora serve
  para criar e editar (`questao?` prop).
- `app/admin/avaliacoes/[id]/resultado-form.tsx` — campos opcionais de
  resposta por questão quando a avaliação tem questões cadastradas.
- `app/admin/avaliacoes/actions.ts` — `updateQuestaoAction` (novo);
  `addQuestaoAction`/`updateQuestaoAction` rejeitam número de questão
  duplicado na mesma avaliação; `registrarResultadoAction` grava
  `respostasJson` a partir dos campos `resposta_<numero>`.
- `app/portal/direcao/avaliacoes/page.tsx` e `[id]/page.tsx` — badge de
  status; seção de análise por item (somente leitura, escopada à escola).
- `components/portal/sidebar.tsx` — item "Avaliações Municipais" no menu
  do Professor.

## Decisões técnicas

1. **Cobertura por tupla `(escolaId, turma)`, nunca só `turma`.** Antes da
   ETAPA 09, o cálculo de matriculados por turma agrupava só por
   `turmaSerie`; correto no escopo escola/professor (já implicitamente
   filtrado), mas incorreto no escopo rede, onde o mesmo código de turma se
   repete em escolas diferentes (achado P1 documentado desde a ETAPA 00/04 —
   34 códigos reutilizados na rede). Corrigido de uma vez para os três
   escopos usando a mesma função (`contarMatriculadosPorTurma`), em vez de
   herdar o bug ao generalizar para Admin.
2. **Status é sempre derivado, nunca persistido.** Não há campo de situação
   nem data de início/fim de aplicação no schema, e criar um agora seria
   `schema por conveniência` (regra 7.8). A heurística
   (`deriveStatusAvaliacao`) é pura, testada e documentada na própria tela
   — não é um score opaco (regra 7.6): quem quiser auditar o "porquê" olha a
   cobertura ao lado do badge.
3. **`respostasJson` chaveado pelo número da questão (string), não pelo
   `id`.** Mais estável para lançamento manual (o número é o que a Secretaria
   já vê no papel da prova) e mais simples de reconciliar numa futura
   importação CSV/XLSX. Como consequência, número de questão duplicado
   dentro da mesma avaliação quebraria a análise silenciosamente — por isso
   `addQuestaoAction`/`updateQuestaoAction` passaram a validar isso
   explicitamente (o schema não tinha esse índice único; adicionar agora
   seria migração fora do escopo desta etapa, e a validação em código já
   fecha o risco).
4. **Rede (Admin) nunca retorna 404 por zero resultados; escola/professor
   continuam retornando.** Preservei o comportamento original da Direção
   (não expõe avaliação irrelevante ao escopo) mas o Admin precisa gerenciar
   uma avaliação recém-criada antes de qualquer resultado existir — por
   isso `getAvaliacaoDetalhe` só aplica o guard de "zero resultados → null"
   fora do escopo rede.
5. **CSV/XLSX de resultados/questões não foi implementado.** O checklist da
   própria etapa já permite adiar ("pode virar P1 se muito extensa"); a
   captura de `respostasJson` habilitada nesta etapa é manual (por
   resultado, via `ResultadoForm`), suficiente para viabilizar a análise por
   item já nesta rodada sem o escopo adicional de preview/mapeamento de
   colunas/relatório de erros. Fica para a ETAPA 10.
6. **Evolução agregada (rede/escola) entre edições não foi implementada.**
   Diferente da evolução pessoal do Aluno (ETAPA 07, mesmo estudante ao
   longo do tempo — comparação segura), comparar médias de turmas/escolas
   entre edições exigiria desenho de coorte (mesmos alunos? turma
   equivalente?) que este documento não detalha e que, feito às pressas,
   violaria a regra 7.3 (nunca comparar grupos/períodos incompatíveis
   silenciosamente). Registrado como pendência para decisão de produto, não
   implementado por omissão.
7. **Catálogo de descritores/habilidades BNCC não foi criado.** `descritor`
   continua texto livre em `AvaliacaoQuestao`; a Análise por item agora
   agrupa por esse texto, o que já prepara a exibição para quando existir
   uma fonte validada, sem inventar uma taxonomia agora (mesmo critério já
   aplicado a outras decisões de não-construir nas etapas anteriores).

## Testes executados

- `npx tsx --test lib/analytics/avaliacoes.test.ts` (isolado, durante o
  desenvolvimento do módulo puro).
- `npm test` (suíte completa).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.

## Resultado dos testes

- `npm test`: **202/202** (193 pré-ETAPA-09 + 9 novos em
  `lib/analytics/avaliacoes.test.ts`, cobrindo `deriveStatusAvaliacao` nos 4
  status e `calcularAnalisePorItem` — inclusive os casos de questão sem
  gabarito e resultado sem resposta não inventarem percentual).
- `npm run typecheck`: limpo.
- `npm run lint`: limpo (0 warnings/erros).
- `npm run build`: sucesso — **65 rotas** (63 do baseline da ETAPA 08 + 2
  novas: `/portal/professor/avaliacoes` e
  `/portal/professor/avaliacoes/[id]`; nenhuma rota removida).

## Riscos e pendências

- **Validação end-to-end logada (Admin/Diretor/Professor navegando de
  fato) não foi executada** — mesma limitação de credenciais registrada em
  todas as etapas anteriores desde a 01; fica pendente para a ETAPA 11.
- **Importação CSV/XLSX de questões/resultados** — decisão deliberada de
  adiar para a ETAPA 10 (ver decisão técnica 5); o schema e o
  `respostasJson` já estão prontos para receber esse fluxo sem remodelar.
- **Evolução agregada entre edições (rede/escola)** — não implementada por
  falta de desenho de coorte validado (decisão técnica 6); candidata a
  ETAPA 10/decisão de produto com a Secretaria.
- **`AvaliacaoQuestao.numero` continua sem índice único no schema** — a
  duplicidade é bloqueada em código (`addQuestaoAction`/
  `updateQuestaoAction`), não no banco; um caminho de escrita futuro que não
  passe por essas actions (ex.: uma eventual importação em lote) precisa
  repetir essa validação ou a migração de schema deve ser revisitada nesse
  momento.
- **`getAvaliacaoDetalhe` no escopo rede pode listar muitas turmas** em
  "Cobertura por turma" quando uma avaliação é aplicada em toda a rede —
  não há paginação nessa tabela específica (só nos Resultados). Aceitável
  no volume atual da rede (dezenas de turmas por avaliação, não milhares);
  registrado para revisitar se o volume crescer.

## Critérios de aceite

Uma mesma avaliação produz visões coerentes e seguras nos perfis diferentes,
sem duplicar regra de cálculo.

## Próximo passo permitido

ETAPA 10, somente mediante autorização explícita do usuário.
