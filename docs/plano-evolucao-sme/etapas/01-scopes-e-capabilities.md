# ETAPA 01 — Scopes e Capabilities

## Status
DONE

## Objetivo

Centralizar autorização contextual (escola/turma/disciplina/vínculo/entidade,
não apenas `role`) antes de ampliar qualquer tela.

## Por que esta etapa existe

Hoje a autorização (`lib/require-session.ts`, `lib/roles.ts`) é baseada
apenas em `role`. A ETAPA 00 confirmou, no schema real, que `ServidorTurma`
não tem `escolaId` e não modela disciplina na chave de unicidade — ou seja, o
sistema não tem hoje como verificar com segurança que um professor só acessa
a escola/turma/disciplina a que está de fato atribuído. Ampliar telas antes de
resolver isso arrisca expor dados fora do escopo permitido.

## Pré-requisitos

ETAPA 00 concluída (`DONE`).

## Escopo desta etapa

- Representação de `NetworkScope`, `SchoolScope`, `ProfessorScope`,
  `StudentSelfScope`, `StaffSelfScope`.
- Helper(s) de capability/autorização reutilizáveis.
- `CapabilityGate` apenas como complemento de UI (a checagem real deve ser
  no servidor).
- Checagem equivalente no servidor/query/action, não só na UI.
- Compatibilidade com o RBAC atual (`Role` do Prisma, `lib/auth.ts`,
  `middleware.ts`).

## Fora de escopo

- Reescrever telas de perfil (isso é ETAPA 04–08).
- Qualquer migração de `ServidorTurma` que não seja estritamente necessária
  para representar `ProfessorScope` com segurança — se necessária, deve ser
  proposta como decisão técnica separada (seção 7.8 do master prompt) antes
  de ser executada.

## Arquivos/áreas previstos

- Novo módulo de scopes/capabilities (local exato a definir na investigação
  desta etapa — provável candidato: `lib/authz/` ou equivalente).
- `lib/require-session.ts`, `lib/roles.ts`, `middleware.ts` (avaliação de
  integração, não necessariamente reescrita).
- `prisma/schema.prisma` (somente se a investigação confirmar necessidade de
  migração para `ProfessorScope`, documentada antes de executar).

## Checklist
- [x] Investigar pontos de autorização atuais (`middleware.ts`,
      `lib/require-session.ts`, layouts de `/admin` e `/portal/*`).
- [x] Definir representação de cada scope.
- [x] Implementar helper(s) de capability reutilizáveis.
- [x] Implementar `CapabilityGate` de UI.
- [x] Garantir checagem equivalente no servidor/query/action (aplicado aos
      dois pontos de maior risco: aluno detalhado em Direção e Professor).
- [x] Avaliar necessidade de migração em `ServidorTurma` para `ProfessorScope`
      seguro — avaliado e **adiado deliberadamente** para a ETAPA 06 (ver
      Decisões técnicas).
- [x] Adicionar testes para os cenários críticos (professor sem turma,
      diretor preso à escola, servidor geral sem dados acadêmicos, etc.).

## Alterações realizadas

Novo módulo `lib/authz/` (autorização contextual central, sem I/O — mesmo
princípio de "regra de negócio é função pura" já usado em `lib/analytics/`):

- [`lib/authz/scope.ts`](../../../lib/authz/scope.ts) (novo): tipo `Scope`
  (união discriminada dos 5 scopes conceituais do master prompt —
  `network`, `school`, `professor`, `student-self`, `staff-self`) e
  `scopeFromSession(session, options?)`, que constrói o `Scope` a partir da
  sessão já decodificada (`SessionPayload`). Lança `ScopeError` quando o
  papel exige um vínculo que a sessão não tem (ex.: DIRETOR sem
  `escolaId`) — tratado como conta incompleta, não como tentativa de
  acesso indevido. Não faz consulta ao banco: para `PROFESSOR`, quem chama
  passa as turmas (`options.professorTurmas`) já carregadas via
  `getServidorBySession` — evita uma segunda consulta Prisma redundante nas
  páginas que já buscam o servidor.
- [`lib/authz/authorize.ts`](../../../lib/authz/authorize.ts) (novo):
  predicados puros `canViewEscola`, `canViewTurma`, `canViewEstudante`,
  `canViewServidor` — cada um recebe um `Scope` e os campos mínimos da
  entidade, sem depender de Prisma. É a fonte central de "este scope pode
  ver esta entidade?", pensada para ser chamada tanto em Server
  Components/Actions quanto (via resultado já calculado) por
  `CapabilityGate` na UI.
