# Guia dos Indicadores — Como cada etapa funciona, calcula e se testa

**Para quem é este documento:** quem vai testar manualmente o Centro de Indicadores (Secretaria,
QA, ou qualquer pessoa da equipe) e precisa saber, para cada tela: o que ela mostra, de onde vem
cada número, como o cálculo é feito, e como conferir que está certo.

Este documento explica **o resultado** de cada etapa da Fase 1 do MVP (E0-E10). O **histórico de
como cada etapa foi construída** — decisões, achados, commits — fica em
[`docs/PLANO_DESENVOLVIMENTO.md`](PLANO_DESENVOLVIMENTO.md), que é o documento vivo atualizado a
cada etapa concluída. Se algo aqui divergir do código, o código manda — este guia deve ser
atualizado junto.

---

## 0. Como preparar o ambiente para testar

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, JWT_SECRET (peça à equipe se for testar com dado real)
npm run dev
```

Acesse `http://localhost:3000/login`. Todas as telas deste guia ficam em `/admin`, atrás de login
com papel **ADMIN** ou **SECRETARIA** — use o usuário semeado por `npm run db:seed`
(`SEED_ADMIN_CPF` / `SEED_ADMIN_PASSWORD` do seu `.env`) ou qualquer conta admin já provisionada.

Para conferir a lógica sem precisar de banco de dados (as fórmulas em si são funções puras):

```bash
npm run typecheck   # tipos
npm run lint        # padrões de código
npm test            # roda todo *.test.ts em lib/analytics/ — 107 testes hoje
```

Cada seção abaixo também lista o comando para rodar só os testes daquele indicador.

---

## 1. Fundamentos (E0–E4) — os motores por trás de todas as telas

Nenhuma tela calcula nada sozinha. Toda fórmula vive em `lib/analytics/*.ts` (funções puras, sem
banco de dados, 100% cobertas por teste) e é reaproveitada por `lib/queries/*.ts` (que busca o dado
real) e finalmente pela página (`app/admin/indicadores/**/page.tsx`, que só formata e exibe). Isso
significa: **o mesmo cálculo de frequência, por exemplo, é usado pela tela executiva (E5), pela
tela por escola (E6) e pela tela de comparativos (E10)** — não há três fórmulas diferentes por aí.

### 1.1 Frequência — `lib/analytics/frequencia.ts`

| O que calcula | Fórmula | Constantes |
|---|---|---|
| Percentual de presença | `(Total de aulas − Total de faltas) / Total de aulas × 100` | Retorna `null` se não houver aula registrada (não divide por zero) |
| Faixa (adequada/atenção/crítica) | Compara o percentual com dois limiares | Adequada ≥ **85%**, Atenção ≥ **75%**, abaixo disso é Crítica — **provisório**, a Secretaria ainda não confirmou o critério oficial (ver §8 do plano) |
| Tendência (alta/queda/estável) | Diferença em pontos percentuais entre o período atual e o anterior | Estável se a diferença for menor que **0,5 p.p.** em módulo |
| Faltas consecutivas | Conta dias letivos seguidos com falta, sem presença no meio | Faixas: Atenção ≥ **3** dias, Alerta ≥ **5**, Crítico ≥ **10** — **motor pronto, ainda sem tela dedicada no frontend** (nenhuma página exibe isso hoje) |

Testar só este motor: `npx tsx --test lib/analytics/frequencia.test.ts` (22 testes).

### 1.2 Distorção idade-série — `lib/analytics/distorcao.ts`

Segue a metodologia do **INEP** (a mesma do Censo Escolar): compara a idade do estudante numa data
de referência com a idade teoricamente esperada para a série cursada.

- **Fórmula:** `idade na data de referência − idade esperada para a série`. Distorção quando a
  diferença é **≥ 2 anos**.
- **Data de referência padrão:** 31/03 do ano letivo selecionado (convenção usual do INEP — ainda
  não confirmada formalmente pelo município).
- **Intensidade:** defasagem de 2-3 anos é "moderada"; **4 anos ou mais é "severa"**.
- **Fora do escopo, por definição:** Educação Infantil, EJA, Educação Especial, turmas
  multianuais e a trilha "Trajetória de Sucesso" — nenhuma delas tem uma única idade esperada bem
  definida. Estudantes nessas situações (ou com data de nascimento ausente/corrompida) entram como
  "fora do escopo", nunca como "sem distorção" — para não maquiar o número.
- **Importante:** como parte dos estudantes defasados já é direcionada para a trilha "Trajetória de
  Sucesso" (fora do escopo), o número contado nas turmas regulares é um **piso**, não o total real
  de estudantes em distorção na rede.

