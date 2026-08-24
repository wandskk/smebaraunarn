# Plano de Evolucao MVP - Servidor Geral

> Extraido automaticamente do XML interno do DOCX (word/document.xml) na ETAPA 00. Este texto e um extrato de apoio; o DOCX original em ../Plano_Evolucao_MVP_Servidor_Geral_SME_Barauna.docx permanece a fonte funcional de referencia.

SME BARAÚNA
## Plano de Evolução do MVPPerfil Servidor Geral
Centro de Avaliação Municipal, Indicadores Educacionais e Dados Integrados ao SIGEduc
24 de agosto de 2026
## 1. Resumo executivo
Conclusão principal. O Servidor Geral é, hoje, o perfil mais simples e também o que menos precisa ser “inflado”. O portal atual mostra uma ficha funcional pessoal e, conceitualmente, isso é correto. A prioridade é transformar essa ficha em uma fonte confiável de informação sobre vínculo, lotação, status e dados de contato, com origem e atualização explícitas. Novos módulos devem entrar somente quando houver uma necessidade institucional e uma fonte de dados clara.

## 2. Mapa atual do perfil Servidor Geral

## 3. Dados exibidos hoje

## 4. Achados críticos e riscos

## 5. Perguntas que o portal deve responder
Qual é minha matrícula, cargo, função, vínculo e status atualmente registrados?
Em qual unidade estou lotado e essa informação veio de qual fonte?
Qual turno/carga está registrado para mim? O dado está completo?
Quando meus dados funcionais foram atualizados pela última vez?
Existe alguma divergência ou informação ausente que eu precise comunicar?
Existe uma pendência realmente aplicável ao meu cargo? O que ela significa e qual ação devo tomar?
Quais dados de contato a Secretaria possui para mim?
Se eu tiver mais de uma lotação/atribuição, quais são elas e qual é a principal?
Como altero minha senha sem misturar essa ação com a ficha funcional?
Quais serviços internos estão disponíveis especificamente para o meu cargo, sem me dar acesso a dados que não preciso?
## 6. Modelo de dados recomendado para vida funcional
A modelagem atual de ServidorTurma nasceu para resolver atribuições docentes. Usá-la também como única origem de turno e carga de trabalho do Servidor Geral mistura duas coisas diferentes: lotação funcional e atribuição pedagógica.

### 6.1 Estratégia MVP sem migração grande
Persistir turno e carga_trabalho no próprio Servidor quando a linha da API não tiver turma, evitando perda imediata de informação.
Mostrar “Não informado pela fonte” em vez de apenas “-” para campos funcionais relevantes.
Adicionar DataFreshnessBadge do módulo SERVIDORES.
Adicionar email/telefone em seção “Contato cadastrado”, somente para o próprio usuário.
Validar o significado de pendencia_pedagogica antes de tratá-la como alerta universal.
## 7. Evolução detalhada da experiência
### 7.1 /portal/servidor - Minha vida funcional
Manter uma única Home no MVP; não criar sidebar apenas para preencher espaço.
Topo: nome, cargo/função e unidade principal; logo abaixo, “Atualizado em … · Fonte: SIGEduc”.
Bloco “Vínculo e lotação”: matrícula, tipo de vínculo, status, unidade, turno e carga, cada campo com estado claro quando a fonte não informou.
Bloco “Contato cadastrado”: email e telefone sincronizados; deixar explícito que a alteração não ocorre no SME se a fonte oficial for o SIGEduc.
Bloco “Atenções”: somente informações que exijam ação do próprio servidor e cuja semântica tenha sido validada.
Se houver divergência entre escola estruturada e escolaNome da origem, mostrar aviso de inconsistência em vez de escolher silenciosamente uma delas.
Se não houver unidade vinculada, não tratar como erro técnico automaticamente: alguns servidores podem estar lotados na Secretaria.
### 7.2 Pendências e mensagens de ação
Evitar o rótulo genérico “Pendência pedagógica” para cargos não pedagógicos até que a regra seja confirmada.
Toda pendência deve responder: o que significa? de qual sistema veio? quando foi atualizada? quem resolve? há prazo?
Não criar score de situação funcional. Mostrar o evento/pendência de forma direta e verificável.
Se a pendência for apenas informativa ou técnica, usar tom neutro; reservar alerta visual para necessidade real de ação.
### 7.3 /conta - Minha Conta compartilhada
Manter fora da vida funcional: autenticação e cadastro funcional são responsabilidades diferentes.
Continuar reutilizando a mesma rota para todos os perfis.
O CPF é dado do próprio usuário, mas pode ser parcialmente mascarado por padrão se a Secretaria preferir minimização visual.
Futuro: último acesso/sessões somente quando houver auditoria de segurança real; não simular esse dado antes de persistir.
### 7.4 Serviços futuros - somente com fonte e governança

