# Plano de Ação — MVP de Indicadores Inteligentes
## SME Baraúna/RN — execução orientada para Claude Code + MCP 21st.dev

**Objetivo do MVP:** transformar a Central de Indicadores em uma experiência executiva que permita, em menos de 60 segundos, responder quatro perguntas:

1. Como está a rede municipal agora?
2. O que mudou recentemente?
3. Onde a gestão deve investigar primeiro?
4. Posso confiar nos dados exibidos?

O MVP não deve virar um chatbot, não deve usar “IA” como decoração e não deve criar um score opaco de escolas. A inteligência deve vir de regras explicáveis, comparação com contexto, tendência temporal, priorização e drill-down.

---

# 0. Contexto obrigatório antes de alterar código

O projeto já possui uma base funcional e visual madura. Antes de qualquer alteração, o executor deve ler:

- `README.md`
- `docs/plano-evolucao-sme/PROGRESSO.md`
- `docs/redesign-visual/PLANO_REDESIGN_VISUAL.md`
- `app/admin/page.tsx`
- `app/admin/indicadores/page.tsx`
- `app/admin/indicadores/frequencia/page.tsx`
- `app/admin/indicadores/aprendizagem/page.tsx`
- `app/admin/indicadores/comparativos/page.tsx`
- `app/admin/indicadores/fluxo-trajetoria/page.tsx`
- `app/admin/indicadores/qualidade/page.tsx`
- `app/admin/avaliacoes/page.tsx`
- `app/admin/avaliacoes/[id]/page.tsx`
- `lib/analytics/atencao.ts`
- `lib/analytics/frequencia.ts`
- `lib/analytics/distorcao.ts`
- `lib/analytics/explicabilidade.ts`
- `lib/queries/atencao.ts`
- `lib/queries/frequencia.ts`
- `lib/queries/desempenho.ts`
- `lib/queries/comparativos.ts`
- `lib/queries/avaliacoes.ts`
- `lib/queries/qualidade-dados.ts`
- `components/ui/metric-card.tsx`
- `components/ui/insight-card.tsx`
- `components/ui/charts/*`

## O que JÁ existe e não deve ser reconstruído

- `MetricCard` com suporte a `trend`/sparkline.
- `InsightCard`.
- `RingProgress`.
- `DonutChart`.
- `MiniBarChart`.
- `Sparkline`.
- `EmptyState`.
- `DataFreshnessBadge`.
- `ComparisonDelta`.
- `DataTable`.
- animações e skeletons.
- Recharts já instalado.
- motor de “Atenção agora”.
- comparação Escola × Rede.
- frequência por escola e sequência de faltas.
- distribuição estatística de notas por escola.
- distorção idade-série por série/escola.
- qualidade/completude de dados.
- avaliações municipais por rede/escola/professor.
- análise por item/descritor nas avaliações.
- dados reais de avaliações municipais importados.

**Regra:** nenhuma etapa pode criar uma segunda versão de componente ou cálculo que já exista.

---

# 1. Princípios de produto

## 1.1 A tela deve começar pela decisão, não pelo cadastro

Evitar usar como protagonistas:

- total de turmas;
- total de escolas;
- total de servidores;
- total de publicações.

Esses números são contexto estrutural, não inteligência.

Os protagonistas devem ser:

- frequência;
- aprendizagem;
- fluxo/trajetória;
- faltas consecutivas;
- situações de atenção;
- avaliações municipais;
- confiabilidade/atualização do dado.

## 1.2 Inteligência explicável

Nunca exibir apenas “Escola em risco”.

Exibir:

> Escola X — frequência 74,2%, queda de 6,1 p.p. em relação ao período anterior.

E explicar:

> Frequência abaixo da faixa adequada e em queda no período recente.

Sempre mostrar:

- fato;
- valor;
- referência;
- período;
- motivo;
- link para investigar.

## 1.3 Não criar ranking de “melhor/pior escola”

Usar:

- “Panorama das escolas”
- “Escolas com sinais de atenção”
- “Comparação com a rede”
- “Maiores variações no período”

