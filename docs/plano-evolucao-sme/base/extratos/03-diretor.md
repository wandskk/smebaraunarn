# Plano de Evolucao MVP - Diretor

> Extraido automaticamente do XML interno do DOCX (word/document.xml) na ETAPA 00. Este texto e um extrato de apoio; o DOCX original em ../Plano_Evolucao_MVP_Diretor_SME_Barauna.docx permanece a fonte funcional de referencia.

SME BARAÚNA
## Plano de Evolução do MVPPerfil Diretor
Centro de Avaliação Municipal, Indicadores Educacionais e Dados Integrados ao SIGEduc
24 de agosto de 2026
## 1. Resumo executivo
Conclusão principal. O portal da Direção já possui um bom esqueleto: escopo travado por escola, servidores, turmas, estudantes, notas, frequência e avaliações municipais. A evolução correta não é criar um “Admin menor”, mas reaproveitar a ficha inteligente da escola e os mesmos motores analíticos do Admin, fixando o contexto na unidade do diretor e removendo ações que pertencem à Secretaria.

## 2. Mapa atual do perfil Diretor

## 3. Perguntas que o Diretor precisa responder

## 4. Achados críticos de consistência

## 5. Arquitetura de reaproveitamento
O Diretor é o perfil que mais demonstra por que o sistema deve compartilhar entidades e motores analíticos. A escola vista pelo Diretor é a mesma escola vista pelo Admin; não deve existir uma segunda fórmula ou uma segunda ficha técnica para ela.

