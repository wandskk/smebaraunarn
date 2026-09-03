# Mapeamento do portal CAEd (Criança Alfabetizada) para o módulo Avaliações

Documento de investigação — não é um plano de execução. Levanta o que existe no site
oficial do CAEd (telas, fluxos, dados, cálculos) e compara com o que o smebaraunarn já
tem hoje, para servirmos de referência quando formos detalhar as próximas etapas do
módulo Avaliações. Investigação feita em 2026-09-03, navegando com o Chrome logado do
usuário (Marcos Antônio de Sousa) na conta de gestor municipal da rede.

## 1. O que é a plataforma

URL: `https://criancaalfabetizada.caeddigital.net/` — "Compromisso Nacional Criança
Alfabetizada", programa federal operado pelo CAEd/UFJF. Não é uma ferramenta isolada de
resultados: é uma plataforma completa de aplicação de avaliação formativa, com estas
seções no menu principal (`#!/inicio`):

| Módulo | O que faz |
|---|---|
| Cronograma / Novidades | Calendário de ações previstas na plataforma |
| Profissionais | Cadastro de gestores, diretores, coordenadores, professores |
| **Avaliações** | Download dos cadernos de teste e materiais instrucionais para aplicação; lançamento de respostas |
| **Banco de Itens** | Gera cadernos de atividades avulsos, filtráveis por habilidade não consolidada — reforço direcionado |
| **Resultados** | Dashboard de participação/desempenho — é o foco deste documento |
| **Matrizes** | Catálogo das habilidades avaliadas por etapa/componente, com descrição expansível |
| Monitoramento | Alcance da plataforma: cadastro vs. Censo Escolar, taxas de participação por etapa/caderno |
| Desenvolvimento Profissional | Curso de capacitação em avaliação educacional |
| Apoio Pedagógico | Materiais de orientação e práticas pedagógicas |

O nosso projeto hoje só replica uma fatia de **Resultados** (via
`scripts/extrair-caed-alunos.ts` + `AvaliacaoResultadoTurma`). As seções abaixo detalham
cada módulo relevante e, ao final, o gap para o smebaraunarn.

## 2. Tela "Resultados das avaliações" (`VIEW_RESULTADOS`)

URL de exemplo usada na investigação:
```
#!/pagina/VIEW_RESULTADOS?DADOS.VL_FILTRO_AVALIACAO=AV22026
  &DADOS.VL_FILTRO_ETAPA=ENSINO FUNDAMENTAL DE 9 ANOS - 1º ANO
  &DADOS.VL_FILTRO_DISCIPLINA=LÍNGUA PORTUGUESA
  &DADOS.VL_FILTRO_REDE=PÚBLICA
```
Os filtros da tela viram query params — dá pra montar link direto para uma combinação.
Abas no topo por **ano letivo** (Resultados 2026 / 2025 / 2024), cada um com seus
próprios ciclos (2026 tem Ciclo I e II; 2025 teve Ciclo I, II e III — o número de ciclos
varia por ano). Não existe, em lugar nenhum da tela, um gráfico de **evolução entre
ciclos ou entre anos** — cada ciclo é mostrado lado a lado (cards "2026 - Ciclo I" /
"2026 - Ciclo II"), mas não há uma série temporal. Isso é uma lacuna do próprio CAEd, e
uma oportunidade real pra nós (ver seção 6).

