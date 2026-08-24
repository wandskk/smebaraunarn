# Plano de Evolucao MVP - Admin/Secretaria

> Extraido automaticamente do XML interno do DOCX (word/document.xml) na ETAPA 00. Este texto e um extrato de apoio; o DOCX original em ../Plano_Evolucao_MVP_Admin_SME_Barauna.docx permanece a fonte funcional de referencia.

SME BARAÚNA
## Plano de Evolução do MVPPerfil Administrador
Centro de Avaliação Municipal, Indicadores Educacionais e Dados Integrados ao SIGEduc

ObjetivoTransformar o painel administrativo de uma base operacional já funcional em uma central de decisão educacional: diagnosticar, explicar, aprofundar, agir e acompanhar — sem perder simplicidade, consistência ou rastreabilidade dos dados.
24 de agosto de 2026

## 1. Resumo executivo
Conclusão principal. O MVP já possui a infraestrutura mais difícil: integração e sincronização com SIGEduc, RBAC, catálogo de escolas/alunos/servidores, notas, frequência, avaliações municipais, camada analítica testada, comparativos e qualidade de dados. O próximo salto não é criar mais CRUDs; é fazer as telas responderem perguntas de gestão.
Regra de produto proposta: toda tela analítica deve permitir responder quatro coisas sem o usuário “montar a análise na cabeça”:
O que está acontecendo?
Onde está acontecendo e quanto difere da referência?
Qual escola/turma/aluno explica o indicador?
O dado está atualizado e qual deve ser o próximo passo?
## 2. Base já existente e comprovada
O repositório registra validações contra a base real em 18/08/2026. Esses números não são tratados aqui como “dados de hoje”, e sim como evidência de que a camada analítica já operou sobre dados reais:


Também já existem os módulos analíticos de frequência, distorção idade-série, estatística de aprendizagem, explicabilidade, qualidade de dados e comparativos ponderados entre escola e rede. Portanto, várias propostas deste documento são de composição e navegação — não exigem reinventar cálculo nem banco.
## 3. Mapa atual do perfil Admin
A sidebar atual está corretamente organizada em cinco domínios. A recomendação é preservar essa arquitetura e aprofundar o conteúdo das rotas, evitando criar menus paralelos para informações que já pertencem a uma entidade.