## 6. Evolução detalhada por rota
### 6.1 /portal/direcao - Painel da Direção
Hoje: cinco MetricCards com quantidade de servidores, estudantes, notas, registros de frequência e resultados de avaliações. É funcional como inventário, mas não ajuda a decidir o que fazer primeiro.
Substituir a prioridade visual dos contadores por 4-6 indicadores de gestão: estudantes, frequência no período, desempenho no período, cobertura da avaliação ativa, turmas com queda e qualidade/atualização dos dados.
Criar “Atenção agora” com 3-5 achados objetivos e clicáveis: turma com maior queda de frequência; alunos com faltas consecutivas; avaliação com baixa cobertura; turma com desempenho abaixo da referência.
Mostrar comparação simples Escola vs Rede e Atual vs Período anterior. Não expor ranking nominal de outras escolas.
Adicionar DataFreshnessBadge por domínio; um sync de CARGOS não deve fazer NOTAS parecerem atualizadas.
Manter contadores de servidores/estudantes como informação secundária ou no bloco “Estrutura da escola”.
O período selecionado deve ser preservado ao clicar em Frequência, Notas, Turma ou Aluno.
### 6.2 /portal/direcao/servidores - Equipe da escola
Manter busca por nome e as colunas Cargo/Função/Vínculo/Status - elas já têm valor operacional.
Adicionar filtros: cargo, função, vínculo, status e atuação em turma/disciplina.
Criar /portal/direcao/servidores/[id] reaproveitando a ficha funcional proposta no Admin, mas exibindo somente dados necessários à gestão escolar.
Na ficha: matrícula funcional, cargo, função, vínculo, status, turmas, série, turno, disciplina e carga de trabalho via ServidorTurma.
Não exibir CPF completo por padrão. O perfil atual já evita isso e deve continuar assim.
Distinguir dado vindo do SIGEduc de qualquer vínculo/ajuste de escola feito administrativamente no sistema.
### 6.3 /portal/direcao/turmas - Lista de turmas
Evoluir os cards de “nome + nº alunos” para um resumo operacional: alunos, frequência no período, média/mediana quando disponível, cobertura da avaliação e tendência.
Adicionar filtros por série/etapa/turno e busca por nome/código.
Ordenação útil: maior queda de frequência, menor desempenho, maior pendência de avaliação ou alfabética.
Usar cor apenas para sinal objetivo e metodologicamente validado; evitar pintar toda turma como “crítica” por um score composto.
Cada card deve manter o contexto temporal ao abrir a turma.
### 6.4 /portal/direcao/turmas/[turma] - Ficha da turma
Hoje: frequência agregada, faltas, quantidade de disciplinas com nota, médias por disciplina e lista de alunos. A estrutura é boa, mas a semântica temporal precisa ser corrigida antes de acrescentar inteligência.
P0: frequência deve usar o mesmo ano/período das notas. Hoje ela agrega todo o histórico disponível da turma.
Adicionar tendência de frequência vs período anterior e alunos com 3/5/10 dias letivos consecutivos de falta, com limiares configuráveis pela rede.
Adicionar distribuição de aprendizagem: média, mediana, P25/P75 e proporção abaixo do limiar oficial/provisório claramente identificado.
Adicionar bloco “Professores desta turma” usando ServidorTurma: disciplina, turno e carga de trabalho.
Adicionar “Avaliações Municipais”: cobertura da turma, resultados por nível e, quando respostasJson estiver estruturado, habilidades/descritores com menor acerto.
Na lista de alunos, acrescentar sinais objetivos (queda recente, faltas consecutivas, avaliação pendente) sem rótulo permanente de “aluno de risco”.
Reutilizar exatamente a mesma ficha da turma no Admin e, depois, no Professor, apenas mudando o escopo.
### 6.5 /portal/direcao/estudantes e /alunos/[id]
Lista: filtros por turma/série, frequência, faltas consecutivas, situação de avaliação e sinais de queda de desempenho.
Evitar CPF e outros identificadores sensíveis na listagem; nome, matrícula, turma e responsável já são suficientes para a rotina.
Padronizar rota futura para /portal/direcao/estudantes/[id]; manter redirect da rota /alunos/[id] para não quebrar links existentes.
Detalhe: reutilizar StudentAcademicDetail com abas Visão Geral | Frequência | Aprendizagem | Avaliações | Trajetória.
P0: substituir “90 registros” por período explícito, igual ao documento do Aluno.
Adicionar avaliação municipal do estudante, permitindo ao Diretor sair do agregado da turma e entender o caso individual.
A query do detalhe deve receber escolaId e alunoId, aplicando o escopo já no banco como defesa em profundidade.
### 6.6 /portal/direcao/notas - Aprendizagem
Hoje: média ponderada pela quantidade de lançamentos da escola e tabelas por turma/disciplina. A rota aceita ?ano, mas não oferece um seletor visível.
Adicionar seletor de ano e unidade/bimestre, mais filtros de turma, série e disciplina.
Mostrar média + mediana + distribuição. Duas turmas com média 7,0 podem ter perfis totalmente diferentes.
Adicionar comparação com referência da rede no mesmo ano/período, sem transformar a página em ranking de escolas.
Exibir completude: quantos estudantes/notas esperados já possuem lançamento naquele recorte.
Diferenciar “média de lançamentos” de “média por estudante” quando necessário; definir uma métrica oficial para comparações.
Drill-down Turma → disciplina → estudantes deve preservar filtros.
### 6.7 /portal/direcao/frequencia - Frequência
A página atual já filtra a frequência a partir de 1º de janeiro do ano corrente, o que é melhor que a ficha da turma; ainda assim, o recorte anual é pouco acionável.
Adicionar períodos 7/30/60/90 dias, bimestre e intervalo, comparando com período anterior equivalente.
Ordenar por pior frequência ou maior queda, além da ordem alfabética.
Drill-down Escola → Turma → Estudante com contexto preservado.
Exibir quantidade de aulas/registros como cobertura do cálculo; baixa cobertura reduz a confiança na comparação.
Adicionar faltas consecutivas e diferenciar “frequência baixa estável” de “queda recente”.
### 6.8 /portal/direcao/avaliacoes - Avaliações Municipais
É a maior oportunidade de evolução funcional do Diretor. Hoje a tela pega somente os 100 resultados mais recentes da escola e agrupa por nome da avaliação.
P0: trocar a tela de resultados soltos por catálogo de avaliações aplicáveis à escola: nome, tipo, ano, etapa, status e cobertura.
P0: remover o take: 100 global. Resultados devem ser paginados dentro da avaliação selecionada.
P0: agrupar por ID/código/ano da avaliação; nomes iguais em edições diferentes não podem ser misturados.
Criar /portal/direcao/avaliacoes/[id] com abas Visão Geral | Cobertura | Resultados | Análise.
Cobertura: esperados, realizados, %, turmas completas e pendentes. A ação do diretor é operacionalizar a aplicação, não apenas ler notas.
Resultados: filtros por turma e nível; Fluência mostra distribuição por nível e palavras/min quando aplicável.
Análise: questão/descritor/habilidade quando respostasJson passar a ser preenchido e descritores forem estruturados.
Permissão: manter leitura/diagnóstico como padrão. Qualquer edição/importação pela escola deve depender de decisão explícita da SME; não duplicar automaticamente as ações do Admin.
## 7. Vínculo do Diretor à escola e governança de acesso
O próprio layout do portal implementa um estado especial quando session.escolaId está vazio e explica que, no SIGEduc, cargos de direção podem ficar vinculados à Secretaria em vez da unidade. Isso torna o vínculo de escola uma dependência operacional do produto, não um detalhe técnico.
Na tela Admin > Usuários e Acessos, tornar “Diretor sem escola vinculada” um filtro/alerta explícito.
Exibir a origem do vínculo: “SIGEduc” ou “definido no SME”.
Ao trocar o diretor de unidade, registrar quem alterou, escola anterior, nova escola e data quando LogAuditoriaLGPD for implementado.
Nunca inferir escola apenas pelo nome do cargo; o vínculo deve ser explícito e auditável.
Ao fazer login sem escola, manter a mensagem atual, mas incluir canal/orientação institucional de regularização em vez de deixar o usuário sem próximo passo operacional.
## 8. Matriz de reaproveitamento entre Admin, Aluno e Diretor

