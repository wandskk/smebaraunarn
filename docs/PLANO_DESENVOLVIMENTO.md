# Plano de Desenvolvimento — Centro de Inteligência e Indicadores Educacionais

**Status:** documento vivo — atualizado a cada etapa concluída.
**Última atualização:** 2026-08-18.
**Origem:** consolida `centro_indicadores_educacionais.md` (visão/escopo funcional) e `implementation_plan.md`
(diagnóstico técnico e cronograma de 60 dias) em um roteiro de etapas pequenas, validáveis e
independentes. Este arquivo é a referência de trabalho — os dois documentos originais continuam
valendo como visão de produto, mas a ordem e o tamanho das entregas aqui podem divergir do
cronograma dia-a-dia original sempre que isso reduzir risco ou permitir validar mais cedo.

---

## 1. Princípios que guiam toda etapa

1. **Sem dependência de framework.** O projeto já roda sem bibliotecas de UI/estado pesadas e sem
   ORM além do Prisma. Toda nova peça (motor de indicadores, testes, cron) deve poder ser trocada
   de tecnologia sem reescrever o resto. Testes usam `node:test` + `node:assert` (nativos do
   Node.js) através do `tsx` — que já é devDependency do projeto — em vez de Jest/Vitest.
2. **Regras de negócio são funções puras.** Tudo que calcula um indicador (frequência, distorção,
   faixas, desempenho) vive em `lib/analytics/*.ts`, sem `import` de Prisma, sem I/O. Isso permite
   testar 100% da lógica sem banco de dados e trocar a fonte de dados no futuro sem tocar na
   fórmula.
3. **Explicabilidade sempre.** Todo indicador exibido precisa poder responder: de onde veio, quando
   foi atualizado, qual fórmula, qual filtro está ativo. Isso é código (`lib/analytics/explicabilidade.ts`),
   não só documentação.
4. **Etapas pequenas, validadas antes de avançar.** Cada etapa abaixo é: (a) implementável em uma
   sessão, (b) testável isoladamente, (c) commitável e enviável para `main` sem depender da etapa
   seguinte já existir. `main` tem deploy automático na Vercel — então "subir" uma etapa é uma ação
   com efeito real em produção, e cada etapa só sobe depois de `typecheck` + `lint` + testes
   passarem localmente.
5. **Não substituir o SIGEduc.** Toda integração é somente leitura. O banco local é uma camada
   analítica sobre os dados sincronizados, nunca a fonte de verdade cadastral.

---

## 2. Diagnóstico verificado do repositório (2026-08-18)

Confirmado lendo o código, não apenas o plano anexado:

| Item | Estado |
|---|---|
| Sincronização SIGEduc (`lib/sigeduc.ts`, `lib/sync/sigeduc-sync.ts`) | Existe e funciona: escolas, cargos, servidores, estudantes, notas, frequência, em lotes/páginas. |
| Cron automático via Vercel (`vercel.json`) | Já existe: 5 crons diários (`/api/cron/sync-*`) autenticados por `CRON_SECRET`. |
| RBAC (`lib/roles.ts`, `lib/auth.ts`, `middleware.ts`) | Existe: papéis ADMIN/SECRETARIA/DIRETOR/PROFESSOR/SERVIDOR_GERAL/ALUNO, portais segmentados. |
| Avaliações municipais | Schema básico existe (`Avaliacao`, `AvaliacaoQuestao`, `AvaliacaoResultadoAluno`, enum `TipoAvaliacao` com `FLUENCIA_LEITORA`, `SPADEB`, `SIMULADO`, `PROVA_MUNICIPAL`) e uma tela CRUD em `app/admin/avaliacoes/`. Não há ainda item-a-item por descritor/habilidade BNCC nem heatmap. |
| `lib/analytics/` | **Não existe.** Confirma a lacuna apontada no plano — é o ponto de partida real. |
| `/admin/indicadores` | Hoje é só um formulário para editar 4 números estáticos da landing page (`IndicadoresLanding`: totalEscolas, totalAlunos, totalDocumentos, totalAcessos). Não é ainda o centro analítico — vai ser expandido, não substituído (a landing page pública continua precisando desses 4 números). |
| Alertas, Intervenções, Metas, Auditoria LGPD | Não existem no schema. Confirma a lacuna. |
| Testes automatizados | **Não existiam antes desta etapa.** Não havia Jest/Vitest nem `node:test` configurado. |
| Banco de dados | Postgres remoto (Neon/Vercel Postgres pelo formato de `DATABASE_URL`/`DATABASE_URL_UNPOOLED`). Não há `.env` neste ambiente de desenvolvimento — logo, **este ambiente não tem acesso ao banco real** (nem de produção, nem de um banco de dev separado). |