## 4. Perguntas inteligentes que o Admin deve conseguir responder
## 5. Padrão único para telas e compartilhamento de rotas
O design system atual já é uma boa fundação. A evolução deve acontecer por composição dos componentes existentes, não por uma segunda camada visual. O objetivo é que o usuário reconheça a mesma “gramática” em qualquer rota.
### 5.1 Anatomia padrão de uma tela analítica
PageHeader: breadcrumb, título, escopo atual e ações principais.
Barra de contexto: Ano letivo + período + escola/série/turma quando aplicável. Deve usar query params e ser preservada no drill-down.
Resumo: 3–6 MetricCards com valor, referência, variação e link para aprofundar.
Insights: 1–5 cartões explicáveis (“o que aconteceu / por que importa / abrir detalhe”).
Filtros e busca: sempre antes da tabela/visualização; filtros ativos visíveis.
Conteúdo principal: DataTable ou visual simples; ordenação com intenção (pior→melhor, maior queda, maior diferença), não só alfabética.
Rodapé metodológico: fonte, última atualização, fórmula/limitação e cobertura do dado.
### 5.2 Componentes compartilhados sugeridos
### 5.3 Estratégia de rotas para não duplicar telas
A tela da entidade deve ser a fonte de verdade. Indicadores apontam para Escola/Turma/Estudante já filtrados, em vez de criar cópias da mesma ficha dentro de cada indicador.
Usar tabs/query params no MVP: /admin/escolas/[id]?tab=indicadores&ano=2026; /admin/estudantes/[id]?tab=frequencia&periodo=30d.
Criar rota nova apenas quando existir uma tarefa de rede que não pertença a uma entidade específica — exemplo: /admin/turmas (visão de todas as turmas) ou /admin/relatorios.
Componentes básicos de estudante já compartilhados com portal devem ser quebrados em seções menores para cada papel compor somente o que pode ver.
## 6. Evolução detalhada por rota — Rede Escolar
### 6.1 /admin — Painel administrativo
Hoje: quatro contagens (posts, servidores, estudantes e avaliações) e um chamado para sincronização. É funcional, mas ainda não se comporta como a “entrada inteligente” do sistema.
Atenção agora: 3–5 fatos explicáveis, sem score opaco. Ex.: “Escola X: frequência 72,4%, –6,1 p.p. vs período anterior”.
Saúde da base: chips por módulo com último SUCESSO e aviso de atraso/erro.
Avaliações em andamento: cobertura geral e escolas/turmas pendentes.
Acessos: quantidade de contas inativas, sem vínculo ou com papel/escola pendente.
Atalhos contextuais: “ver escolas em atenção”, “ver sync atrasado”, “ver avaliação pendente”.
### 6.2 /admin/escolas — Lista da rede
Hoje: nome, INEP e contagem de servidores/estudantes. A lista deve continuar rápida, mas pode deixar de ser meramente cadastral.
Colunas/visão compacta opcionais: estudantes, turmas, frequência, desempenho, distorção e cobertura de avaliação.
Filtros: nome/INEP, etapa/série atendida (quando derivável), tamanho da escola e “com atenção”.
Ordenação: alfabética | menor frequência | maior queda | maior distorção | pior cobertura de avaliação.
Badge de atualização: não precisa por linha; um badge de fonte/recorte no topo é suficiente.
Exportar lista respeitando filtros.
### 6.3 /admin/escolas/[id] — Ficha da escola
Hoje: nome/INEP e cards de turmas. O modelo já possui endereço e telefone, e a camada analítica já calcula comparação por escola.
Tabs: Visão Geral | Turmas | Servidores | Estudantes | Indicadores | Avaliações.
Bloco “Destaques da escola”: maior queda de frequência, turma de maior dispersão de notas, série com maior distorção.
Comparação com rede no mesmo recorte e mesma fórmula do /admin/indicadores/comparativos.
Não duplicar listas: abas podem reutilizar os mesmos componentes e queries já usados nas rotas de rede.
### 6.4 /admin/escolas/[id]/turmas/[turma] — Ficha da turma
Hoje: frequência agregada, faltas, número de disciplinas, médias por disciplina e lista de alunos. Esta rota é o ponto ideal para explicar por que uma escola está em atenção.
Adicionar seletor de ano/período e preservar contexto vindo da escola/indicador.
Frequência atual + variação vs período anterior + quantidade de alunos com 3/5/10 faltas consecutivas.
Aprendizagem: média, mediana, P25/P75 e % abaixo do parâmetro; por disciplina, não só média geral.
Docentes da turma/disciplina, turno e carga de trabalho a partir de ServidorTurma.
Avaliações municipais da turma: cobertura, desempenho e descritores críticos quando disponíveis.
Lista de alunos com sinais objetivos de acompanhamento; evitar rótulo permanente de “aluno de risco”.
### 6.5 /admin/estudantes — Diretório e acompanhamento
Hoje: diretório pesquisável. Deve manter essa função operacional e ganhar uma segunda leitura de acompanhamento.
Filtros: escola, turma, ano, faixa de frequência, distorção, avaliação e “necessita acompanhamento”.
Presets de visão: “Todos” | “Frequência” | “Aprendizagem” | “Avaliação municipal” | “Trajetória”.
Sinais explicáveis por linha, sem ranking único: “4 faltas consecutivas”, “–1,8 ponto na média”, “avaliação pendente”.
Contagem de resultados no filtro (“23 estudantes correspondem aos critérios”).
CPF não precisa ser coluna padrão; busca pode continuar aceitando CPF.
### 6.6 /admin/estudantes/[id] — Ficha do estudante
Hoje: responsável, data de nascimento, frequência, faltas/abonadas, boletim por unidade e registros recentes de frequência. É uma boa base compartilhada com outros portais.
Tabs: Visão Geral | Frequência | Aprendizagem | Avaliações | Trajetória | Intervenções (futuro).
Ano/período explícito. Nunca calcular um percentual comparável usando apenas “os últimos N registros”.
Frequência: 30/60/90 dias ou bimestre, faltas consecutivas, tendência e comparação com a turma.
Aprendizagem: evolução por unidade, disciplinas com maior queda/ganho e posição descritiva na distribuição da turma (sem “ranking de criança”).
Avaliações: histórico de fluência/provas municipais e evolução entre edições.
Trajetória: idade-série, regra aplicada, escopo e justificativa quando não elegível.
Fonte/última atualização por seção.
### 6.7 /admin/servidores — Rede de profissionais
Hoje: nome, CPF, cargo, papel no portal, escola e status; há atribuição manual de escola. O schema contém muito mais contexto que ainda não aparece.
Filtros: escola, papel, cargo, função, vínculo, status, sem escola, com/sem usuário provisionado.
Mostrar matrícula, função e vínculo em uma visão expandida; CPF mascarado por padrão.
Nova rota /admin/servidores/[id] com dados funcionais, contato, escola, turmas/disciplinas/turno/carga e status de acesso ao portal.
Explicar a classificação de papel (“Professor porque cargo contém PROF…”) para facilitar auditoria.
Diferenciar “escola da origem” de “escola atribuída manualmente”, especialmente para direção.
### 6.8 Nova rota sugerida: /admin/turmas
Hoje as turmas só são acessíveis dentro de uma escola. Uma visão de rede é útil para o Admin quando a pergunta começa por série/turma, não por escola.
Tabela: escola, série, turma, turno, estudantes, docentes, frequência, desempenho, avaliação e atenção.
Filtros por escola/série/turno e ordenação por maior queda ou menor indicador.
Cada linha abre a ficha de turma já existente; não criar uma segunda ficha.