## 9. Hipótese para Professor e Servidor Geral após esta etapa
Com Admin, Aluno e Diretor analisados, já é possível reduzir a incerteza dos próximos perfis. A matriz abaixo ainda será validada nos documentos seguintes.

## 10. Backlog priorizado - Perfil Diretor

## 11. Sequência recomendada de implementação

## 12. Critérios de homologação do Diretor
O Diretor nunca visualiza estudante, servidor ou detalhe de outra escola alterando URL/params.
O mesmo indicador da mesma escola e período deve ter valor idêntico no Admin e no Diretor.
Turma: notas e frequência usam exatamente o mesmo contexto temporal visível.
Painel não mistura contagens históricas com métricas do ano/período sem rotulagem explícita.
Avaliações não perdem resultados por limite global e não misturam edições de mesmo nome.
Cobertura de avaliação apresenta esperado, realizado e percentual com denominador explicável.
Frequência sem aulas = sem dados; baixa cobertura precisa ser visível.
Todo insight de “Atenção agora” contém evidência numérica e link para o detalhe que o explica.
Filtros relevantes permanecem na URL e sobrevivem ao drill-down escola → turma → aluno.
Dados pessoais que não ajudam à gestão não aparecem por padrão.
Conta DIRETOR sem escola possui fluxo de regularização claro e não acessa dados até o vínculo existir.
## 13. Inventário técnico confirmado

Próximo perfil após aprovação deste documento: PROFESSOR.

---

### Tabelas do documento

**Tabela 1**

| ObjetivoTransformar o portal da Direção em um cockpit operacional e pedagógico da própria escola: o diretor deve saber rapidamente o que merece atenção, por quê, em qual turma/aluno e com que atualização, sem receber a complexidade administrativa da Secretaria. |
| --- |

**Tabela 2**

| Escopo desta versãoAuditoria do perfil DIRETOR a partir do branch main do repositório wandskk/smebaraunarn, das rotas atuais e do histórico técnico já analisado nos perfis Admin e Aluno. A navegação automatizada autenticada no domínio de produção permanece indisponível nesta sessão; portanto, o documento separa achados confirmados no código de itens que ainda exigem homologação visual em produção. Credenciais de teste não são reproduzidas. |
| --- |

**Tabela 3**

| O que já está bem resolvidoRBAC exclusivo DIRETOR; bloqueio quando a conta não tem escola vinculada; navegação própria; consultas de estudantes/servidores por escola; turma com drill-down; ficha de aluno reutilizada; notas, frequência e avaliações já disponíveis em leitura. | Maior oportunidade de valorSubstituir contadores brutos por leitura gerencial da escola: frequência recente e tendência, aprendizagem, cobertura de avaliações, turmas/alunos que precisam de atenção e qualidade/atualização dos dados. |
| --- | --- |

**Tabela 4**

