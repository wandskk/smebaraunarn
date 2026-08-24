# Plano de Evolucao MVP - Aluno

> Extraido automaticamente do XML interno do DOCX (word/document.xml) na ETAPA 00. Este texto e um extrato de apoio; o DOCX original em ../Plano_Evolucao_MVP_Aluno_SME_Barauna.docx permanece a fonte funcional de referencia.

SME BARAÚNA
## Plano de Evolução do MVPPerfil Aluno
Centro de Avaliação Municipal, Indicadores Educacionais e Dados Integrados ao SIGEduc
24 de agosto de 2026
## 1. Resumo executivo
Conclusão principal. O portal do aluno já resolve três necessidades objetivas: consultar boletim, consultar frequência e emitir declaração de matrícula. A próxima evolução deve evitar adicionar menus por adicionar e, em vez disso, transformar a home e as páginas acadêmicas em uma leitura simples de “como estou agora, o que mudou e o que preciso observar”.
Regra de produto proposta: para o Aluno/Responsável, todo número deve responder “de qual período é?”, “o que significa?” e “há algo que preciso acompanhar?”, sem ranking entre estudantes e sem rótulos estigmatizantes.
## 2. Mapa atual do perfil Aluno

## 3. Perguntas que o portal deve responder

## 4. Princípios de UX específicos para Aluno/Responsável
Linguagem direta. “Frequência neste bimestre”, “média parcial”, “resultado da avaliação” são melhores que termos analíticos internos.
Sem ranking de aluno contra aluno. Comparações pessoais devem usar expectativa/meta/critério oficial, não posição na turma.
Sem “score de risco” no portal do aluno. Se houver um sinal objetivo, descrevê-lo: “3 dias letivos seguidos com falta”.
Período sempre visível. O mesmo percentual não pode mudar de significado sem o usuário perceber.
Dados ausentes devem aparecer como “sem dados no período”, nunca como 0 ou 100 por conveniência.
Minimização de dados pessoais. NIS, filiação e outros identificadores não precisam ocupar a home se não ajudam numa tarefa imediata.
O portal deve funcionar bem para responsável em celular: cards curtos, tabelas responsivas e ação principal evidente.
## 5. Base compartilhada e o que deve ser reaproveitado
A arquitetura atual já favorece compartilhamento. O correto é aprofundar essa direção e evitar uma “versão Aluno” separada de componentes acadêmicos que já existem no Admin/Direção/Professor.