Nunca:

- “Piores escolas”
- “Ranking de desempenho geral”
- score único sem explicação.

## 1.4 Não inventar regra oficial

Quando um parâmetro ainda não foi homologado pela Secretaria, identificá-lo como:

> parâmetro de trabalho atual

ou manter a regra já documentada no código.

Não criar novas faixas, metas ou limiares arbitrários apenas para deixar o dashboard mais “inteligente”.

## 1.5 Sem IA generativa no MVP

Não adicionar:

- chatbot;
- “assistente pedagógico”;
- previsões de reprovação com LLM;
- texto gerado por API externa;
- recomendações pedagógicas automáticas.

O MVP deve ser determinístico, auditável e reproduzível.

---

# 2. Arquitetura de informação do MVP

## Rota protagonista

`/admin/indicadores`

Renomear visualmente para:

# Centro de Inteligência Educacional

### Texto do cabeçalho

> Visão executiva da rede municipal para acompanhar resultados, identificar mudanças e localizar pontos que merecem investigação.

Ações no cabeçalho:

- seletor `Ano letivo`;
- `Qualidade dos dados`;
- `Comparar escolas`.

Mover “Números da página inicial” para uma área secundária/administração. Não deve competir com o Centro de Inteligência.

---

# 3. Tela principal — Centro de Inteligência Educacional

A ordem da tela é obrigatória.

## BLOCO A — Contexto da rede

Linha discreta, não cards gigantes:

> **[N] estudantes · [N] escolas · [N] turmas · Ano letivo [AAAA]**

Serve apenas para contextualizar o recorte.

---

## BLOCO B — Pulso da rede

Título:

### Pulso da rede

Texto:

> Os principais sinais educacionais do recorte selecionado.

Usar quatro KPIs.

### KPI 1 — Frequência média

**Valor:** percentual atual.

**Complemento:**
- delta em p.p. versus período anterior;
- sparkline quando existir série temporal suficiente.

Exemplo de texto:

> 87,4%  
> ↓ 2,1 p.p. nos últimos 30 dias

CTA:

> Ver frequência

### KPI 2 — Desempenho médio

**Valor:** média da rede.

Complemento curto:

> [X]% das notas abaixo do parâmetro de trabalho

Somente mostrar essa segunda informação se for calculada pela regra atual já documentada.

CTA:

> Ver aprendizagem

### KPI 3 — Distorção idade-série

Preferir percentual + contagem.

Exemplo:

> 14,8%  
> 312 estudantes elegíveis em distorção

Evitar mostrar apenas a quantidade absoluta.

CTA:

> Ver fluxo e trajetória

### KPI 4 — Faltas consecutivas agora

Mais útil do que “total de turmas”.

Exemplo:

> 37 estudantes  
> com sequência recente de 3+ faltas

Se o motor atual tiver faixas 3/5/10, mostrar detalhe textual discreto, sem inventar nova classificação.

CTA:

> Investigar frequência

### Regra visual dos KPIs

- máximo 4;
- mesmo tamanho;
- número dominante;
- contexto curto;
- tooltip de explicabilidade;
- data/fonte acessível;
- sparkline apenas onde há série real;
- nunca gráfico decorativo sem informação adicional.

---

# 4. BLOCO C — Atenção agora

Este é o principal diferencial do MVP.

O motor já existe. O trabalho é torná-lo protagonista da Central de Indicadores.

Título:

### Atenção agora

Texto:

> Situações identificadas automaticamente a partir de tendência, comparação com a rede e qualidade dos dados.

Exibir no máximo 5 cards.

Cada card deve mostrar:

1. categoria;
2. severidade;
3. escola/módulo;
4. fato;
5. valor;
6. comparação;
7. motivo;
8. período;
9. CTA.

### Exemplo — Frequência

**Frequência · Crítico**

> Escola Municipal X  
> Frequência em 72,4%, queda de 6,1 p.p. em relação ao período anterior.