| Regra de produto propostaAdmin responde “como está a rede e onde intervir?”. Diretor responde “como está minha escola, o que mudou e em qual turma/aluno devo agir?”. Ambos devem usar a mesma fórmula e os mesmos componentes-base; muda o escopo, a permissão e a densidade da informação. |
| --- |

**Tabela 5**

| Rota | Hoje | Evolução proposta | Prio. |
| --- | --- | --- | --- |
| /portal/direcao | Painel com 5 contadores | Cockpit da escola: frequência, aprendizagem, avaliações, atenção agora e atualização | P0 |
| /portal/direcao/servidores | Lista de servidores da escola | Filtros + detalhe funcional/lotação/turmas; sem expor CPF por padrão | P1 |
| /portal/direcao/turmas | Cards de turmas e nº alunos | Indicadores por turma, filtros e ordenação por atenção | P0 |
| /portal/direcao/turmas/[turma] | Média por disciplina + frequência + alunos | Unificar período; professores; tendência; distribuição; avaliações e sinais por aluno | P0 |
| /portal/direcao/estudantes | Lista de estudantes | Filtros pedagógicos + sinais objetivos + contexto temporal | P0 |
| /portal/direcao/alunos/[id] | Ficha acadêmica do aluno | Reutilizar ficha compartilhada com período explícito, avaliações e trajetória | P0 |
| /portal/direcao/notas | Médias por turma/disciplina | Filtros, distribuição, evolução e referência da rede | P1 |
| /portal/direcao/frequencia | Frequência anual por turma | 30/60/90 dias/bimestre, tendência e drill-down até estudante | P0 |
| /portal/direcao/avaliacoes | Últimos 100 resultados | Catálogo por avaliação, cobertura, pendências e análise por turma/descritor | P0 |
| /conta | Minha Conta compartilhada | Manter compartilhada | Manter |

**Tabela 6**

| Domínio | Pergunta | Rota |
| --- | --- | --- |
| Escola | Quais são os 3-5 pontos que merecem atenção hoje? | Painel |
| Frequência | Quais turmas pioraram no período recente? Quais alunos acumulam faltas consecutivas? | Painel / Frequência |
| Aprendizagem | Quais turmas/disciplinas estão abaixo da referência e onde a distribuição é desigual? | Painel / Notas |
| Avaliações | Qual a cobertura da avaliação municipal? Quem ainda não foi avaliado? Quais habilidades tiveram pior desempenho? | Avaliações |
| Turma | O que explica o resultado desta turma: frequência, notas, professores, cobertura ou alguns alunos específicos? | Turma |
| Aluno | Este estudante está piorando recentemente? Há faltas, queda de desempenho ou avaliação pendente? | Aluno |
| Servidores | Quem está lotado na escola e em quais turmas/disciplinas atua? | Servidores |
| Dados | Posso confiar no número? De qual período e sincronização ele veio? | Todas as telas analíticas |

**Tabela 7**

| Prio. | Achado | Impacto | Correção |
| --- | --- | --- | --- |
| P0 | Painel mistura períodos | Notas são do ano corrente; frequência e resultados de avaliação são contagens históricas sem o mesmo recorte. | Um único ano/período visível e métricas semanticamente comparáveis. |
| P0 | Turma mistura notas do ano com frequência histórica | getTurmaDetalhe filtra notas por ano, mas frequência não filtra data. | Aplicar exatamente o mesmo contexto temporal à frequência. |
| P0 | Avaliações limitadas aos 100 resultados mais recentes | Uma escola com mais de 100 resultados perde dados silenciosamente na tela. | Listar avaliações primeiro e paginar/resultados por avaliação, sem take global de 100. |
| P0 | Avaliações agrupadas somente por nome | Avaliações com mesmo nome em anos/edições diferentes podem ser misturadas. | Agrupar por avaliacao.id/código/ano, nunca somente pelo nome. |
| P0 | Vínculo da direção depende de escola manual | O próprio layout reconhece que cargos de direção podem vir ligados à Secretaria na origem. | Fluxo administrativo explícito de vinculação + estado de conta sem escola. |
| P0 | Ficha do aluno usa 90 registros | Mesmo problema identificado no perfil Aluno: N registros não é período. | Janela temporal explícita compartilhada. |
| P1 | Lista Estudantes → detalhe em /alunos/[id] | Nomenclatura de rota diverge da navegação principal. | Padronizar para /estudantes/[id] e manter redirect de compatibilidade. |
| P1 | Detalhe do aluno consulta por ID global antes do escopo | A resposta é bloqueada corretamente após a consulta, mas a query pode ser mais defensiva. | Buscar aluno já com escolaId da sessão na camada de query. |