Testar só este motor: `npx tsx --test lib/analytics/distorcao.test.ts` (14 testes).

### 1.3 Estatística de distribuição — `lib/analytics/estatistica.ts`

Genérico, sem conhecimento de domínio — usado hoje só por Aprendizagem (E7).

- **Mediana / Percentil (P25, P75):** interpolação linear entre os dois valores mais próximos
  (mesmo método padrão do Excel/numpy).
- **Amplitude:** maior valor menos o menor.
- **Proporção abaixo de um limite:** percentual de valores estritamente abaixo do limite informado.

Testar só este motor: `npx tsx --test lib/analytics/estatistica.test.ts` (16 testes).

### 1.4 Explicabilidade — `lib/analytics/explicabilidade.ts`

Não calcula indicador nenhum — garante que todo indicador relevante tem uma "ficha técnica"
(objetivo, fórmula, fonte, periodicidade, limitações). No frontend, isso aparece como o ícone
**ⓘ** ao lado de alguns KPIs em `/admin/indicadores` (E5) — passe o mouse para ver a ficha completa.

Testar só este motor: `npx tsx --test lib/analytics/explicabilidade.test.ts` (11 testes).

### 1.5 Agregações gerais de rede — `lib/queries/indicadores-gerais.ts` (E4)

Não é um motor puro (faz consulta ao banco), mas é a base do painel executivo (E5): junta
estudantes, frequência e notas do ano letivo selecionado e aplica os motores acima para produzir
os números de rede. Sem tela própria — quem quiser testá-la, testa através da E5.

---

## 2. `/admin/indicadores` — Central de Indicadores (E5)

**Pergunta que responde:** "como está a rede hoje, em um relance?"

### O que a tela mostra

| Card | Significado | Cálculo |
|---|---|---|
| Estudantes matriculados | Total de estudantes no ano letivo selecionado | Contagem direta |
| Escolas ativas | Escolas com pelo menos 1 matrícula no ano | Contagem de `escolaId` distintos |
| Turmas | Turmas distintas com estudante matriculado | Contagem de `turmaSerie` distintos |
| Frequência média da rede | % de presença de toda a rede no ano letivo | §1.1, somando aulas/faltas de todos os estudantes do ano |
| Estudantes abaixo da faixa adequada de frequência | Quantos estudantes, individualmente, estão abaixo de 85% | §1.1, aplicado por estudante, não por rede |
| Desempenho médio | Média aritmética simples de todas as notas do ano | Soma das notas ÷ quantidade de notas |
| Estudantes em distorção idade-série | Quantos estudantes atendem ao critério do §1.2 | §1.2, com nota de rodapé mostrando quantos ficaram fora do escopo |

A cor do card (verde/âmbar/vermelho) segue a faixa de frequência (§1.1) para o card de frequência,
e fica âmbar sempre que a contagem de "atenção" for maior que zero nos demais.

### Como testar

1. Logue como ADMIN/SECRETARIA e abra `/admin/indicadores`.
2. Confira que "Última sincronização" bate com o horário mais recente em
   `/admin/indicadores/qualidade` (E9) — os dois lêem a mesma tabela (`LogSincronizacao`).
3. Troque o seletor de "Ano letivo" (se houver mais de um ano com dado) e confira que os números
   mudam — isso confirma que o filtro está realmente sendo aplicado na consulta, não só na tela.
4. Passe o mouse no ícone **ⓘ** de qualquer card com explicabilidade e confira que o texto bate com
   a fórmula descrita acima.
5. Clique em "Ver por escola →" nos cards de frequência, desempenho e distorção — cada um leva à
   tela correspondente (E6, E7, E8) já filtrada pelo mesmo ano letivo.

---

## 3. `/admin/indicadores/frequencia` — Frequência por Escola (E6)

**Pergunta que responde:** "em qual escola a frequência está piorando?"

### O que a tela mostra

Uma linha por escola, **ordenada da frequência mais baixa para a mais alta** (as que mais precisam
de atenção aparecem primeiro):

- **Frequência atual:** % de presença nos últimos 30 dias (§1.1).
- **Tendência:** comparação com os 30 dias anteriores a esses — seta para cima (alta), para baixo
  (queda) ou traço (estável), com a diferença em pontos percentuais.
- **Faixa:** badge Adequada/Atenção/Crítica (§1.1), calculada sobre a frequência atual.

### Como testar

