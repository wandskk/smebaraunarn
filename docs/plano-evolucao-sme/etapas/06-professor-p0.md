# ETAPA 06 — Professor P0

## Status
DONE

## Objetivo

Corrigir primeiro o modelo de escopo pedagógico do Professor e só então
aprofundar o portal.

## Por que esta etapa existe

Esta é a etapa de maior risco de segurança/escopo identificada na ETAPA 00: a
Home hoje pode contar todos os alunos da escola quando o professor não tem
turma, e `ServidorTurma` não tem `escolaId` nem modela disciplina na chave de
unicidade — o que é estruturalmente frágil quando códigos de turma se repetem
entre escolas (achado confirmado no schema real, ver
`etapas/00-auditoria-e-baseline.md` e `MATRIZ_REAPROVEITAMENTO.md`).

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`). Não depende de 04/05 estarem
concluídas, mas é recomendável já ter passado por elas para reaproveitar
padrões.

## Escopo desta etapa

1. Corrigir contagem da Home quando não há turmas.
2. Revisar `ProfessorScope`.
3. Validar professor atuando em múltiplas escolas.
4. Revisar `ServidorTurma` e necessidade de `escolaId`/disciplina na
   identidade (decisão de migração, se necessária, documentada antes de
   executar — seção 7.8 do master prompt).
5. Se houver migração: documentar/backfill/testar antes de aplicar.
6. Criar verdadeira visão de "Minhas Turmas".
7. Separar rota conceitual de turma e rota de estudante (hoje
   `/portal/professor/turma/[id]` representa estudante, não turma).
8. Estudante detalhado deve respeitar disciplina/capability do professor.
9. Preparar encaixe de Avaliações Municipais das próprias turmas.

## Fora de escopo

Implementação completa do módulo de Avaliações Municipais (ETAPA 09) — aqui
só se prepara o encaixe.

## Arquivos/áreas previstos

`app/portal/professor/**`, `prisma/schema.prisma` (somente se migração for
decidida e documentada), scope de professor da ETAPA 01.

## Checklist
- [x] Reler `base/Plano_Evolucao_MVP_Professor_SME_Barauna.docx` / extrato.
- [x] Confirmar código atual de cada rota antes de alterar.
- [x] Corrigir contagem da Home sem turma.
- [x] Decidir e documentar (se necessário) migração de `ServidorTurma`
      (decidida, aplicada, com autorização explícita do usuário).
- [x] Separar rota de turma da rota de estudante.
- [x] Testar: professor não abre estudante de turma não autorizada via URL
      direta (testes automatizados; validação com login real fica para a
      ETAPA 11, mesma limitação de credenciais das etapas anteriores).

## Alterações realizadas

### Sub-lote 1 — Home e navegação
- `app/portal/professor/page.tsx`: `totalAlunos` passa a ser `0` quando o
  professor não tem turma vinculada (antes: contava a escola inteira, pois
  o filtro por turma era omitido do `where`).
- `components/portal/sidebar.tsx`: item de navegação renomeado de "Minha
  Turma" (`/portal/professor/turma`) para "Minhas Turmas"
  (`/portal/professor/turmas`).

### Sub-lote 2 — Minhas Turmas de verdade + separação turma/estudante
- Nova `app/portal/professor/turmas/page.tsx`: lista de turmas do
  professor (antes `/portal/professor/turma` misturava alunos de todas as
  turmas numa tabela só).
- Nova `app/portal/professor/turmas/[turma]/page.tsx`: reaproveita
  `TurmaDetalheView` (mesma ficha de turma do Admin/Diretor, ETAPA 03),
  com checagem de escopo via `canViewTurma` antes de renderizar — turma
  fora da atribuição do professor retorna 404, mesmo por URL direta.
- Nova `app/portal/professor/estudantes/[id]/page.tsx` (movida de
  `turma/[id]`, que representava estudante apesar do nome sugerir turma).
- `app/portal/professor/turma/page.tsx` e `app/portal/professor/turma/[id]/page.tsx`
  viram redirects (`/turmas` e `/estudantes/[id]` respectivamente) —
  preserva links antigos.

### Sub-lote 3 — Notas respeitam disciplina do professor
- `components/portal/aluno-detalhe.tsx` (`AlunoDetalhe`): novo prop
  opcional `disciplinasVisiveis?: string[]` — quando informado, filtra o
  boletim (`GradeTable`) só para essas disciplinas. Frequência continua
  mostrando o resumo geral (política diferente por tipo de dado, ver
  decisão técnica 2).
- `app/portal/professor/estudantes/[id]/page.tsx` passa
  `disciplinasVisiveis` com a(s) disciplina(s) que o professor leciona
  *naquela turma específica do estudante* (via `ServidorTurma.disciplina`).
  Sem disciplina informada (dado ainda não sincronizado), não filtra.
- Admin/Diretor continuam vendo o boletim completo (prop não passada nessas
  rotas) — comportamento inalterado.

### Sub-lote 4 — Auditoria para decisão de `ServidorTurma`/`ProfessorScope`

Levantamento read-only na base de produção (ver decisão técnica 3):
611 linhas em `ServidorTurma`, 235 servidores com ≥1 turma, **57 códigos de
turma que colidem entre escolas diferentes** (mesmo código de turma
aparecendo em `ServidorTurma` de servidores lotados em escolas distintas).
Confirma, com número real, o risco já apontado no documento de Professor e
na ETAPA 00. Decisão de migração registrada abaixo.

### Sub-lote 5 — Migração aplicada (autorizada explicitamente pelo usuário)

Após a decisão técnica 3 ser registrada, o usuário autorizou explicitamente
aplicar a migração agora (não adiar). Executado nesta ordem:

1. `prisma/schema.prisma`: `ServidorTurma.escolaId Int` (obrigatório) +
   relação com `Escola`; `@@unique([servidorId, turma])` →
   `@@unique([servidorId, escolaId, turma])`; novo índice em `escolaId`.
2. Migration manual `prisma/migrations/20260824190000_servidor_turma_escola_id/`
   (não gerada por `prisma migrate dev` porque o comando exige modo
   interativo para decidir o backfill de uma coluna obrigatória sem
   default — indisponível neste ambiente): adiciona a coluna nullable,
   faz backfill a partir de `Servidor.escolaId`, só então torna a coluna
   `NOT NULL`, troca o índice único, adiciona a FK. Aplicada com
   `prisma migrate deploy` contra o Neon (produção) — confirmado
   `psql`/Prisma: 611/611 linhas preenchidas, 0 nulas, 0 divergentes de
   `Servidor.escolaId` logo após o backfill (esperado, dado que nenhuma
   linha pertencia a um `Servidor.escolaId` nulo).
3. `lib/sync/sigeduc-sync.ts` (`syncServidoresChunk`): o upsert de
   `ServidorTurma` passa a gravar o `escolaId` já resolvido por linha (o
   mesmo valor usado para `Servidor.escolaId`), em vez de deixar
   implícito. Linhas sem escola resolvida (`escolaId === null`, cargo sem
   correspondência) deixam de gravar `ServidorTurma` — antes gravariam
   sem informação de escola nenhuma.
4. `lib/authz/scope.ts`: `ProfessorScope` vira
   `{ kind: "professor"; atribuicoes: { escolaId; turma }[] }` (era
   `{ escolaId; turmas: string[] }`); `professorTurmas` renomeado para
   `professorAtribuicoes`.
5. `lib/authz/authorize.ts`: `canViewTurma`/`canViewEstudante`/
   `canViewEscola` passam a checar a tupla `(escolaId, turma)` exata
   dentro de `atribuicoes`, não `escolaId` do scope e `turmas.includes`
   separadamente.
6. Páginas do Professor atualizadas para o novo formato: resolvem o
   `escolaId` de cada turma a partir da própria atribuição
   (`servidor.turmas.find(t => t.turma === turma)`), não mais de
   `servidor.escolaId` — inclusive as contagens de alunos na Home e em
   "Minhas Turmas" (agrupadas por `(escolaId, turma)` via `OR` de tuplas,
   não só por `turma`).
7. Testes novos em `lib/authz/{scope,authorize}.test.ts` cobrindo
   exatamente o cenário que motivou a migração: mesmo código de turma em
   duas escolas diferentes do mesmo professor.

## Decisões técnicas

1. **Notas filtradas por disciplina, frequência não.** O documento de
   Professor trata os dois de forma diferente: "Aprendizagem/notas: por
   padrão, só a disciplina atribuída"; "Frequência: resumo geral do
   estudante quando a Secretaria aprovar esse uso pedagógico" (ou seja,
   resumo geral já é o padrão aceitável). Replicar essa distinção em vez
   de aplicar o mesmo filtro aos dois evita esconder informação que o
   próprio documento considera apropriada por padrão.
2. **Filtro de disciplina é "melhor esforço", não bloqueio.** Quando
   `ServidorTurma.disciplina` está vazio (dado ainda não sincronizado ou
   cargo sem disciplina definida na origem), a tela mostra o boletim
   completo em vez de ocultar tudo. A ausência de um dado de
   configuração não deveria virar uma restrição de acesso — isso seria
   inventar uma política a partir de um buraco de dado, não de uma
   decisão real da rede.
3. **Migração de `ServidorTurma` (adicionar `escolaId`) — decisão
   registrada, execução pendente de autorização:**
   - **Por que é necessária:** `ServidorTurma` não tem `escolaId` própria;
     a origem (`/consulta-servidor`) já entrega `codigo_inep_escola` por
     linha (o mesmo campo já usado para resolver `Servidor.escolaId` em
     `lib/sync/sigeduc-sync.ts:144`), mas hoje esse dado é descartado ao
     gravar `ServidorTurma` — só sobra em `Servidor.escolaId`, que é
     **único por servidor** e sobrescrito a cada linha processada
     ("last write wins"). Um professor com turmas em 2 escolas fica com
     `Servidor.escolaId` = a última escola processada, e
     `ProfessorScope { escolaId, turmas: string[] }` perde a escola de
     origem de cada turma individual. Como códigos de turma colidem entre
     escolas (57 casos confirmados nesta auditoria), isso pode tanto
     ocultar turmas legítimas do professor (na escola "perdida") quanto,
     em tese, permitir `canViewTurma` aceitar uma turma de outra escola
     que colida em código com uma turma real do professor — dependendo de
     como cada página resolve `escolaId` (as páginas desta etapa usam
     `servidor.escolaId` como a escola da turma, então hoje o risco
     concreto observado é turmas "perdidas", não vazamento — mas o motivo
     estrutural para vazamento existe e cresce se mais telas usarem
     `ProfessorScope` sem essa correção).
   - **Dados afetados:** tabela `ServidorTurma` (611 linhas). Nenhuma
     tabela dependente além dela (`@@unique([servidorId, turma])` não é
     referenciada por FK de outra tabela).
   - **Estratégia de migração/backfill:**
     1. Adicionar `escolaId Int? ` (nullable) a `ServidorTurma`, com FK
        para `Escola`.
     2. Backfill das 611 linhas existentes com `Servidor.escolaId` do
        respectivo servidor (correto para a grande maioria — professor de
        escola única; para os poucos casos de múltiplas escolas, o valor
        herdado pode estar errado para algumas turmas, mas a próxima
        sincronização já corrige, porque o passo 4 grava o valor certo
        por linha).
     3. Trocar `@@unique([servidorId, turma])` por
        `@@unique([servidorId, escolaId, turma])`.
     4. Atualizar `syncServidoresChunk`
        (`lib/sync/sigeduc-sync.ts:177`) para gravar `escolaId` (já
        resolvido na própria função, linha 144) em cada upsert de
        `ServidorTurma`, em vez de depender de `Servidor.escolaId`.
     5. Atualizar `ProfessorScope` (`lib/authz/scope.ts`) de
        `{ escolaId: number; turmas: string[] }` para uma lista de
        atribuições `{ escolaId: number; turma: string }[]`, e
        `canViewTurma`/`canViewEstudante` (`lib/authz/authorize.ts`) para
        checar a tupla exata em vez de `scope.escolaId === X &&
        scope.turmas.includes(Y)` separadamente — isso é o que
        efetivamente fecha o risco estrutural, não só a migração de
        schema.
     6. Atualizar as 3 páginas desta etapa
        (`app/portal/professor/{page,turmas/page,turmas/[turma]/page,estudantes/[id]/page}.tsx`)
        para construir/consumir o novo formato de scope.
     7. Testes novos em `lib/authz/*.test.ts` para o cenário "professor
        com turmas de mesmo código em duas escolas diferentes" (hoje
        coberto só para turma×escola única).
   - **Por que não migrar disciplina para a chave de identidade agora:**
     o achado é P1 no documento ("confirmar cardinalidade da API antes de
     migrar"), não P0; e `@@unique([servidorId, turma])` já limita hoje a
     1 disciplina por turma por servidor (a sincronização faz upsert, a
     disciplina mais recente sobrescreve a anterior) — mudar isso exige
     primeiro confirmar com a Secretaria/SIGEduc se a API pode mesmo
     retornar 2 disciplinas para a mesma turma, o que está fora do que dá
     para verificar só pelo código. Registrado como pendência para a
     ETAPA 10 (P1) ou quando houver confirmação da fonte.
   - **Autorização e execução:** o `.env` deste ambiente aponta para o
     banco de produção (Neon) — alterar schema em produção é uma ação
     pouco reversível, então a migração só foi executada depois de
     autorização explícita do usuário (pedida nesta etapa antes de tocar
     no schema, conforme master prompt 7.8). Detalhes de execução no
     sub-lote 5 de "Alterações realizadas".

## Testes executados

- `npm test` (suíte completa).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- Verificação read-only pós-migração (script descartável, não commitado):
  contagem de `ServidorTurma` (611), linhas com `escolaId` nulo (0),
  linhas divergentes de `Servidor.escolaId` logo após o backfill (0).
- Auditoria read-only pré-migração (idem): 611 linhas de `ServidorTurma`,
  235 servidores com ≥1 turma, 57 códigos de turma colidindo entre
  escolas diferentes — número que embasou a decisão técnica 3.

## Resultado dos testes

- `npm test`: **184/184** (180 pré-existentes + 4 novos — 1 em
  `scope.test.ts` para atribuições em múltiplas escolas, 3 em
  `authorize.test.ts` para a tupla exata escolaId+turma em
  `canViewEscola`/`canViewTurma`/`canViewEstudante`).
- `npm run typecheck`: limpo.
- `npm run lint`: limpo (0 warnings/erros).
- `npm run build`: sucesso — 61 rotas (4 novas: `/portal/professor/turmas`,
  `/portal/professor/turmas/[turma]`, `/portal/professor/estudantes/[id]`;
  `/portal/professor/turma` e `/portal/professor/turma/[id]` continuam
  existindo, agora como redirects).
- Migração: aplicada em produção (Neon) via `prisma migrate deploy`;
  backfill confirmado 611/611 linhas, 0 nulas, 0 divergentes.
- Validação end-to-end logada como PROFESSOR real (inclusive tentativa de
  URL direta para turma/estudante fora da atribuição) **não foi
  executada** — mesma limitação de credenciais de teste já registrada
  desde a ETAPA 01; fica pendente para a ETAPA 11.

## Riscos e pendências

- **Dados históricos de `ServidorTurma` para professores com múltiplas
  escolas:** o backfill usou `Servidor.escolaId` (a única fonte
  disponível antes desta migração) — para os poucos professores que já
  atuavam em mais de uma escola *antes* desta etapa, o `escolaId`
  herdado pode estar errado para algumas turmas até a próxima
  sincronização completa rodar (que já grava o valor certo por linha, ver
  sub-lote 5, item 3). Não há como corrigir isso retroativamente sem
  reprocessar a origem — é uma limitação temporária que se autocorrige,
  não um bug permanente.
- **Disciplina não entrou na identidade de `ServidorTurma`** (decisão
  técnica registrada, adiada para P1/ETAPA 10 — cardinalidade da API do
  SIGEduc para "mesma turma, duas disciplinas" não foi confirmada).
- **Avaliações Municipais do Professor** (`/portal/professor/avaliacoes`)
  não foram criadas — fora de escopo explícito desta etapa (só
  "preparar o encaixe"). Com `ProfessorScope.atribuicoes` já expondo a
  tupla (escolaId, turma) de cada atribuição, a query de avaliações da
  ETAPA 09 pode filtrar resultados por essas tuplas sem trabalho adicional
  de escopo quando for implementada.
- Frequência na ficha do estudante do Professor continua mostrando o
  resumo geral (não filtrado por disciplina) — decisão técnica 1,
  consistente com a política que o próprio documento de Professor propõe
  (frequência geral é aceitável por padrão; notas não).
- Validação visual/E2E autenticada como PROFESSOR real continua pendente
  (ETAPA 11), mesma limitação já registrada desde a ETAPA 01.

## Critérios de aceite

Um professor jamais vê aluno/turma/disciplina fora da atribuição efetivamente
permitida, inclusive por URL direta.

## Próximo passo permitido

ETAPA 07, somente mediante autorização explícita do usuário.