### 2.1 Restrição operacional importante

O agente que está executando este plano **não tem credenciais de banco de dados** neste ambiente
(`.env` não existe localmente). Isso significa:

- Consigo escrever, testar e validar (`typecheck`, `lint`, `node:test`) qualquer código que não
  precise de uma conexão real com o Postgres.
- **Não consigo rodar `prisma migrate dev`/`deploy` contra o banco real**, nem testar queries Prisma
  contra dados de verdade, nem abrir `npm run dev` e navegar as telas logadas (login depende de
  usuários que só existem no banco de produção).
- Por isso, o roteiro abaixo separa explicitamente **etapas sem alteração de schema** (posso
  entregar sozinho, ponta a ponta, com testes) de **etapas com alteração de schema** (preciso que
  você rode a migração no seu ambiente com acesso ao banco, ou me informe como aplicá-la com
  segurança — nunca vou tocar no schema de produção sem confirmação explícita, por ser uma ação
  difícil de reverter).

---

## 3. Estratégia de testes

- Runner: `node:test` (nativo do Node ≥ 18) executado via `tsx` (já é devDependency — zero pacotes
  novos).
- Convenção: arquivo `*.test.ts` ao lado do módulo que testa (ex.: `lib/analytics/frequencia.ts` →
  `lib/analytics/frequencia.test.ts`).
- Comando: `npm test` (ver `package.json`) roda todos os `*.test.ts` do projeto.
- Cobertura esperada: **100% das funções puras de `lib/analytics/`** (é onde mora a regra de
  negócio que a Secretaria vai confiar). Código de UI e queries com I/O são validados por
  `typecheck` + revisão manual/homologação, já que exigem banco.

---

## 4. Roteiro de etapas — Fase 1 (MVP do Centro de Indicadores)

Cada etapa lista: o que entrega, se precisa de schema novo, e o critério de "pronto".

| # | Etapa | Schema novo? | Critério de pronto |
|---|---|---|---|
| E0 | Este documento + infraestrutura de testes (`npm test`) | Não | `npm test` roda e passa (mesmo que com 0 ou 1 teste de exemplo) |
| E1 | `lib/analytics/frequencia.ts` — variação temporal, faltas consecutivas (3/5/10), faixas configuráveis | Não | Funções puras, testes cobrindo casos de borda (sem faltas, faltas não consecutivas, faixas customizadas) |
| E2 | `lib/analytics/distorcao.ts` — distorção idade-série documentada e versionada | Não | Regra de idade esperada por série documentada no código; testes com casos de fronteira (idade exata, 1 ano acima, 2+ anos acima) |
| E3 | `lib/analytics/explicabilidade.ts` — metadados padrão (fonte, fórmula, periodicidade, data de atualização) para qualquer indicador | Não | Tipo `FichaIndicador` reutilizável + testes |
| E4 | `lib/queries/indicadores-gerais.ts` — agregações de rede usando `Estudante`, `Escola`, `NotaEstudante`, `FrequenciaEstudante` já existentes | Não (usa schema atual) | Typecheck limpo; lógica de agregação isolada e revisável; validação real de dados fica para homologação com banco |
| E5 | Expandir `/admin/indicadores` em painel executivo (KPIs de topo + bloco "Atenção Agora") | Não | Consome E1–E4; tela renderiza com dados mockados/testáveis antes de ligar ao banco real |
| E6 | `/admin/indicadores/frequencia/` — matriz Escola → Série → Turma → Estudante | Não | Consome E1 + E4 |
| E7 | `/admin/indicadores/aprendizagem/` — distribuição, mediana, percentis (não só média) | Não | Nova função pura de estatística com testes |
| E8 | `/admin/indicadores/fluxo-trajetoria/` — distorção idade-série por rede/escola/série | Não | Consome E2 |
| E9 | `/admin/indicadores/qualidade/` — painel usando `LogSincronizacao` (já existe) | Não | Sem novo modelo; só nova leitura |
| E10 | `/admin/indicadores/comparativos/` — escola × rede, período × período | Não | Consome E4 |