### 2.1 Filtros
- **Avaliação** — na prática, o ciclo (ex.: "Avaliação Contínua da Aprendizagem - Ciclo
  II / 2026")
- **Ano escolar** — 1º ao 5º ano do Ensino Fundamental
- **Componente curricular** — Língua Portuguesa (Leitura), Língua Portuguesa (Escrita),
  Matemática, Fluência
- **Rede** — Pública / Estadual / Municipal

### 2.2 Seção "Participação"
Cards por ciclo com **estudantes avaliados** (contagem simples, sem % neste card — o %
de participação só aparece na tabela por escola).

### 2.3 Seção "Desempenho"
Card por ciclo com:
- **% de estudantes com aprendizagem adequada** (número grande, destaque)
- **Distribuição por 3 níveis**, sempre a mesma taxonomia:
  - 🟠 **Defasagem**
  - 🟡 **Aprendizado intermediário**
  - 🟣 **Aprendizado adequado**
  
  Barra horizontal empilhada + legenda com quantidade absoluta e %. Essa é exatamente a
  taxonomia que já está no nosso schema (`percentualDefasagem` /
  `percentualIntermediario` / `percentualAdequado` em `AvaliacaoResultadoTurma`) —
  confirma que a modelagem que já fizemos bate com a fonte oficial.

Exemplo real capturado (1º ano, Língua Portuguesa/Leitura, rede pública):

| | Ciclo I/2026 | Ciclo II/2026 |
|---|---|---|
| Estudantes avaliados | 232 | 238 |
| Aprendizagem adequada | 34% (78 est.) | 76% (180 est.) |
| Defasagem | 44% (102 est.) | 15% (35 est.) |
| Intermediário | 22% (52 est.) | 10% (23 est.) |

### 2.4 Seção "Percentual de acerto por habilidade"
Grade de cartões **H01, H02, ... H08** (para o 1º ano — o número de habilidades varia
por etapa/componente), cada um mostrando o código interno CAEd entre parênteses (ex.:
`H 01 (1EF06_P)`) e o % de acerto da rede inteira nessa habilidade. Cor do cartão muda
por faixa:
- 🔴 Até 40%
- 🟠 De 41 até 60%
- 🔵 De 61 até 80%
- 🟢 Acima de 80%

Tem um seletor "Acerto por habilidade: Todos / Até 40% / 41-60% / 61-80% / Acima de 80%"
que filtra os cartões exibidos — útil pra focar rápido nas habilidades mais fracas.
Botão **"Baixar dados em csv"** exporta essa grade.

### 2.5 "Visão detalhada dos resultados" — a tabela por escola
Duas abas, mesma tabela de escolas, colunas diferentes:

**Aba "Participação e desempenho"**: Escola · Previstos · Avaliados · % Participação ·
Defasagem · Aprendizado intermediário · Aprendizado adequado.

**Aba "Acerto por habilidade"**: Escola · Acerto total · H01(%) · H02(%) · ... · H08(%).

Paginada (10 escolas por página), sem busca por nome — só paginação `« 1 2 »`. Botão
**"Baixar dados"** ao final exporta a tabela completa. Os nomes de escola vêm com código
interno junto (ex.: `ESCOLA MUNICIPAL DE 1º GRAU AMARO CAVALCANTE - 24000531`), útil pra
casar com o nosso cadastro de `Escola`.

Dado real capturado (aba Acerto por habilidade, mesmo filtro acima):

| Escola | Acerto total | H01 | H02 | H03 | H04 | H05 | H06 | H07 | H08 |
|---|---|---|---|---|---|---|---|---|---|
| CRECHE MUN. APRENDIZADO DO ANGICOS | 89% | 100 | 83 | 100 | 83 | 100 | 78 | 83 | 75 |
| EM DE 1 GRAU PROF AMAURI RIBEIRO DA SILVA | 72% | 59 | 86 | 77 | 61 | 85 | 70 | 54 | 84 |
| ESC. MUN. DE 1º GRAU AMARO CAVALCANTE | 62% | 58 | 64 | 69 | 54 | 81 | 51 | 56 | 56 |
| ESC. MUN. DE 1º GRAU OLAVO BILAC | 100% | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 |

Nas linhas com poucos avaliados (2-3 alunos), o % de acerto por escola oscila muito —
vale considerar exibir "n avaliados" ao lado do % quando formos montar uma visão
parecida, pra não passar falsa precisão numa amostra pequena.

**Não existe, nessa tela, um clique que desça de escola para turma/aluno** — o usuário
logado como gestor municipal só vê o agregado por escola. A hierarquia
turma/aluno (usada pelo `scripts/extrair-caed-alunos.ts` via API) só é visível
navegando como perfil de escola/turma, ou via a chamada direta de API que o script já
descobriu (`getDadosResultado`, parâmetro `nivelAbaixo`).

## 3. Tela "Matrizes de referência" (`VIEW_MOS_MATRIZES`)

Catálogo de habilidades por Avaliação/Ano escolar/Componente, com botão
Expandir/Reduzir que troca o código exibido pelo código "completo" do item (ex.: H01 →
`1EF06_P`, `1EF01_E`, `1EF01_M`, `D001_D` conforme o componente). Clicar no código abre
mais conteúdo (não aprofundamos — provavelmente a descrição textual da habilidade usada
no banco de itens). Isso é o equivalente ao "descritor" que já existe no nosso
`AvaliacaoQuestao.descritor`, só que estruturado como catálogo oficial em vez de texto
livre por questão — é a peça que falta pra sairmos de "descritor como texto livre" (nota
já registrada em `app/admin/avaliacoes/[id]/page.tsx:705-709`) para um catálogo real de
habilidades BNCC/CAEd.

## 4. Tela "Monitoramento" (`VIEW_MONITORAMENTO`)

Dashboard de **uso da plataforma**, não de desempenho pedagógico — mas com dados que
não existem em nenhum outro lugar do CAEd nem no smebaraunarn hoje:

- **Visão geral da rede**: 1 secretaria, 22 escolas, 215 profissionais, 1485 estudantes
  cadastrados (com quebra por papel: gestores, diretores, coordenadores, professores).
- **Estudantes avaliados vs. cadastro na plataforma**: previstos → responderam ao menos
  um caderno → taxa de resposta (ex.: 1485 previstos, 1407 avaliados, 95%).
- **Estudantes cadastrados vs. Censo Escolar 2025** — funil de 3 estágios: registrados
  no censo (1516, 100%) → cadastrados na plataforma (1485, 98%) → avaliados (1407, 93%).
  Gráfico de barras horizontal com as 3 barras. Esse cruzamento com o Censo Escolar é
  algo que **não temos** — não integramos Censo Escolar no smebaraunarn hoje.
- **Participação por etapa e componente**: tabela cruzada mostrando, pra cada
  componente (LP Leitura, LP Escrita, Fluência, Matemática), a participação por ano
  escolar (ex.: "Fluência" no 2º ano teve só 31% de participação — 84/275 — bem abaixo
  dos outros anos/componentes, um sinal de problema operacional específico que passaria
  despercebido numa média geral).

Cada bloco tem alternância "Visão geral / Visão detalhada" (não abrimos o detalhe por
tempo, mas pelo padrão da tela de Resultados, deve abrir uma tabela por escola).

## 5. Tela "Avaliações" e "Banco de Itens" (aplicação, não resultado)

- **Avaliações** (`#!/avaliacoes`): download dos cadernos de teste e gabaritos por
  ciclo/etapa/componente (aba "Downloads"), mais uma "Coleção de Avaliações" com
  material de ciclos passados. É a etapa anterior à digitação de resultado — não gera
  dado de desempenho, só os PDFs usados na aplicação em papel.
- **Banco de Itens** (`#!/lista-gerar-caderno`): gera **cadernos de atividades avulsos**
  filtrando por habilidade — a ideia declarada na própria tela é "selecionar as
  habilidades ainda não consolidadas pelos estudantes para montar um caderno de
  reforço". Isso é puro material de apoio, não compõe a avaliação oficial. É uma feature
  de fechamento de ciclo (diagnóstico → reforço direcionado) que hoje não existe no
  smebaraunarn de forma nenhuma.

## 6. Comparação com o que o smebaraunarn já tem

O módulo `app/admin/avaliacoes/[id]/page.tsx` (aba "Visão Geral", bloco "Indicadores por
escola/turma (CAEd)") **já cobre uma fatia real** do que o CAEd mostra — a modelagem
(`AvaliacaoResultadoTurma` com `percentualParticipacao/Defasagem/Intermediario/Adequado`
+ `acertoPorHabilidade` JSON, agregado em `lib/analytics/avaliacoes.ts`) usa a mesma
taxonomia de 3 níveis do CAEd. Hoje já temos:

- Cards de participação média / % defasagem médio / % adequado médio (equivalente
  resumido às seções 2.2/2.3 do CAEd, mas achatado — um número de rede, não por
  ciclo lado a lado).
  - **Ver mais**: `app/admin/avaliacoes/[id]/page.tsx:317-346`
- Gráfico "Escolas/turmas com menor % adequado" e "Habilidades com menor % de acerto"
  (rede inteira, top 10) — equivalente à ideia dos cartões coloridos do CAEd, mas sem a
  granularidade por escola.
- Tabela por escola/turma com participação/defasagem/intermediário/adequado —
  equivalente à aba "Participação e desempenho" do CAEd (seção 2.5), mas sem paginação
  nem exportação.

### O que falta (gaps concretos, cada um mapeado à seção do CAEd que o originou)

1. **Tabela "Acerto por habilidade" por escola** (seção 2.5, aba 2) — hoje só temos o
   ranking agregado de rede das piores habilidades; falta a tabela H01..Hn por escola.
2. **Codificação de cor por faixa de %** (até 40 / 41-60 / 61-80 / acima de 80) — nossos
   números hoje são só texto plano, sem semáforo visual.
3. **Ciclos lado a lado** — CAEd mostra Ciclo I e Ciclo II (ou III) como cards
   comparáveis na mesma tela; no nosso schema cada ciclo é um registro `Avaliacao`
   separado, então hoje pra comparar dois ciclos é preciso abrir duas páginas.
4. **Exportação CSV** — CAEd tem "Baixar dados" em duas telas; não temos nenhuma
   exportação em `admin/avaliacoes` hoje (confirmado por busca no código).
5. **Cruzamento com Censo Escolar / cadastro da plataforma** (seção 4) — não temos
   Censo Escolar integrado; é a peça que dá ao gestor um "funil de cobertura" real
   (quantos deveriam existir vs. quantos estão cadastrados vs. quantos foram avaliados).
6. **Participação cruzada etapa × componente** (seção 4) — hoje nossa cobertura é por
   turma dentro de uma avaliação; não cruzamos automaticamente vários componentes/anos
   numa tabela só pra achar outliers de participação (ex.: o caso da Fluência no 2º ano
   com 31%).
7. **Catálogo de habilidades (Matrizes)** — nosso `descritor` é texto livre por questão;
   o CAEd tem um catálogo oficial código→descrição por etapa/componente. Sem isso, cada
   nova avaliação importada pode grafar a mesma habilidade com texto levemente diferente
   e quebrar a agregação por descritor.
8. **Geração de material de reforço por habilidade fraca** (Banco de Itens, seção 5) —
   feature nova, não é só de visualização; envolveria ter um banco de itens próprio ou
   algum link/exportação pra apoio pedagógico direcionado.

### Onde o smebaraunarn pode ir além do CAEd
- **Evolução entre ciclos/anos** — o próprio CAEd não tem isso (cada ciclo é uma foto
  isolada). Como já guardamos os resultados históricos importados, dá pra montar uma
  série temporal por escola/habilidade que o CAEd não oferece.
- **Comparação entre fontes de avaliação** (CAEd + Fluência Leitora + SPADEB + provas
  municipais) numa visão unificada — o CAEd só mostra os dados dele.

## 7. Observações técnicas para quando formos implementar

- A API que o CAEd usa (`portal/functions/getDadosResultado`) já foi mapeada em
  `scripts/extrair-caed-alunos.ts` — ela aceita agregação em qualquer nível da
  hierarquia (`agregado` + `nivelAbaixo`), então dá pra extrair direto no nível de
  escola sem paginar tela por tela, caso um dia a gente precise re-extrair.
- Login é gov.br com captcha — nenhuma automação de coleta roda sem a sessão manual do
  usuário (já era a premissa do script existente; confirma que qualquer nova extração
  segue a mesma limitação).
- Nomenclatura de escola no CAEd inclui um código interno próprio (ex. `24000531`) que
  não é o `codigoInep` nem o `id` do SIGEduc na nossa tabela `Escola` — qualquer parser
  novo precisa mapear por nome (como o import atual já faz) ou pedir esse código como
  chave adicional.
- Bandas de cor do CAEd (até 40 / 41–60 / 61–80 / acima de 80) são um padrão que vale
  reaproveitar tal qual, inclusive no `DC_FAIXA_PERCENTUAL_HABILIDADE` que aparece na
  própria URL do filtro (`Alto-Médio Baixo-Médio Alto-Baixo` — nomenclatura interna do
  CAEd pras faixas, útil se algum dia lermos a URL/API diretamente).

## 8. Próximos passos

Aguardando mais detalhes do usuário sobre qual desses gaps priorizar antes de propor
qualquer schema/etapa concreta — este documento é só o mapeamento, ainda sem plano de
implementação.
