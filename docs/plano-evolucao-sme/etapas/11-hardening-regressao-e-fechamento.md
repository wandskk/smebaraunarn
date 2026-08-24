# ETAPA 11 — Hardening, regressão e fechamento

## Status
DONE

## Objetivo

Fechar a rodada de evolução sem dívida técnica oculta.

## Por que esta etapa existe

Depois de 11 etapas de mudança incremental, é necessário uma varredura final
de autorização, PII, qualidade (lint/typecheck/testes/build) e estados de
UI antes de considerar a rodada encerrada — e registrar explicitamente o que
fica para depois (P2).

## Pré-requisitos

ETAPAS 00 a 10 concluídas (`DONE`).

## Escopo desta etapa

- Revisão de autorização por URL direta em todas as rotas sensíveis.
- Revisão de exposição de PII (CPF, dados pessoais).
- Lint.
- Typecheck.
- Testes unitários.
- Testes de integração disponíveis.
- Build de produção.
- Smoke test das rotas principais (se houver ferramenta de navegador
  disponível no ambiente).
- Verificar estados vazio/loading/error.
- Verificar mobile nos componentes alterados.
- Verificar acessibilidade básica.
- Revisar documentação (`docs/plano-evolucao-sme/**`,
  `docs/PLANO_DESENVOLVIMENTO.md`).
- Consolidar decisões em `decisoes/`.
- Atualizar `PROGRESSO.md` para o estado final.
- Gerar lista separada de P2/futuro, sem implementá-la automaticamente.

### P2 conhecido para backlog (do master prompt, não implementar aqui)

- `AlertaAnalitico` persistente, somente após validar regras dinâmicas.
- `IntervencaoPedagogica`.
- `MetaEducacional`.
- `LogAuditoriaLGPD`.
- Descritor/habilidade BNCC estruturado.
- `lastLoginAt`/trilha de segurança.
- Histórico/coortes avançadas.
- Regras municipais configuráveis após validação oficial.

## Fora de escopo

Implementar qualquer item do backlog P2 listado acima.

## Arquivos/áreas previstos

Todo o repositório (varredura), sem escopo de arquivo único previsto.

## Checklist
- [x] Autorização por URL direta revisada em todas as rotas sensíveis.
- [x] PII revisada (CPF, dados pessoais).
- [x] `npm run lint` limpo.
- [x] `npm run typecheck` limpo.
- [x] `npm test` passando.
- [x] `npm run build` com sucesso.
- [x] Smoke test das rotas principais.
- [x] Estados vazio/loading/error verificados.
- [x] Mobile verificado nos componentes alterados.
- [x] Acessibilidade básica verificada.
- [x] `PROGRESSO.md` atualizado para o estado final.
- [x] Lista de P2/futuro gerada.

## Alterações realizadas

Esta etapa é uma varredura de fechamento, não uma etapa de feature — o
único código alterado foi a correção já commitada separadamente na ETAPA
10 (`getTurmasRede`, achada durante a validação logada). Aqui não há
alteração de código nova; o trabalho foi auditoria + documentação:

1. **Autorização por URL direta** — auditoria completa (agente dedicado)
   de todos os 51 `page.tsx` sob `app/admin/**`, `app/portal/**` e
   `app/conta/**`, toda rota dinâmica (`[id]`/`[turma]`) e os 8
   `actions.ts`. Complementada com testes manuais reais (login com as 5
   contas fornecidas pelo usuário): Diretor/Professor tentando abrir
   turma/estudante fora do escopo por URL direta → 404 ou dado vazio
   corretamente escopado; Servidor Geral tentando `/admin` e
   `/portal/direcao` → redirecionado de volta ao próprio portal.
2. **Revisão de PII** — grep dirigido por `.cpf` em `app/**`/`components/**`
   e por CPF/senha em `console.*`. Confirmado: CPF mascarado por padrão em
   toda listagem (`maskCpf`, ETAPA 04); revelado apenas em fichas de
   detalhe (`/admin/usuarios/[id]`, `/admin/servidores/[id]`, `/conta` —
   padrão já deliberado desde a ETAPA 04, não uma exceção nova); nenhum
   CPF/senha em log de runtime (o único `console.log` com CPF é
   `prisma/seed.ts`, script de setup local, nunca executado em produção,
   e não loga a senha). Nenhum CPF em query string.
3. **Qualidade** — `lint`/`typecheck`/`test`/`build` executados do zero
   (com `.next` limpo) após resolver um problema de ambiente (ver Riscos).
4. **Smoke test das rotas principais** — continuação da validação da
   ETAPA 10: mesmas 5 contas reais, agora cobrindo também estados de erro
   (login com senha errada → mensagem de erro correta) e mobile (375px)
   em `/admin/turmas`, `/admin/indicadores/qualidade` e na ficha de turma
   com a seção "Faltas consecutivas agora" (Professor).