**Todas as etapas E1–E10 usam o schema atual.** Isso foi confirmado revisando `prisma/schema.prisma`:
`Estudante.dataNascimento`, `Estudante.ano`, `Estudante.turmaSerie`, `NotaEstudante` e
`FrequenciaEstudante` já carregam o necessário para todo o MVP de indicadores. Migração de schema só
entra a partir da Fase 2.

## 5. Roteiro de etapas — Fase 2 (exige decisão + migração de schema)

Estas etapas dependem de novos modelos Prisma (`AlertaAnalitico`, `IntervencaoPedagogica`,
`MetaEducacional`, `LogAuditoriaLGPD`, extensão de `AvaliacaoQuestao` com descritor BNCC). Antes de
iniciar qualquer uma delas:

1. Vou propor o diff do `schema.prisma` e a migração correspondente.
2. Preciso que você rode `npx prisma migrate dev` no seu ambiente (com acesso ao `DATABASE_URL`) ou
   confirme explicitamente que eu posso fazer isso — é uma alteração em infraestrutura
   compartilhada, então segue como ação que pede confirmação, não como etapa automática.
3. Só depois disso a etapa é implementada e enviada.

| # | Etapa | Depende de |
|---|---|---|
| F1 | Motor de alertas (`lib/analytics/alertas-engine.ts`) + modelo `AlertaAnalitico` | Migração |
| F2 | `/admin/indicadores/alertas/` | F1 |
| F3 | Avaliações diagnósticas por item/descritor BNCC + heatmap de habilidades | Migração |
| F4 | `/admin/estudantes/` — lista de acompanhamento (linguagem não estigmatizante) | E4 |
| F5 | Registro de intervenções (`IntervencaoPedagogica`) + medição de impacto | Migração |
| F6 | Metas (`MetaEducacional`) | Migração |
| F7 | Log de auditoria LGPD (`LogAuditoriaLGPD`) para acesso a dados nominais | Migração |
| F8 | Relatórios executivos automáticos (PDF) | E1–E10 |

## 6. Fase 3 (futuro — não detalhada ainda)

Índices compostos validados, projeções, benchmarking, integração de novas fontes (SPAEDB, CAED,
SIMAIS — avaliações municipais externas). Só será detalhada quando a Fase 2 estiver homologada,
conforme o princípio de "não construir para hipóteses futuras" — mas o design de `lib/analytics/`
já é pensado para acomodar novas fontes de avaliação como um novo `lib/sync/avaliacao-<fonte>-sync.ts`
sem tocar no motor de cálculo.

---

## 7. Fluxo de trabalho por etapa

1. Implementar a etapa isoladamente.
2. Rodar `npm run typecheck`, `npm run lint`, `npm test`.
3. Reportar o que foi validado (e o que **não** pôde ser validado por falta de acesso ao banco).
4. Commitar com mensagem descrevendo a etapa.
5. Push para `main` → deploy automático na Vercel.
6. Marcar a etapa como concluída neste documento antes de iniciar a próxima.

## 8. Decisões pendentes com a Secretaria / equipe técnica

(Adaptado da seção 7 do `implementation_plan.md` original — ainda em aberto)

1. Confirmar fórmula oficial de distorção idade-série a adotar (INEP usa defasagem ≥ 2 anos;
   confirmar se o município segue o mesmo critério ou tem regra própria). A rede já mantém uma
   trilha própria de correção de fluxo ("Trajetória de Sucesso I/II"), que fica fora do cálculo por
   desenho — logo, o número de estudantes em distorção nas turmas regulares é um piso, não o total
   real da rede (quem já está na trilha não é recontado). Confirmar se isso é aceitável ou se a
   Secretaria quer um número combinado.
2. Definir faixas de frequência (adequada/atenção/crítica) — hoje não há uma faixa oficial
   registrada em nenhum lugar do sistema.