## 8. Capabilities recomendadas
Como SERVIDOR_GERAL é heterogêneo, o papel deve continuar protegendo a área geral, enquanto capabilities refinam o que aparece dentro dela. No MVP, parte dessas capabilities pode ser derivada sem nova tabela; persistência explícita só é necessária quando a regra deixar de ser simples.

## 9. Reaproveitamento específico do Servidor Geral

## 10. Matriz final de reaproveitamento entre os cinco perfis

### 10.1 Regra arquitetural consolidada

## 11. Backlog priorizado - Servidor Geral

## 12. Sequência de implementação recomendada

## 13. Critérios de aceitação
Servidor sem turma não perde turno/carga informados pela origem.
A tela informa quando o módulo SERVIDORES foi atualizado e se a sincronização está incompleta/atrasada.
Campo ausente aparece como “não informado pela fonte”, não como dado implícito.
Pendência só aparece quando a regra de negócio disser que é aplicável e acionável.
SERVIDOR_GERAL não acessa estudantes, notas, frequência ou avaliações apenas por pertencer a uma escola.
Dados de contato exibidos são somente os do próprio usuário.
Minha Conta continua compartilhada e separada da ficha funcional.
Múltiplas lotações, se existirem, são representadas sem sobrescrever silenciosamente uma unidade por outra.
Nenhum módulo futuro é criado sem definir fonte, responsável, visibilidade e ação permitida.
Admin, Diretor e Servidor usam o mesmo núcleo de ficha funcional, com scopes diferentes.
## 14. Síntese dos cinco perfis e plano de reaproveitamento
Depois da auditoria dos cinco acessos, a arquitetura recomendada deixa de ser “uma aplicação diferente por perfil” e passa a ser “um mesmo domínio com scopes e capabilities”. Essa decisão é o principal mecanismo para manter o SME coerente à medida que novas telas forem adicionadas.

### 14.1 O que deve ser construído uma única vez
AcademicContextBar: ano/período/contexto preservado em todos os drill-downs acadêmicos.
DataFreshnessBadge: última sincronização do módulo que realmente alimenta o dado.
SchoolOverview: Admin e Diretor.
TurmaDetail: Admin, Diretor e Professor.
StudentAcademicDetail + GradeTable + AttendanceSummary: Admin, Diretor, Professor e Aluno, com capabilities.
EvaluationSummary/Analysis: do agregado ao individual, reutilizado conforme escopo.
FunctionalDataCard + AssignmentSummary: Admin, Diretor e Servidor; Professor reutiliza sua própria atribuição.
CapabilityGate/Scope resolvers: segurança e UX coerentes em todos os perfis.
SourceField/MethodologyNote: transparência de fonte, período, fórmula, atualização e limitações.
### 14.2 O que não deve ser compartilhado como acesso
Administração de usuários/sincronização/configuração global permanece administrativa.
Servidor Geral não herda dados acadêmicos da escola.
Professor não herda visão completa da escola; recebe apenas atribuições autorizadas.
Aluno não recebe comparações nominais/rankings internos da rede.
Diretor não recebe automaticamente ações globais da Secretaria/Admin.
## 15. Homologação e continuidade
Primeira rodada concluída: Admin, Aluno, Diretor, Professor e Servidor Geral foram mapeados individualmente. A matriz consolidada deste documento já indica quais componentes devem ser reaproveitados entre os cinco perfis.

---

### Tabelas do documento

**Tabela 1**