1. Abra a tela e confira que a lista está ordenada da pior para a melhor frequência.
2. Se aparecer o aviso amarelo "nenhuma escola tem tendência calculada" — isso é esperado quando o
   histórico de frequência sincronizada ainda não cobre os 60 dias necessários (30 atuais + 30
   anteriores); não é um bug.
3. Confira que a soma de "Estudantes" de todas as escolas bate com o total mostrado em
   "Estudantes matriculados" na Central de Indicadores (E5) para o mesmo ano letivo.
4. Clique no nome de uma escola para conferir que ela leva à ficha da escola.

---

## 4. `/admin/indicadores/aprendizagem` — Aprendizagem por Escola (E7)

**Pergunta que responde:** "a média sozinha esconde alguma coisa nessa escola?"

### O que a tela mostra

Uma linha por escola, ordenada da média mais baixa para a mais alta:

- **Notas lançadas:** quantidade de notas usadas no cálculo (não é número de estudantes).
- **Média:** média aritmética simples.
- **Mediana:** valor do meio da distribuição (§1.3) — se muito diferente da média, é sinal de
  distribuição assimétrica.
- **P25 – P75:** os 50% "do meio" das notas ficam nesse intervalo.
- **Amplitude:** maior nota menos a menor.
- **Abaixo de 6,0:** % de notas abaixo do critério provisório de aprovação (ainda não confirmado
  oficialmente pela Secretaria).

### Como testar

1. Procure uma escola onde média e mediana estejam bem distantes uma da outra — é o sinal de que a
   distribuição importa mais que a média isolada (foi exatamente esse achado, no CEJAB/EJA, que
   validou esta etapa em produção: média 7,7 mas mediana 9,8).
2. Confira que "Notas lançadas" somadas nas escolas não precisa bater com o total de estudantes —
   são notas, um estudante pode ter várias.

---

## 5. `/admin/indicadores/fluxo-trajetoria` — Fluxo e Trajetória (E8)

**Pergunta que responde:** "onde está a maior concentração de distorção, e em qual etapa ela começa
a crescer?"

### O que a tela mostra

**Por série** (barra de progressão): % de estudantes elegíveis em distorção idade-série (§1.2), do
1º Ano ao 3º Ano do Ensino Médio.

**Por escola** (tabela): elegíveis, em distorção, % de distorção, quantos estão em **defasagem
severa (4+ anos)**, e quantos ficaram **fora do escopo** do cálculo (creches, EJA, Educação
Especial, turmas multianuais, Trajetória de Sucesso).

### Como testar

1. Confira que toda escola de Educação Infantil (creche) aparece com 0 elegíveis e 100% fora do
   escopo — é o comportamento esperado, não um erro de dado.
2. Some "Elegíveis" de todas as escolas na tabela — deve bater com o total mostrado na Central de
   Indicadores (E5), já que os dois usam o mesmo motor (§1.2).
3. Observe o gráfico de barras "por série": o achado documentado em produção é que a distorção
   cresce progressivamente até um pico por volta do 7º Ano — se sua massa de dados mostrar um
   padrão muito diferente disso, vale investigar antes de confiar no número.

---

## 6. `/admin/indicadores/qualidade` — Qualidade dos Dados (E9)

**Pergunta que responde:** "os indicadores acima estão sendo alimentados corretamente?" — este
painel não mostra indicador pedagógico nenhum, mostra a saúde da própria sincronização.

### O que a tela mostra

**Saúde da sincronização** — uma linha por módulo (Escolas, Cargos, Servidores, Estudantes, Notas,
Frequência):

- **Situação:**
  - 🟢 **Em dia** — o módulo teve uma execução com `SUCESSO` há menos de 30 horas.
  - 🟠 **Atrasado** — a última execução com `SUCESSO` foi há mais de 30 horas (o cron roda
    diariamente entre 2h e 2h50, então 30h dá folga sem soar falso alarme).
  - 🔴 **Sem sincronização** — nunca teve uma execução com `SUCESSO`.
- **Última execução:** pode ser `SUCESSO`, `ERRO` ou `PROCESSANDO` (sincronizações grandes rodam em
  lotes — várias linhas `PROCESSANDO` até fechar em `SUCESSO`).
- **Erros (7 dias):** quantas execuções com status `ERRO` esse módulo teve na última semana.

**Integridade — código de turma reutilizado entre escolas:** a origem (SIGEduc) não garante que um
código de turma seja único na rede inteira. Isso **não é erro por si só** — vira risco só quando
escolas diferentes atribuem **séries diferentes** ao mesmo código (aí sim o indicador de distorção
idade-série poderia usar a série errada). Cada código aparece com status **Consistente** (mesma
série em todas as escolas que o usam) ou **Divergente** (precisa de revisão).

