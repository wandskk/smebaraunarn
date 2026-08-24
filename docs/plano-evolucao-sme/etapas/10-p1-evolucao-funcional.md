# ETAPA 10 — P1: evolução funcional

## Status
DONE (rodada 1 — "Indicadores de rede" — e rodada 2 — "Importação de
avaliações", autorizada explicitamente pelo usuário em 2026-08-24,
incluindo a importação real de dois datasets externos — SPADEB 2026 e
Leitor Fluente Rápido — fornecidos como dumps Postgres)

## Objetivo

Implementar melhorias de alto valor que não eram bloqueadoras P0 nas etapas
anteriores.

## Por que esta etapa existe

Cada etapa 04–09 foca em achados P0. Os DOCX e o master prompt também listam
melhorias de valor alto mas não bloqueador (P1) que ficam mais seguras de
implementar depois que a fundação (scopes, contexto temporal, componentes
compartilhados) e os P0 de cada perfil já estão consolidados.

## Pré-requisitos

ETAPAS 00 a 09 concluídas (`DONE`).

## Escopo desta etapa

Avaliar conforme os DOCX e o estado real do código, entre outros:

- `/admin/turmas`.
- Relatórios/exportações filtradas.
- Importação avançada de avaliações.
- Filtros de aprendizagem por disciplina/unidade.
- Drill-down completo de frequência.
- Distribuição de aprendizagem: média, mediana, percentis e proporções.
- CMS: preview/agendamento/galeria, se realmente necessário.
- Documentos: edição/substituição/categorias/validade.
- Completude/anomalias de dados.
- Histórico/coorte quando houver dados suficientes.

## Fora de escopo

Itens P2 (backlog listado na ETAPA 11) — não executar sem autorização
explícita.

## Arquivos/áreas previstos

A definir na investigação desta etapa, conforme os itens P1 priorizados
com o usuário.

## Checklist
- [x] Revisar os 5 DOCX e extrair a lista completa de itens P1 restantes
      (cruzada com o que cada etapa 04-09 já entregou, para não repetir
      trabalho já feito).
- [x] Priorizar com o usuário quais entram nesta rodada — pergunta feita via
      `AskUserQuestion` com 4 blocos (Indicadores de rede / Importação de
      avaliações / Comunicação e documentos / Itens específicos por perfil).
      Rodada 1: usuário selecionou **"Indicadores de rede"**. Rodada 2:
      usuário pediu explicitamente **"Importação de avaliações"**, com um
      pedido concreto (importar dois datasets reais fornecidos por ele).
- [x] Implementar item a item, com teste, dentro dos blocos selecionados.

## Alterações realizadas

### Levantamento do estado real (antes de editar)

Cruzando o backlog P1 dos 5 DOCX com o que já foi entregue nas ETAPAS 04-09,
o bloco "Indicadores de rede" tinha 4 itens genuinamente pendentes:

1. `/admin/turmas` (rota de rede por turma) — não existia.
2. Drill-down completo de frequência (`/admin/indicadores/frequencia` parava
   em Escola; o motor de faltas consecutivas 3/5/10 já existia em
   `lib/analytics/frequencia.ts`, puro e testado, mas **nunca foi
   conectado** a nenhuma query/tela).
3. Distribuição de aprendizagem já tinha média/mediana/percentis/amplitude/
   proporção abaixo do parâmetro por escola (`/admin/indicadores/
   aprendizagem`, entregue antes desta etapa) — faltava só o filtro por
   disciplina/unidade.
4. Completude/anomalias em `/admin/indicadores/qualidade` — a página já
   tinha saúde de sincronização e colisão de código de turma; faltava
   completude por campo.

### Implementado

1. **`getEstudantesEmSequenciaDeFaltas`/`getContagemFaltasConsecutivasPorEscola`**
   (`lib/queries/frequencia.ts`) — conecta o motor já existente
   (`faltasConsecutivasAtuais`/`classificarGravidadeFaltasConsecutivas`) a
   dados reais, agregando por dia via `groupBy` (uma consulta para a rede
   inteira, não uma por turma/escola).
