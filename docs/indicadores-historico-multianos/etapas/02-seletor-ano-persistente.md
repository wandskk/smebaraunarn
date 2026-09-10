# ETAPA 02 — Seletor de ano persistente (URL + cookie via Server Action)

## Status
DONE

## Objetivo

Construir a infraestrutura reutilizável de seleção de ano(s) letivo(s) —
tipo, resolução com prioridade, Server Action de persistência e componente
de UI — cobrindo os 3 modos pedidos pelo usuário: um único ano, múltiplos
anos específicos, ou "todos os anos". Ainda sem aplicar em nenhuma página de
indicador (isso começa na ETAPA 05).

## Escopo desta etapa

1. `SelecaoAnosLetivos` (tipo) e `resolverSelecaoAnosLetivos` em
   `lib/queries/anos-letivos.ts`.
2. `salvarSelecaoAnosLetivosAction` (Server Action) em
   `lib/actions/anos-letivos.ts`.
3. `AnosLetivosFiltro` (client component) em
   `components/ui/anos-letivos-filtro.tsx`.
4. Teste unitário da lógica de prioridade.
5. Revisão adversarial (3 dimensões) + verificação manual no browser antes de
   fechar a etapa, dado que introduz um componente de UI e uma Server Action
   novos que nenhum teste automatizado cobre de ponta a ponta.

## Fora de escopo

- Aplicar o seletor em qualquer página real (ETAPA 05+).
- Gráfico de evolução histórica (ETAPA 03+).

## Decisões técnicas

- **Persistência**: URL search params (`?anos=`) como fonte de verdade
  imediata + cookie `sme_anos_letivos` (mesmas opções de `lib/auth.ts`:
  `httpOnly, secure, sameSite=lax, path=/`) como fallback, gravado por uma
  Server Action — cookies só podem ser escritos em Server Action/Route
  Handler no App Router, nunca durante o render de um Server Component em
  GET. `?ano=` singular (legado) continua sendo lido indefinidamente, sem
  custo de manutenção relevante.
- **Prioridade de resolução** (`resolverSelecaoAnosLetivos`): `?anos=`
  (repetido, ou sentinela `todos`) → `?ano=` legado → cookie → default (ano
  mais recente). Qualquer ano fora de `anosDisponiveis` é descartado antes de
  cair pro próximo critério.
- **Sem store client global** (Zustand/Context) — mantém o padrão 100%
  Server Component do projeto; o componente client é só a superfície de
  interação sobre o `<form>` que aciona a Server Action.
- **Componente compartilhado agora justificado**: um `AcademicContextBar`
  genérico foi conscientemente adiado em
  `docs/plano-evolucao-sme/etapas/02` e `03` por só haver 1 caso de uso real
  na época ("não crie um componente só porque o nome aparece"). Este
  roadmap tem 7+ usos reais simultâneos (Central, Aprendizagem, Frequência,
  Comparativos, Fluxo-Trajetória, Avaliações do Município, Portal da
  Direção) — cruza o limite que a própria régua do projeto usa para
  justificar a construção.

## Revisão adversarial (antes de fechar a etapa)

3 agentes independentes revisaram o diff (segurança/corretude da Server
Action, corretude do componente client, semântica de integração ponta a
ponta), seguidos de verificação adversarial de cada achado. Resultado:
**6 achados reais confirmados** (2 descartados como falso-positivo), todos
corrigidos nesta etapa antes do commit:

1. **Open-redirect** (moderado) — `pathname` vinha de um hidden input de
   Client Component sem validação nenhuma e ia direto pro `redirect()`; um
   valor como `//evil.example.com` produziria um redirect pra fora da
   origem. Corrigido com `caminhoSeguro()` em
   `lib/actions/anos-letivos.ts`, exigindo `startsWith("/")` e recusando
   `//`. **Testado ao vivo no browser**: adulterei o hidden input via JS pra
   `//evil.example.com` e confirmei que o redirect caiu em `/` (mesma
   origem), não no host externo.
2. **Checkboxes não refletiam visualmente "Todos os anos"** (moderado) —
   marcar "Todos os anos" não atualizava o `Set` de anos individualmente
   selecionados; os checkboxes desabilitados continuavam mostrando só a
   seleção parcial anterior. Corrigido: `checked={todos ||
   selecionados.has(ano)}`.