| ObjetivoDefinir um portal funcional, confiável e proporcional ao papel SERVIDOR_GERAL: priorizar a própria ficha funcional e a transparência dos dados sincronizados, sem ampliar indevidamente acesso a informações escolares ou criar módulos sem fonte de dados comprovada. |
| --- |

**Tabela 2**

| Escopo desta versãoAuditoria do perfil SERVIDOR_GERAL a partir do branch main do repositório wandskk/smebaraunarn e da arquitetura já analisada nos perfis Admin, Diretor, Professor e Aluno. A navegação autenticada automatizada no domínio de produção permanece indisponível nesta sessão; por isso, os achados são confirmados no código e os estados visuais específicos do login devem ser homologados em produção. Credenciais de teste não são reproduzidas. |
| --- |

**Tabela 3**

| O que já está bem resolvidoRBAC exclusivo SERVIDOR_GERAL; vínculo com o registro Servidor; uma página simples; dados pessoais restritos ao próprio usuário; shell/topbar compartilhados; Minha Conta e alteração de senha já reutilizados. | Maior oportunidade de valorConfiabilidade da vida funcional: mostrar o que o SIGEduc informa, quando foi atualizado, o que está incompleto e a quem recorrer quando houver divergência. Depois disso, evoluir por capabilities, não por um menu genérico igual para todos os cargos. |
| --- | --- |

**Tabela 4**

| Regra de produto propostaSERVIDOR_GERAL é um papel de fallback para cargos que não são classificados como Direção nem Docência. Como esse conjunto pode incluir funções muito diferentes, o portal deve crescer por capacidades habilitadas conforme cargo, vínculo e disponibilidade de dados — não por suposição de que todo servidor precisa das mesmas telas. |
| --- |

**Tabela 5**

| Rota | Hoje | Evolução proposta | Prio. |
| --- | --- | --- | --- |
| /portal/servidor | Página única com dados funcionais e eventual pendência pedagógica | Manter enxuta; evoluir para ficha funcional confiável e contextualizada | P0 |
| /portal/servidor/dados-funcionais | Não existe como rota separada | Só criar se a Home crescer; inicialmente pode ser uma seção/tab | P1 |
| /portal/servidor/lotacoes | Não existe | Criar apenas se houver múltiplas lotações/atribuições ou histórico disponível | P1/P2 |
| /portal/servidor/comunicados | Não existe | Opcional: comunicação interna somente se houver regra de visibilidade no CMS | P2 |
| /conta | Minha Conta compartilhada; CPF + alteração de senha | Manter compartilhada e reutilizada por todos os perfis | Manter |

**Tabela 6**

| Campo | Origem atual | Leitura técnica |
| --- | --- | --- |
| Matrícula | Servidor.matricula | Fonte direta sincronizada; adequada para identificação funcional. |
| Cargo | Servidor.cargo | Base para classificação do papel; deve permanecer como dado de origem. |
| Função | Servidor.funcao | Importante para contexto funcional e eventual capability. |
| Tipo de vínculo | Servidor.tipoVinculo | Útil; ideal mostrar sem interpretações jurídicas adicionais. |
| Escola | Servidor.escolaNome ou relação Escola | Necessita distinguir lotação da origem e fallback quando não houver escola estruturada. |
| Turno | Derivado de ServidorTurma.turno | Pode desaparecer para servidor sem turma; não é uma fonte funcional geral confiável. |
| Status | Servidor.status | Útil; precisa de data/fonte para o usuário saber se está atualizado. |
| Carga de Trabalho | Soma de ServidorTurma.cargaTrabalho | Pode aparecer vazia para servidor sem turma; modelagem atual é docente-cêntrica. |
| Pendência pedagógica | Servidor.pendenciaPedagogica | Exibida como alerta; sem explicação de regra, origem, aplicabilidade ou ação esperada. |

**Tabela 7**