## 7. Evolução detalhada — Avaliações Municipais e Indicadores
### 7.1 /admin/avaliacoes — Catálogo
Hoje: código, nome, tipo, ano, quantidade de resultados e questões. Para gestão, “quantos resultados existem” precisa virar “qual é a cobertura e o que os resultados dizem”.
Filtros por tipo, ano, etapa e status ativo.
Colunas: público esperado, resultados recebidos, % cobertura, média/mediana ou distribuição de níveis, última atualização.
Status operacional: Preparação | Em aplicação | Coleta parcial | Consolidada (pode iniciar derivado, sem modelo novo).
Pendências: “3 escolas sem resultado”, “2 turmas abaixo de 80% de cobertura”.
Ações: duplicar estrutura, importar resultados, abrir análise.
### 7.2 /admin/avaliacoes/new — Cadastro
Manter código/nome/tipo/ano/etapa, mas incluir escopo de aplicação: escolas/séries/turmas.
Data/período de aplicação e versão da prova.
Templates por tipo de avaliação para reduzir cadastro repetitivo.
Permitir duplicar uma avaliação anterior e alterar apenas período/versão.
Se o escopo estruturado exigir persistência, tratar como P1/P2 com migração; não “inventar” cobertura a partir de texto livre de etapa.
### 7.3 /admin/avaliacoes/[id] — Centro da avaliação
Hoje: cadastro de questões uma a uma e resultado individual por matrícula/CPF. O schema já contém respostasJson, mas o fluxo atual não o utiliza. Esta é a maior oportunidade de ganho de valor do módulo.
Visão Geral: esperado, realizado, cobertura, escolas/turmas pendentes, média/mediana ou níveis de fluência.
Questões: editar, reordenar, validar número duplicado e importar lista de questões.
Resultados: busca/filtros, editar resultado, não só excluir; turma/escola preenchidas a partir do contexto da aplicação quando possível.
Importação: CSV/XLSX com preview, mapeamento de colunas, validação e relatório de erros antes de gravar.
Análise por item: % acerto por questão e por descritor; se respostasJson for alimentado, já é possível iniciar sem remodelar tudo.
Heatmap escola/turma × descritor/habilidade quando o descritor estiver estruturado.
Fluência: distribuição de níveis, palavras/minuto e evolução entre edições.
### 7.4 /admin/indicadores — Central de Indicadores
Hoje já é um bom painel executivo com KPIs, ano letivo, explicabilidade, comparativos e qualidade. O próprio código sinaliza que falta o bloco “Atenção agora”.
Implementar “Atenção agora” dinamicamente, antes de criar um modelo persistente de alertas.
Regra 1: frequência baixa + queda recente; mostrar valor atual e variação.
Regra 2: desempenho abaixo da rede + elevada proporção abaixo do parâmetro.
Regra 3: distorção elevada/severa por escola/série.
Regra 4: sincronização relevante atrasada/erro — dados podem estar incompletos.
Cada alerta precisa de deep-link e explicação. Evitar somar tudo em um “score de risco” no MVP.
Mostrar “o que mudou desde o período anterior” quando houver histórico suficiente.
### 7.5 /admin/indicadores/frequencia
Drill-down real: Escola → Série/Turma → Estudante, mantendo ano e janela.
Janelas: 7/30/60/90 dias e bimestre, com referência anterior equivalente.
Separar “baixo e estável” de “queda rápida”; são problemas diferentes.
Mostrar turmas/estudantes com faltas consecutivas (motor 3/5/10 já existe).
Exibir cobertura do dado: total de aulas/registros que compõem o percentual.
Sparklines/tendência apenas quando houver histórico suficiente; caso contrário, aviso explícito como já ocorre.
### 7.6 /admin/indicadores/aprendizagem
Filtros por disciplina, série, escola e unidade/bimestre.
Drill-down para escola/turma/disciplinas.
Distribuição por faixas e evolução entre unidades, não apenas média anual.
Comparar escola/turma com rede no mesmo componente ComparisonDelta.
O parâmetro 6,0 está documentado como provisório: torná-lo configurável ou, no mínimo, rotular claramente como parâmetro não oficial.
### 7.7 /admin/indicadores/fluxo-trajetoria
Manter o excelente recorte por série + escola e adicionar drill-down autorizado até o estudante.
Separar “fora do escopo” de “sem dado” visualmente; têm significados diferentes.
Exibir Trajetória de Sucesso em bloco próprio, pois hoje é excluída do cálculo por definição.
Quando houver histórico anual, mostrar coorte/tendência para responder se a distorção está reduzindo.
Destaque automático “onde começa a crescer” — a validação já mostrou que esse tipo de pergunta gera insight real.
### 7.8 /admin/indicadores/comparativos
Filtros/ordenação: maior distância da rede, acima/abaixo em 2+ dimensões, escola específica.
Matriz simples Frequência × Desempenho para identificar perfis de escola; a tabela continua como fonte detalhada.
Período atual × anterior quando houver dados comparáveis.
Deep-link para a escola já no mesmo ano/período.
Não produzir ranking geral composto sem metodologia validada.
### 7.9 /admin/indicadores/qualidade
Adicionar completude por campo: nascimento ausente, CPF ausente, escola/turma sem mapeamento, notas sem série/escola contextual.
Mostrar impacto: “isso afeta distorção”, “isso afeta vínculo de acesso”, “isso afeta análise por escola”.
Cobertura por escola/módulo para encontrar sincronização parcial.
Gráfico simples de duração/registros por execução para detectar degradação.
Ação “ir para sincronização” no módulo com problema.
Manter a checagem dos códigos de turma reutilizados e evoluir a estrutura para escopo por escola quando houver migração.
### 7.10 /admin/indicadores/portal-publico
Manter a separação entre números institucionais da landing e indicadores analíticos.
Adicionar “valor calculado atualmente” ao lado de cada campo e botão “usar valor calculado” onde fizer sentido.
Preview da página inicial antes de salvar.
Registrar/mostrar última alteração e responsável se auditoria for adicionada.
## 8. Comunicação, usuários e operação
### 8.1 /admin/posts, /new e /[id]
Preview antes de publicar e link “ver no site”.
Permitir editar dataPublicacao/agendamento; o modelo já possui a data.
Exibir autor e última atualização na lista.
Galeria de imagens: o schema já tem galeriaImagens, mas o fluxo atual não a utiliza; implementar ou retirar do escopo visível.
Duplicar publicação e salvar rascunho continuam simples e úteis.
### 8.2 /admin/documentos
Categorias controladas (Portaria, Edital, Resolução, Calendário etc.) em vez de texto livre.
Ações Abrir/Preview, Editar, Substituir arquivo e Excluir.
Data de publicação/validade quando aplicável; indicar documento expirado/arquivado.
Acessos: confirmar rastreamento e mostrar leitura útil, não apenas contador acumulado.
Versionamento pode entrar depois; no MVP basta substituição controlada + metadados.
### 8.3 /admin/usuarios e /admin/usuarios/[id]
Filtros por papel, status, vínculo, escola e origem (automático/manual).
Rótulos amigáveis em toda interface — não expor enums como ADMIN/SECRETARIA no topbar.
Mostrar “origem do vínculo” e se a escola/papel será recalculada no próximo login.
CPF mascarado por padrão nas listas; revelação intencional apenas quando necessária.
Futuro: último login e auditoria de alterações sensíveis.
### 8.4 /admin/sincronizacao
Resumo no topo: último SUCESSO de cada módulo, idade do dado e status atual.
Separar “rotina diária” de “carga histórica/backfill”.
Mostrar dependências visualmente: Escolas/Cargos → Servidores/Estudantes → Notas/Frequência.
Botão “Sincronizar rotina completa” executando sequência segura, mantendo os painéis individuais para diagnóstico.
Comparar registros antes/depois e detectar finalização incompleta (PROCESSANDO sem SUCESSO final).
Link direto para Qualidade dos Dados após execução.
### 8.5 /conta — rota compartilhada
Manter como rota autenticada comum a todos os perfis. É um bom exemplo de compartilhamento. Futuramente pode receber sessões ativas/último acesso, mas não deve absorver configurações administrativas.