- [`lib/authz/capabilities.ts`](../../../lib/authz/capabilities.ts) (novo):
  tipo `Capability` e `hasCapability(role, capability)`. O mapa
  `CAPABILITIES_BY_ROLE` documenta a distinção real já existente no código
  entre `ADMIN` e `SECRETARIA` (`usuarios:manage` é hoje a única capability
  ADMIN-only — confirmado por grep em todos os `requireSession([...])` de
  `app/admin/**/actions.ts`; as demais ações administrativas já aceitam os
  dois papéis). Não inventa capabilities sem lastro no código atual.
- [`components/ui/capability-gate.tsx`](../../../components/ui/capability-gate.tsx)
  (novo): componente apresentacional `<CapabilityGate allowed fallback>` —
  não faz checagem própria, só esconde/substitui UI conforme um `boolean`
  já resolvido no servidor. Ainda não está aplicado a nenhuma tela (a
  aplicação visual Admin×Secretaria é explicitamente escopo da ETAPA 04);
  fica pronto para a ETAPA 04 consumir.
- [`lib/authz/scope.test.ts`](../../../lib/authz/scope.test.ts),
  [`lib/authz/authorize.test.ts`](../../../lib/authz/authorize.test.ts),
  [`lib/authz/capabilities.test.ts`](../../../lib/authz/capabilities.test.ts)
  (novos): 33 testes cobrindo todos os ramos de cada scope/predicado,
  incluindo os cenários críticos listados na seção 12 do master prompt
  (professor sem turma, professor em turma de outra escola com mesmo
  código, diretor preso à escola, Servidor Geral sem dados acadêmicos).

Refatoração de 2 páginas para consumir o novo módulo em vez de checagem
inline duplicada (comportamento preservado, mesma condição, agora
centralizada e testável):

- [`app/portal/direcao/alunos/[id]/page.tsx`](../../../app/portal/direcao/alunos/%5Bid%5D/page.tsx):
  troca `dados.estudante.escolaId !== session.escolaId` por
  `!canViewEstudante(scope, dados.estudante)`.
- [`app/portal/professor/turma/[id]/page.tsx`](../../../app/portal/professor/turma/%5Bid%5D/page.tsx):
  troca a checagem manual de escola+turma (`nomesTurma.includes(...)`) por
  `!canViewEstudante(scope, dados.estudante)`.

Nenhuma outra tela foi alterada nesta etapa (ex.: `app/portal/direcao/turmas/[turma]/page.tsx`
já delega o filtro de escola para `getTurmaDetalhe(session.escolaId!, ...)`
na query — mudar isso é reduzir duplicação sem corrigir um risco de
segurança novo, então foi deixado para a ETAPA 03, que trata especificamente
de componentes/queries acadêmicos compartilhados).

## Decisões técnicas

1. **`ServidorTurma` não foi migrado nesta etapa.** A ETAPA 00 já havia
   confirmado que `ServidorTurma` não tem `escolaId` e não modela disciplina
   na chave de unicidade. `ProfessorScope` foi implementado do jeito que o
   schema atual permite (escola vem de `Servidor.escolaId`, turmas vêm de
   `ServidorTurma.turma`) — isso já resolve o caso relatado no master prompt
   de "professor não abre aluno de turma não autorizada via URL direta"
   *dentro da própria escola do professor*. O caso que a estrutura atual
   ainda não resolve com 100% de segurança é um professor que, por
   coincidência, tem uma `ServidorTurma.turma` com o mesmo código de uma
   turma de **outra escola que ele não deveria ver** — isso só é possível
   hoje porque `canViewTurma`/`canViewEstudante` também exigem
   `scope.escolaId === estudante.escolaId` (a escola do **professor**, não
   da turma digitada), então esse caso já está coberto pelo predicado atual
   (testado em `authorize.test.ts`, caso "professor não vê turma de mesmo
   código em outra escola"). A migração de schema (adicionar `escolaId` a
   `ServidorTurma`, rever a chave de unicidade para comportar mais de uma
   disciplina por turma) continua sendo necessária para o cenário mais
   específico de **múltiplas disciplinas na mesma turma** (ETAPA 06,
   Professor P0, item 4) — não é um requisito da ETAPA 01, que pôde ser
   cumprida sem tocar no schema.