| Prio. | Achado | Por que importa | Correção |
| --- | --- | --- | --- |
| P0 | Turno e carga podem ser perdidos | A API de servidor traz turno e carga_trabalho no próprio registro, mas a sincronização só os persiste em ServidorTurma quando s.turma existe. Servidores administrativos sem turma podem ficar com “-” mesmo quando a origem informou esses valores. | Persistir uma lotação funcional independente de turma; no curto prazo, armazenar fallback no Servidor quando turma for nula. |
| P0 | Papel é um catch-all amplo | classifyServidorRole retorna SERVIDOR_GERAL para tudo que não contém palavras de Direção ou Professor. Assim, funções muito diferentes caem no mesmo papel. | Manter o RBAC amplo, mas evoluir UI por capabilities derivadas/administradas, sem liberar dados de estudantes. |
| P0 | Pendência pedagógica sem semântica de produto | O campo é mostrado como aviso para qualquer SERVIDOR_GERAL. Para cargos não pedagógicos, a nomenclatura pode ser inadequada; não há explicação de origem ou procedimento. | Validar semântica com Secretaria; exibir somente quando aplicável e sempre com origem/ação esperada. |
| P1 | Lotação e escola podem ficar ambíguas | O layout prioriza escolaNome textual antes da relação Escola. Em casos de mapeamento/correção, a origem textual e a unidade estruturada podem divergir. | Definir uma fonte canônica visual e mostrar divergência explicitamente quando existir. |
| P1 | Sem freshness do dado funcional | A página afirma que os dados estão sincronizados, mas não informa a última sincronização de SERVIDORES. | Reutilizar DataFreshnessBadge e status do módulo SERVIDORES. |
| P1 | Contato existe no schema mas não é mostrado | Servidor.email e telefone são sincronizados, porém a ficha atual não os exibe. | Adicionar seção de contato pessoal apenas para o próprio servidor, com origem e orientação de correção. |

**Tabela 8**

| Princípio de UXA tela do Servidor Geral deve transmitir confiança e autoatendimento básico. Ela não é um painel de indicadores educacionais. O valor está em reduzir dúvida operacional sobre o próprio cadastro e, futuramente, concentrar serviços internos realmente autorizados. |
| --- |

**Tabela 9**

| Separação recomendadaServidor = identidade funcional principal. ServidorLotacao = unidade/turno/carga/vínculo/lotação quando a origem disponibilizar esse contexto. ServidorTurma = atribuição pedagógica em turma/disciplina. Essa separação também ajuda a corrigir o risco já identificado no perfil Professor. |
| --- |

**Tabela 10**

| Entidade | Responsabilidade | Decisão |
| --- | --- | --- |
| Servidor | Identidade, matrícula, cargo, função, status, contato | Manter como entidade principal do servidor. |
| ServidorLotacao (novo, se necessário) | Servidor + escola/unidade + turno + carga + contexto temporal/origem | Representar lotação funcional sem depender de turma; suportar múltiplas lotações no futuro. |
| ServidorTurma | Turma, série, disciplina, turno, carga | Reservar para atribuição pedagógica; adicionar escolaId conforme plano do Professor. |
| LogSincronizacao | SERVIDORES: status, registros, data, duração | Usar para freshness e confiabilidade da ficha. |

**Tabela 11**

| Módulo | Prio. | Condição para existir |
| --- | --- | --- |
| Comunicados internos | P2 | Reutilizar CMS apenas depois de existir visibilidade por público/role/unidade; posts públicos atuais não equivalem a comunicação interna. |
| Documentos do servidor | P2 | Só criar se houver fonte oficial para documentos individuais. Não confundir com DocumentoPublico. |
| Solicitação de correção cadastral | P2 | Pode ser útil, mas exige workflow, responsável, status e auditoria; não editar diretamente o espelho do SIGEduc. |
| Histórico de lotações | P2 | Somente quando a fonte trouxer histórico confiável ou o SME passar a persistir contexto temporal. |

**Tabela 12**

| Decisão de escopoNão recomendo adicionar frequência, notas, avaliações ou indicadores escolares ao SERVIDOR_GERAL. Se um servidor precisa desses dados por função, isso deve ser uma capability institucional específica ou outro papel, nunca acesso implícito por estar lotado em uma escola. |
| --- |

**Tabela 13**