## 9. Achados de consistência e dados que merecem prioridade
## 10. Arquitetura funcional sugerida para o Admin
Menu recomendado após as evoluções P0/P1. A maior parte permanece igual; somente “Turmas” e “Relatórios” são candidatas a novas rotas de rede.
Visão Geral  →  Painel
Rede Escolar  →  Escolas  •  Turmas (nova)  •  Estudantes  •  Servidores
Avaliação & Dados  →  Avaliações Municipais  •  Central de Indicadores  •  Relatórios (P1)
Comunicação  →  Notícias / CMS  •  Documentos
Administração  →  Usuários e Acessos  •  Sincronização SIGEduc  •  Parâmetros (futuro)
## 11. Backlog priorizado para deixar o MVP “mais completo”
### P0 — Alto valor sem depender de grande migração de schema
Padronizar AnalysisScopeBar e preservação de ano/período no drill-down.
Corrigir recortes temporais inconsistentes em estudante e turma.
DataFreshnessBadge por fonte/indicador.
Dashboard com “Atenção agora” e saúde da base.
Ficha da escola com visão geral, comparativos e tabs.
Ficha da turma com tendência, distribuição e docentes.
Ficha do estudante com período explícito, sinais de frequência e avaliações.
Criar /admin/servidores/[id].
Filtros analíticos em escolas, estudantes, servidores e avaliações.
Cobertura básica da avaliação e reorganização da tela por tabs.
Permissões visuais Admin × Secretaria coerentes com Server Actions.
Sincronização com resumo de saúde e detecção de execução incompleta.
### P1 — Próxima iteração de inteligência
Importação CSV/XLSX de questões e resultados com preview/validação.
Usar respostasJson para análise por item e descritor.
Nova rota /admin/turmas e visão transversal por série/turma.
Filtros por disciplina/unidade em Aprendizagem.
Drill-down completo de Frequência e Fluxo até aluno autorizado.
Preview/agendamento no CMS e edição completa de documentos.
Relatórios executivos exportáveis respeitando filtros.
Completude/anomalias por escola no painel de qualidade.
### P2 — Exige decisão de produto/schema e governança
AlertaAnalitico persistente depois de validar as regras de “Atenção agora”.
Descritor/habilidade BNCC estruturado e heatmap por habilidade.
IntervencaoPedagogica com responsável, ação, prazo e medição de impacto.
MetaEducacional por indicador/escola/período.
LogAuditoriaLGPD para acesso/alterações em dados nominais.
Parâmetros oficiais configuráveis (faixas de frequência, nota mínima, regras locais).
lastLoginAt e trilha de segurança de contas.
Correção estrutural do escopo de turma/escola em notas/atribuições.
## 12. Sequência de implementação recomendada
## 13. Critérios de qualidade para considerar a evolução pronta
Nenhuma tela compara métricas de períodos diferentes sem deixar isso explícito.
Todo KPI analítico informa fonte, período, última atualização e fórmula/limitação.
Todo insight de atenção tem evidência numérica e link para a entidade que explica o valor.
Filtros relevantes permanecem na URL e são preservados ao navegar para detalhes.
ADMIN e SECRETARIA só veem ações que realmente podem executar.
CPF/dados pessoais não aparecem por padrão sem necessidade operacional.
Avaliações mostram cobertura, não apenas quantidade absoluta de resultados.
A tela de escola explica “por que” ela está acima/abaixo da rede; a tela de turma explica a escola; a tela do aluno explica a turma.
Alertas não usam score oculto; regras e limiares são explicáveis.
Sincronização incompleta/atrasada reduz confiança visualmente no indicador afetado.

