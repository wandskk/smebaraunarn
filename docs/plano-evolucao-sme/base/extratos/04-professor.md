# Plano de Evolucao MVP - Professor

> Extraido automaticamente do XML interno do DOCX (word/document.xml) na ETAPA 00. Este texto e um extrato de apoio; o DOCX original em ../Plano_Evolucao_MVP_Professor_SME_Barauna.docx permanece a fonte funcional de referencia.

SME BARAÚNA
## Plano de Evolução do MVPPerfil Professor
Centro de Avaliação Municipal, Indicadores Educacionais e Dados Integrados ao SIGEduc
24 de agosto de 2026
## 1. Resumo executivo
Conclusão principal. O portal do Professor ainda é o mais enxuto dos perfis operacionais: Home, lista de alunos das turmas vinculadas e ficha acadêmica individual. O caminho de maior valor é evoluí-lo para Turma → Aluno, reutilizando as mesmas fichas analíticas de Diretor/Admin, mas aplicando um escopo mais rigoroso: escola, turma e, quando pertinente, disciplina do professor.

## 2. Mapa atual do perfil Professor

## 3. Achados críticos e riscos de escopo

## 4. Perguntas que o portal do Professor deve responder
Quais são minhas turmas, disciplinas e turnos atuais?
Qual turma teve a maior queda de frequência neste período?
Quais estudantes estão com faltas consecutivas ou queda recente de presença?
Como está a aprendizagem da minha disciplina em cada turma: média, mediana e distribuição?
Quais habilidades/descritores da avaliação municipal tiveram menor acerto?
Quais estudantes ainda não possuem resultado na avaliação ou lançamento suficiente para análise?
Quem melhorou ou piorou em relação ao período anterior?
Os dados que estou vendo estão atualizados e completos?
Quando eu abro um estudante, estou vendo apenas dados necessários à minha atuação?
Qual informação precisa ser encaminhada à Direção para uma intervenção mais ampla?

## 5. Modelo de autorização recomendado
Hoje o escopo é montado com Servidor.escolaId + lista de nomes de turma. Isso funciona para um professor simples em uma única escola, mas é frágil para múltiplas escolas, códigos de turma repetidos e múltiplas disciplinas na mesma turma.

### 5.1 Política de acesso por disciplina
Aprendizagem/notas: por padrão, detalhar somente a(s) disciplina(s) atribuída(s) ao professor naquela turma.
Frequência: se a origem é por disciplina/aula, permitir visão da própria disciplina e um resumo geral do estudante quando a Secretaria aprovar esse uso pedagógico.
Boletim completo: não assumir automaticamente que todo professor precisa das notas detalhadas de todas as disciplinas.
Avaliações Municipais: mostrar avaliações compatíveis com a série/turma e, quando houver área/disciplina estruturada, priorizar as relacionadas à atuação docente.
Diretor/Admin continuam com visão transversal; Aluno vê a própria ficha. Assim o mesmo componente recebe capabilities em vez de duplicar páginas.
## 6. Arquitetura de reaproveitamento