2. **`TurmaDetalheView`** (`components/portal/turma-detalhe.tsx`) ganhou a
   seção "Faltas consecutivas agora" — como esse componente já é
   compartilhado por Admin/Direção/Professor (ETAPA 03), o drill-down até o
   aluno chega aos 3 perfis de uma vez, sem tela nova.
3. **`/admin/indicadores/frequencia`** ganhou coluna "Faltas consecutivas
   agora" por escola (link para a ficha da escola → turma → aluno), visível
   só quando o ano letivo selecionado é o corrente (é um sinal de "agora",
   não um recorte histórico).
4. **`/admin/indicadores/aprendizagem`**: filtros de disciplina e unidade
   (bimestre) somados ao `where` de `getDesempenhoPorEscola`; nova
   `getDisciplinasComNota` alimenta o filtro sem inventar uma lista fixa.
5. **`/admin/indicadores/qualidade`**: nova seção "Completude por campo"
   (`getCompletudeDados`) com 6 checagens (nascimento/CPF do estudante,
   escola do servidor, escola/série da nota, escola da frequência) e nova
   seção de nomes de escola sem correspondência (`getEscolasNaoMapeadas`).
6. **`/admin/turmas`** (nova rota) — visão de rede por turma
   (`getTurmasRede` em `lib/queries/academico.ts`): escola, turma/série,
   turno, estudantes, docentes, frequência (com faixa), desempenho; filtros
   por escola/série/turno; ordenação alfabética/menor frequência/menor
   desempenho. Cada linha abre a ficha de turma já existente — não duplica
   tela. Item de menu "Turmas" adicionado à sidebar do Admin.

### Arquivos alterados/criados

Novos: `app/admin/turmas/page.tsx`.

Alterados: `lib/queries/academico.ts` (`getTurmasRede`),
`lib/queries/frequencia.ts` (`getEstudantesEmSequenciaDeFaltas`,
`getContagemFaltasConsecutivasPorEscola`), `lib/queries/desempenho.ts`
(filtro disciplina/unidade, `getDisciplinasComNota`),
`lib/queries/qualidade-dados.ts` (`getCompletudeDados`,
`getEscolasNaoMapeadas`), `components/portal/turma-detalhe.tsx`,
`components/admin/sidebar.tsx`, `app/admin/indicadores/frequencia/page.tsx`,
`app/admin/indicadores/aprendizagem/page.tsx`,
`app/admin/indicadores/qualidade/page.tsx`.

## Decisões técnicas

1. **Sequência de faltas usa a atribuição ATUAL do estudante, não o ano
   letivo selecionado.** É um sinal de "quem precisa de atenção agora", não
   uma métrica histórica — por isso a coluna em `/admin/indicadores/
   frequencia` só aparece quando o ano selecionado é o corrente, em vez de
   inventar significado para "sequência de faltas em 2023" (regra 7.3).
2. **`getTurmasRede` matricula pela atribuição atual (`Estudante.turmaSerie`),
   não histórica** — mesma convenção já usada por `getTurmaDetalhe` (ETAPA
   03) para a ficha de turma individual; manter a mesma semântica entre a
   lista de rede e a ficha evita a lista mostrar uma turma diferente da que
   a ficha mostra ao clicar.
3. **Nenhum "score de atenção" foi criado em `/admin/turmas`.** O documento
   sugere uma coluna "atenção"; optei por expor frequência+faixa e
   desempenho lado a lado (dado explicável) em vez de combinar os dois num
   indicador único sem metodologia validada (regra 7.6, mesmo critério já
   usado no "Atenção agora" da ETAPA 04).