5. **Mobile** — `DataTable` (já existente, `overflow-x-auto` desde antes
   desta rodada) rola horizontalmente dentro do próprio container em
   todas as telas novas testadas (`/admin/turmas`,
   `/admin/indicadores/qualidade`); `MetricCard`/formulários em grid
   empilham em coluna única; nenhuma quebra de layout de página
   encontrada nas telas das ETAPAS 09/10.
6. **Acessibilidade básica** — confirmado: `Badge` sempre comunica estado
   por texto, nunca só cor (já era regra do design system); botões
   ícone-apenas adicionados nesta rodada (editar/excluir questão) têm
   `aria-label`; única imagem (`next/image` em `/noticias/[slug]`) tem
   `alt`. Gap pré-existente identificado e **não corrigido** nesta etapa
   (ver Riscos): rótulos de filtro (`<label>`) em várias telas não têm
   `htmlFor`/`id` associando ao campo — padrão replicado em todo o
   admin/portal desde antes desta rodada, não uma regressão desta etapa.
7. **Documentação** — `docs/PLANO_DESENVOLVIMENTO.md` (o roteiro anterior,
   E0-E10, focado só em indicadores) ganhou uma nota de status apontando
   para `docs/plano-evolucao-sme/` como roteiro ativo e corrigindo a
   afirmação desatualizada de que o ambiente não tinha acesso ao banco.
   `docs/plano-evolucao-sme/**` já estava atualizado etapa a etapa.

## Decisões técnicas

1. **Não convertida a auditoria de autorização em uma lista de "correções
   pendentes"** porque não há nenhuma: a auditoria dedicada não encontrou
   gap real (todo dynamic route ou está em escopo de rede, ou checa
   `canView*`/`scopeFromSession`, ou escopa a própria query por
   `session.escolaId`/atribuições do professor). O único ponto
   observado — páginas `app/admin/**` não re-chamam `requireSession` por
   página (confiam só no layout), enquanto `app/portal/**` re-chama em
   toda página mesmo já protegida pelo layout — é uma inconsistência de
   estilo, não uma falha de segurança (o layout já bloqueia em ambos os
   casos); registrado como observação, não como correção obrigatória.
2. **CPF completo em fichas de detalhe administrativas mantido como
   está.** A regra 7.7 do master prompt fala em não mostrar CPF completo
   "em listas sem necessidade operacional" — fichas de detalhe
   (`/admin/usuarios/[id]`, `/admin/servidores/[id]`) já eram uma exceção
   deliberada desde a ETAPA 04 (revelação intencional, não lista). Não
   reaberto nesta etapa por não ser um achado novo.
3. **Gap de `label`/`htmlFor` em filtros não corrigido.** É um padrão
   replicado de forma consistente em dezenas de formulários de filtro em
   todo o admin/portal, presente desde antes da ETAPA 09. Corrigir só nas
   telas tocadas pelas últimas 2 etapas criaria inconsistência visual e de
   acessibilidade entre telas idênticas; corrigir em todo o app é uma
   varredura maior que não estava no escopo combinado desta rodada.
   Registrado como P2 (ver Riscos e pendências / backlog).
4. **Ambiente de build/dev instável durante a etapa — causa raiz
   identificada e não é um bug de código.** Ver Riscos e pendências.

## Testes executados

- Agente dedicado de auditoria de autorização (leitura, sem alteração)
  cobrindo 100% dos `page.tsx`/`actions.ts` sob `app/admin`, `app/portal`,
  `app/conta`.
- `grep` dirigido por exposição de CPF/PII em `app/**`, `components/**`, e
  por CPF/senha em chamadas de `console.*` em todo o repositório.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — do
  zero, com `.next` e `node_modules/.cache` limpos.
- Smoke test manual logado (Browser pane) com as 5 contas reais: Admin
  (`/admin/sincronizacao` pós-fix de cache), estado de erro de login
  (senha errada), mobile (375px) em `/admin/turmas`,
  `/admin/indicadores/qualidade`, `/portal/professor/turmas/[turma]`.

## Resultado dos testes

- Auditoria de autorização: **nenhum gap real encontrado** (ver Decisões
  técnicas item 1).
- PII: nenhuma exposição indevida encontrada.
- `npm test`: **193/193**.
- `npm run typecheck`: limpo.
- `npm run lint`: limpo.
- `npm run build`: sucesso — **66 rotas**, mesma contagem da ETAPA 10 (não
  houve rota nova nesta etapa).
- Smoke test: todas as telas verificadas renderizaram corretamente, sem
  erro de console real (alguns 404 de console eram ruído de navegação
  anterior na mesma aba — confirmado via `read_network_requests` que a
  página em questão não tinha nenhuma requisição com erro).