## 7. Evolução detalhada das telas
### 7.1 /portal/professor - Home
Corrigir P0: sem atribuições, total de alunos = 0; exibir estado claro “nenhuma turma vinculada” e orientação de regularização.
Trocar a tabela bruta por cards de turma legíveis (série + seção), com disciplina, turno e número de estudantes.
Adicionar 3-5 indicadores do período: frequência média das minhas turmas, estudantes com faltas consecutivas, desempenho da minha disciplina, avaliações pendentes e atualização dos dados.
Adicionar “Atenção agora”: no máximo 5 achados clicáveis e explicáveis, sem score opaco.
Se o professor atua em múltiplas escolas, a Home deve separar as atribuições por escola ou permitir selecionar unidade explicitamente.
Não colocar ranking de estudantes na Home; mostrar necessidade pedagógica, não competição.
### 7.2 /portal/professor/turma → /turmas - Minhas Turmas
A rota atual mistura alunos de todas as turmas. Transformar a primeira tela em lista de turmas, semelhante à Direção, mas apenas com atribuições do professor.
Cada turma: nome amigável, disciplina(s), turno, alunos, frequência no período, tendência, desempenho da disciplina e cobertura de avaliação.
Filtros: escola (se houver mais de uma), turno, disciplina e período.
Ordenações: maior queda de frequência, maior proporção abaixo do limiar, avaliação com maior pendência e alfabética.
Ao clicar, abrir /portal/professor/turmas/[turma] preservando ano/período/disciplina.
### 7.3 Nova /portal/professor/turmas/[turma] - Cockpit da turma
Reutilizar TurmaDetail do Admin/Diretor, porém filtrado pela atribuição autorizada.
Topo: turma, série, turno, disciplina do professor, total de estudantes e freshness dos módulos.
Frequência: 7/30/60/90 dias ou bimestre; tendência; estudantes com faltas consecutivas; separar frequência da própria disciplina do resumo geral quando necessário.
Aprendizagem: média, mediana, P25/P75, distribuição por faixas e evolução por unidade da disciplina do professor.
Avaliações: cobertura da turma e habilidades/descritores com menor acerto; permitir filtrar somente estudantes ainda sem resultado.
Lista de estudantes: nome, frequência no período, tendência, média da disciplina, status da avaliação e sinais objetivos.
Nada de rótulo permanente “aluno de risco”. O sinal deve sempre explicar período, métrica e referência.
### 7.4 /portal/professor/turma/[id] → /estudantes/[id]
Padronizar a rota para representar corretamente a entidade: estudante, não turma.
Buscar o estudante já dentro do ProfessorScope autorizado (escola+turma e, quando aplicável, disciplina).
Reutilizar StudentAcademicDetail com abas Visão Geral | Frequência | Aprendizagem | Avaliações.
P0 temporal: remover a semântica “últimos 90 registros”; usar período explícito.
Aprendizagem: mostrar a disciplina do professor em destaque. Visão completa das demais disciplinas somente se a política da rede autorizar.
Frequência: distinguir faltas totais, faltas na disciplina e faltas abonadas com regra única compartilhada.
Avaliações Municipais: exibir resultado individual e evolução, sem ranking nominal entre estudantes.
### 7.5 Nova /portal/professor/avaliacoes - Avaliações Municipais
Listar apenas avaliações relevantes às turmas/séries autorizadas.
Para cada avaliação: ano, tipo, situação, estudantes esperados, avaliados, cobertura e pendências.
Drill-down por turma com distribuição de pontuação/nível e, quando respostasJson estiver preenchido, acerto por questão/descritor.
Gerar “habilidades para retomada” com base objetiva: descritor, percentual de acerto e estudantes afetados.
Fluência Leitora: níveis e palavras por minuto; preservar comparação temporal quando houver múltiplas aplicações.
Professor não edita configuração global da avaliação; ações de cadastro/importação pertencem ao Admin/Secretaria.

## 8. Backlog priorizado

## 9. Sequência de implementação recomendada

## 10. Critérios de aceitação
Professor sem turma não vê total de alunos da escola nem qualquer estudante.
Todo estudante exibido pertence a uma atribuição autorizada do professor no contexto selecionado.
Códigos de turma repetidos em escolas diferentes não ampliam o escopo.
Se houver múltiplas escolas, a atribuição mantém a escola correta por turma.
Notas detalhadas respeitam a política de disciplina definida pela rede.
Todo percentual de frequência informa período e fonte; “90 registros” deixa de ser período.
Todo insight informa métrica, referência e link para o detalhe.
A mesma fórmula de turma usada no Professor é usada no Diretor e no Admin.
Avaliações mostram cobertura/pendência, não apenas resultados absolutos.
Dados não atualizados exibem freshness do módulo afetado.
Nenhuma tela usa ranking nominal de alunos como mecanismo padrão de decisão pedagógica.
## 11. Matriz consolidada de reaproveitamento

* Professor recebe versão filtrada por capabilities/atribuição. ** A confirmar no próximo perfil.
## 12. Homologação e continuidade
Próximo perfil na sequência acordada: SERVIDOR GERAL. Após ele, a matriz de reaproveitamento ficará completa e será possível montar um plano consolidado de implementação por componentes, em vez de por perfil.

---

### Tabelas do documento

**Tabela 1**

