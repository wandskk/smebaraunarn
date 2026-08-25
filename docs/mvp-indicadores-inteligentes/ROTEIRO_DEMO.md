# Roteiro de Demonstração — Centro de Inteligência Educacional

Casos reais do ambiente atual (ano letivo 2026), capturados durante a
verificação da ETAPA 08. Números mudam a cada sincronização — antes de
apresentar, reabra cada URL e confirme que os valores citados ainda
refletem a realidade (ou ajuste o texto falado, nunca os dados).

Roteiro de fala baseado na seção 18 do plano
(`PLANO_MVP_INDICADORES_INTELIGENTES.md`).

---

## 1. Abertura — Centro de Inteligência

**URL:** `/admin/indicadores?ano=2026`

> "A plataforma centraliza os dados que a Secretaria já possui e
> transforma esses dados em uma visão única da rede."

Mostrar a linha de contexto (`3.926 estudantes · 28 escolas · 135 turmas ·
Ano letivo 2026`) e os 4 KPIs do Pulso da rede.

## 2. Pulso da rede

> "Aqui a gestão consegue entender rapidamente frequência, aprendizagem,
> trajetória e sinais recentes de ausência."

- Frequência média da rede: **86,0%**, queda de **1,1 p.p.** nos últimos
  30 dias.
- Desempenho médio: **7,0**, com **17%** das notas abaixo do parâmetro de
  trabalho.
- Distorção idade-série: **6,9%** (160 estudantes elegíveis em distorção).
- Faltas consecutivas agora: **212 estudantes**, **41 críticos**.

## 3. Atenção agora — Caso 1 (Frequência)

> "O sistema não mostra apenas números; ele destaca situações que merecem
> investigação e explica por quê."

**Caso real:** Centro Municipal de Educação de Jovens e Adultos de
Baraúna — CEJAB.

- Card em "Atenção agora": **Frequência · Crítico** — "CEJAB: frequência
  57,9%, -0,9 p.p. vs período anterior." Motivo: "Frequência na faixa
  'critica' e em queda no período mais recente."
- Clicar "Investigar escola" → abre a ficha da escola com o ano
  preservado.
- Complementar em `/admin/indicadores/frequencia?ano=2026`, bloco
  "Ausências que exigem investigação": CEJAB aparece com **26 estudantes**
  em sequência recente de faltas.

> "A partir do sinal da rede, conseguimos chegar à escola e à turma que
> explicam o resultado."

## 4. Caso 2 — Trajetória (distorção idade-série)

**Caso real:** Escola Municipal de 1º Grau Rui Barbosa.

**URL:** `/admin/indicadores/fluxo-trajetoria?ano=2026`

- Maior distorção da rede: **17,3%**, **+10,4 p.p.** acima da referência
  de rede — a maior diferença entre todas as 28 escolas.
- 8 estudantes em defasagem severa (4+ anos) nesta escola.
- Mostrar o gráfico "Por série" (em qual série a distorção se concentra)
  e o bloco `<details>` "Como este indicador é calculado" — explicabilidade
  sem poluir o topo da tela.

Alternativa de Aprendizagem, se o tempo permitir:
`/admin/indicadores/aprendizagem?ano=2026` → gráfico "Menores médias no
recorte", Escola Municipal de 1º Grau Manoel de Barros com nota 6,5 e 25%
das notas abaixo do parâmetro.

## 5. Caso 3 — Avaliação municipal real

**Caso real:** SPADEB 2026 — 9º Ano (`SPADEB-2026-9ANO`).

**URL:** `/admin/avaliacoes/cmt7rw8li02rb5qyrp8qgchm1?tab=analise` (id
pode mudar se a avaliação for recriada — confirmar pelo catálogo em
`/admin/avaliacoes` antes de apresentar).

> "Além do SIGEduc, a plataforma incorpora avaliações próprias do
> município, permitindo analisar cobertura, itens e descritores no mesmo
> ambiente."

- Aba Visão Geral: "48%" → trocar pelo número real do dia; mostrar a frase
  executiva "X% dos estudantes esperados nas turmas já iniciadas possuem
  resultado registrado."
- Aba Análise: gráfico "Itens com menor percentual de acerto" — Questão 35
  (Matemática) com **19%** de acerto, a pior da prova. Ler o texto fixo:
  "O painel não prescreve intervenção pedagógica; ele aponta onde
  investigar."
- Se houver tempo, mostrar também uma avaliação de Fluência Leitora
  (`LEITOR-FLUENTE-PARC-2026`) e sua distribuição por nível — sem ranking
  de estudante.

## 6. Qualidade dos dados

**URL:** `/admin/indicadores/qualidade` (link "Abrir qualidade dos dados"
a partir do bloco "Confiabilidade dos dados" na Central).

> "E cada indicador informa a atualização da sua fonte, para evitar
> decisão baseada em dado desatualizado."

Mostrar o resumo compacto na Central ("5 de 6 módulos em dia") e o
detalhe completo na tela de qualidade (módulo Estudantes com execução
travada em "PROCESSANDO" no momento da verificação — bom exemplo real de
"Qualidade dos dados · Crítico" aparecendo também em "Atenção agora").

## 7. Fechamento

> "Essa é a base. A partir daqui, a priorização dos próximos indicadores e
> acompanhamentos deve ser definida junto com a gestão da Secretaria."

---

## Checklist antes de apresentar

- [ ] Reabrir cada URL acima e confirmar que os números citados ainda
      batem com a tela (ou anotar os novos valores).
- [ ] Confirmar login como Admin/Secretaria válido.
- [ ] Testar ao menos uma vez em tela cheia (1440px) e uma vez em notebook
      menor/tablet, se a apresentação for nesses dispositivos.
- [ ] Ter `/admin/avaliacoes` aberto em outra aba como plano B, caso o id
      da avaliação de exemplo tenha mudado.