| Capability | Quem recebe | Efeito |
| --- | --- | --- |
| VIEW_OWN_FUNCTIONAL_DATA | Todos os SERVIDOR_GERAL | Ficha funcional própria. |
| VIEW_OWN_CONTACT_DATA | Todos, se houver contato sincronizado | Email/telefone do próprio servidor. |
| VIEW_OWN_ASSIGNMENTS | Quando existirem atribuições/lotação adicionais | Turno, carga, lotações e eventualmente turmas próprias; nunca dados de alunos por consequência. |
| VIEW_ACTIONABLE_PENDING | Somente quando a pendência for aplicável ao cargo | Exibe aviso com semântica validada e ação esperada. |
| VIEW_INTERNAL_COMMUNICATIONS | Futuro, se CMS ganhar audiência interna | Comunicados dirigidos à função/unidade. |
| REQUEST_PROFILE_CORRECTION | Futuro, com workflow/auditoria | Solicita correção; não altera a fonte oficial diretamente. |

**Tabela 14**

| Não confundir RBAC com capabilityRole responde “qual portal pode abrir?”. Capability responde “qual bloco/ação pode usar dentro desse portal?”. Essa mesma abordagem também melhora Admin × Secretaria e Professor por disciplina. |
| --- |

**Tabela 15**

| Núcleo | Base | Perfis | Uso |
| --- | --- | --- | --- |
| PortalAppShell / PortalTopbar | Já compartilhado | Todos os portais | Manter; Servidor pode continuar sem sidebar enquanto possuir poucas telas. |
| UserMenu + Minha Conta | Já compartilhado | Todos os perfis | Uma única implementação para senha, logout e identidade. |
| DataFreshnessBadge | Proposto no Admin/Diretor/Professor | Todos os perfis com dado sincronizado | No Servidor, apontar especificamente para o módulo SERVIDORES. |
| FunctionalDataCard | Novo núcleo | Admin / Diretor / Servidor | Admin vê ficha administrativa; Diretor vê resumo da equipe; Servidor vê somente a própria ficha. |
| AssignmentSummary | Evolução de Servidor/ServidorTurma | Admin / Diretor / Professor / Servidor | Mesma estrutura de lotação/atribuição, com escopo e campos adequados ao papel. |
| CapabilityGate | Novo núcleo transversal | Todos os perfis | Evita duplicar condicionais de permissão em cada tela. |
| SourceField / DataProvenance | Novo núcleo transversal | Todos | Campo + fonte + atualização + estado “não informado”. |

**Tabela 16**

| Núcleo | Admin | Diretor | Professor | Aluno | Servidor |
| --- | --- | --- | --- | --- | --- |
| Rede / SchoolOverview | Principal | Minha escola | — | — | — |
| TurmaDetail | Rede → turma | Escola → turma | Minhas turmas | — | — |
| StudentAcademicDetail | Completo | Alunos da escola | Alunos autorizados | Próprio aluno | — |
| GradeTable | Completo | Completo da escola | Disciplina/capability | Próprio boletim | — |
| AttendanceSummary/Table | Completo | Completo da escola | Escopo autorizado | Própria frequência | — |
| EvaluationSummary/Analysis | Rede | Escola | Turmas autorizadas | Resultado próprio | — |
| StaffFunctionalCard | Gestão da rede | Equipe da escola | Própria identidade básica | — | Própria ficha |
| AssignmentSummary | Servidores | Equipe | Próprias atribuições | — | Própria lotação |
| DataFreshnessBadge | Sim | Sim | Sim | Sim | Sim |
| AcademicContextBar | Sim | Sim | Sim | Sim | — |
| Minha Conta / UserMenu | Sim | Sim | Sim | Sim | Sim |
| CapabilityGate | Sim | Sim | Sim | Sim | Sim |

**Tabela 17**

| Uma entidade, uma regra, vários escoposA mesma escola, turma, estudante, avaliação ou servidor não deve possuir cinco implementações. Criar componentes/queries de domínio únicos e aplicar Scope + Capabilities por papel. O perfil muda o alcance e as ações; a regra de cálculo e a semântica do dado permanecem as mesmas. |
| --- |

**Tabela 18**