## 14. Anexo — Inventário de rotas Admin revisadas
## 15. Observação de homologação e continuidade
Escopo de acesso nesta análise. O repositório e seu histórico recente forneceram o mapa completo das rotas, componentes e regras do Admin, incluindo registros de QA do próprio projeto contra produção. Nesta sessão, porém, não houve um canal de navegador interativo autenticado disponível para eu operar o login de produção e registrar uma nova inspeção visual rota a rota. Por isso, as recomendações de interface foram validadas contra o código atual e o histórico de QA, não contra uma nova sessão visual autenticada.
Próxima etapa por perfil. Quando forem fornecidos os demais acessos, o mesmo método deve ser aplicado a Direção, Professor, Servidor Geral e Aluno/Responsável, com foco especial em reaproveitar os componentes de Escola/Turma/Estudante e limitar cada ação ao escopo do papel.

---

### Tabelas do documento

**Tabela 1**

| Escopo desta versãoAuditoria do perfil ADMIN a partir do branch main do repositório wandskk/smebaraunarn, rotas, componentes, regras de acesso, schema Prisma, analytics e histórico recente de QA/produção. As credenciais recebidas para homologação não são reproduzidas neste documento. |
| --- |

**Tabela 2**

| O que o sistema já faz bemOrganiza a rede em rotas coerentes por domínio.Sincroniza dados cadastrais e acadêmicos do SIGEduc.Calcula frequência, desempenho, distorção e comparativos.Explica fórmulas e mostra saúde da sincronização.Possui design system compartilhado e responsivo. | O que falta para “entregar inteligência”Um bloco “Atenção agora” com prioridades explicáveis.Drill-down consistente Rede → Escola → Turma → Estudante.Mesmo período/ano preservado ao navegar entre telas.Cobertura e análise das avaliações por questão/descritor.Mais contexto de dados e menos tabelas meramente cadastrais. |
| --- | --- |

