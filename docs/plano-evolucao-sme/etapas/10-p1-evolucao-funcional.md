# ETAPA 10 — P1: evolução funcional

## Status
DONE (rodada 1 — "Indicadores de rede"; demais blocos P1 ficam para uma
próxima rodada, ver "Riscos e pendências")

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
      Usuário selecionou **apenas "Indicadores de rede"**.
- [x] Implementar item a item, com teste, dentro do bloco selecionado.

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

- `npm test` (suíte completa — nenhum teste novo: os itens desta rodada são
  consultas/apresentação sobre motores já testados em etapas anteriores,
  mesmo padrão de granularidade de teste do restante de `lib/queries`, que
  não tem suíte própria por depender de I/O).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.

## Resultado dos testes

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
- **3 dos 4 blocos P1 apresentados ao usuário não foram selecionados nesta
  rodada** e continuam como backlog em aberto, não perdido:
  - Importação CSV/XLSX de avaliações (já preparada pela ETAPA 09 —
    `respostasJson` pronto para recebê-la).
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

## Critérios de aceite

Os itens P1 selecionados e priorizados com o usuário foram implementados com
teste e sem regressão dos P0 já entregues.

**Atendido para o bloco selecionado ("Indicadores de rede")** — ver acima.
Os demais 3 blocos apresentados não foram selecionados e não fazem parte
desta rodada.

## Critérios de aceite

Os itens P1 selecionados e priorizados com o usuário foram implementados com
teste e sem regressão dos P0 já entregues.

## Próximo passo permitido

ETAPA 11, somente mediante autorização explícita do usuário.