> Está abaixo da faixa adequada e continua em queda.

CTA:

> Investigar escola

### Exemplo — Aprendizagem

**Aprendizagem · Atenção**

> Escola Municipal Y  
> Desempenho 0,6 ponto abaixo da rede e 43% das notas abaixo do parâmetro de trabalho.

CTA:

> Ver desempenho

### Exemplo — Fluxo

**Trajetória · Atenção**

> Escola Municipal Z  
> Distorção idade-série em 21,8%, 7,2 p.p. acima da referência da rede.

CTA:

> Ver trajetória

### Exemplo — Dados

**Qualidade dos dados · Crítico**

> Frequência está com sincronização atrasada.

> Indicadores que dependem desse módulo podem estar desatualizados.

CTA:

> Ver sincronização

## Mudança recomendada no tipo `InsightAtencao`

Adicionar uma categoria explícita, se isso puder ser feito sem duplicar lógica:

```ts
type CategoriaInsight =
  | "frequencia"
  | "aprendizagem"
  | "trajetoria"
  | "dados";
```

Não criar score.

Ordenação:

1. críticos;
2. atenção;
3. dentro da mesma severidade, usar a ordem de relevância já derivada da regra ou maior magnitude do fato quando isso puder ser explicado.

---

# 5. BLOCO D — Panorama das escolas

Título:

### Panorama das escolas

Texto:

> Compare os principais sinais de cada escola no mesmo recorte, sem reduzir realidades diferentes a um único ranking.

Tabela:

| Escola | Frequência | Tendência | Desempenho | vs. rede | Distorção | Sinais |
|---|---:|---|---:|---|---:|---|

## Coluna Sinais

Badges independentes:

- Frequência
- Aprendizagem
- Trajetória

Não usar “score 82”.

Ordenação padrão:

1. mais sinais críticos;
2. mais sinais de atenção;
3. nome da escola.

Filtros:

- Todas;
- Com sinais;
- Frequência;
- Aprendizagem;
- Trajetória.

CTA por linha:

> Ver escola

## Importante

Não duplicar cálculo.

Reaproveitar:

- `getComparativosPorEscola`;
- `getDesempenhoPorEscola`;
- regras de `lib/analytics/atencao.ts`.

Se necessário, construir uma função agregadora pura que transforme os insights existentes em um mapa por escola.

---

# 6. BLOCO E — Tendência da frequência da rede

Título:

### Evolução da frequência

Texto:

> Acompanhe a variação recente da frequência da rede para diferenciar um valor isolado de uma tendência.

Gráfico:

- `AreaChart`/linha;
- últimos 30 dias por padrão;
- eixo X = data;
- eixo Y = percentual;
- tooltip com data e percentual;
- linha textual de resumo abaixo.

Exemplo de resumo:

> A frequência média caiu 2,1 p.p. em relação aos 30 dias anteriores.

Se não houver histórico:

> Ainda não há histórico suficiente para calcular tendência. O gráfico aparecerá automaticamente quando houver dados comparáveis.

## Implementação

Criar um componente de série temporal somente se houver pelo menos dois usos reais:

- Central de Indicadores;
- página detalhada de Frequência.

Sugestão:

`components/ui/charts/time-series-chart.tsx`

Criar query dedicada:

`getEvolucaoFrequenciaRede(...)`

Sem mudança de schema.

---

# 7. BLOCO F — Avaliações municipais

Título:

### Avaliações municipais

Texto:

> Resultados próprios do município integrados ao mesmo ambiente de análise da rede.

Mostrar as 3 ou 4 avaliações mais recentes com resultado.

Cada card:

- nome;
- tipo;
- etapa;
- ano;
- resultados registrados;
- cobertura;
- status;
- última atualização.

CTA:

> Ver análise

Usar `getAvaliacoesResumo({ kind: "rede" })`.

Não duplicar a tela de cadastro de avaliações.

A Central deve funcionar como porta de entrada executiva para o que já existe.

---

# 8. BLOCO G — Confiabilidade dos dados

Compacto.

