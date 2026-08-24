# ETAPA 08 — Servidor Geral P0

## Status
DONE

## Objetivo

Entregar uma ficha funcional confiável para o Servidor Geral, sem
overengineering (sem RH/contracheque/ponto/férias sem fonte de dados real).

## Por que esta etapa existe

O documento de Servidor Geral (`base/extratos/05-servidor-geral.md`) aponta
que `turno`/`carga_trabalho` podem ser perdidos quando o servidor não tem
turma (hoje persistidos via `ServidorTurma`) e que `pendenciaPedagogica`
precisa ter seu público/significado validado antes de ser exibido de forma
ampla. `SERVIDOR_GERAL` é um papel de fallback (`lib/roles.ts`) que cobre
cargos heterogêneos — a modelagem de lotação/dados funcionais precisa ser
avaliada antes de expandir a ficha.

## Pré-requisitos

ETAPAS 01, 02 e 03 concluídas (`DONE`).

## Escopo desta etapa

- Revisar perda de `turno` e `carga_trabalho` para servidores sem turma.
- Distinguir dado funcional de atribuição pedagógica.
- Avaliar necessidade de `ServidorLotacao` ou estrutura equivalente antes de
  migrar (decisão documentada antes de qualquer migração).
- Mostrar fonte/atualização dos dados.
- Revisar `pendenciaPedagogica` e seu público.
- Capabilities por tipo de função, somente quando houver necessidade real.
- Manter `Minha Conta` compartilhada.

## Fora de escopo

Qualquer módulo de RH, contracheque, ponto ou férias — não criar sem fonte de
dados e requisito explícito (regra explícita do master prompt).

## Arquivos/áreas previstos

`app/portal/servidor/**`, `prisma/schema.prisma` (somente se migração for
decidida e documentada), `app/conta/**` (Minha Conta compartilhada).

## Checklist
- [x] Reler `base/Plano_Evolucao_MVP_Servidor_Geral_SME_Barauna.docx` / extrato.
- [x] Confirmar código atual antes de alterar.
- [x] Investigar perda de `turno`/`carga_trabalho` sem turma (confirmado e
      corrigido).
- [x] Decidir e documentar modelagem de lotação (decidido **não** criar
      `ServidorLotacao` agora — ver decisões técnicas).
- [x] Validar público de `pendenciaPedagogica` (não dá para validar a
      regra de negócio só pelo código — tratado com tom neutro e
      transparência de origem em vez de inventar uma regra de
      aplicabilidade).