## 6. Evolução detalhada por rota
### 6.1 /portal/aluno - Home
Hoje: saudação, matrícula/turma/escola, três cards de navegação e um bloco de Responsável/Filiação/NIS. É limpa, mas funciona como menu e não como resumo da situação acadêmica.
Adicionar “Resumo deste período”: frequência, disciplinas com notas lançadas, média parcial geral apenas se a regra for aprovada, e última avaliação municipal disponível.
Mostrar “Atualizado em” por fonte: frequência/notas podem ter datas distintas.
Adicionar 1-3 mensagens simples e objetivas: “Nenhuma falta nos últimos 7 dias”; “2 disciplinas receberam notas nesta unidade”; “Resultado da Fluência disponível”.
Mover NIS e filiações para um bloco recolhível “Dados cadastrais” ou Minha Conta/Perfil. A home deve priorizar tarefas, não cadastro.
Se houver dado ausente, mostrar estado neutro e ação: “Ainda não há frequência sincronizada para este período”.
Preservar os atalhos atuais - eles continuam sendo uma navegação boa para mobile.
### 6.2 /portal/aluno/boletim - Boletim
Hoje: a rota aceita ?ano, mas não existe seletor visível. As notas são agrupadas por disciplina e a média é a média apenas das unidades existentes.
Adicionar seletor de ano letivo com anos realmente disponíveis para a matrícula.
Diferenciar “média parcial” de “média consolidada”. Se só existem 1ª e 2ª unidades, não rotular o resultado como se o ano estivesse fechado.
Adicionar completude: “2/4 unidades lançadas” por disciplina.
Não pintar “aprovado/reprovado” até a Secretaria confirmar regra oficial de média, recuperação e fechamento.
Opcional P1: mini tendência por unidade, sem transformar a tela em dashboard pesado.
Adicionar fonte e última sincronização de NOTAS no rodapé/tooltip.
### 6.3 /portal/aluno/frequencia - Frequência
Esta é a rota que mais precisa de correção antes de ganhar novas features. Hoje ela lê os 90 registros mais recentes, soma aulas/faltas e chama isso de “frequência no período”, mas o período não é temporalmente definido.
P0: trocar take: 90 por janela explícita: bimestre, mês, 30/60/90 dias ou intervalo - sempre filtrando por data.
P0: quando totalAulas = 0, mostrar “sem dados”, não 100%. Hoje a página usa 100 como fallback.
P0: “Faltas abonadas” hoje conta linhas com abonada=true. Se uma linha representar múltiplas aulas/faltas, o rótulo pode divergir do total real. Somar a quantidade de faltas abonadas ou renomear para “registros abonados”.
Adicionar seletor de período e preservar o mesmo recorte nos cards e na tabela.
Adicionar tendência vs período anterior, reutilizando calcularVariacaoFrequencia.
Adicionar sequência atual de faltas por dia letivo, reutilizando faltasConsecutivasAtuais após agregação diária.
Adicionar resumo por disciplina apenas quando houver volume suficiente e o dado fizer sentido para o responsável.
Fonte/última atualização deve referenciar o último SUCESSO de FREQUENCIA, não um log genérico.
### 6.4 /portal/aluno/declaracao - Declaração de Matrícula
Hoje: mostra matrícula/nome e baixa o PDF oficial diretamente pela API do SIGEduc para o ano corrente.
Manter a rota simples; ela já resolve bem a tarefa principal.
Adicionar seletor de ano se a API permitir declaração histórica e houver matrícula naquele ano.
Melhorar estados de erro: “SIGEduc indisponível no momento; tente novamente” + orientação de contato da escola/Secretaria quando necessário.
Não armazenar PDF permanente no MVP sem necessidade; o fluxo atual reduz duplicação e mantém a origem oficial.
No mobile, manter um único botão primário de download e metadados essenciais.
### 6.5 /conta - Minha Conta
É uma rota autenticada compartilhada entre todos os papéis. Não deve ser duplicada dentro de /portal/aluno.
Manter mudança de senha compartilhada.
Se futuramente existir edição de telefone/e-mail, separar claramente “dados que posso editar” de “dados vindos do SIGEduc”.
Não permitir alteração local de dados acadêmicos/cadastrais cuja fonte de verdade é o SIGEduc.
## 7. Nova rota recomendada: Avaliações Municipais
A maior lacuna funcional do perfil Aluno é não conseguir enxergar os resultados que o próprio módulo de Avaliações Municipais já registra no banco. O schema atual já relaciona AvaliacaoResultadoAluno ao estudante, com pontuação, nível de desempenho, palavras por minuto, respostasJson e observações.
### 7.1 /portal/aluno/avaliacoes
Lista cronológica das avaliações em que o estudante possui resultado.
Filtros simples por ano e tipo: Fluência Leitora, SPADEB, Simulado e Prova Municipal.
Card por avaliação: nome, data/ano, pontuação quando aplicável, nível e chamada “ver detalhes”.
Sem ranking de posição na turma/rede. Para o aluno, o foco é interpretação do resultado e evolução pessoal.
Estado “resultado ainda não disponível” somente quando houver uma aplicação conhecida para aquela etapa/turma; evitar criar expectativa sem base.
### 7.2 /portal/aluno/avaliacoes/[id] - Resultado
Resumo da avaliação e explicação do que foi medido.
Fluência: nível atual + palavras por minuto + explicação da escala, quando formalmente validada pela SME.
Provas/simulados: pontuação total e, se respostasJson estiver estruturado, acertos por questão/descritor sem expor gabaritos indevidos de avaliações ainda ativas.
Evolução pessoal quando existirem aplicações comparáveis do mesmo tipo/etapa.
Mensagem pedagógica neutra: “habilidades que merecem mais atenção” em vez de “fraquezas”.
Fonte, data da aplicação/importação e observações relevantes.
## 8. Correções de dado e consistência antes de expandir