Título:

### Confiabilidade dos dados

Mostrar:

- módulos em dia / total;
- quantidade atrasada;
- última atualização das fontes relevantes.

Texto:

> Os indicadores dependem de diferentes módulos do SIGEduc e podem ter datas de atualização diferentes.

CTA:

> Abrir qualidade dos dados

Não copiar a tela `/admin/indicadores/qualidade`; ela já é o drill-down técnico.

---

# 9. Página de Frequência

Rota:

`/admin/indicadores/frequencia`

Novo título:

# Frequência e Permanência

Descrição:

> Onde a frequência está piorando e quais escolas ou estudantes apresentam sinais recentes de ausência?

## KPIs

1. Frequência média da rede.
2. Escolas em atenção/crítica.
3. Escolas em queda no período.
4. Estudantes com sequência de 3+ faltas.

## Gráficos

### Gráfico 1 — Evolução da rede

Reaproveitar o mesmo `TimeSeriesChart` da Central.

### Gráfico 2 — Escolas por faixa

Manter o donut atual.

## Bloco “Ausências que exigem investigação”

Mostrar top escolas com maior quantidade atual de estudantes em sequência de faltas.

Sem criar score.

Exemplo:

> Escola X — 12 estudantes com sequência recente de faltas  
> 3 deles na faixa mais grave definida pelo motor atual.

CTA:

> Ver escola

## Tabela existente

Manter e melhorar hierarquia:

- Escola;
- Estudantes;
- Frequência atual;
- Variação;
- Faixa;
- Faltas consecutivas.

Ordenação padrão:

frequência mais baixa primeiro.

## Heatmap

Não colocar heatmap agregado da rede só porque existe componente.

`AttendanceHeatmap` faz mais sentido em:

- estudante;
- turma;
- escola selecionada.

Se não houver um drill-down em que ele responda uma pergunta clara, não usar no MVP.

---

# 10. Página de Aprendizagem

Rota:

`/admin/indicadores/aprendizagem`

Título:

# Aprendizagem e Desempenho

Descrição:

> Como os resultados se distribuem entre escolas e onde há maior concentração de notas abaixo do parâmetro de trabalho?

Manter filtros:

- ano;
- disciplina;
- unidade.

## KPIs

1. desempenho médio da rede;
2. total de notas no recorte;
3. percentual de notas abaixo do parâmetro;
4. escolas com sinal de atenção em aprendizagem.

Se mediana da rede puder ser calculada sem query excessivamente cara, pode substituir o total de notas.

## Gráfico 1 — Distribuição de notas

Histograma simples.

Faixas sugeridas apenas como agrupamento visual, não como regra pedagógica:

- 0–2;
- 2–4;
- 4–6;
- 6–8;
- 8–10.

Objetivo:

mostrar concentração e dispersão, não classificar aluno.

## Gráfico 2 — Desempenho por escola

Barra horizontal com média por escola e referência da rede.

Se 28 escolas tornarem a visualização pesada:

- mostrar 10 com menor média no recorte;
- texto explícito: “Menores médias no recorte”, nunca “Piores escolas”;
- tabela completa continua abaixo.

## Tabela

Manter:

- média;
- mediana;
- P25/P75;
- amplitude;
- % abaixo do parâmetro.

Não remover estatística em favor de gráfico bonito.

---

# 11. Página de Fluxo e Trajetória

Rota:

`/admin/indicadores/fluxo-trajetoria`

Título:

# Fluxo e Trajetória Escolar

Descrição:

> Onde a distorção idade-série está concentrada e em quais etapas ela começa a crescer?

## KPIs

1. percentual da rede;
2. estudantes em distorção;
3. defasagem severa 4+ anos;
4. estudantes fora do escopo do cálculo.

## Gráfico por série

Manter a leitura atual, mas evoluir para componente gráfico consistente se isso melhorar responsividade/acessibilidade.

Pergunta respondida:

> Em qual série a distorção se concentra?

## Tabela por escola

Ordenar maior percentual primeiro.

