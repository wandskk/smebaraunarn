# Validação end-to-end logada (ETAPAS 01-10) + correção em `getTurmasRede`

## Contexto

Todas as etapas de 01 a 10 registraram a mesma pendência: a validação
end-to-end logada (login real por papel, navegação, verificação de
autorização por URL direta) nunca havia sido executada por falta de
credenciais de teste na sessão. O usuário forneceu 5 contas reais (uma por
papel — ADMIN, DIRETOR, PROFESSOR, ALUNO, SERVIDOR_GERAL) especificamente
para isso. As credenciais não são reproduzidas neste documento nem em
nenhum outro arquivo do repositório (regra 7.7 do master prompt — não
registrar CPF/senha).

## O que foi validado

Login + navegação read-only (sem submeter nenhum formulário de escrita) com
os 5 papéis, contra o banco de dados real (o `DATABASE_URL` já configurado
na sessão), via `npm run dev` local:

- **ADMIN**: `/admin`, `/admin/turmas` (nova rota ETAPA 10), `/admin/
  avaliacoes` (ETAPA 09, catálogo vazio — nenhuma avaliação cadastrada
  ainda na base real), `/admin/indicadores/frequencia` (coluna "Faltas
  consecutivas agora", ETAPA 10), `/admin/indicadores/aprendizagem`
  (filtros de disciplina/unidade, ETAPA 10, testado com filtro aplicado),
  `/admin/indicadores/qualidade` (completude por campo, ETAPA 10),
  `/admin/escolas/[id]` e `/admin/escolas/[id]/turmas/[turma]`.
- **DIRETOR**: `/portal/direcao` (SchoolOverview, ETAPA 05), `/portal/
  direcao/turmas`, `/portal/direcao/turmas/[turma]`, `/portal/direcao/
  avaliacoes`, `/portal/direcao/notas`. Testado acesso direto por URL a uma
  turma de código igual ao de outra escola (`EFAFM9A`, que existe em duas
  escolas da rede) — a ficha abriu escopada à escola do Diretor (0 alunos,
  não os 109 da outra escola), confirmando que o escopo é aplicado na
  consulta ao banco, não só na navegação da UI.
- **PROFESSOR**: `/portal/professor` (Home, ETAPA 06), `/portal/professor/
  turmas`, `/portal/professor/turmas/[turma]` (seção "Faltas consecutivas
  agora" renderizou corretamente com dados reais), `/portal/professor/
  avaliacoes` (ETAPA 09/10, vazio — sem avaliações). Testado acesso direto
  por URL a uma turma não atribuída (`/portal/professor/turmas/EFAFM9A`) e
  a um estudante fora de escopo (`/portal/professor/estudantes/1`) — ambos
  retornaram 404, confirmando o `canViewTurma`/`canViewEstudante` da ETAPA
  01/06.
- **ALUNO**: `/portal/aluno` (Home resumo, ETAPA 07), `/portal/aluno/
  boletim` (coluna de completude "Parcial (x/4)", ETAPA 07), `/portal/
  aluno/avaliacoes` (vazio — sem avaliações).
- **SERVIDOR_GERAL**: `/portal/servidor` — ficha funcional mostrou
  `turno`/`cargaTrabalho` preenchidos mesmo sem turma (fallback da ETAPA
  08, confirmado funcionando com dado real). Testado acesso direto a
  `/admin` e a `/portal/direcao` — ambos redirecionaram de volta para
  `/portal/servidor`, sem vazar nenhuma tela fora do escopo do papel.

Nenhum erro de console/rede além de ruídos esperados de navegação (ex.:
`net::ERR_ABORTED` em prefetch de RSC interrompido por navegação
subsequente — comportamento normal do Next.js, não um bug).

## Bug real encontrado e corrigido: `getTurmasRede` divergia da ficha de turma

Ao abrir `/admin/turmas` e depois clicar na ficha da mesma turma
(`EFAFM6D`, escola "Manoel de Barros"), os dois números de frequência
batiam com fórmulas diferentes: a lista mostrava 66,7%, a ficha mostrava
"Sem dados no período" (0 aulas). Investigando:

- `getTurmaDetalhe` (a ficha, já existente desde a ETAPA 03) atribui
  frequência/nota a uma turma pelo campo `turma` gravado no próprio
  registro (`FrequenciaEstudante.turma`/`NotaEstudante.turma`), casado com
  a escola ATUAL do estudante (`estudante: { escolaId }`).
- `getTurmasRede` (novo, ETAPA 10) tinha sido implementado atribuindo
  frequência pela turma ATUAL do estudante (via `estudanteMatricula`), não
  pelo campo `turma` do próprio registro histórico.

Um estudante que mudou de turma no meio do ano tem registros de frequência
antigos com `turma` = turma antiga. A versão errada de `getTurmasRede`
somava esses dias à turma NOVA (a atual do aluno); a versão correta
(`getTurmaDetalhe`) não — e é exatamente isso que fazia a lista e a ficha
divergirem para a mesma turma.

**Correção**: `getTurmasRede` (`lib/queries/academico.ts`) passou a
agrupar frequência/notas por `(escola atual do estudante, turma do próprio
registro)` — mesma convenção de `getTurmaDetalhe` — em vez de `(escola
atual, turma atual)`. Revalidado manualmente: a mesma turma agora mostra o
mesmo número nos dois lugares.

**Por que isso importa além do bug em si**: é exatamente o tipo de
inconsistência que a regra de reaproveitamento do master prompt (seção 6)
existe para prevenir — duas telas que deveriam usar "o mesmo cálculo entre
perfis/telas" mostrando números diferentes para a mesma entidade. Não foi
pego por `typecheck`/`lint`/`build`/testes automatizados porque não havia
teste cobrindo a combinação específica (aluno com histórico de troca de
turma) — `lib/queries/*` não tem suíte própria por depender de I/O (mesma
limitação já registrada em outras etapas). Ficou pendente até a validação
manual com dado real.

## Riscos residuais não descobertos nesta passada

Este foi um smoke test dirigido às áreas construídas nas ETAPAS 04-10, não
uma varredura exaustiva de todas as ~66 rotas. Não foram testados:
estados de erro/loading, mobile, acessibilidade, nem os fluxos de escrita
(cadastro de avaliação, edição de resultado, sincronização) — ficam para o
checklist completo da ETAPA 11.