**Tabela 3**

| Direção recomendadaAdotar o fluxo Diagnosticar → Explicar → Aprofundar → Agir → Acompanhar. A Central de Indicadores diagnostica; a tela da entidade explica; o drill-down encontra a causa; uma ação/intervenção é registrada; a evolução volta para o painel. |
| --- |

**Tabela 4**

| 3.924estudantes | 28escolas ativas | 135turmas | 83,4%frequência média |
| --- | --- | --- | --- |

**Tabela 5**

| 6,99desempenho médio | 158em distorção | 1.775fora do escopo da distorção | 34códigos de turma reutilizados |
| --- | --- | --- | --- |

**Tabela 6**

| Rota | Hoje | Evolução proposta | Prio. |
| --- | --- | --- | --- |
| /admin | 4 contagens + chamada de sincronização | Resumo executivo, “Atenção agora”, saúde dos dados e atalhos contextuais | P0 |
| /admin/escolas | Lista nome/INEP/servidores/alunos | Indicadores-resumo, filtros, ordenação por atenção e drill-down | P0 |
| /admin/estudantes | Lista nome/matrícula/turma/escola | Filtros analíticos e acompanhamento nominal explicável | P0 |
| /admin/servidores | Lista + papel + escola + status | Filtros e nova ficha detalhada de servidor | P0 |
| /admin/avaliacoes | Catálogo de avaliações | Cobertura, status, resultados e pendências de aplicação | P0 |
| /admin/indicadores | KPIs de rede + submódulos | Atenção agora + contexto temporal + navegação causal | P0 |
| /admin/posts | CMS básico | Preview, data de publicação, autoria e galeria | P1 |
| /admin/documentos | Publicação + acessos | Edição, categorias controladas, preview e validade | P1 |
| /admin/usuarios | Contas, vínculo, reset, status | Filtros, origem do acesso, permissões e segurança de UX | P0 |
| /admin/sincronizacao | Execução por módulo + logs | Saúde consolidada, dependências, cobertura e sync completo | P0 |

**Tabela 7**

| Domínio | Pergunta | Rota de resposta |
| --- | --- | --- |
| Rede | Quais escolas precisam de atenção agora e por quê? | Central de Indicadores + Dashboard |
| Frequência | Qual escola/turma piorou mais nas últimas semanas? Quais estudantes concentram faltas consecutivas? | Indicadores → Frequência → Escola/Turma/Aluno |
| Aprendizagem | A média parece boa, mas existe dispersão? Em quais disciplinas/turmas está a maior concentração abaixo do esperado? | Indicadores → Aprendizagem → Escola/Turma |
| Trajetória | Em qual série a distorção começa a crescer? Onde há defasagem severa? | Fluxo e Trajetória |
| Avaliação municipal | Quem já foi avaliado? Quais escolas ainda estão pendentes? Quais questões/descritores tiveram menor acerto? | Avaliações → Análise/Cobertura |
| Escola | Esta escola está melhor ou pior que a rede e o que explica isso? | Escola → Visão Geral/Indicadores |
| Turma | Esta turma está puxando frequência ou desempenho da escola para baixo? | Turma → Visão Geral |
| Aluno | Há queda recente, faltas consecutivas, baixo desempenho ou necessidade de acompanhamento? | Estudante → Visão Geral |
| Servidor | Quem está sem escola, sem vínculo, com papel incoerente ou sem acesso provisionado? | Servidores + Usuários |
| Dados | Posso confiar no número que estou vendo? De qual sincronização ele veio? | Qualidade + badge de atualização por indicador |

**Tabela 8**

| Princípio de consistência temporalAo clicar em “Escola X” a partir de um indicador de 2026 / últimos 30 dias, a tela de escola deve abrir no mesmo contexto. Não deve voltar silenciosamente para “ano atual” ou “todo histórico”. |
| --- |

**Tabela 9**