4. **Desempenho de `getTurmasRede` resolve escola pelo nome gravado na
   própria nota (`NotaEstudante.escola`), não pela escola atual do aluno**
   — mesmo motivo já documentado em `getDesempenhoPorEscola` (ETAPA
   anterior à 09): evita atribuir nota histórica à escola atual de quem já
   mudou de escola. Notas cujo nome de escola não bate com nenhuma `Escola`
   cadastrada ficam de fora do desempenho da turma (mesmo dado agora visível
   em "Completude por campo" → "nomes de escola sem correspondência").
5. **Completude usa `count()` puro no banco, nunca `findMany` + filtro em
   memória**, ao contrário de `getDesempenhoPorEscola`/`getTurmasRede` (que
   precisam dos valores individuais para mediana/percentil/soma). Cada
   checagem de completude só precisa de uma contagem, então usar `COUNT` no
   banco é estritamente mais barato e não há razão para trazer os registros.
6. **Sem migração de schema.** Todos os itens implementados nesta rodada
   usam dados já existentes (`ServidorTurma`, `FrequenciaEstudante`,
   `NotaEstudante`, `Estudante`) — nenhum campo novo foi necessário.

## Testes executados

Rodada 1:
- `npm test` (suíte completa — nenhum teste novo: os itens desta rodada são
  consultas/apresentação sobre motores já testados em etapas anteriores,
  mesmo padrão de granularidade de teste do restante de `lib/queries`, que
  não tem suíte própria por depender de I/O).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.

Rodada 2:
- `npm test` (13 testes novos em `lib/import/avaliacoes-import.test.ts`).
- `npm run typecheck`, `npm run lint`, `npm run build` — reexecutados a
  cada mudança relevante (instalação do `xlsx`, wiring da aba Importar,
  correção do bug de `pontuacao` na migração).
- Migração real: dry-run (`validarLinhasResultado` sem gravar) revisado
  manualmente antes de qualquer commit; commit real; verificação visual
  pós-commit (logado como Admin e como Diretor, contra a base de produção)
  que revelou o bug de `pontuacao` (ver seção da rodada 2 acima); reexecução
  do script para corrigir; nova verificação visual confirmando a correção.

## Resultado dos testes

Rodada 1:
- `npm test`: **193/193** (sem regressão; nenhum teste novo necessário —
  ver acima).
- `npm run typecheck`: limpo.
- `npm run lint`: limpo (1 erro de aspas retas em JSX corrigido durante a
  etapa).
- `npm run build`: sucesso — **66 rotas** (65 do baseline da ETAPA 09 + 1
  nova: `/admin/turmas`).
- Após a validação manual (ver Riscos e pendências) e a correção em
  `getTurmasRede`, `typecheck`/`lint`/`test` foram reexecutados: mesmos
  resultados (193/193, limpos) — a correção não muda nenhum tipo/contrato
  público, só a lógica interna de agregação.

Rodada 2:
- `npm test`: **206/206** (193 da rodada 1 + 13 novos).
- `npm run typecheck`/`npm run lint`: limpos.
- `npm run build`: sucesso — **66 rotas** (mesma contagem — a importação
  vive dentro da rota já existente `/admin/avaliacoes/[id]`, nenhuma rota
  nova; o bundle dessa página cresceu de 3.47 kB para 22.4 kB de JS
  próprio, refletindo os dois novos formulários client-side — `xlsx` roda
  só no servidor, dentro das server actions, e não é incluído no bundle do
  cliente).
- Migração real: ver tabela de resultado na seção da rodada 2 acima — 9
  avaliações, 320 questões, 1.831 resultados gravados na base de produção,
  388 linhas não encontradas/ambíguas listadas e descartadas (não
  gravadas), 1 bug real encontrado e corrigido antes de fechar a etapa
  (`pontuacao` indevidamente zerada — ver acima).

## Rodada 2 — Importação de avaliações (CSV/XLSX)