| ObjetivoTransformar o portal do Professor em um cockpit pedagógico das próprias turmas: o docente deve identificar rapidamente frequência, aprendizagem, avaliações e estudantes que precisam de acompanhamento, mantendo o escopo estritamente vinculado às suas atribuições. |
| --- |

**Tabela 2**

| Escopo desta versãoAuditoria do perfil PROFESSOR a partir do branch main do repositório wandskk/smebaraunarn e da arquitetura já analisada nos perfis Admin, Diretor e Aluno. A navegação automatizada autenticada no domínio de produção permanece indisponível nesta sessão; portanto, achados de interface são derivados do código atual e itens visuais devem ser homologados em produção. Credenciais de teste não são reproduzidas. |
| --- |

**Tabela 3**

| O que já está bem resolvidoRBAC exclusivo PROFESSOR; vínculo com Servidor; leitura de ServidorTurma; lista de estudantes limitada às turmas; checagem de escopo antes de exibir ficha individual; shell e componentes compartilhados com os outros portais. | Maior oportunidade de valorSair de “lista de alunos + boletim” para “o que minhas turmas precisam agora”: tendência de frequência, distribuição de aprendizagem, cobertura de avaliações, habilidades frágeis e sinais objetivos por estudante. |
| --- | --- |

**Tabela 4**

| Regra de produto propostaAdmin enxerga a rede; Diretor enxerga a escola; Professor enxerga somente suas atribuições. A mesma turma deve ter uma única regra de cálculo. O que muda é o recorte: no Professor, a autorização deve ser resolvida por atribuição (escola + turma + disciplina), não apenas por nome de turma. |
| --- |

**Tabela 5**

| Rota | Hoje | Evolução proposta | Prio. |
| --- | --- | --- | --- |
| /portal/professor | Home com tabela de turmas e 1 card de total de alunos | Cockpit das turmas: alertas, frequência, aprendizagem, avaliações e atualização | P0 |
| /portal/professor/turma | Lista única de alunos de todas as turmas vinculadas | Evoluir para Minhas Turmas e permitir drill-down por turma | P0 |
| /portal/professor/turma/[id] | [id] é aluno; ficha completa compartilhada | Padronizar como /estudantes/[id] e aplicar escopo por atribuição/disciplina | P0 |
| /portal/professor/turmas/[turma] | Não existe | Nova ficha da turma reutilizando TurmaDetail | P0 |
| /portal/professor/avaliacoes | Não existe | Avaliações municipais das próprias turmas + cobertura + análise | P1 |
| /conta | Minha Conta compartilhada | Manter compartilhada | Manter |

**Tabela 6**

| Prio. | Achado | Impacto | Correção |
| --- | --- | --- | --- |
| P0 | Sem turma, Home pode contar a escola inteira | Quando nomesTurma está vazio, o filtro por turma é omitido e o count usa apenas escolaId. O professor vê “nenhuma turma vinculada”, mas o card pode exibir todos os alunos da escola. | Se não há atribuições, totalAlunos deve ser 0 e o card não deve sugerir acesso inexistente. |
| P0 | Modelo não representa professor em múltiplas escolas | Servidor possui um único escolaId; ServidorTurma não possui escolaId. Uma sincronização com o mesmo CPF em escolas diferentes sobrescreve Servidor.escolaId e acumula turmas. | Adicionar escolaId à atribuição e resolver escopo por tuplas de atribuição, não por escola única do servidor. |
| P0 | Códigos de turma se repetem entre escolas | O próprio plano técnico registra 34 códigos reutilizados na rede. Combinar uma escola “final” com turmas acumuladas de outra unidade pode produzir escopo incorreto. | Atribuição deve carregar escolaId; consultas devem usar escolaId + turma juntos. |
| P0 | Professor vê todas as disciplinas do aluno | AlunoDetalhe busca todas as notas e frequências do estudante. Um professor de componente específico recebe o boletim completo. | Definir política: própria disciplina por padrão; visão transversal apenas se autorizada e claramente diferenciada. |
| P0 | Ficha do aluno usa 90 registros, não período | Mesmo problema dos perfis Aluno/Diretor: 90 registros podem cobrir intervalos diferentes. | Usar ano/bimestre/30-60-90 dias ou intervalo explícito. |
| P1 | ServidorTurma é único por servidor + turma | A sincronização faz upsert por servidorId_turma e disciplina é só dado atualizado. Se houver duas disciplinas na mesma turma, a última pode substituir a anterior. | Confirmar cardinalidade da API; se necessário, chave de atribuição inclui escola e disciplina (e ano). |
| P1 | Rota /turma/[id] representa aluno | A URL sugere detalhe de turma, mas o parâmetro é ID do estudante. | Padronizar /turmas/[turma] para turma e /estudantes/[id] para aluno. |
| P1 | Navegação usa “Minha Turma” no singular | O código suporta várias turmas e várias disciplinas. | Renomear para “Minhas Turmas”. |
| P1 | Home exibe códigos brutos de turma | Tabela e descrição usam t.turma diretamente. | Reusar formatTurmaLabel para nomes legíveis e manter código como informação secundária. |
| P1 | Escopo do aluno é validado depois da busca global | A página carrega aluno por ID e só depois verifica escola/turma. A saída está protegida, mas a query pode ser mais defensiva. | Buscar já com os critérios de atribuição autorizada. |