3. **Estado local "preso" após o redirect pra mesma rota** (moderado, o mais
   sério) — como a Server Action redireciona pra mesma página (só muda a
   query string), o React reconcilia `AnosLetivosFiltro` como a MESMA
   instância em vez de remontar, então os `useState` iniciais não rodam de
   novo — o `Set` de anos selecionados ficava desatualizado em relação à
   nova seleção resolvida pelo servidor. Corrigido com um `useEffect`
   resincronizando `todos`/`selecionados` sempre que `selecaoAtual`/
   `anosDisponiveis` mudam. **Testado ao vivo**: marquei "Todos os anos",
   apliquei, reabri o popover, desmarquei "Todos os anos" — os 3 anos
   apareceram corretamente marcados (não só o ano da seleção original antes
   do fix).
4. **`return null` com exatamente 1 ano disponível** (moderado) — descartava
   também o rótulo "Ano letivo X", que as páginas hoje sempre mostram em
   texto simples independente de terem seletor. Corrigido: só retorna `null`
   com 0 anos; com 1 ano, mostra um rótulo não-interativo.
5. **Acessibilidade do popover** (menor) — `aria-haspopup="dialog"` sem
   `role="dialog"`/`aria-label` correspondente no conteúdo, e foco nunca
   entrava no popover ao abrir. Corrigido: `role="dialog"`, `aria-label`,
   `aria-controls`, e foco no primeiro campo ao abrir.
6. **Sem guarda de estado pendente no botão Aplicar** (menor) — um duplo
   clique rápido poderia disparar a Server Action duas vezes (impacto baixo,
   dado idempotente). Corrigido com `useFormStatus` num subcomponente
   `BotaoAplicar`, desabilitando durante o envio.

**Achado adicional (menor, também corrigido)**: o redirect reconstruía a URL
só com `anos=`, descartando qualquer outro parâmetro que a página já
tivesse (disciplina/unidade em Aprendizagem, sinal em Comparativos) — o
filtro de ano resetaria filtros que não são da sua responsabilidade. Corrigido
com uma prop opcional `preservarQueryParams`, propagada via hidden inputs
`extra_*` e remontada pela Server Action antes de anexar `anos`.

**Achados descartados (falso-positivo, confirmado por verificação
independente):** o round-trip de seleção de 1 único ano específico (`?anos=2025`
como string única, não array) já era tratado corretamente por `paraArray`;
`anoReferencia`/`anosParaEvolucao` já eram sãos para o modo "todos" com
exatamente 1 ano disponível (caminho inatingível pela UI de qualquer forma,
já que o componente não oferece seletor com 0-1 anos).

## Verificação manual no browser (após os fixes)

Criei uma página de teste temporária fora de `/admin`/`/portal` (sem
exigir login), removida ao final da etapa, e testei ao vivo com o dev
server:

- Seleção única → "Todos os anos" → Aplicar: URL vira `?anos=todos`, cookie
  grava `{"modo":"todos","anos":[]}`, os 3 checkboxes aparecem marcados.
- Reabrir e desmarcar "Todos os anos": os 3 anos aparecem corretamente
  marcados individualmente (prova do fix do achado 3).
- Selecionar 2024+2025 (não "todos") → Aplicar: `selecao =
  {modo:"multiplos", anos:[2024,2025]}`, `anoReferencia = 2025`,
  `anosParaEvolucao = [2024,2025]` — todos corretos.
- Navegar para a mesma página **sem nenhuma query string** (simulando
  navegação pela sidebar): seleção anterior (`todos`) restaurada
  corretamente a partir só do cookie — a persistência que esta etapa existe
  para entregar funciona.
- Adulterar o hidden `pathname` para `//evil.example.com` e enviar: redirect
  caiu em `/`, confirmando o guard contra open-redirect.
- `document.cookie` no browser retorna vazio para `sme_anos_letivos` —
  confirma `httpOnly` funcionando (JS do cliente não pode ler).

## Testes executados

```bash
npm test        # 277/277 (14 novos: resolverSelecaoAnosLetivos, anoReferencia, anosParaEvolucao)
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 63 rotas (página de teste temporária já removida)
```

## Critério de pronto

- [x] `resolverSelecaoAnosLetivos` cobrindo os 4 níveis de prioridade + casos
      de borda (ano inválido, cookie corrompido, `anosDisponiveis` vazio).
- [x] Server Action gravando cookie no mesmo padrão de `lib/auth.ts`.
- [x] Componente `AnosLetivosFiltro` funcional, acessível, sem estado
      desatualizado após redirect.
- [x] Revisão adversarial executada; 6 achados reais corrigidos, 2
      descartados verificados independentemente.
- [x] Verificação manual no browser (não só leitura de código) para os
      pontos que nenhum teste automatizado cobre.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.

## Próximo passo permitido

ETAPA 03 — aguardando autorização explícita do usuário.