Autorizada explicitamente pelo usuário em 2026-08-24, junto com um pedido
concreto: importar dois datasets reais de avaliação (SPADEB 2026 e Leitor
Fluente Rápido) que o usuário restaurou localmente a partir de dumps
Postgres de dois sistemas externos, e que motivaram construir a
funcionalidade de importação em lote ao mesmo tempo (o P1 já previsto no
checklist da ETAPA 09/10).

### Funcionalidade geral (reaproveitável, nova aba "Importar")

Nova aba em `/admin/avaliacoes/[id]?tab=importar`, com dois fluxos
independentes (questões e resultados), cada um em duas etapas — "Analisar
arquivo" (só lê e valida, nada é gravado) e "Confirmar importação" (grava
só as linhas validadas, reenviando o preview já processado, nunca relendo
o arquivo):

- **Importar questões**: aceita `numero` (obrigatório, único no arquivo),
  `descritor`, `gabarito`, `peso`, `enunciado`. Número já cadastrado na
  avaliação é ignorado (não sobrescrito) — mesma regra de
  `addQuestaoAction`.
- **Importar resultados**: identifica o aluno por `matricula`, `cpf`, ou
  `nome` (+ opcionalmente `escola`/`turma` para desambiguar). Aceita
  `pontuacao`, `nivel` (nome ou código do nível de fluência), `turma`,
  `palavras_por_min`, `observacoes`, e colunas `resposta_N`/`qN`/`questao_N`
  por questão (viram `respostasJson`, alimentando a Análise por item já
  existente desde a ETAPA 09). Cada linha do preview mostra um status:
  `ok` / `não encontrado` / `ambíguo` (2+ alunos com o mesmo nome) / `dado
  inválido` — só linhas `ok` são gravadas.
- Mesmo parser (`XLSX.read`) para os dois formatos — CSV puro e XLSX são
  detectados automaticamente pelo conteúdo, sem código duplicado.

### Arquivos novos

`lib/import/parse-tabular.ts` (leitura de arquivo → linhas normalizadas),
`lib/import/avaliacoes-import.ts` (+ `.test.ts`, 13 testes — validação de
questão, interpretação de nível de fluência, extração de respostas por
item; resolução de estudante e commit são funções à parte, não puras,
sem teste automatizado pelo mesmo motivo do resto de `lib/queries/*`),
`app/admin/avaliacoes/[id]/importar-questoes-form.tsx`,
`app/admin/avaliacoes/[id]/importar-resultados-form.tsx`.

### Dependência nova: `xlsx` (SheetJS)