**Tabela 7**

| Princípio de UXO professor não precisa de uma réplica dos indicadores da Secretaria. A tela deve começar pelas próprias turmas, responder “o que ensinar/acompanhar agora?” e permitir descer até o estudante com contexto preservado. |
| --- |

**Tabela 8**

| Objeto de escopo sugeridoCriar um resolvedor único, por exemplo ProfessorScope, que retorne as atribuições autorizadas como { escolaId, turma, serie, turno, disciplina, cargaTrabalho, anoLetivo? }. Toda query do portal Professor deve receber esse escopo e jamais reconstruí-lo localmente a partir de strings soltas. |
| --- |

**Tabela 9**

| Elemento | Hoje | Direção proposta |
| --- | --- | --- |
| Servidor | escolaId único | Pode permanecer como lotação principal/referência, mas não deve ser a fonte exclusiva de autorização pedagógica. |
| ServidorTurma | servidorId + turma; sem escolaId | Adicionar escolaId obrigatório quando conhecido; avaliar disciplina e anoLetivo como parte da identidade da atribuição. |
| Chave única | @@unique([servidorId, turma]) | Se a API puder retornar mais de uma disciplina para a mesma turma, migrar para chave que não sobrescreva atribuições distintas. |
| Consultas | escolaId do servidor + turma in nomesTurma | Usar EXISTS/OR por atribuições escolaId+turma e, em aprendizagem, disciplina quando aplicável. |

**Tabela 10**

| Núcleo | Base existente/proposta | Perfis | Decisão |
| --- | --- | --- | --- |
| AcademicContextBar | Admin / Diretor / Aluno | Admin, Diretor, Professor, Aluno | Ano/período; no Professor acrescenta seletor de turma e disciplina autorizada |
| DataFreshnessBadge | Admin / Diretor | Todos os perfis analíticos | Atualização por NOTAS, FREQUENCIA, ESTUDANTES e AVALIACOES |
| InsightCard | Admin / Diretor | Admin, Diretor, Professor | Mesma regra explicável; escopo muda de rede→escola→turma |
| TurmaDetail | Admin / Diretor | Admin, Diretor, Professor | Componente central; Professor recebe uma turma autorizada e capabilities próprias |
| StudentAcademicDetail | Admin / Diretor / Aluno | Todos | Subcomponentes comuns; Professor filtra/mascara conforme disciplina/capacidade |
| GradeTable | Aluno / Diretor | Todos | Uma única regra para unidade, média parcial e completude |
| AttendanceSummary/Table | Aluno / Diretor | Todos | Uma única janela temporal e regra de faltas abonadas |
| EvaluationSummary/Analysis | Admin / Diretor | Admin, Diretor, Professor, Aluno | Do catálogo agregado até resultado individual, conforme papel |
| CoverageCard | Admin / Diretor | Admin, Diretor, Professor | Avaliação esperados × realizados e completude de dados |

**Tabela 11**

| Maior ganho de engenhariaA ficha de turma não deve existir três vezes. Admin, Diretor e Professor devem renderizar o mesmo TurmaDetail, alimentado por um contexto e um conjunto de capabilities. Isso reduz divergência de fórmula e faz cada melhoria pedagógica chegar aos três perfis. |
| --- |