| Componente | Responsabilidade |
| --- | --- |
| AnalysisScopeBar | Controla ano, período, escola, série e turma; escreve em query params e preserva contexto entre rotas. |
| DataFreshnessBadge | Mostra fonte e última sincronização do módulo relevante (ESTUDANTES, NOTAS, FREQUENCIA etc.). |
| InsightCard | Mensagem explicável com métrica, referência e deep-link. Base do “Atenção agora”. |
| ComparisonDelta | Padroniza +/– pontos percentuais ou pontos vs rede/período anterior. |
| CoverageCard | Exibe realizado / esperado / % cobertura em avaliações e sincronizações. |
| EntityOverviewTabs | Visão Geral, Indicadores, Turmas/Acadêmico, Avaliações, Dados; usa os mesmos blocos nos perfis autorizados. |
| MethodologyNote | Reaproveita a explicabilidade já existente para evitar texto solto e divergente entre telas. |
| ExportActions | CSV/PDF quando o relatório tiver significado administrativo; exportação respeitando filtros ativos. |

**Tabela 10**

| P0 — transformar em cockpitAdicionar “Atenção agora”, saúde dos dados, status das avaliações e atalhos para pendências. O painel deve responder “o que merece minha atenção hoje?”; a Central de Indicadores continua sendo a análise completa. |
| --- |

**Tabela 11**

| Visão Geral propostaEndereço/telefone/INEPEstudantes, turmas e servidoresFrequência e tendênciaDesempenho vs redeDistorção e cobertura de avaliação | Perguntas que deve responderA escola está acima/abaixo da rede?Qual indicador explica a diferença?Qual turma concentra o problema?O dado está atualizado?Quais avaliações estão pendentes? |
| --- | --- |

**Tabela 12**

| Correção analítica P0A ficha atual combina notas do ano corrente com frequência agregada sem um recorte equivalente. Antes de comparar ou gerar alertas, alinhar os dois domínios ao mesmo ano/período. |
| --- |

**Tabela 13**

| Correção analítica P0O percentual de frequência atual da ficha usa os 90 registros mais recentes, não um intervalo de datas. Dois estudantes podem ter “90 registros” cobrindo períodos diferentes. Trocar por janela temporal explícita antes de usar o número em comparação ou alerta. |
| --- |

**Tabela 14**

| P0/P1 — reorganizar por tabsVisão Geral / Questões / Resultados / Análise / Importação. O usuário deve enxergar cobertura e diagnóstico antes de enxergar formulários. |
| --- |

**Tabela 15**

| Integridade históricaHoje, ao registrar resultado, escolaId é obtido da escola atual do estudante e a turma é digitada manualmente. Para análises históricas, isso pode atribuir a avaliação à escola errada após transferência. O resultado deve preservar o contexto da aplicação no momento da avaliação. |
| --- |

**Tabela 16**

| Correção de confiabilidade P0A data “Última sincronização” da Central hoje vem do log mais recente de qualquer módulo. Um sync de CARGOS pode deixar a página parecendo atualizada mesmo se FREQUENCIA/NOTAS estiverem atrasadas. Mostrar atualização por indicador/fonte. |
| --- |

**Tabela 17**

| Permissão/UX P0O layout de /admin aceita ADMIN e SECRETARIA, e a sidebar mostra “Usuários e Acessos” para ambos; porém várias ações dessa área exigem ADMIN. A interface deve ocultar/desabilitar controles sem permissão e explicar o motivo — não deixar o usuário descobrir pelo erro da Server Action. |
| --- |

**Tabela 18**

| Prio. | Achado | Risco | Ação |
| --- | --- | --- | --- |
| P0 | Data de atualização genérica | Central de Indicadores usa o último LogSincronizacao de qualquer módulo como “última sincronização”. | Vincular cada indicador ao último SUCESSO da fonte relevante. |
| P0 | Janela inconsistente no aluno | Frequência usa os 90 registros mais recentes, não 30/60/90 dias. | Trocar para janela temporal explícita e comparável. |
| P0 | Janela inconsistente na turma | Notas usam ano atual; frequência é agregada sem o mesmo recorte. | Unificar contexto temporal e propagar filtros. |
| P0 | Contexto histórico da avaliação | Resultado usa escola atual do estudante e turma digitada. | Persistir/validar escola e turma do momento da aplicação. |
| P0 | Permissões Admin × Secretaria | Mesma navegação, mas ações de usuários são ADMIN-only. | Capability checks também no menu e na UI. |
| P1 | Código de turma não é globalmente único | 34 códigos são reutilizados entre escolas; hoje as séries coincidem. | Adicionar escopo de escola em dados acadêmicos quando migrar schema. |
| P1 | Descritor de questão é texto livre | Impede taxonomia consistente de habilidade/BNCC. | Estruturar descritor/habilidade e usar análise por item. |
| P1 | respostasJson não alimentado | Campo existe, mas fluxo de resultado não persiste respostas por item. | Usar importação/lançamento por item para habilitar diagnóstico. |
| P1 | CPF muito exposto | Listas administrativas exibem CPF integral. | Mascarar por padrão e auditar acesso nominal futuramente. |