## 9. Padrão visual compartilhado entre perfis
O perfil Aluno deve usar o mesmo design system, mas não a mesma densidade de informação do Admin. Reaproveitar componente não significa reaproveitar todas as colunas ou todos os indicadores.
PageHeader: mesmo componente; no Aluno, descrição curta e humana.
MetricCard: mesmo componente; limitar a 2-4 números realmente úteis.
DataTable: mesmo componente; no mobile, considerar cards/stack para boletim e frequência se a tabela ficar larga.
Badge/faixas: reutilizar somente se a faixa tiver definição oficial e linguagem adequada ao aluno.
Explicabilidade: a mesma ficha técnica pode gerar tooltip detalhado no Admin e texto simplificado no Aluno.
Contexto de período: mesmo componente e mesma query param entre Admin, Direção, Professor e Aluno sempre que fizer sentido.
## 10. Matriz inicial de reaproveitamento entre os 5 perfis

Observação: as colunas de Diretor, Professor e Servidor Geral são uma hipótese arquitetural inicial baseada nas rotas atuais. Serão confirmadas/ajustadas nos próximos documentos, perfil por perfil, como você pediu.
## 11. Backlog priorizado - Perfil Aluno

## 12. Sequência recomendada de implementação

## 13. Critérios de homologação do perfil Aluno
O percentual de frequência do Aluno deve bater exatamente com a ficha do mesmo estudante no Admin quando ano/período forem iguais.
Sem registros de aula no período = “sem dados”, nunca 100%.
Média do boletim deve indicar se é parcial e quais unidades existem.
Trocar ano/período deve atualizar cards, tabela e URL de forma coerente.
Nenhum estudante pode acessar dados de outro estudante alterando URL/query params.
Resultados de avaliação exibidos ao aluno devem ser somente do próprio estudante.
Dados pessoais de baixo valor operacional não devem dominar a home.
Mobile: navegação, boletim, frequência e download de declaração devem funcionar sem overflow impeditivo.
Todo número acadêmico deve informar fonte/período/atualização em linguagem apropriada.
## 14. Inventário técnico das rotas atuais

Próximo perfil após aprovação deste documento: DIRETOR.

---

### Tabelas do documento

**Tabela 1**

| ObjetivoTransformar o portal do Aluno/Responsável em uma experiência simples, confiável e útil para acompanhar aprendizagem, frequência e avaliações municipais sem expor complexidade administrativa nem produzir interpretações enganosas. |
| --- |

**Tabela 2**

| Escopo desta versãoAuditoria do perfil ALUNO a partir do branch main do repositório wandskk/smebaraunarn, das rotas atuais do portal e do histórico de QA registrado no próprio projeto. O ambiente desta sessão bloqueou a navegação automatizada no domínio de produção antes da página de login; por isso, qualquer observação visual de produção é marcada como pendente de homologação, sem inventar navegação. |
| --- |

**Tabela 3**

| O que já está bem resolvidoLogin unificado; escopo por estudante da sessão; navegação curta; boletim por disciplina/unidade; frequência nominal; declaração oficial obtida do SIGEduc; design system compartilhado com os demais portais. | Maior oportunidade de valorAdicionar contexto temporal correto, resumo acadêmico na home e resultados das Avaliações Municipais. O aluno/responsável não precisa de “indicadores da rede”; precisa de informação pessoal clara e confiável. |
| --- | --- |

**Tabela 4**

| Rota | Hoje | Evolução proposta | Prio. |
| --- | --- | --- | --- |
| /portal/aluno | Home com dados básicos e atalhos | Adicionar resumo acadêmico, atualização e próximos pontos de atenção | P0 |
| /portal/aluno/boletim | Notas por disciplina e 1ª-4ª unidade | Ano selecionável, média parcial explícita, completude e leitura por disciplina | P0 |
| /portal/aluno/frequencia | 90 registros mais recentes + cards | Trocar N registros por período real; corrigir sem dados/abonadas; tendência e resumo por disciplina | P0 |
| /portal/aluno/declaracao | Download da declaração do ano corrente | Escolha de ano disponível, estado de falha e orientação clara | P1 |
| /conta | Alteração de senha compartilhada | Manter compartilhada; nenhuma duplicação no portal Aluno | Manter |
| Nova: /portal/aluno/avaliacoes | Não existe | Resultados de Fluência, SPADEB, simulados/provas municipais com explicabilidade | P1 |

**Tabela 5**