**Tabela 12**

| Navegação sugeridaInício / Minhas Turmas / Avaliações Municipais / Minha Conta. Frequência e Aprendizagem entram como abas/filtros dentro da turma, evitando um menu grande para o professor. |
| --- |

**Tabela 13**

| P0 - agora | P1 - próxima fase | P2 - maturidade |
| --- | --- | --- |
| • Corrigir totalAlunos da Home quando não há turmas.• Criar ProfessorScope central e aplicar em todas as consultas.• Tratar atribuição por escola + turma; corrigir risco de múltiplas escolas/códigos repetidos.• Definir política de acesso por disciplina e parar de assumir boletim completo para qualquer professor.• Padronizar período da ficha do aluno (não 90 registros).• Criar ficha real da turma reutilizando TurmaDetail.• Renomear navegação para Minhas Turmas e usar nomes legíveis.• Aplicar escopo na própria query do detalhe do estudante. | • Adicionar escolaId a ServidorTurma; confirmar/migrar identidade da atribuição para suportar múltiplas disciplinas.• Criar /portal/professor/avaliacoes com cobertura e análise.• Adicionar AcademicContextBar + DataFreshnessBadge.• Distribuição de aprendizagem e comparação com período anterior.• Faltas consecutivas e tendência por turma/estudante.• Padronizar URLs /turmas/[turma] e /estudantes/[id] com redirects.• Adicionar completude de notas/avaliações antes de comparar turmas. | • Estruturar habilidades/descritores BNCC e heatmap de acerto.• Intervenção pedagógica compartilhada Professor → Diretor → Admin, após definir governança.• Metas por turma/disciplina com critérios oficiais.• Histórico de atribuições por ano letivo caso seja necessário analisar desempenho longitudinal por professor.• Exportação/relatório pedagógico da turma com minimização de dados pessoais. |

**Tabela 14**

| Etapa | Entrega |
| --- | --- |
| 1. Escopo seguro | Introduzir ProfessorScope e testes de autorização: 0 turmas, 1 turma, várias turmas, códigos repetidos, múltiplas escolas e múltiplas disciplinas. |
| 2. Modelo de atribuição | Adicionar escolaId em ServidorTurma e ajustar sincronização; decidir identidade da atribuição após validar cardinalidade da API. |
| 3. Minhas Turmas | Home + lista de turmas com nomes legíveis e contexto temporal. |
| 4. Turma compartilhada | Extrair/reusar TurmaDetail do Admin/Diretor, com capabilities do Professor. |
| 5. Estudante compartilhado | Refatorar StudentAcademicDetail; período explícito; própria disciplina por padrão. |
| 6. Avaliações | Cobertura e análise das turmas do professor; descritores quando houver dados por item. |
| 7. Intervenção | Somente depois de validar sinais, permitir registro de ação pedagógica e escalonamento à Direção. |

**Tabela 15**

| Núcleo | Admin | Diretor | Professor | Aluno | Servidor Geral |
| --- | --- | --- | --- | --- | --- |
| Rede / SchoolOverview | Admin | Diretor | — | — | — |
| TurmaDetail | Admin | Diretor | Professor | — | — |
| StudentAcademicDetail | Admin | Diretor | Professor | Aluno | — |
| GradeTable | Admin | Diretor | Professor* | Aluno | — |
| AttendanceSummary/Table | Admin | Diretor | Professor* | Aluno | — |
| EvaluationSummary | Admin | Diretor | Professor | Aluno | — |
| DataFreshnessBadge | Admin | Diretor | Professor | Aluno | Servidor** |
| AcademicContextBar | Admin | Diretor | Professor | Aluno | — |
| Ficha funcional servidor | Admin | Diretor (equipe) | — | — | Servidor |

**Tabela 16**

| Status da auditoriaConfirmado no código: rotas, RBAC, consultas atuais, modelo Servidor/ServidorTurma, regra de sincronização e checagens de escopo. A validar em produção: dados concretos do login de teste, responsividade, nomenclatura visual e possíveis estados específicos daquela conta. |
| --- |