**Tabela 19**

| Não criar um menu “Alertas” imediatamentePrimeiro gerar alertas/insights dinamicamente com regras transparentes dentro do Dashboard e da Central. Só persistir AlertaAnalitico depois que a equipe validar quais regras realmente geram ação — isso reduz schema, ruído e retrabalho. |
| --- |

**Tabela 20**

| Ordem | Frente | Entrega |
| --- | --- | --- |
| 1 | Fundação de contexto | AnalysisScopeBar, DataFreshnessBadge, ComparisonDelta e regras de query params. |
| 2 | Correções de recorte | Aluno e turma passam a usar períodos comparáveis; indicadores exibem fonte correta. |
| 3 | Cockpit Admin | Atenção agora + saúde + pendências; sem persistir alertas ainda. |
| 4 | Entidades inteligentes | Escola → Turma → Estudante e nova ficha de Servidor reutilizando componentes. |
| 5 | Avaliações operacionais | Cobertura, tabs, edição e visão de pendências. |
| 6 | Avaliações diagnósticas | Importação e análise por questão/descritor usando respostas por item. |
| 7 | Governança e ação | Intervenções, metas, auditoria e alertas persistentes após validação com Secretaria. |

**Tabela 21**

| Rota | Área | Direção | Prioridade |
| --- | --- | --- | --- |
| /admin | Visão Geral | Evoluir para cockpit | P0 |
| /admin/escolas | Rede Escolar | Lista + inteligência compacta | P0 |
| /admin/escolas/[id] | Rede Escolar | Overview + tabs + comparação | P0 |
| /admin/escolas/[id]/turmas/[turma] | Rede Escolar | Diagnóstico da turma | P0 |
| /admin/estudantes | Rede Escolar | Diretório + acompanhamento | P0 |
| /admin/estudantes/[id] | Rede Escolar | Ficha longitudinal | P0 |
| /admin/servidores | Rede Escolar | Filtros + integridade de vínculo | P0 |
| /admin/servidores/[id] | Nova | Ficha funcional/docente | P0 |
| /admin/turmas | Nova | Visão transversal de rede | P1 |
| /admin/avaliacoes | Avaliação & Dados | Cobertura e pendências | P0 |
| /admin/avaliacoes/new | Avaliação & Dados | Escopo/período/templates | P1 |
| /admin/avaliacoes/[id] | Avaliação & Dados | Overview/questões/resultados/análise/importação | P0/P1 |
| /admin/indicadores | Avaliação & Dados | Atenção agora + confiança do dado | P0 |
| /admin/indicadores/frequencia | Avaliação & Dados | Drill-down e faltas consecutivas | P0 |
| /admin/indicadores/aprendizagem | Avaliação & Dados | Disciplina/unidade/distribuição | P1 |
| /admin/indicadores/fluxo-trajetoria | Avaliação & Dados | Drill-down e trajetória | P1 |
| /admin/indicadores/comparativos | Avaliação & Dados | Filtros/matriz/delta | P1 |
| /admin/indicadores/qualidade | Avaliação & Dados | Completude + impacto + cobertura | P0/P1 |
| /admin/indicadores/portal-publico | Avaliação & Dados | Sugestão automática + preview | P1 |
| /admin/posts | Comunicação | Preview/autoria/status | P1 |
| /admin/posts/new | Comunicação | Agendamento/galeria | P1 |
| /admin/posts/[id] | Comunicação | Preview/edição completa | P1 |
| /admin/documentos | Comunicação | Edição/categoria/preview | P1 |
| /admin/usuarios | Administração | Filtros/permissão/origem | P0 |
| /admin/usuarios/[id] | Administração | Vínculo + segurança + auditoria futura | P0/P2 |
| /admin/sincronizacao | Administração | Health summary + rotina completa | P0 |
| /conta | Compartilhada | Manter como rota comum | Manter |
| /admin/relatorios | Nova | Relatórios executivos | P1 |
| /admin/indicadores/alertas | Futuro | Alertas persistentes validados | P2 |

**Tabela 22**

| Resultado esperado do MVP após P0O Admin abre o sistema e, sem cruzar planilhas ou entrar em cinco telas diferentes, identifica o que mudou, entende onde está o problema, navega até a escola/turma/aluno que explica o indicador e sabe se a informação é confiável e atualizada. |
| --- |