| Perfil | Scope padrão | Responsabilidade do portal |
| --- | --- | --- |
| Admin | Rede inteira | Configuração, governança, comparação, qualidade e operação. |
| Diretor | Própria escola | Gestão da unidade; turma/aluno/equipe; sem administração global. |
| Professor | Próprias atribuições | Turma/aluno/aprendizagem dentro de escola+turma+disciplina autorizadas. |
| Aluno | Próprio registro | Boletim, frequência, avaliações e documentos pessoais autorizados. |
| Servidor Geral | Próprio registro funcional | Vida funcional e serviços internos especificamente habilitados; nenhum dado acadêmico por padrão. |

**Tabela 19**

| P0 - agora | P1 - próxima fase | P2 - somente com governança |
| --- | --- | --- |
| • Corrigir perda de turno/carga para servidor sem turma.• Adicionar freshness do módulo SERVIDORES.• Validar semântica/aplicabilidade de pendencia_pedagogica.• Padronizar estados “não informado pela fonte”.• Adicionar contato cadastrado (email/telefone) apenas para o próprio servidor.• Definir regra visual para lotação estruturada × escolaNome da origem.• Não conceder qualquer dado acadêmico por padrão ao papel geral. | • Extrair FunctionalDataCard e AssignmentSummary compartilhados.• Criar capability resolver transversal.• Avaliar ServidorLotacao para separar lotação funcional de ServidorTurma.• Testar múltiplas unidades/linhas do mesmo CPF na sincronização.• Melhorar estados de conta sem vínculo/servidor não encontrado com orientação de suporte.• Adicionar proveniência por campo relevante quando houver divergência. | • Comunicados internos com audiência por unidade/role/capability.• Workflow de solicitação de correção cadastral com auditoria.• Histórico de lotações quando houver fonte temporal confiável.• Documentos individuais somente com integração oficial apropriada.• Auditoria de acesso e sessões após existir modelo de segurança persistente. |

**Tabela 20**

| Etapa | Entrega |
| --- | --- |
| 1. Confiabilidade do sync | Preservar turno/carga sem turma; testar registros de funções não docentes. |
| 2. Ficha funcional | Freshness, origem, estados ausentes, contato e lotação canônica. |
| 3. Semântica de pendência | Validar campo, público, ação e linguagem antes de tratá-lo como alerta. |
| 4. Componentização | FunctionalDataCard + AssignmentSummary + SourceField compartilhados com Admin/Diretor. |
| 5. Capabilities | Criar resolvedor simples e testes; evitar menu uniforme para cargos heterogêneos. |
| 6. Lotação estruturada | Introduzir ServidorLotacao apenas se múltiplas lotações/contexto exigirem. |
| 7. Serviços internos | Comunicados/workflows/documentos somente quando houver fonte, governança e necessidade real. |

**Tabela 21**

| Camada | Responsabilidade |
| --- | --- |
| Camada 1 - Domínio | Escola, Turma, Estudante, Servidor, Avaliação, Indicador, Sincronização. Queries e regras únicas. |
| Camada 2 - Scope | NetworkScope (Admin), SchoolScope (Diretor), ProfessorScope, StudentSelfScope, StaffSelfScope. |
| Camada 3 - Capabilities | Configurar, editar, comparar, visualizar disciplina, visualizar equipe, ver própria ficha, exportar etc. |
| Camada 4 - Componentes | SchoolOverview, TurmaDetail, StudentAcademicDetail, FunctionalDataCard, EvaluationSummary, DataFreshnessBadge. |
| Camada 5 - Navegação | Cada papel mostra somente destinos que fazem sentido para seu trabalho, sem duplicar a lógica interna. |

**Tabela 22**

| Resultado esperadoCom essa base, novas funcionalidades deixam de exigir cinco implementações. A equipe cria o domínio e o componente uma vez, testa a regra uma vez e habilita a visualização por scope/capability. Isso reduz bugs, divergências de indicador e custo de manutenção do SME. |
| --- |

**Tabela 23**

| Status da auditoriaConfirmado no código: rota única do Servidor Geral, RBAC, campos exibidos, ausência de sidebar, compartilhamento de Minha Conta, classificação de roles e comportamento da sincronização que armazena turno/carga apenas em ServidorTurma quando existe turma. A validar em produção: valores concretos do acesso de teste, estados responsivos e significado institucional de “pendência pedagógica”. |
| --- |