Colunas:

- Escola;
- Elegíveis;
- Em distorção;
- %;
- severa 4+;
- fora do escopo.

Adicionar comparação com a rede quando já disponível pela query de comparativos.

## Explicabilidade

O texto longo sobre elegibilidade deve ficar em:

- tooltip/info;
- bloco “Como este indicador é calculado”.

Não ocupar o topo inteiro da tela.

---

# 12. Página Comparativos

Rota:

`/admin/indicadores/comparativos`

Renomear visualmente:

# Comparação entre Escolas e Rede

Descrição:

> Veja cada escola em relação à referência municipal no mesmo recorte, sem usar média simples entre unidades de tamanhos diferentes.

Manter:

- frequência da rede;
- desempenho da rede;
- distorção da rede;
- tabela completa.

Adicionar filtros por “sinal de atenção” somente se puderem reaproveitar o mesmo motor.

### Fora do MVP

- scatter plot frequência × desempenho;
- radar chart;
- índice composto;
- ranking geral.

Esses elementos são visualmente chamativos, mas aumentam risco de interpretação errada e não são necessários para a primeira apresentação.

---

# 13. Qualidade dos Dados

Rota:

`/admin/indicadores/qualidade`

A tela atual já entrega muito valor.

Não redesenhar novamente.

Manter:

- situação por módulo;
- erros;
- completude;
- colisões de turma;
- histórico;
- freshness.

Somente revisar:

- textos;
- hierarquia;
- links de retorno;
- consistência mobile.

---

# 14. Avaliações Municipais

Não criar um “novo módulo de avaliação inteligente”.

Aproveitar o existente.

## Catálogo

`/admin/avaliacoes`

Deixar claro:

- tipo;
- ano;
- etapa;
- cobertura;
- status;
- resultados.

## Detalhe — Visão Geral

Manter cobertura.

Adicionar, quando disponível:

### Resumo da aplicação

Exemplo:

> 82% dos estudantes esperados nas turmas já iniciadas possuem resultado registrado.

## Aba Análise — avaliações objetivas

Usar o que já existe em `getAnaliseItensAvaliacao`.

Mostrar:

### Itens com menor percentual de acerto

Barra horizontal, máximo 10.

### Descritores com menor percentual de acerto

Quando houver descritor.

Texto:

> Estes são os itens/descritores com menor percentual de acerto nesta avaliação. O painel não prescreve intervenção pedagógica; ele aponta onde investigar.

## Fluência leitora

Quando a avaliação usar `NivelFluencia`:

- distribuição por nível;
- quantidade por nível;
- palavras por minuto quando houver dado;
- sem ranking de estudantes.

---

# 15. Texto inteligente — sem LLM

Criar um componente reutilizável somente se houver no mínimo dois usos.

Sugestão:

`ExecutiveSummary`

Ele recebe frases já calculadas e exibe um resumo curto.

Exemplos:

### Central

> 3 escolas apresentam sinais de atenção neste recorte: 2 em frequência e 1 em aprendizagem. Há também 1 módulo de sincronização atrasado.

### Frequência

> 4 escolas estão abaixo da faixa adequada e em queda. 37 estudantes apresentam sequência recente de faltas.

### Aprendizagem

> 5 escolas estão abaixo da referência da rede e possuem proporção elevada de notas abaixo do parâmetro de trabalho.

As frases devem ser construídas deterministicamente a partir das regras.

Nunca chamar API de IA para escrever essas frases.

---

# 16. Pesquisa UX obrigatória com MCP 21st.dev

## Regra de uso

O 21st.dev deve servir para inspiração de:

- hierarquia;
- composição;
- espaçamento;
- densidade;
- responsividade;
- apresentação de tendências;
- cards de alerta;
- tabelas analíticas.

Não usar para substituir o design system atual.

Não copiar um dashboard inteiro.

Não adicionar dependência externa só porque um componente do 21st.dev usa.

## Pesquisas a executar

### Pesquisa A — Central executiva

Buscar:

- `executive analytics dashboard`
- `KPI trend dashboard`
- `analytics overview dashboard`
- `dashboard attention alerts`
- `insight cards`

Selecionar referências para:

- 4 KPIs;
- Attention Now;
- resumo executivo;
- estrutura vertical.

### Pesquisa B — Panorama por escola

Buscar:

- `comparison data table`
- `analytics table status badges`
- `performance comparison table`
- `dashboard data table`

Selecionar referência para:

- densidade da tabela;
- badges;
- comparação;
- filtros.

### Pesquisa C — Frequência

Buscar:

- `time series KPI chart`
- `attendance analytics`
- `trend area chart`
- `risk alert cards`

Selecionar referência para:

- gráfico de evolução;
- card de tendência;
- alertas.

### Pesquisa D — Aprendizagem

Buscar:

- `distribution chart dashboard`
- `horizontal bar analytics`
- `assessment dashboard`
- `performance analytics`

Selecionar referência para:

- histograma;
- barras por escola;
- análise de avaliação.

### Pesquisa E — Avaliações

Buscar:

- `assessment analytics dashboard`
- `test results dashboard`
- `question analysis bar chart`
- `coverage progress dashboard`

## Registro das referências

Criar:

`docs/mvp-indicadores-inteligentes/REFERENCIAS_21ST.md`

Para cada referência:

- nome do componente;
- URL/id retornado pelo MCP;
- o que será reaproveitado;
- o que NÃO será copiado;
- qual tela utilizará a inspiração.

---

# 17. Plano de execução para Claude Code

Criar a pasta:

`docs/mvp-indicadores-inteligentes/`

Arquivos:

- `README.md`
- `PROGRESSO.md`
- `REFERENCIAS_21ST.md`
- `etapas/00-auditoria.md`
- `etapas/01-central-executiva.md`
- `etapas/02-tendencia-frequencia.md`
- `etapas/03-atencao-panorama.md`
- `etapas/04-frequencia.md`
- `etapas/05-aprendizagem.md`
- `etapas/06-fluxo-comparativos.md`
- `etapas/07-avaliacoes.md`
- `etapas/08-hardening-demo.md`

---

# ETAPA 00 — Auditoria e baseline

Sem feature.

## Fazer

1. Ler todos os arquivos listados na seção 0.
2. Confirmar branch/commit atual.
3. Registrar componentes existentes.
4. Registrar queries existentes.
5. Rodar:
   - `npm test`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
6. Registrar baseline.
7. Validar a documentação de redesign: o commit atual indica V1–V9 concluído, então corrigir qualquer status documental antigo que ainda diga `PENDING`.
8. Fazer pesquisa 21st.dev das categorias A–E.
9. Criar `REFERENCIAS_21ST.md`.
10. Não alterar UI nessa etapa.

## Critério de pronto

- baseline conhecido;
- referências registradas;
- nenhuma feature alterada.

---

# ETAPA 01 — Central Executiva

## Meta

Transformar `/admin/indicadores` no Centro de Inteligência Educacional.

## Implementar

- novo título/copy;
- contexto da rede compacto;
- 4 KPIs do “Pulso da rede”;
- remover protagonismo de cards estruturais;
- manter explicabilidade/freshness;
- integrar avaliações recentes;
- integrar resumo compacto de qualidade.

## Arquivos prováveis

- `app/admin/indicadores/page.tsx`
- `lib/queries/indicadores-gerais.ts`
- possivelmente `lib/queries/indicadores-executivos.ts`

Não criar a query nova se a composição puder ser feita limpidamente com as existentes.

## Critério de pronto

Em uma captura da tela, sem rolar muito, o usuário deve entender:

- frequência;
- desempenho;
- distorção;
- faltas recentes;
- principais atenções.

---

# ETAPA 02 — Tendência temporal de frequência

## Meta

Adicionar contexto temporal real.

## Implementar

- query de série da frequência da rede;
- testes da transformação temporal;
- `TimeSeriesChart` compartilhado;
- usar na Central;
- usar em Frequência.