| Domínio | Pergunta | Rota de resposta |
| --- | --- | --- |
| Resumo | Como está minha situação escolar neste período? | Home |
| Boletim | Quais notas já foram lançadas? A média exibida é parcial ou consolidada? | Boletim |
| Frequência | Qual é minha frequência no mês/bimestre? Ela está melhorando ou piorando? | Frequência |
| Faltas | Tenho sequência recente de faltas? Houve abono? | Frequência |
| Avaliação municipal | Qual foi meu resultado na Fluência/SPADEB/simulado? O que esse nível significa? | Avaliações |
| Histórico | Consigo consultar outro ano letivo sem editar a URL manualmente? | Boletim / Avaliações / Declaração |
| Atualização | Quando esses dados foram atualizados pelo SIGEduc? | Todas as páginas de dado |
| Privacidade | Quais dados pessoais realmente precisam aparecer na tela inicial? | Home / Minha Conta |

**Tabela 6**

| Núcleo | Base atual | Perfis que reaproveitam | Decisão |
| --- | --- | --- | --- |
| Shell e navegação | PortalAppShell, PortalSidebar, PortalTopbar, UserMenu | Aluno, Direção, Professor; Servidor usa topbar sem sidebar | Reutilizar sem fork |
| Cabeçalhos e cards | PageHeader, Card, SectionCard, MetricCard | Todos os perfis | Reutilizar |
| Tabelas | DataTable + primitives | Admin, Aluno, Direção, Professor | Reutilizar |
| Resumo acadêmico do estudante | Hoje existe lógica em AlunoDetalhe e páginas do Aluno | Admin, Direção, Professor, Aluno | Extrair subcomponentes reutilizáveis |
| Boletim | Tabela disciplina/unidades/média | Admin ficha do aluno + Aluno + Direção/Professor quando autorizado | Um único GradeTable |
| Frequência | Cálculo/summary + histórico | Admin ficha do aluno + Aluno + Direção/Professor | Um único AttendanceSummary/AttendanceTable |
| Avaliações municipais | AvaliacaoResultadoAluno já liga avaliação ao estudante | Admin, Direção e Aluno; Professor conforme escopo | Criar componentes compartilháveis |
| Contexto temporal | Ano/período/fonte/atualização | Todos os perfis analíticos | Um único AcademicContextBar |

**Tabela 7**

| Direção de arquiteturaA mesma informação acadêmica deve ser calculada por uma query/serviço comum e renderizada em componentes comuns. O que muda entre Admin, Direção, Professor e Aluno é escopo e permissão - não a fórmula da frequência, a média ou o componente de boletim. |
| --- |

**Tabela 8**

| Regra metodológicaAusência de nota não deve virar zero. O sistema atual corretamente ignora unidade ausente na média; o problema é de comunicação: o usuário precisa saber que a média é parcial. |
| --- |

**Tabela 9**

| Reaproveitamento diretoEssa nova área usa a mesma Avaliacao/AvaliacaoResultadoAluno do Admin e, mais tarde, os mesmos componentes de resultado poderão aparecer para Direção e Professor com escopo ampliado. Não é um módulo novo: é uma nova visão segura do mesmo dado. |
| --- |

**Tabela 10**

| Prio. | Achado | Impacto | Correção |
| --- | --- | --- | --- |
| P0 | Frequência sem aulas retorna 100% | Na página do aluno, totalAulas=0 usa fallback 100. | Retornar null e exibir “sem dados no período”. |
| P0 | Janela de frequência = 90 registros | Registros não equivalem a dias nem período fixo. | Filtrar por data e exibir período explícito. |
| P0 | Abonadas contam registros | filter(abonada).length mede linhas, não necessariamente faltas/aulas abonadas. | Somar falta quando abonada ou renomear métrica. |
| P0 | Contexto temporal fragmentado | Boletim usa ano; frequência não usa ano/período selecionável. | AcademicContextBar compartilhado. |
| P1 | Média do boletim sem status parcial | Média ignora unidades ausentes, corretamente, mas parece final. | Exibir “média parcial” + x/4 unidades. |
| P1 | Última atualização ausente | Aluno não sabe se o dado é de hoje ou está atrasado. | Usar último SUCESSO do módulo correspondente. |
| P1 | NIS exposto na home | Dado cadastral sensível/baixo valor para tarefa diária. | Mover para Dados cadastrais recolhíveis. |