- [x] Testar: Servidor Geral não abre rota acadêmica (cobertura já
      existente desde a ETAPA 01 —
      `lib/authz/authorize.test.ts`: "Servidor Geral não vê dados
      acadêmicos de estudante, nem da própria escola").

## Alterações realizadas

### Plano de execução (registrado antes de editar)

Confirmado no código o achado P0 central: `ServidorResponse` (`lib/sigeduc.ts`)
já traz `turno`/`carga_trabalho` como campos da própria linha do servidor,
independente de `turma` — mas `syncServidoresChunk` só persiste esses dois
campos dentro do `if (s.turma)`, gravando em `ServidorTurma`. Quando a linha
não tem turma (cargos administrativos, típico de `SERVIDOR_GERAL`), a
origem pode ter informado turno/carga e o sync descarta silenciosamente.
`app/portal/servidor/page.tsx` deriva Turno/Carga só de `servidor.turmas`
(vazio para quem não tem turma) — por isso aparecem como "-" mesmo quando a
origem informou.

O próprio DOCX de Servidor Geral recomenda a estratégia MVP (seção 6.1):
persistir turno/carga como fallback no próprio `Servidor` quando não há
turma, sem criar a tabela `ServidorLotacao` maior (essa fica P1/P2 no
documento — "avaliar apenas se múltiplas lotações exigirem"). Plano em 2
sub-lotes:

1. **Schema pequeno + sync**: `Servidor.turno`/`Servidor.cargaTrabalho`
   (colunas novas, nullable, sem backfill necessário — dado nunca foi
   capturado antes) + ajuste em `syncServidoresChunk` para gravar esses
   campos no `Servidor` quando `s.turma` for nulo.
2. **Ficha funcional**: página do Servidor passa a usar o fallback quando
   não há turma; "Não informado pela fonte" em vez de "-"; freshness do
   módulo SERVIDORES; seção de contato (email/telefone, já sincronizados
   mas não exibidos); aviso de divergência escola estruturada × escolaNome;
   pendência pedagógica com tom neutro + fonte/atualização (sem inventar
   regra de aplicabilidade que só a Secretaria pode confirmar).

`ServidorLotacao` **não será criada** nesta etapa — decisão registrada nas
decisões técnicas.

### Arquivos alterados/criados

- `prisma/schema.prisma` + `prisma/migrations/20260824210000_servidor_turno_carga_fallback/`:
  `Servidor.turno String?` e `Servidor.cargaTrabalho Int?` (aditivas,
  nullable, sem backfill — aplicadas em produção via `prisma migrate deploy`,
  autorizado explicitamente pelo usuário).
- `lib/sync/sigeduc-sync.ts` (`syncServidoresChunk`): grava `turno`/
  `cargaTrabalho` no `Servidor` quando a linha da API não tem `turma` — sem
  sobrescrever com `undefined` quando uma linha posterior do mesmo servidor
  tiver turma (o campo simplesmente não entra no objeto `data` nesse caso,
  e o Prisma não altera o que já está no banco).
- `app/portal/servidor/page.tsx`: reescrita — Turno/Carga usam
  `ServidorTurma` quando há turma, senão o fallback do `Servidor`; "Não
  informado pela fonte" nos campos ausentes; `DataFreshnessBadge` do
  módulo SERVIDORES; seção "Contato cadastrado" (email/telefone, só
  aparece se a origem os enviou); aviso quando `escolaNome` (texto da
  origem) diverge de `escola.nome` (vínculo estruturado); pendência
  pedagógica com tom neutro (borda cinza, não mais laranja de alerta) +
  texto explicando a origem do campo.

## Decisões técnicas

1. **`ServidorLotacao` não foi criada.** O próprio documento de Servidor
   Geral classifica essa tabela como P1/P2 ("avaliar apenas se múltiplas
   lotações/contexto exigirem" — Tabela 19) e recomenda, para o MVP P0, o
   fallback direto no `Servidor` (seção 6.1, citado literalmente). Não há,
   nesta auditoria, evidência de que a origem envie múltiplas lotações
   simultâneas por servidor que justifiquem uma tabela nova agora — criar
   uma migração maior "por conveniência" contrariaria a regra 7.8 do
   master prompt. Fica registrado como candidato a P1/ETAPA 10 se essa
   evidência aparecer.
2. **Fallback só se aplica quando não há turma.** Gravar turno/carga do
   `Servidor` também quando há `ServidorTurma` correspondente misturaria
   "dado funcional" com "atribuição pedagógica" — exatamente a confusão
   que o documento pede para desfazer (seção 6). Um servidor com 3 turmas
   em turnos diferentes não tem um "turno único" que faça sentido gravar
   no nível do `Servidor`.
3. **`pendenciaPedagogica` não ganhou uma regra de aplicabilidade
   inventada.** O documento pede para validar "com a Secretaria" antes de
   tratar o campo como alerta universal — isso não é uma decisão que dá
   para tomar só lendo o código ou o schema. Em vez de inventar uma regra
   (ex.: só mostrar para cargos com "PROF" no nome, o que contradiria o
   próprio `SERVIDOR_GERAL` ser fallback para quem não é classificado como
   Professor), a mudança desta etapa foi de tom e transparência: visual
   neutro em vez de alerta laranja, e texto explícito dizendo que é um
   campo espelhado do SIGEduc sem interpretação do SME. A regra de
   aplicabilidade real fica como pendência explícita (abaixo).
4. **Capabilities por função não foram criadas.** O escopo desta etapa diz
   "somente quando houver necessidade real" — hoje todo `SERVIDOR_GERAL`
   vê exatamente os mesmos campos (ficha funcional própria), sem nenhuma
   diferenciação por cargo identificada que justifique uma capability
   nova. Mesma régua já aplicada a `CapabilityGate` na ETAPA 01
   (construído sem uso até haver um caso real na ETAPA 04).

## Testes executados

- `npm test` (suíte completa).
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- Migração: aplicada em produção via `prisma migrate deploy` (colunas
  aditivas nullable — sem risco de dado existente, verificado só pela
  natureza da migration, sem necessidade de script de verificação
  separado como na ETAPA 06).

## Resultado dos testes

- `npm test`: **184/184** (sem testes novos — mudanças são de
  apresentação/fallback de campo em uma página, mesmo padrão de
  granularidade das etapas anteriores; a lógica nova em
  `syncServidoresChunk` já não tinha testes automatizados antes desta
  etapa — a função depende de I/O externo (API do SIGEduc) e segue sem
  suíte própria, consistente com o restante de `lib/sync/*`).
- `npm run typecheck`: limpo.
- `npm run lint`: limpo (0 warnings/erros).
- `npm run build`: sucesso — 63 rotas (nenhuma nova; só a página do
  Servidor foi reescrita).
- Validação end-to-end logada como SERVIDOR_GERAL real **não foi
  executada** — mesma limitação de credenciais de teste já registrada
  desde a ETAPA 01; fica pendente para a ETAPA 11.

## Riscos e pendências

- **Semântica de `pendenciaPedagogica` continua sem confirmação oficial**
  da Secretaria — decisão técnica 3 amenizou a apresentação, mas não
  resolve a pergunta de fundo ("esse campo é acionável para este cargo?
  quem resolve? há prazo?"). Registrado como P1 explícito, aguardando
  informação que só a Secretaria pode dar.
- **Fallback de turno/carga só populará dados para sincronizações
  futuras.** Servidores sem turma já sincronizados antes desta etapa
  ficam com `turno`/`cargaTrabalho` nulos até a próxima execução do sync
  de SERVIDORES — mesma natureza da limitação já registrada na ETAPA 06
  para o backfill de `ServidorTurma.escolaId`.
- `ServidorLotacao` (múltiplas lotações) segue sem evidência que
  justifique construir — reavaliar se aparecer um caso real (decisão
  técnica 1).
- Validação visual/E2E autenticada como SERVIDOR_GERAL real continua
  pendente (ETAPA 11), mesma limitação já registrada desde a ETAPA 01.

## Decisões técnicas

_(preencher ao concluir a etapa)_

## Testes executados

_(preencher ao concluir a etapa)_

## Resultado dos testes

_(preencher ao concluir a etapa)_

## Riscos e pendências

_(preencher ao concluir a etapa)_

## Critérios de aceite

A ficha funcional exibe somente dados confiáveis e o perfil não recebe
acesso acadêmico por padrão.

## Próximo passo permitido

ETAPA 09, somente mediante autorização explícita do usuário.
