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
- [ ] Implementar "Atenção agora" explicável. *(sub-lote futuro)*
- [x] Implementar saúde/freshness por módulo no dashboard `/admin`.
- [x] Implementar período consistente em turma (frequência agora usa o
      mesmo recorte de ano que notas). Estudante já ficou consistente na
      ETAPA 02.
- [x] Mascarar CPF por padrão em listagens (`/admin/usuarios`, `/admin/servidores`).
- [x] Permissão visual Admin×Secretaria em `/admin/usuarios` (lista e detalhe).
- [ ] `/admin/servidores/[id]` (confirmado ausente — sub-lote futuro, é uma
      página nova relativamente grande).
- [ ] Filtros analíticos em escolas/estudantes/servidores/avaliações. *(sub-lote futuro)*
- [ ] Sincronização: saúde por módulo e detecção de execução incompleta. *(sub-lote futuro)*

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
4. **"Atalhos contextuais" ("ver escolas em atenção", "ver avaliação
   pendente") não entraram no sub-lote 2.** Os exemplos do DOCX para esses
   atalhos dependem do conceito de "atenção" (escola com queda de
   frequência, avaliação com cobertura baixa), que ainda não existe em
   nenhuma tela — é literalmente o próximo achado do checklist ("Atenção
   agora"). Construir um atalho para um conceito que ainda não existe seria
   inventar a peça errada primeiro; o atalho "ver sync atrasado" já existe
   de fato agora, como o link "Ir para Sincronização" ao lado do resumo de
   saúde (fica mais evidente quando há módulo com problema, pela cor do
   ícone).

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

Validação visual via browser (conferir que SECRETARIA de fato não vê os
controles administrativos, que o CPF aparece mascarado, e que o bloco de
saúde da base reflete a situação real de cada módulo) **não foi
executada** — mesma limitação de credenciais já registrada nas etapas
01–03.

## Riscos e pendências

1. **Validação visual/end-to-end logada não foi feita** (ver acima) —
   importante confirmar com uma conta SECRETARIA real antes de considerar
   o achado "Permissões Admin × Secretaria" totalmente fechado.
2. **Restante do escopo desta etapa ainda pendente** (ver checklist):
   "Atenção agora", `/admin/servidores/[id]`, filtros analíticos,
   sincronização com detecção de execução incompleta. Continuam em
   sub-lotes futuros dentro desta mesma etapa.

## Critérios de aceite

A visão Admin responde "onde devo olhar agora e por quê?" e todo indicador
relevante mantém rastreabilidade de período/fonte.

## Próximo passo permitido

ETAPA 05, somente mediante autorização explícita do usuário.