## Critério de pronto

Nenhum sparkline/gráfico pode usar dado mockado em produção.

Sem histórico suficiente -> estado explicativo.

---

# ETAPA 03 — Atenção Agora + Panorama

## Meta

Colocar o motor existente no centro da experiência.

## Implementar

- remover o placeholder atual de “Atenção agora” da Central;
- chamar `getInsightsAtencao`;
- exibir no máximo 5 insights;
- categoria explícita;
- tabela compacta do Panorama;
- badges de sinais por escola;
- filtros por categoria.

## Regra

Nenhum score agregado.

## Testes

Atualizar testes de `lib/analytics/atencao.ts` se o tipo mudar.

---

# ETAPA 04 — Frequência e Permanência

## Implementar

- 4 KPIs;
- tendência temporal;
- donut atual;
- bloco de faltas consecutivas;
- tabela existente;
- revisar textos;
- preservar `ano`.

## Não implementar

- predição de abandono;
- intervenção automática;
- heatmap da rede sem pergunta clara.

---

# ETAPA 05 — Aprendizagem e Desempenho

## Implementar

- KPIs;
- distribuição/histograma;
- barra por escola;
- tabela estatística atual;
- resumo determinístico;
- filtros existentes.

## Regra

Média nunca deve ser a única leitura.

Manter mediana/P25/P75.

---

# ETAPA 06 — Fluxo + Comparativos

## Implementar

- KPIs de distorção;
- visual por série;
- tabela por escola;
- comparação com rede;
- copy explicativa enxuta;
- consolidar tela Comparativos como drill-down completo.

## Não implementar

- ranking geral;
- radar;
- score composto.

---

# ETAPA 07 — Avaliações Municipais

## Implementar

- seção de avaliações recentes na Central;
- melhorar leitura executiva do detalhe;
- gráficos de itens/descritores com menor acerto;
- distribuição de níveis para fluência quando aplicável.

## Regra

Não prescrever ação pedagógica.

Mostrar evidência para investigação.

---

# ETAPA 08 — Hardening e roteiro de demonstração

## Verificar

### Funcional

- ano preservado nos links;
- filtros;
- deep-links;
- RBAC;
- nenhum CPF/PII na Central;
- dados reais;
- null/empty states;
- freshness.

### Acessibilidade

- estado nunca só por cor;
- labels;
- contraste;
- navegação por teclado;
- `prefers-reduced-motion`.

### Responsividade

Verificar no mínimo:

- 375 px;
- 768 px;
- 1440 px.

### Build

Rodar:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

### Demo

Preparar três casos reais:

1. uma escola com situação interessante de frequência;
2. uma situação de aprendizagem ou distorção;
3. uma avaliação municipal real.

Criar:

`docs/mvp-indicadores-inteligentes/ROTEIRO_DEMO.md`

---

# 18. Roteiro recomendado de apresentação

## 1. Centro de Inteligência

Frase:

> A plataforma centraliza os dados que a Secretaria já possui e transforma esses dados em uma visão única da rede.

## 2. Pulso da rede

Frase:

> Aqui a gestão consegue entender rapidamente frequência, aprendizagem, trajetória e sinais recentes de ausência.

## 3. Atenção agora

Frase:

> O sistema não mostra apenas números; ele destaca situações que merecem investigação e explica por quê.

Abrir um caso real.

## 4. Escola

Drill-down.

Frase:

> A partir do sinal da rede, conseguimos chegar à escola e à turma que explicam o resultado.

## 5. Avaliações

Frase:

> Além do SIGEduc, a plataforma incorpora avaliações próprias do município, permitindo analisar cobertura, itens e descritores no mesmo ambiente.

## 6. Qualidade

Frase:

> E cada indicador informa a atualização da sua fonte, para evitar decisão baseada em dado desatualizado.

## 7. Fechamento

Frase:

> Essa é a base. A partir daqui, a priorização dos próximos indicadores e acompanhamentos deve ser definida junto com a gestão da Secretaria.