## Riscos e pendências

- **Instabilidade de ambiente local durante a etapa, causa raiz
  identificada.** `npm run build` falhou duas vezes com `EPERM` ao tentar
  substituir o engine do Prisma — causado por processos `next dev`
  remanescentes (o `preview_stop` desta sessão não mata a árvore de
  processos no Windows de forma confiável) segurando o arquivo aberto.
  Depois de matar os processos manualmente e limpar `.next` +
  `node_modules/.cache`, o build passou a rodar limpo de forma
  consistente. Separadamente, o usuário reportou um erro de runtime em
  `/admin/sincronizacao` ("Cannot read properties of undefined (reading
  'call')") — sintoma clássico de cache de build corrompido em modo dev,
  coincidindo com um `rm -rf .next` executado enquanto um servidor de dev
  ainda estava de pé. Resolvido com o mesmo processo (matar processos,
  limpar cache, build de produção limpo confirmando 66 rotas, reabrir o
  servidor de dev e revalidar a tela visualmente sem erro). **Não é um
  bug de código** — não há nenhuma alteração de fonte associada a esse
  sintoma, e o build de produção limpo comprova isso.
- **`getSeriePorTurma` continua sem escopo por `escolaId`** (achado desde
  a auditoria original do projeto, antes da ETAPA 00) — mitigado, não
  eliminado: hoje a série resolvida é consistente entre os 76 códigos de
  turma reutilizados na rede (confirmado ao vivo em
  `/admin/indicadores/qualidade` durante a validação desta etapa — o
  número subiu de 34 para 76 desde o diagnóstico original, mas 0
  divergentes). Continua candidato a correção estrutural (gravar
  `escolaId` em `NotaEstudante`/`ServidorTurma` na sincronização), listada
  no backlog P2.
- **Gap de acessibilidade (label/htmlFor) não corrigido**, replicado em
  todo o admin/portal — ver Decisões técnicas item 3. Candidato a uma
  etapa própria de acessibilidade se a Secretaria priorizar.
- **Fluxos de escrita não exercitados na validação manual** (cadastro de
  avaliação, edição de resultado, sincronização de fato disparada,
  criação/edição de post/documento) — a validação desta e da etapa
  anterior foi deliberadamente somente leitura, para não alterar dado real
  de produção sem pedido explícito do usuário.

### Backlog final — P1 não selecionado (ETAPA 10) + P2 (master prompt)

Consolidado num único lugar para referência futura; nada aqui foi
implementado nesta rodada:

**P1 (ETAPA 10, blocos não escolhidos pelo usuário — prontos para uma nova
rodada a qualquer momento):**
- ~~Importação CSV/XLSX de questões/resultados de avaliações~~ — **concluído
  na ETAPA 10 rodada 2** (pedida pelo usuário após o fechamento desta
  ETAPA 11), incluindo a importação real de dois datasets externos (SPADEB
  2026 e Leitor Fluente Rápido). Ver
  [`etapas/10-p1-evolucao-funcional.md`](10-p1-evolucao-funcional.md).
- Comunicação e documentos: CMS (`/admin/posts` — preview, agendamento,
  galeria) e Documentos (`/admin/documentos` — edição, substituição,
  categorias, validade).
- Itens específicos por perfil: Direção (`/portal/direcao/servidores` com
  filtros+ficha funcional, `/portal/direcao/notas` com
  distribuição/evolução), Aluno (declaração de matrícula com seletor de
  ano).

**P2 (do master prompt, seção 9/ETAPA 11 — exige decisão de produto e/ou
migração de schema):**
- `AlertaAnalitico` persistente, só após validar regras dinâmicas.
- `IntervencaoPedagogica`.
- `MetaEducacional`.
- `LogAuditoriaLGPD` (acesso/alteração de dados nominais).
- Descritor/habilidade BNCC estruturado (hoje texto livre, já agrupável
  desde a ETAPA 09 — catálogo formal fica para quando houver fonte
  validada).
- `lastLoginAt`/trilha de segurança de contas.
- Histórico/coortes avançadas.
- Regras municipais configuráveis após validação oficial.
- Correção estrutural de `getSeriePorTurma` (escopo por `escolaId` via
  migração — ver Riscos acima).
- Padronização de acessibilidade (`label`/`htmlFor`) em todo o
  admin/portal — ver Riscos acima.

## Critérios de aceite

Repositório sem dívida oculta conhecida na rodada, documentação e
`PROGRESSO.md` refletindo o estado final, backlog P2 registrado sem
implementação.

## Próximo passo permitido

Nenhum — esta é a última etapa da rodada. Apresentar relatório final ao
usuário.