**Tabela 11**

| Núcleo | Admin | Aluno | Diretor | Professor | Servidor Geral |
| --- | --- | --- | --- | --- | --- |
| App shell / topbar / conta | Compartilhado | Compartilhado | Compartilhado | Compartilhado | Compartilhado |
| Escola - ficha/indicadores | Completo | Somente nome/contexto | Completo da própria escola | Contexto da própria escola | Somente lotação |
| Turma - resumo | Completo | Somente própria turma | Completo da escola | Próprias turmas | Somente se aplicável |
| Estudante - ficha acadêmica | Completo | Próprio estudante | Estudantes da escola | Estudantes autorizados das turmas | Não |
| Boletim / notas | Completo | Próprio | Por escola/estudante | Por turma/estudante | Não |
| Frequência | Rede→aluno | Própria | Escola→aluno | Turma→aluno | Não |
| Avaliação municipal | Gestão completa | Próprio resultado | Resultados da escola | Resultados das turmas autorizadas | Não |
| Sincronização/qualidade | Completo | Somente “atualizado em” | Somente atualização | Somente atualização | Não |

**Tabela 12**

| Prio. | Entrega | Valor |
| --- | --- | --- |
| P0 | Corrigir frequência sem dados = 100% | Confiabilidade |
| P0 | Substituir 90 registros por período temporal explícito | Confiabilidade |
| P0 | Corrigir métrica de abonadas | Confiabilidade |
| P0 | Criar contexto compartilhado de ano/período | Consistência |
| P0 | Home com resumo do período + atualização por fonte | Valor percebido |
| P0 | Boletim com seletor de ano e média parcial explícita | Clareza |
| P1 | Adicionar /portal/aluno/avaliacoes | Valor pedagógico |
| P1 | Resultado detalhado da avaliação + evolução pessoal | Valor pedagógico |
| P1 | Tendência e faltas consecutivas na frequência | Acompanhamento |
| P1 | Mover NIS/filiação para dados cadastrais secundários | Privacidade/UX |
| P1 | Declaração com ano/erro orientado | Serviço |
| P2 | Otimização mobile de tabelas para cards responsivos | UX |
| P2 | Mensagens contextuais na home (“o que mudou”) | Engajamento |

**Tabela 13**

| # | Etapa | Critério |
| --- | --- | --- |
| 1 | Corrigir semântica da frequência | P0 - antes de qualquer nova tela analítica do aluno. |
| 2 | Criar AcademicContextBar + helpers de período | Base compartilhada para Aluno, Direção, Professor e Admin. |
| 3 | Refatorar GradeTable e AttendanceSummary/Table | Extrair a duplicação já existente em páginas/fichas. |
| 4 | Evoluir home do Aluno | Resumo do período usando os mesmos serviços compartilhados. |
| 5 | Melhorar Boletim | Ano, completude, média parcial e atualização. |
| 6 | Adicionar Avaliações Municipais | Maior ganho funcional novo com schema já existente. |
| 7 | Ajustar Declaração e dados cadastrais | Refino de serviço e privacidade. |
| 8 | Homologar no usuário real de teste | Desktop + mobile; comparar números com Admin no mesmo estudante/período. |

**Tabela 14**

| Rota | Arquivo atual | Responsabilidade |
| --- | --- | --- |
| /portal/aluno | app/portal/aluno/page.tsx | Home e dados cadastrais |
| /portal/aluno/boletim | app/portal/aluno/boletim/page.tsx | Notas por ano |
| /portal/aluno/frequencia | app/portal/aluno/frequencia/page.tsx | 90 registros de frequência |
| /portal/aluno/declaracao | app/portal/aluno/declaracao/page.tsx | Solicitação de PDF |
| /portal/aluno/declaracao/download | app/portal/aluno/declaracao/download/route.ts | Proxy autenticado para SIGEduc |
| /conta | rota compartilhada | Senha do usuário |

**Tabela 15**

| FechamentoO perfil Aluno não precisa ganhar dezenas de features. O MVP fica mais completo quando passa a oferecer quatro coisas muito bem: situação atual, histórico coerente, frequência confiável e resultados das avaliações municipais. A maior parte da infraestrutura necessária já existe e deve ser reaproveitada nos próximos perfis. |
| --- |