---

# 19. Definition of Done do MVP

O MVP está pronto somente quando:

- [ ] A Central responde “como está a rede?” em menos de 60 segundos.
- [ ] “Atenção agora” existe dentro da Central.
- [ ] Todo insight explica o motivo.
- [ ] É possível ir de um insight para a escola em um clique.
- [ ] Não há ranking opaco.
- [ ] Não há score agregado de escola.
- [ ] Frequência possui tendência temporal real.
- [ ] Aprendizagem mostra distribuição, não só média.
- [ ] Distorção mostra percentual, concentração por série e escola.
- [ ] Avaliações municipais aparecem na narrativa executiva.
- [ ] Qualidade/freshness está visível sem dominar a tela.
- [ ] Nenhuma nova regra oficial foi inventada.
- [ ] Nenhum dado mockado aparece em produção.
- [ ] Nenhum CPF/PII aparece na visão executiva.
- [ ] Mobile e desktop foram verificados.
- [ ] `npm test` passa.
- [ ] `typecheck` passa.
- [ ] `lint` passa.
- [ ] `build` passa.
- [ ] Existe roteiro de demo com dados reais.

---

# 20. Prompt mestre para iniciar no Claude Code

Use o texto abaixo como instrução inicial:

> Você está trabalhando no repositório `wandskk/smebaraunarn`.
>
> Seu objetivo NÃO é fazer outro redesign geral. O projeto já passou por um redesign visual e já possui `MetricCard`, `InsightCard`, `RingProgress`, `DonutChart`, `MiniBarChart`, `Sparkline`, `EmptyState`, skeletons, Recharts e design tokens. Antes de criar qualquer componente, procure se já existe um equivalente.
>
> A tarefa agora é concluir o MVP do **Centro de Inteligência Educacional**, com foco em hierarquia da informação, contexto, tendência, priorização explicável e drill-down.
>
> Leia integralmente:
> - `docs/mvp-indicadores-inteligentes/README.md`
> - `docs/mvp-indicadores-inteligentes/PROGRESSO.md`
> - `docs/redesign-visual/PLANO_REDESIGN_VISUAL.md`
> - `docs/plano-evolucao-sme/PROGRESSO.md`
> - as páginas e queries de indicadores atuais.
>
> Execute UMA ETAPA POR VEZ.
>
> Antes de implementar a ETAPA 01, use o MCP 21st.dev conforme `REFERENCIAS_21ST.md`. Pesquise referências de dashboard executivo, KPI com tendência, insight/alert cards, tabela comparativa, série temporal, distribuição de desempenho e avaliação. Use as referências somente como inspiração de composição e UX; preserve o design system, tokens, dark mode e componentes atuais.
>
> Regras obrigatórias:
> 1. Não inventar dados.
> 2. Não inventar regra pedagógica oficial.
> 3. Não criar ranking “melhor/pior escola”.
> 4. Não criar score opaco.
> 5. Não adicionar IA generativa.
> 6. Todo indicador precisa ser explicável.
> 7. Todo alerta precisa expor fato, valor, referência, período, motivo e deep-link.
> 8. Reutilizar queries e motores existentes antes de criar novos.
> 9. Não alterar schema Prisma no MVP sem necessidade técnica comprovada e autorização explícita.
> 10. Não inserir credenciais, CPF, senha ou PII em docs, logs, testes ou commits.
> 11. Preservar `ano`/contexto temporal nos drill-downs.
> 12. Estado nunca deve depender apenas de cor.
>
> Ao iniciar cada etapa:
> - leia o Markdown da etapa;
> - descreva brevemente o que pretende mudar;
> - liste os arquivos;
> - implemente em pequenos commits;
> - rode testes relevantes;
> - rode `npm run typecheck`, `npm run lint` e `npm run build`;
> - faça verificação visual desktop/mobile;
> - registre o resultado em `PROGRESSO.md`;
> - pare ao final da etapa e reporte o que foi entregue.
>
> Não avance automaticamente para a etapa seguinte.