Instalada inicialmente pelo registro npm; `npm install` acusou 2
vulnerabilidades **altas** específicas desse pacote (prototype pollution e
ReDoS no parser — GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9), exatamente na
superfície de risco desta funcionalidade (parsing de arquivo enviado por
upload). Trocada pela build oficial corrigida do próprio SheetJS
(`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, recomendação
publicada nos dois advisories) — `npm audit` confirma a entrada `xlsx`
limpa depois da troca; as vulnerabilidades remanescentes no projeto (next,
postcss, undici, glob, minimatch) já existiam antes desta etapa e não
foram introduzidas aqui.

### Migração real: SPADEB 2026 + Leitor Fluente Rápido

O usuário forneceu dois dumps Postgres (`.backup`, formato custom do
`pg_restore`) de sistemas externos reais da rede, que ele mesmo restaurou
localmente (Postgres 17 local, bancos `dump_barauna_edu_hub` e
`dump_leitor_fluente`). Inspecionados com `pg_restore -l`/`psql` (sem
alterar os dumps):

- **`dump_barauna_edu_hub`** = SPADEB 2026 (Sistema Permanente de
  Avaliação da Educação Básica de Baraúna), com estrutura própria
  (`assessments`, `assessment_answer_keys`, `assessment_results`, etc.):
  8 avaliações (uma por série, 2º-9º Ano — a 9ª linha, "SPADEB 2026" sem
  série, é um registro vazio sem gabarito/resultado, ignorado), gabarito
  de 40 questões cada (20 Língua Portuguesa + 20 Matemática, número +
  resposta + matéria), 1.998 resultados com resposta item a item.
- **`dump_leitor_fluente`** = Leitor Fluente Rápido: 4 avaliações
  cadastradas, mas só 1 com lançamento real ("Avaliação Diagnóstica -
  PARC", 235 lançamentos, todas turmas de 2º Ano) — as outras 3 ficaram
  vazias, não geraram nenhuma `Avaliacao` no SME.

Nenhum dos dois sistemas guarda CPF/matrícula do estudante — só nome +
escola + turma no vocabulário próprio de cada sistema. Isso definiu o
desenho da importação: identificação por nome, com a escola do sistema de
origem mapeada manualmente (curada por inspeção, ~19 e ~13 escolas,
respectivamente — pequeno demais para justificar fuzzy-match automático)
para o nome real de `Escola.nome` no SME; a turma não é usada como
critério de busca (o nome de turma da origem — ex. "Multiserriada" — não
corresponde a nenhum código real do SIGEduc, e usá-lo como filtro só
geraria falso-negativo). Documentada em
`scripts/migrar-avaliacoes-externas.ts`, que reaproveita literalmente as
mesmas funções de `lib/import/avaliacoes-import.ts` usadas pela tela — a
migração é, na prática, o teste de ponta a ponta da funcionalidade geral
contra dado real.

### Resultado real da migração (gravado em produção em 2026-08-24)

| Dataset | Avaliações criadas | Questões | Resultados no arquivo | Gravados (match por nome+escola) | Ambíguo | Não encontrado |
|---|---|---|---|---|---|---|
| SPADEB 2026 (8 séries) | 8 | 320 (40 × 8) | 1.998 | **1.643** | 8 | 347 |
| Leitor Fluente Rápido (PARC) | 1 | — | 229 (235 − 6 sem participação) | **188** | 0 | 41 |
| **Total** | **9** | **320** | **2.227** | **1.831** | **8** | **388** |

Taxa de match ~82% nos dois datasets, de forma consistente entre as 8
séries do SPADEB (não há nenhuma série com taxa anormalmente baixa, o que
indicaria um mapeamento de escola quebrado) — os "não encontrado" são, por
amostragem manual dos primeiros casos de cada série, majoritariamente erro
de digitação no nome no sistema de origem (ex. "HENRIUE" em vez de
"HENRIQUE", sobrenomes com letra trocada/faltando), não uma falha de
correspondência. Nenhuma tentativa de correção automática de nome foi
feita — ficam de fora, visíveis apenas no log do script, para eventual
revisão manual da Secretaria.

**Bug encontrado e corrigido durante a própria migração**: a primeira
gravação populou `pontuacao` a partir do campo `percentage` do SPADEB
(`assessment_results.percentage`). Comparando com o resultado antes de
fechar a etapa, **1.983 dos 1.998 registros (99%) tinham esse campo zerado
na origem** — não é nota real de 0%, é um campo que o `barauna-edu-hub`
nunca chegou a calcular para quase todos os registros (confirmado batendo
com `answers`, que tem variação real, e com a Análise por item deste
próprio sistema, que calcula % de acerto real a partir de
`respostasJson` + gabarito e mostra distribuição plausível, não zero).
Gravar `percentage` como `pontuacao` teria feito quase toda a rede parecer
com nota zero no SPADEB. Corrigido: `pontuacao` não é mais preenchida a
partir dessa fonte (fica `null` — "sem pontuação direta informada", nunca
um zero inventado); a % de acerto real continua disponível pela aba
Análise. Achado só apareceu na verificação visual pós-commit (checklist
"smoke test com dado real" pagou o investimento) — o script foi
reexecutado (upsert, idempotente) para reverter os `pontuacao=0` já
gravados.

## Riscos e pendências

- **Validação end-to-end logada executada** com contas reais dos 5 papéis
  fornecidas pelo usuário — ver
  [`decisoes/10-validacao-e2e-turmas-rede.md`](../decisoes/10-validacao-e2e-turmas-rede.md).
  Encontrou e corrigiu um bug real: `getTurmasRede` atribuía frequência/nota
  pela turma ATUAL do estudante em vez do campo `turma` do próprio registro
  histórico (mesma convenção de `getTurmaDetalhe`), causando divergência de
  número entre `/admin/turmas` e a ficha de turma para a mesma turma quando
  havia estudante com histórico de troca de turma. Corrigido e revalidado
  manualmente. Suíte automatizada não é afetada (`lib/queries/*` sem testes
  próprios por depender de I/O) — mesma limitação já registrada em etapas
  anteriores; validação manual foi o que pegou este caso.
- Smoke test foi dirigido às áreas construídas nas ETAPAS 04-10, não uma
  varredura de todas as ~66 rotas nem dos fluxos de escrita — o checklist
  completo (estados de erro/loading, mobile, acessibilidade, fluxos de
  escrita) continua sendo escopo da ETAPA 11.
- **2 dos 4 blocos P1 apresentados ao usuário permanecem não selecionados**
  e continuam como backlog em aberto, não perdido (a Importação de
  avaliações, o 3º bloco, foi selecionada e concluída nesta rodada 2):
  - Comunicação e documentos (CMS: preview/agendamento/galeria; Documentos:
    edição/substituição/categorias/validade).
  - Itens específicos por perfil (Direção: `/portal/direcao/servidores` com
    filtros+ficha funcional, `/portal/direcao/notas` com
    distribuição/evolução; Aluno: declaração de matrícula com seletor de
    ano).
  Qualquer um pode virar uma nova rodada da ETAPA 10 ou ser formalmente
  adiado para a ETAPA 11/backlog P2, mediante decisão do usuário.
- **`getTurmasRede` faz 4-5 consultas de rede inteira em paralelo por
  carregamento de página** (estudantes, servidorTurma, frequência agregada,
  notas do ano) — aceitável no volume atual (~4 mil estudantes, ~135
  turmas), mas não pagina; se a rede crescer muito, revisar.
- **Coluna "Faltas consecutivas agora"** usa uma janela fixa de 20 dias
  corridos (não configurável); nenhuma tela expõe esse parâmetro ao
  usuário. Documentado como constante (`DIAS_JANELA_FALTAS_CONSECUTIVAS`)
  em `lib/queries/frequencia.ts`, não como limitação escondida.
- **388 resultados (SPADEB + Leitor Fluente) não foram importados** por não
  encontrar o estudante por nome/escola, ou por ambiguidade — ficam
  registrados no log da migração (não versionado, foi rodada localmente),
  não em um relatório persistido no repositório. Se a Secretaria quiser
  revisar esses casos manualmente, os nomes/escolas exatos precisam ser
  reextraídos rodando `scripts/migrar-avaliacoes-externas.ts` (sem
  `--commit`) de novo contra os dumps locais.
- **Matching por nome é inerentemente mais frágil que por matrícula/CPF** —
  a funcionalidade geral de importação aceita os três, mas quando só o nome
  está disponível (caso dos dois datasets migrados), erro de digitação na
  fonte vira "não encontrado" em vez de um falso-positivo (comportamento
  desejado — nunca adivinha), mas também significa que uma correção de
  digitação na fonte exigiria reimportar manualmente essas linhas.

## Critérios de aceite

Os itens P1 selecionados e priorizados com o usuário foram implementados com
teste e sem regressão dos P0 já entregues.

**Atendido para os blocos selecionados** — "Indicadores de rede" (rodada 1)
e "Importação de avaliações" (rodada 2, incluindo a migração real de
SPADEB 2026 e Leitor Fluente Rápido). Os demais 2 blocos apresentados não
foram selecionados e não fazem parte desta rodada.

## Próximo passo permitido

ETAPA 11, somente mediante autorização explícita do usuário.
