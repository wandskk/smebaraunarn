# ETAPA 04 — Admin P0

## Status
IN_PROGRESS

## Objetivo

Implementar os achados P0 do documento de Admin (`base/extratos/01-admin.md`
e `base/Plano_Evolucao_MVP_Admin_SME_Barauna.docx`) usando a fundação
compartilhada das etapas 01–03.

## Por que esta etapa existe

O Admin é o perfil com mais superfície (rede inteira) e o DOCX correspondente
já identifica que o próximo salto não é criar CRUDs novos, mas fazer as telas
responderem perguntas de gestão com rastreabilidade de período/fonte —
dependente de `NetworkScope`, freshness por módulo e componentes acadêmicos
compartilhados já existirem (etapas 01–03).

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`).

## Escopo desta etapa

- Dashboard com "Atenção agora" explicável (fato, valor, referência, período,
  motivo, deep-link — sem score opaco).
- Saúde/freshness de dados por módulo.
- `SchoolOverview` inteligente aplicado ao Admin.
- Turma com período consistente entre notas e frequência.
- Estudante com período explícito.
- Filtros úteis em escolas/estudantes/servidores/avaliações.
- `/admin/servidores/[id]` se ainda não existir.
- Capability visual Admin x Secretaria (refletindo capability real, não só
  papel).
- Sincronização com saúde por módulo e detecção de execução incompleta.
- Evitar CPF completo por padrão em listagens.

## Fora de escopo

Qualquer item marcado como P1 no documento de Admin (isso é ETAPA 10).

## Arquivos/áreas previstos

`app/admin/**`, `lib/queries/indicadores-gerais.ts`,
`lib/queries/comparativos.ts`, `lib/queries/qualidade-dados.ts`,
componentes compartilhados da ETAPA 03.

## Nota sobre condução desta etapa

O escopo do documento de Admin é grande (rivaliza em tamanho com as etapas
00–03 juntas). A pedido do usuário, esta etapa é executada em **sub-lotes
pequenos e testáveis**, cada um parando para confirmação antes de seguir
para o próximo — em vez de uma única mudança grande. Cada sub-lote abaixo
tem seu próprio registro de arquivos/testes; a etapa só é marcada `DONE`
quando os achados P0 relevantes estiverem cobertos (ou explicitamente
adiados com justificativa, como já é o padrão nas etapas anteriores).

## Checklist
- [x] Reler `base/Plano_Evolucao_MVP_Admin_SME_Barauna.docx` / extrato.
- [x] Confirmar código atual de cada rota antes de alterar.
- [x] Implementar "Atenção agora" explicável.
- [x] Implementar saúde/freshness por módulo no dashboard `/admin`.
- [x] Implementar período consistente em turma (frequência agora usa o
      mesmo recorte de ano que notas). Estudante já ficou consistente na
      ETAPA 02.
- [x] Mascarar CPF por padrão em listagens (`/admin/usuarios`, `/admin/servidores`).
- [x] Permissão visual Admin×Secretaria em `/admin/usuarios` (lista e detalhe).
- [x] `/admin/servidores/[id]` (confirmado ausente na ETAPA 00, criada
      no sub-lote 5).
- [ ] Filtros analíticos em escolas/estudantes/servidores/avaliações. *(sub-lote futuro)*
- [x] Sincronização: saúde por módulo (sub-lote 2) e detecção de execução
      incompleta (sub-lote 4).

## Alterações realizadas

### Sub-lote 1 — bugs P0 concretos (período de turma, CPF, permissão visual)

Mapeamento antes de alterar: reli o extrato do Admin (Tabelas 12, 16, 17,
18) e confirmei cada achado no código atual antes de mexer — 2 dos achados
P0 do documento **já estavam corrigidos** pelas etapas 01–03 (freshness
genérica → corrigida na ETAPA 02; janela do aluno "90 registros" → corrigida
na ETAPA 02). Este sub-lote cobre os que ainda estavam abertos:

1. **Janela inconsistente na turma** (Tabela 12/18 do DOCX): confirmado em
   [`lib/queries/academico.ts`](../../../lib/queries/academico.ts)
   (`getTurmaDetalhe`) que a agregação de frequência não tinha filtro de
   data nenhum, somando todo o histórico já sincronizado da turma, enquanto
   notas já filtravam por `ano`. Corrigido: frequência agora usa o mesmo
   recorte `data: { gte: "${ano}-01-01", lte: "${ano}-12-31" }`. UI
   ([`components/portal/turma-detalhe.tsx`](../../../components/portal/turma-detalhe.tsx),
   consumida por Admin e Direção desde a ETAPA 03) passou a exibir o ano no
   rótulo dos cards de frequência/faltas, e "-" virou "Sem dados no
   período" quando não há aula registrada no ano, consistente com o padrão
   já adotado em outras telas na ETAPA 02.
2. **CPF exposto em listagens** (Tabela 18/regra 7.7): confirmado que
   `/admin/usuarios` e `/admin/servidores` mostravam CPF completo
   formatado (`formatCpf`) nas colunas de lista. Novo utilitário
   `maskCpf` em [`lib/utils.ts`](../../../lib/utils.ts) (mantém 3
   primeiros + 2 últimos dígitos, oculta o miolo — mesmo padrão de
   guard de `formatCpf` para CPF inválido). Aplicado nas duas listas.
   Telas de detalhe de um único registro (`/admin/usuarios/[id]`)
   continuam mostrando CPF completo — é um drill-down já intencional
   para um registro específico, não uma listagem (distinção que o
   próprio DOCX faz na seção 8.3: "CPF mascarado por padrão **nas
   listas**"). `/admin/estudantes` já não exibia CPF como coluna (só
   usa no filtro de busca), nada a corrigir lá.
3. **Permissões Admin × Secretaria** (Tabela 17/18): confirmado por
   leitura de `app/admin/usuarios/actions.ts` que toda ação
   (`createUserAction`, `updateUserVinculoAction`,
   `toggleUserAtivoAction`, `resetPasswordToBirthDateAction`,
   `setPasswordAction`) já exige `requireSession(["ADMIN"])` — a
   segurança do lado do servidor já estava correta desde sempre; o
   problema era só a UI mostrar os controles para SECRETARIA mesmo
   assim. Usando `hasCapability`/`CapabilityGate` (construídos na ETAPA
   01, sem uso até agora): `/admin/usuarios` (lista) esconde "Criar
   acesso manual" para quem não tem `usuarios:manage` e troca o toggle
   de status/botão de redefinir senha por um badge somente leitura;
   `/admin/usuarios/[id]` esconde o formulário de troca de vínculo. Cada
   fallback explica o motivo em vez de deixar a SECRETARIA descobrir
   pelo erro da Server Action (achado literal do DOCX).

### Sub-lote 2 — saúde da base no dashboard `/admin`

`/admin` (Visão Geral) tinha só 4 contagens e um card genérico chamando
para a Sincronização, sem dizer nada sobre a saúde dos dados — exatamente
o achado do DOCX ("é funcional, mas ainda não se comporta como a 'entrada
inteligente' do sistema"; Tabela 10: "Adicionar... saúde dos dados").

- [`app/admin/page.tsx`](../../../app/admin/page.tsx): o card genérico de
  sincronização foi trocado por um bloco "Saúde da base" que reaproveita
  `getStatusSincronizacao()` (já existente desde antes da ETAPA 00) e
  `DataFreshnessBadge` (ETAPA 02) — mostra a situação (em-dia/atrasado/sem
  sincronização) de cada um dos 6 módulos (Escolas, Cargos, Servidores,
  Estudantes, Notas, Frequência) lado a lado, com um resumo textual no
  topo ("Todos os módulos... em dia" ou "N módulo(s) atrasado(s)...") e o
  ícone/cor mudando conforme há ou não problema. O link para
  `/admin/sincronizacao` continua no mesmo lugar.
- `ROTULO_MODULO` (rótulo amigável de cada módulo) estava duplicado como
  constante local em `app/admin/indicadores/qualidade/page.tsx`; movido
  para [`lib/queries/qualidade-dados.ts`](../../../lib/queries/qualidade-dados.ts)
  (exportado, tipado pelos 6 módulos conhecidos) para o dashboard também
  usar. Como o histórico bruto de sincronização (`LogSincronizacao.modulo`)
  é texto livre no banco, não a união estrita dos 6 módulos, foi adicionada
  `rotuloModulo(modulo: string)` como acesso seguro com fallback — a página
  de Qualidade dos Dados usa essa versão para a coluna de histórico, que
  precisa aceitar qualquer string sem erro de tipo.

### Sub-lote 3 — "Atenção agora" no dashboard `/admin`

O achado mais citado do DOCX ("o próprio código sinaliza que falta o bloco
'Atenção agora'" — `app/admin/indicadores/page.tsx` já tinha esse aviso
explícito desde antes desta etapa). Implementadas as 4 regras dinâmicas
descritas no DOCX (seção 7.4), sem persistir nada — recalculado a cada
carregamento, seguindo a recomendação do próprio documento de validar as
regras antes de criar um modelo `AlertaAnalitico`.

- [`lib/analytics/atencao.ts`](../../../lib/analytics/atencao.ts) (novo,
  puro, sem I/O — mesmo princípio dos outros módulos de `lib/analytics/`):
  4 funções geradoras de insight, uma por regra:
  1. `gerarInsightsFrequencia` — escola fora da faixa "adequada" **e** em
     queda no período mais recente (usa `frequenciaFaixa` +
     `frequenciaVariacao.tendencia`, já calculados por
     `lib/analytics/frequencia.ts`).
  2. `gerarInsightsDesempenho` — desempenho abaixo da rede **e** proporção
     elevada (≥40%, severidade crítica a partir de 60%) de notas abaixo do
     parâmetro esperado.
  3. `gerarInsightsDistorcao` — distorção idade-série ≥5 p.p. acima da
     rede (severidade crítica a partir de 10 p.p.).
  4. `gerarInsightSincronizacao` — qualquer módulo fora de "em-dia" vira um
     insight agregado único (severidade crítica se algum módulo nunca
     sincronizou).
  Mais `combinarInsightsAtencao`, que junta os 4 grupos, prioriza crítico
  sobre atenção e limita o total exibido (padrão: 5) — sem somar nada num
  score único (regra 7.6 do master prompt). 16 testes cobrindo cada regra
  isoladamente, incluindo os casos de não-gerar-insight (dado insuficiente,
  variação favorável, abaixo do limiar).
- [`lib/queries/atencao.ts`](../../../lib/queries/atencao.ts) (novo):
  busca os dados já calculados por `getComparativosPorEscola`
  (frequência/desempenho/distorção vs. rede, já existente) e
  `getDesempenhoPorEscola` (proporção abaixo do parâmetro, que
  `ComparativoEscola` não expõe), soma o status de sincronização, e chama
  o motor puro acima — nenhuma fórmula nova, só composição do que já
  existia e já era usado em `/admin/indicadores/comparativos` e
  `/admin/indicadores/frequencia`.
- [`components/ui/insight-card.tsx`](../../../components/ui/insight-card.tsx)
  (novo — é o `InsightCard` citado na Tabela 9 do DOCX): cartão explicável
  com ícone/cor por severidade, título (fato+valor+referência já
  formatados), motivo, período e link para a entidade que explica o valor.
  Ao contrário de `AcademicContextBar`/`MethodologyNote` (adiados na ETAPA
  02/03 por falta de caso de uso), este já nasce com um consumidor real.
- [`app/admin/page.tsx`](../../../app/admin/page.tsx): nova seção "Atenção
  agora" acima dos números da rede, com estado vazio explícito quando
  nenhuma regra dispara. `anoLetivo` do dashboard passou a ser resolvido
  (ano mais recente com estudante matriculado) para poder consultar os
  comparativos — o dashboard ainda não tem seletor de ano (fica para um
  sub-lote futuro se for pedido; hoje sempre mostra o ano mais recente,
  coerente com a ideia de "agora").

### Sub-lote 4 — detecção de execução incompleta na sincronização

Achado do DOCX (seção 8.4): "Comparar registros antes/depois e detectar
finalização incompleta (PROCESSANDO sem SUCESSO final)". Confirmado em
[`lib/sync/sigeduc-sync.ts`](../../../lib/sync/sigeduc-sync.ts) que módulos
grandes (Estudantes/Notas/Frequência) gravam um log por lote, com status
`"PROCESSANDO" | "SUCESSO" | "ERRO"` — se a execução for interrompida no
meio (timeout serverless, ou o painel manual em
`frequencia-sync-panel.tsx` com a aba fechada no meio do laço), o último
log fica preso em `"PROCESSANDO"` para sempre. `classificarSituacaoSincronizacao`
só olha para o último **SUCESSO**, então esse cenário passava
completamente despercebido — um módulo podia aparecer "em dia" mesmo com
uma execução mais recente travada.

- [`lib/analytics/qualidade-dados.ts`](../../../lib/analytics/qualidade-dados.ts):
  nova função pura `execucaoIncompleta(ultimoLog, agora, limiarMinutos=10)`
  — verdadeiro quando o log mais recente do módulo está em `"PROCESSANDO"`
  há mais de 10 minutos (folga generosa sobre o tempo real de um lote,
  45–120s conforme `maxDuration` das rotas de cron). 7 novos testes.
- [`lib/queries/qualidade-dados.ts`](../../../lib/queries/qualidade-dados.ts):
  `StatusModuloSincronizacao` ganhou o campo `execucaoIncompleta`, calculado
  dentro de `getStatusSincronizacao()`.
- [`lib/analytics/atencao.ts`](../../../lib/analytics/atencao.ts): a regra 4
  de "Atenção agora" (`gerarInsightSincronizacao`) agora também considera
  módulos com execução travada, mesmo que a situação normal seja "em dia"
  — vira insight crítico, com o motivo citando explicitamente "execução
  travada em PROCESSANDO sem SUCESSO final".
- UI: badge "Travado" ao lado da situação do módulo em
  [`app/admin/page.tsx`](../../../app/admin/page.tsx) (Saúde da base) e em
  [`app/admin/indicadores/qualidade/page.tsx`](../../../app/admin/indicadores/qualidade/page.tsx)
  (que também ganhou um banner explicando o que aconteceu e a ação
  recomendada — executar a sincronização novamente).

### Sub-lote 5 — nova rota `/admin/servidores/[id]`

Achado do DOCX (seção 6.7 e Tabela 21): "Nova rota /admin/servidores/[id]
com dados funcionais, contato, escola, turmas/disciplinas/turno/carga e
status de acesso ao portal". Confirmada ausente na ETAPA 00; a lista em
`/admin/servidores` não linkava para nenhum detalhe.

- [`app/admin/servidores/[id]/page.tsx`](<../../../app/admin/servidores/[id]/page.tsx>)
  (novo): ficha funcional com CPF completo (drill-down intencional, mesma
  regra do sub-lote 1), matrícula, tipo de vínculo, status; papel no
  portal com explicação de por que foi classificado assim; contato
  (e-mail/telefone); escola atribuída, com aviso quando a "escola na
  origem" (`Servidor.escolaNome`, o que o SIGEduc informou) diverge da
  atribuição manual (`Servidor.escola`) — achado explícito do DOCX
  ("diferenciar 'escola da origem' de 'escola atribuída manualmente'"),
  incluindo uma nota específica para Direção/Coordenação (que costuma vir
  sem escola na origem); tabela de turmas/disciplinas/turno/carga a partir
  de `ServidorTurma`; e status de acesso ao portal (busca `User` por
  `servidorId` — mostra papel/ativo e link para gerenciar em
  `/admin/usuarios/[id]`, ou explica como provisionar se não houver conta
  ainda).
- `explicarClassificacaoServidorRole` (novo, em
  [`lib/roles.ts`](../../../lib/roles.ts), puro, 8 novos testes junto com
  `classifyServidorRole` que também não tinha teste antes): DOCX pede
  literalmente "explicar a classificação de papel ('Professor porque
  cargo contém PROF…')" — a função cita a palavra-chave real encontrada
  em cargo/função, não só o resultado.
- `/admin/servidores` (lista) ganhou a coluna "Ver detalhes" linkando para
  a nova rota.

## Decisões técnicas

1. **Máscara de CPF só nas listas, não no detalhe.** `/admin/usuarios/[id]`
   continua usando `formatCpf` (completo). O DOCX (seção 8.3) e o
   checklist desta etapa falam especificamente de "listagens"; a tela de
   detalhe já é um acesso individual, deliberado, a um registro específico
   — mascarar lá reduziria utilidade operacional (conferir CPF contra
   documento) sem reduzir exposição real (quem chega lá já escolheu abrir
   aquele registro).
2. **Sem botão de "revelar CPF" nesta etapa.** O DOCX sugere "revelação
   intencional apenas quando necessária", o que implicaria um toggle
   client-side. Ficou fora do sub-lote 1 por ser uma peça de UX adicional,
   não o núcleo do achado P0 ("não expor por padrão") — pode entrar em um
   sub-lote de polimento futuro se for pedido.
3. **`CapabilityGate` aplicado só em `/admin/usuarios`.** É a única tela
   onde já existe uma capability real e testada distinguindo ADMIN de
   SECRETARIA (`usuarios:manage`, documentada em
   `lib/authz/capabilities.ts` desde a ETAPA 01). Nenhuma outra ação
   administrativa hoje diferencia os dois papéis no código (confirmado por
   grep em todos os `requireSession([...])` na ETAPA 01) — aplicar
   `CapabilityGate` em outro lugar agora não teria nenhuma capability real
   por trás para consultar.
4. **Limiares de "Atenção agora" são parâmetros, não valores oficiais —
   mesmo tratamento já dado a `FAIXAS_PADRAO_FREQUENCIA` e
   `NOTA_MINIMA_ESPERADA_PADRAO`.** `limiarDiferencaRede`,
   `limiarPercentualAbaixo` (desempenho) e `limiarDiferencaRede`
   (distorção) em `lib/analytics/atencao.ts` têm valores-padrão razoáveis
   (documentados no código), mas não foram validados pela Secretaria — são
   argumentos com default, não constantes fixas sem alternativa, seguindo
   o mesmo padrão já usado nos módulos de frequência/desempenho/distorção
   existentes.
5. **"Atalhos contextuais" viram os próprios deep-links do `InsightCard`,
   não uma lista separada.** O DOCX sugere atalhos como "ver escolas em
   atenção" — com "Atenção agora" implementado (sub-lote 3), cada cartão
   já é o atalho: aponta direto para a escola que gerou o insight. Um
   atalho agregado adicional ("ver todas as N escolas em atenção") só faria
   sentido com uma lista maior que 5 itens, o que o `limite` padrão de
   `combinarInsightsAtencao` já evita mostrar de uma vez — não construído
   por falta de necessidade real ainda. "Ver sync atrasado" continua
   coberto pelo link "Ir para Sincronização" do bloco de Saúde da base.
6. **Limiar de 10 minutos para "execução travada" é conservador de
   propósito.** Cada lote real leva 45–120s (limite das rotas de cron); 10
   minutos dá folga de sobra para não marcar como travada uma execução que
   só está um pouco mais lenta que o normal (ex.: API do SIGEduc
   respondendo devagar). Prefere um falso negativo ocasional (travamento
   real que demora a aparecer) a um falso positivo (aviso incômodo para
   uma execução que ainda está rodando normalmente).
7. **Avaliações não entraram em nenhuma regra de "Atenção agora".** O DOCX
   cita "avaliação pendente" como fonte de atenção, mas cobertura de
   avaliação (esperado vs. realizado) ainda não existe em nenhuma query —
   é o objeto da ETAPA 09 (Avaliações Municipais). Adicionar uma 5ª regra
   aqui exigiria calcular cobertura pela primeira vez fora do contexto que
   já vai fazer isso de forma completa; ficou fora por decisão consciente,
   não esquecimento.

## Testes executados

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Resultado dos testes

- Sub-lote 1: `npm test` **146/146** (143 pré-existentes + 3 novos em
  `lib/utils.test.ts` para `maskCpf`), `typecheck`/`lint`/`build` limpos.
- Sub-lote 2: `npm test` **146/146** (sem testes novos — mudança é
  apresentacional/reuso de query já testada indiretamente via
  `lib/analytics/qualidade-dados.test.ts`), `typecheck`/`lint`/`build`
  limpos após corrigir um erro de tipo real (`ROTULO_MODULO` com chave
  estrita não aceitava `LogSincronizacao.modulo`, que é texto livre —
  resolvido com `rotuloModulo()` como acesso seguro).
- Sub-lote 3: `npm test` **162/162** (146 pré-existentes + 16 novos em
  `lib/analytics/atencao.test.ts`, cobrindo cada uma das 4 regras
  isoladamente e a combinação/priorização), `typecheck`/`lint`/`build`
  limpos.
- Sub-lote 4: `npm test` **169/169** (162 pré-existentes + 7 novos em
  `lib/analytics/qualidade-dados.test.ts` para `execucaoIncompleta`),
  `typecheck`/`lint`/`build` limpos.
- Sub-lote 5: `npm test` **177/177** (169 pré-existentes + 8 novos em
  `lib/roles.test.ts`, novo arquivo — cobrindo `classifyServidorRole`,
  que ainda não tinha teste, e `explicarClassificacaoServidorRole`),
  `typecheck`/`lint`/`build` limpos. Build confirma a rota nova:
  `/admin/servidores/[id]` (47 rotas no total, uma a mais que o baseline).

Validação visual via browser (conferir que SECRETARIA de fato não vê os
controles administrativos, que o CPF aparece mascarado, que o bloco de
saúde da base reflete a situação real de cada módulo, e que os cartões de
"Atenção agora" mostram fatos corretos contra dados reais) **não foi
executada** — mesma limitação de credenciais já registrada nas etapas
01–03.

## Riscos e pendências

1. **Validação visual/end-to-end logada não foi feita** (ver acima) —
   importante confirmar com uma conta SECRETARIA real antes de considerar
   o achado "Permissões Admin × Secretaria" totalmente fechado, e conferir
   os cartões de "Atenção agora" contra a base real de produção (a lógica
   está testada com dados sintéticos, não com o volume/distribuição real
   da rede).
2. **Limiares de "Atenção agora" não validados pela Secretaria** (ver
   Decisões técnicas item 4) — podem gerar falsos positivos/negativos até
   serem ajustados com feedback real de uso. Fáceis de recalibrar (são
   parâmetros com default, não constantes espalhadas pelo código).
3. **Limiar de execução travada (10 min) nunca foi observado contra uma
   execução real interrompida** — só testado com dados sintéticos. Se o
   tempo real de um lote em produção variar muito mais que o esperado
   (ex.: API do SIGEduc lenta em horário de pico), pode gerar falso
   positivo; fácil de ajustar (é parâmetro com default).
4. **Restante do escopo desta etapa ainda pendente** (ver checklist):
   filtros analíticos em escolas/estudantes/servidores/avaliações.
   Continua em sub-lote futuro dentro desta mesma etapa.

## Critérios de aceite

A visão Admin responde "onde devo olhar agora e por quê?" e todo indicador
relevante mantém rastreabilidade de período/fonte.

## Próximo passo permitido

ETAPA 05, somente mediante autorização explícita do usuário.