2. **`getScope`/busca no banco não foi criada nesta etapa.** Todas as
   páginas que hoje precisam de `Scope` para `PROFESSOR` já buscam o
   `Servidor` (com `turmas`) via `getServidorBySession` antes de decidir o
   que renderizar. Por isso `scopeFromSession` é uma função pura que recebe
   as turmas como parâmetro, em vez de fazer sua própria consulta Prisma —
   evita duplicar a mesma query e mantém o módulo 100% testável sem banco,
   seguindo o princípio já estabelecido em `docs/PLANO_DESENVOLVIMENTO.md`
   (regras de negócio são funções puras). Se uma futura etapa precisar de
   `Scope` num ponto que ainda não tem o `Servidor` carregado, um wrapper
   assíncrono fino (`lib/authz/get-scope.ts`, com `import "server-only"`)
   pode ser adicionado sem alterar a API pura existente.
3. **`CapabilityGate` foi criado mas não aplicado a nenhuma tela.** O
   master prompt já reserva "capability visual Admin x Secretaria" para a
   ETAPA 04. Aplicar o componente amplamente em `/admin/usuarios` agora
   seria antecipar escopo de outra etapa; ele foi criado, testado por
   `typecheck`, e documentado para a ETAPA 04 consumir diretamente.
4. **`middleware.ts` não foi alterado.** Ele já faz uma primeira camada de
   defesa por prefixo de rota e papel (`ROLE_ALLOWED_PREFIXES`), que
   continua válida e compatível — o novo módulo de scope atua depois disso,
   dentro da rota já autorizada por papel, decidindo *qual entidade* pode
   ser vista. Isso é exatamente a "segunda camada de defesa" que
   `lib/require-session.ts` já documentava como seu próprio papel.

## Testes executados

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Resultado dos testes

- `npm test`: **140 testes, 28 suítes, 140 passaram, 0 falharam** (107
  pré-existentes + 33 novos em `lib/authz/{scope,authorize,capabilities}.test.ts`).
- `npm run typecheck`: sem erros.
- `npm run lint`: sem warnings/erros.
- `npm run build`: sucesso, as mesmas 46 rotas do baseline da ETAPA 00
  continuam gerando (nenhuma rota nova, nenhuma rota quebrada).

Validação end-to-end via browser (login real com DIRETOR/PROFESSOR e
navegação até uma URL de aluno fora do escopo) **não foi executada nesta
etapa** — exigiria credenciais de contas reais de cada papel, que não
estavam disponíveis nesta sessão. A cobertura desta etapa é por teste
unitário puro (`lib/authz/*.test.ts`, cobrindo os predicados que agora
controlam essas duas páginas) e por leitura direta do código alterado. Isso
fica registrado como pendência para a ETAPA 11 (smoke test das rotas
principais).

## Riscos e pendências

1. **Validação end-to-end logada não foi feita** (ver acima) — recomenda-se
   confirmar em ambiente com login real, antes ou durante a ETAPA 11, que
   um usuário DIRETOR/PROFESSOR de fato recebe 404 ao tentar abrir
   `/portal/direcao/alunos/[id]` ou `/portal/professor/turma/[id]` de fora
   do escopo.
2. **`ServidorTurma` sem `escolaId`/disciplina na identidade continua sem
   migração** — decisão explícita de adiar para a ETAPA 06 (ver Decisões
   técnicas item 1). O `ProfessorScope` atual já é seguro para o cenário
   testado (turma de outra escola com mesmo código), mas não resolve
   múltiplas disciplinas por turma.
3. **`CapabilityGate` sem uso real ainda** — existe e está testado por
   typecheck, mas só passa a valer alguma coisa quando a ETAPA 04 o aplicar
   em `/admin/usuarios` e demais telas administrativas.
4. **`app/portal/direcao/turmas/[turma]/page.tsx` e outras rotas de listagem
   não foram tocadas** — elas já filtram por `escolaId` na query (não são um
   risco de escopo novo), mas não usam ainda o módulo `lib/authz`; a
   consolidação delas é natural na ETAPA 03 (componentes acadêmicos
   compartilhados), não nesta etapa.

## Critérios de aceite

A autorização contextual passa a ter uma fonte central reutilizável e há
testes para os cenários críticos.

## Próximo passo permitido

ETAPA 02, somente mediante autorização explícita do usuário.