**Histórico recente:** as últimas 30 execuções de sincronização, de qualquer módulo.

### Como testar

1. Confira que todo módulo com sincronização diária de fato aparece "Em dia" — se algum estiver
   "Atrasado" sem explicação, é um problema operacional real (foi assim que descobrimos, testando
   esta etapa, que o módulo Estudantes ficou preso em `PROCESSANDO` sem fechar).
2. Se houver um card "Erros (7 dias)" maior que zero, role até o histórico recente e procure a linha
   `ERRO` correspondente — a coluna "Mensagem" deve trazer o motivo.
3. Na tabela de integridade, confira alguns códigos "Consistente" manualmente: todas as escolas
   listadas devem mostrar a mesma série entre parênteses. Se algum aparecer "Divergente", isso é
   uma ação real a investigar antes de confiar nos números de distorção daquela turma.
4. Teste rápido do motor puro por trás desta tela: `npx tsx --test lib/analytics/qualidade-dados.test.ts`
   (11 testes: classificação de situação por limiar de horas e detecção de divergência de série).

---

## 7. `/admin/indicadores/comparativos` — Comparativos Escola × Rede (E10)

**Pergunta que responde:** "essa escola está acima ou abaixo da rede, no mesmo período?" — em vez
de olhar cada número isolado, como nas telas E6-E8.

### O que a tela mostra

Uma linha por escola com três indicadores lado a lado — Frequência, Desempenho, Distorção
idade-série — cada um com a **diferença em relação à referência de rede** no mesmo recorte
(mesmo ano letivo, mesma janela de 30 dias de frequência).

- Frequência e Desempenho: diferença **positiva (verde)** é bom (escola acima da rede);
  **negativa (vermelho)** é ruim.
- Distorção idade-série: a leitura é **invertida** — diferença **negativa (verde)** é bom (menos
  distorção que a rede); **positiva (vermelho)** é ruim.
- "sem referência de rede" aparece quando a escola não tem dado suficiente para aquele indicador
  específico (ex.: uma creche não tem estudante elegível para distorção).

### Como a referência de rede é calculada (o ponto central desta etapa)

A referência de rede **não é a média simples dos percentuais de cada escola** — isso daria peso
igual a uma escola de 20 alunos e a uma de 400, distorcendo o resultado. Em vez disso, é uma
**média ponderada** pelo "tamanho" da escola naquele indicador:

| Indicador | Peso usado |
|---|---|
| Frequência | Total de aulas dadas no período (soma bruta de aulas/faltas de todas as escolas, depois aplica a fórmula do §1.1 uma vez sobre o total) |
| Desempenho | Total de notas lançadas |
| Distorção idade-série | Total de estudantes elegíveis |

Motor: `lib/analytics/comparativos.ts` — `calcularMediaPonderada` (a média ponderada em si) e
`calcularDiferencaParaRede` (a subtração escola − rede, retornando `null` se faltar qualquer lado).

### Como testar

1. Confira os 3 cards de resumo no topo (Frequência/Desempenho/Distorção da rede) contra os mesmos
   números da Central de Indicadores (E5) — devem ser próximos (frequência pode variar um pouco
   porque E5 usa o ano letivo inteiro e E10 usa a janela de 30 dias).
2. Escolha uma escola grande e uma pequena e confira que a diferença da escola pequena não "puxa"
   desproporcionalmente a referência de rede — é justamente o que a ponderação evita.
3. Confira o sentido das cores: ache uma escola com distorção acima da rede e confirme que aparece
   em vermelho (não verde) — é o único indicador com leitura invertida.
4. Teste rápido do motor puro: `npx tsx --test lib/analytics/comparativos.test.ts` (9 testes,
   incluindo um caso que prova que a média ponderada dá o mesmo resultado que somar os totais
   brutos e dividir no fim).

---

## 8. O que ainda não existe (para não confundir com bug)

- **Faltas consecutivas** (§1.1): motor pronto e testado, mas nenhuma tela exibe isso ainda.
- **Bloco "Atenção agora"** na Central de Indicadores (E5): destaque automático de escolas/turmas
  com queda recente. A base de dados para isso já existe (E10), mas o destaque automático em si
  ainda não foi construído.
- **Fase 2** (alertas, intervenções pedagógicas, metas, auditoria LGPD, avaliações por
  descritor/habilidade BNCC): depende de novos modelos no banco — ver
  `docs/PLANO_DESENVOLVIMENTO.md` §5.