3. Confirmar quais avaliações municipais (SPAEDB, CAED, SIMAIS, Fluência Leitora) têm formato de
   dado definido para ingestão — cada uma provavelmente precisa de um parser próprio em
   `lib/sync/avaliacao-<fonte>-sync.ts`.
4. Definir quem terá acesso a `DATABASE_URL` de produção para aplicar migrações das etapas de Fase 2.
5. Confirmar perfis de acesso a listas nominais de estudantes (LGPD) antes de implementar F4/F7.
6. **Risco técnico confirmado em produção (2026-08-18):** `getSeriePorTurma`
   (`lib/queries/academico.ts`) resolve a série de uma turma pelo código sozinho, sem escopar por
   escola — porque `NotaEstudante` e `ServidorTurma` não têm uma coluna `escolaId`. Verificamos que
   **34 códigos de turma são reutilizados por mais de uma escola** na rede atual. Para todos os
   casos com dado de nota, a série textual resolvida foi idêntica entre as escolas colidentes (a
   convenção de nomenclatura da rede é consistente hoje), então não há erro ativo — mas é uma
   dependência frágil: se a convenção divergir no futuro, o indicador de distorção pode
   silenciosamente usar a série errada para uma turma. Correção adequada exigiria join por escola
   (ex.: gravar `escolaId` em `NotaEstudante`/`ServidorTurma` na sincronização) — fica como
   candidato para o painel de qualidade de dados (E9) ou Fase 2, não é uma correção pontual segura
   de se fazer sem testar contra o schema real.

## 8.2 Decisões de arquitetura já tomadas nesta etapa

- Funções puras de `lib/analytics/` que podem falhar por dado de entrada malformado (datas
  corrompidas, por exemplo) **retornam `null`, nunca lançam exceção** — um dado ruim vindo da fonte
  é um caso esperado a ser tratado pelo chamador, não um erro de programação. Ver
  `calcularIdadeEmAnos`/`calcularDistorcaoIdadeSerie` em `lib/analytics/distorcao.ts`.

---

## 9. Registro de progresso

- [x] E0 — Documento-base criado + infraestrutura de testes (`npm test`).
- [x] E1 — `lib/analytics/frequencia.ts` (19 testes).
- [x] E2 — `lib/analytics/distorcao.ts` (13 testes, regra INEP versionada — ver §8.1).
- [x] E3 — `lib/analytics/explicabilidade.ts` (11 testes; inclui dicionário inicial de indicadores).
- [x] E4 — `lib/queries/indicadores-gerais.ts`, validado contra o banco real de produção (conexão
      liberada pelo usuário em 2026-08-18): 3.924 estudantes, 28 escolas ativas, 135 turmas, 83,4%
      de frequência média, nota média 6,99, 158 estudantes em distorção idade-série (piso — ver §8,
      item 1), 1.775 fora do escopo do cálculo de distorção (Educação Infantil/EJA/Especial/
      Multianual/Trajetória de Sucesso, confere com a contagem manual dos dados reais). Revisão
      adversarial (8 vertentes) encontrou e já corrigiu: query redundante de frequência, execução
      serializada desnecessária, fórmula de percentual duplicada em `academico.ts`, e trocou o
      contrato de exceção por retorno `null` no motor de distorção (ver §8.2). Achado documentado
      sem correção imediata: colisão de código de turma entre escolas (§8, item 6).
- [x] E5 — `/admin/indicadores` expandido em painel executivo (KPI cards com tooltip de
      explicabilidade, tons de alerta por faixa, seletor de ano letivo). O editor dos números da
      landing page pública foi movido para `/admin/indicadores/portal-publico` (continua existindo,
      é um dado diferente). Testado de ponta a ponta no navegador, logado como admin, contra o
      banco de produção real — números batem com a validação da Etapa 4. Bloco "Atenção agora" do
      documento de visão foi propositalmente adiado: depende de comparação histórica por
      escola/turma, que ainda não existe (ver E6+).
- [ ] E6 em diante — frequência por escola/turma/estudante, aprendizagem, fluxo-trajetória,
      qualidade dos dados, comparativos (ver §4).