**Tabela 8**

| Núcleo | Base | Perfis | Decisão |
| --- | --- | --- | --- |
| SchoolOverview | Admin /admin/escolas/[id] + Painel Diretor | Admin e Diretor | Mesmo serviço/componente; Admin escolhe escola, Diretor recebe escolaId fixo |
| AcademicContextBar | Proposto no Admin/Aluno | Admin, Diretor, Professor, Aluno | Ano/período/série/turma em query params; escola fixa no Diretor |
| DataFreshnessBadge | Proposto no Admin | Admin, Diretor, Professor, Aluno | Último SUCESSO por módulo: NOTAS, FREQUENCIA, ESTUDANTES etc. |
| InsightCard / Atenção agora | Proposto no Admin | Admin e Diretor | Mesmas regras explicáveis; Admin na rede, Diretor na escola |
| ComparisonDelta | Proposto no Admin | Admin e Diretor | Diretor compara escola com rede e período anterior, sem acessar dados pessoais de outras escolas |
| CoverageCard | Proposto no Admin | Admin e Diretor | Cobertura de avaliação e completude de dados |
| TurmaDetail | Admin escola→turma + Direção turma | Admin, Diretor, Professor | Mesma ficha; ações/escopo variam por papel |
| StudentAcademicDetail | Admin/Direção + Aluno | Admin, Diretor, Professor, Aluno | Boletim/frequência/avaliações por subcomponentes comuns |
| GradeTable | AlunoDetalhe + boletim | Admin, Diretor, Professor, Aluno | Uma única regra de média/completude |
| AttendanceSummary/Table | AlunoDetalhe + frequência | Admin, Diretor, Professor, Aluno | Uma única regra temporal e de abonadas |

**Tabela 9**

| Decisão arquitetural forteA Home da Direção deve renderizar o mesmo núcleo de SchoolOverview usado na ficha da escola do Admin. Isso reduz divergência, acelera implementação e garante que “frequência da escola” signifique a mesma coisa em ambos os perfis. |
| --- |

**Tabela 10**

| Risco histórico de avaliaçãoO modelo guarda escolaId e turma no resultado da avaliação, o que é correto para preservar contexto de aplicação. Porém, no fluxo atual de cadastro manual do Admin, escolaId é derivado da escola atual do estudante; transferências precisam ser tratadas para não atribuir uma aplicação histórica à escola errada. |
| --- |

**Tabela 11**

| Núcleo | Admin | Aluno | Diretor | Decisão |
| --- | --- | --- | --- | --- |
| App shell / topbar / conta | AdminShell próprio | PortalAppShell | PortalAppShell | Shell compartilhado por família de portal |
| Escola / SchoolOverview | Rede → escola | Somente contexto | Própria escola completa | Mesmo núcleo Admin/Diretor |
| Turma | Completo | Somente contexto pessoal | Completo da própria escola | Mesmo TurmaDetail |
| Estudante | Completo | Próprio | Estudantes da escola | Mesmo StudentAcademicDetail + escopo |
| Boletim / notas | Rede/escola/aluno | Próprio | Escola/turma/aluno | Mesmo GradeTable + agregações por escopo |
| Frequência | Rede→aluno | Própria | Escola→aluno | Mesmo motor + Attendance components |
| Avaliações | Gestão completa | Próprio resultado | Cobertura/análise da escola | Mesma base Avaliacao/Resultado; capacidades diferentes |
| Atenção agora | Rede | Sinais pessoais simples | Escola | Mesmas regras explicáveis em granularidades diferentes |
| Qualidade/sync | Completo | Atualizado em | Atualizado em + impacto na escola | DataFreshnessBadge comum |

**Tabela 12**

| Perfil | Maior reaproveitamento esperado | O que ainda precisa ser confirmado |
| --- | --- | --- |
| Professor | TurmaDetail + StudentAcademicDetail + GradeTable + Attendance + Avaliações | Próprias turmas/disciplinas e estudantes autorizados; possivelmente operações pedagógicas, se existirem. |
| Servidor Geral | PortalAppShell/topbar + ficha funcional própria | Provavelmente visão individual de vínculo/lotação; sem dados acadêmicos amplos, salvo função específica. |

**Tabela 13**

| Prio. | Entrega | Valor |
| --- | --- | --- |
| P0 | Criar contexto único de ano/período e corrigir frequência da turma | Confiabilidade |
| P0 | Transformar Painel em SchoolOverview/Atenção agora | Valor gerencial |
| P0 | DataFreshnessBadge por módulo | Confiança no dado |
| P0 | Frequência com tendência + faltas consecutivas + drill-down | Ação rápida |
| P0 | Avaliações por catálogo/cobertura, sem limite global de 100 | Operação/diagnóstico |
| P0 | Separar avaliações por ID/código/ano | Integridade |
| P0 | StudentAcademicDetail com período explícito | Consistência |
| P0 | Filtros pedagógicos em estudantes e turmas | Operação |
| P1 | Criar /servidores/[id] com lotação/turmas | Gestão de equipe |
| P1 | Notas com unidade, disciplina, distribuição e referência da rede | Diagnóstico |
| P1 | Professores e avaliações dentro da ficha da turma | Contexto |
| P1 | Padronizar /estudantes/[id] + redirect legado | Arquitetura |
| P1 | Query de aluno escopada por escola no banco | Defesa em profundidade |
| P2 | Auditoria formal do vínculo Diretor - Escola | Governança/LGPD |
| P2 | Metas e intervenções pedagógicas depois de validar fluxo real | Gestão contínua |

**Tabela 14**

| # | Etapa | Critério |
| --- | --- | --- |
| 1 | Fundação compartilhada | AcademicContextBar, DataFreshnessBadge, ComparisonDelta, CoverageCard e serviços comuns. |
| 2 | Corrigir recortes temporais | Turma e estudante primeiro; nenhuma inteligência em cima de períodos inconsistentes. |
| 3 | SchoolOverview da Direção | Reaproveitar a ficha inteligente da escola do Admin e fixar escolaId da sessão. |
| 4 | Turmas e Frequência | Tendência, faltas consecutivas, professores e drill-down. |
| 5 | Estudantes | Filtros/sinais e ficha acadêmica compartilhada. |
| 6 | Avaliações Municipais | Catálogo, cobertura, resultados e análise por turma. |
| 7 | Aprendizagem / Notas | Distribuição, unidade/disciplinas e comparação com rede. |
| 8 | Servidores | Ficha funcional e atuação em turmas. |
| 9 | Homologação real | Comparar Diretor vs Admin para a mesma escola, turma, aluno, período e avaliação. |

**Tabela 15**

| Rota | Arquivo | Responsabilidade atual |
| --- | --- | --- |
| /portal/direcao | app/portal/direcao/page.tsx | Painel de contadores |
| /portal/direcao/servidores | .../servidores/page.tsx | Lista da equipe da escola |
| /portal/direcao/turmas | .../turmas/page.tsx | Lista de turmas |
| /portal/direcao/turmas/[turma] | .../turmas/[turma]/page.tsx | Turma: frequência/notas/alunos |
| /portal/direcao/estudantes | .../estudantes/page.tsx | Lista de estudantes |
| /portal/direcao/alunos/[id] | .../alunos/[id]/page.tsx | Ficha do estudante |
| /portal/direcao/notas | .../notas/page.tsx | Médias por turma/disciplina |
| /portal/direcao/frequencia | .../frequencia/page.tsx | Frequência anual por turma |
| /portal/direcao/avaliacoes | .../avaliacoes/page.tsx | Resultados municipais |
| /conta | rota compartilhada | Minha Conta / senha |

**Tabela 16**

| FechamentoO perfil Diretor deve se tornar o ponto de decisão diária da escola. A maior economia de desenvolvimento vem de não construir isso isoladamente: SchoolOverview, TurmaDetail, StudentAcademicDetail, frequência, notas, avaliações e explicabilidade devem ser os mesmos núcleos do Admin, com escopo e capacidades definidos por papel. |
| --- |