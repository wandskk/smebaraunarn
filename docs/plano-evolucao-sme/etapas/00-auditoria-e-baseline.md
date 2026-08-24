# ETAPA 00 — Auditoria, baseline e documentação

## Status
DONE

## Objetivo

Preparar uma base rastreável (documentação + baseline de testes) antes de
alterar qualquer comportamento do sistema.

## Por que esta etapa existe

O master prompt exige entender e documentar antes de editar. Sem um baseline
de testes/lint/typecheck/build registrado, não é possível saber depois se uma
mudança futura quebrou algo que já estava quebrado antes, ou se introduziu um
problema novo.

## Pré-requisitos

Nenhum — é a primeira etapa.

## Escopo desta etapa

1. Verificar branch/commit atual.
2. Identificar package manager e scripts disponíveis.
3. Mapear rotas Admin/Aluno/Diretor/Professor/Servidor.
4. Criar a estrutura `docs/plano-evolucao-sme/`.
5. Copiar os 5 DOCX para `base/` (se disponíveis).
6. Extrair o conteúdo dos DOCX para os 5 Markdown em `base/extratos/`.
7. Criar `README.md` com visão geral.
8. Criar `PROGRESSO.md` com todas as etapas em `PENDING`, exceto a 00.
9. Criar `MATRIZ_REAPROVEITAMENTO.md` preliminar.
10. Criar os arquivos Markdown das etapas 00–11.
11. Registrar o baseline dos testes atuais sem "consertar" nada ainda.
12. Identificar arquivos já modificados localmente pelo usuário e não
    sobrescrevê-los.

## Fora de escopo

- Qualquer correção de comportamento, mesmo que um problema óbvio tenha sido
  identificado durante a auditoria (ex.: os achados P0 do master prompt).
- Qualquer alteração de schema Prisma.
- Qualquer implementação de scope/capability (isso é ETAPA 01).

## Arquivos/áreas previstos

- `docs/plano-evolucao-sme/**` (novo).
- Nenhum arquivo de código-fonte (`app/`, `components/`, `lib/`, `prisma/`) foi
  alterado.

## Checklist

- [x] Branch/commit atual verificado.
- [x] Package manager e scripts identificados.
- [x] Rotas Admin/Aluno/Diretor/Professor/Servidor mapeadas.
- [x] Estrutura `docs/plano-evolucao-sme/` criada.
- [x] 5 DOCX copiados para `base/`.
- [x] 5 extratos Markdown gerados em `base/extratos/`.
- [x] `README.md` criado.
- [x] `PROGRESSO.md` criado.
- [x] `MATRIZ_REAPROVEITAMENTO.md` preliminar criada.
- [x] Arquivos Markdown das etapas 00–11 criados.
- [x] Baseline de testes/lint/typecheck/build registrado.
- [x] Nenhum arquivo local modificado pelo usuário foi sobrescrito.

## Alterações realizadas

Somente criação de documentação, nenhuma alteração de código-fonte:

- `docs/plano-evolucao-sme/README.md` (novo)
- `docs/plano-evolucao-sme/PROGRESSO.md` (novo)
- `docs/plano-evolucao-sme/MATRIZ_REAPROVEITAMENTO.md` (novo)
- `docs/plano-evolucao-sme/base/Plano_Evolucao_MVP_Admin_SME_Barauna.docx` (cópia)
- `docs/plano-evolucao-sme/base/Plano_Evolucao_MVP_Aluno_SME_Barauna.docx` (cópia)
- `docs/plano-evolucao-sme/base/Plano_Evolucao_MVP_Diretor_SME_Barauna.docx` (cópia)
- `docs/plano-evolucao-sme/base/Plano_Evolucao_MVP_Professor_SME_Barauna.docx` (cópia)
- `docs/plano-evolucao-sme/base/Plano_Evolucao_MVP_Servidor_Geral_SME_Barauna.docx` (cópia)
- `docs/plano-evolucao-sme/base/extratos/01-admin.md` (novo, gerado)
- `docs/plano-evolucao-sme/base/extratos/02-aluno.md` (novo, gerado)
- `docs/plano-evolucao-sme/base/extratos/03-diretor.md` (novo, gerado)
- `docs/plano-evolucao-sme/base/extratos/04-professor.md` (novo, gerado)
- `docs/plano-evolucao-sme/base/extratos/05-servidor-geral.md` (novo, gerado)
- `docs/plano-evolucao-sme/etapas/00-auditoria-e-baseline.md` (novo, este arquivo)
- `docs/plano-evolucao-sme/etapas/01-scopes-e-capabilities.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/02-contexto-temporal-e-freshness.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/03-componentes-academicos-compartilhados.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/04-admin-p0.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/05-diretor-p0.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/06-professor-p0.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/07-aluno-p0.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/08-servidor-geral-p0.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/09-avaliacoes-municipais.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/10-p1-evolucao-funcional.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/etapas/11-hardening-regressao-e-fechamento.md` (novo, esqueleto PENDING)
- `docs/plano-evolucao-sme/decisoes/README.md` (novo)

Originais em `claude_code_sme_base/` (master prompt + `docs_base/` com os 5
DOCX) foram preservados sem alteração.

## Decisões técnicas

1. **Extração de DOCX sem `python-docx`.** O ambiente Windows local não tem
   Python disponível (`python`/`python3` não encontrados — ver saída do
   comando de verificação). Conforme a regra de disponibilidade do master
   prompt ("se não estiver disponível, use leitura do XML interno do DOCX de
   forma local"), foi escrito um script PowerShell
   (`extract_docx.ps1`, mantido no scratchpad da sessão, não commitado) que
   abre cada `.docx` como ZIP, carrega `word/document.xml` via
   `System.Xml.XmlDocument.Load` (para respeitar a codificação UTF-8
   declarada no XML — a primeira tentativa usando `Get-Content -Raw` corrompeu
   acentuação e foi descartada) e extrai parágrafos/headings/listas/tabelas
   para Markdown. O resultado é um extrato de apoio, não uma conversão
   completa e fiel do DOCX (elementos como caixas de texto/SmartArt podem não
   aparecer — por isso cada extrato traz uma nota apontando de volta para o
   DOCX original como fonte de referência).
2. **DOCX vieram de `claude_code_sme_base/docs_base/`, não da raiz do
   repositório.** O usuário disponibilizou os 5 DOCX e o master prompt dentro
   de um diretório `claude_code_sme_base/` (untracked no git) em vez da raiz,
   como o cabeçalho do master prompt sugere como "uso recomendado". Os
   arquivos foram localizados por busca (`Glob`) e copiados normalmente para
   `docs/plano-evolucao-sme/base/`; os originais em `claude_code_sme_base/`
   não foram removidos.
3. **Build de produção incluído no baseline.** O master prompt não pede build
   explicitamente na lista de 12 itens da ETAPA 00, mas a seção 12
   ("Regras de testes") do mesmo documento pede lint+typecheck+build sempre
   que aplicável, e um baseline de build é barato aqui (schema Prisma gera
   sem precisar de conexão real ao banco, e todas as rotas são dinâmicas
   `ƒ` ou estáticas simples `○`, sem side-effects de I/O no build). Por isso
   foi incluído no baseline desta etapa.

## Testes executados

Comandos executados na raiz do repositório, sem alterar código:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Resultado dos testes

- `npm test` (via `scripts/test.mjs`, `node:test` através de `tsx`): **107
  testes, 22 suítes, 107 passaram, 0 falharam.** Cobrem
  `lib/analytics/{comparativos,distorcao,estatistica,explicabilidade,
  frequencia,mapeamento-serie,qualidade-dados}.test.ts` — todas funções puras,
  sem dependência de banco.
- `npm run typecheck` (`tsc --noEmit`): **sem erros.**
- `npm run lint` (`next lint`): **sem warnings/erros** ("No ESLint warnings or errors").
- `npm run build` (`prisma generate && next build`): **sucesso.** 46 rotas
  geradas (a maioria dinâmica `ƒ`, algumas estáticas `○` como `/`, `/documentos`,
  `/login`). `prisma generate` funcionou porque só precisa do schema, não de
  conexão real com o Postgres — o `.env` local tem `DATABASE_URL` definido,
  mas nenhuma query real foi executada nesta etapa (nenhum teste de UI logada
  nem migração).

Nenhuma correção foi feita — este é o estado real do repositório em
2026-08-24, antes de qualquer mudança das próximas etapas.

## Riscos e pendências

Riscos identificados durante a auditoria que **podem alterar a ordem ou o
escopo das próximas etapas** (nenhum foi corrigido nesta etapa, por estar
fora de escopo):

1. **`ServidorTurma` sem `escolaId` e disciplina fora da chave de unicidade**
   (`prisma/schema.prisma`): `@@unique([servidorId, turma])`, com `turma`
   como string livre e `disciplina` como campo opcional não único. Isso
   confirma, no schema real, o achado do master prompt de que turma+professor
   não é uma chave segura quando (a) códigos de turma se repetem entre
   escolas e (b) um professor pode lecionar mais de uma disciplina na mesma
   turma. Isso é pré-requisito direto da ETAPA 01 (`ProfessorScope`) e da
   ETAPA 06 (Professor P0) — qualquer decisão de adicionar `escolaId`/rever a
   chave de unicidade é uma migração de schema e deve seguir a regra da
   seção 7.8 do master prompt (explicar, identificar dados afetados, propor
   estratégia de backfill, só executar na etapa que prevê a mudança).
2. **Autorização hoje é só por `role`.** `lib/require-session.ts` e o padrão
   observado em `lib/roles.ts` confirmam que a checagem de acesso atual é
   binária por papel (`session.role` contra uma lista permitida), sem
   dimensão de escola/turma/disciplina. Isso é esperado nesta fase (é
   exatamente o gap que a ETAPA 01 resolve), mas significa que, até lá,
   qualquer rota de detalhe por ID (`/admin/estudantes/[id]`,
   `/portal/direcao/alunos/[id]`, `/portal/professor/turma/[id]`) pode não
   estar validando escopo — isso deve ser tratado com cuidado e testado
   explicitamente na ETAPA 01/06, não presumido como já seguro.
3. **Nenhum componente acadêmico compartilhado nomeado existe ainda**
   (`SchoolOverview`, `TurmaDetail`, `GradeTable`, etc.) — a ETAPA 03 parte de
   zero na extração, não de refatoração de componentes já isolados. Ver
   `MATRIZ_REAPROVEITAMENTO.md` seção 3.
4. **DOCX fora da raiz do repositório.** Os 5 DOCX e o master prompt estavam
   em `claude_code_sme_base/` (untracked). Se esse diretório for removido ou
   se o usuário estava esperando os arquivos na raiz conforme sugerido no
   cabeçalho do master prompt, vale confirmar se `claude_code_sme_base/`
   deve ser mantido, versionado ou removido do repositório — decisão do
   usuário, não tomada nesta etapa.
5. **Seção "Perguntas inteligentes"/"Perguntas que o portal deve responder"
   vazias nos extratos.** Em pelo menos dois extratos (Admin seção 4, Aluno
   seção 3), o texto abaixo do heading não foi capturado pela extração
   automática — provavelmente por estar em elemento não capturado pelo script
   simplificado (ex.: SmartArt, caixa de texto, ou lista com formatação não
   padrão). Ao trabalhar nas etapas que dependem dessas seções, consultar o
   DOCX original diretamente, não confiar apenas no extrato.

## Critérios de aceite

- [x] A documentação existe.
- [x] Os DOCX estão referenciados (copiados + extraídos).
- [x] O baseline está registrado (testes/lint/typecheck/build).
- [x] Nenhum comportamento funcional foi alterado.

Todos os critérios de aceite foram atendidos.

## Próximo passo permitido

ETAPA 01 — Scopes e Capabilities, **somente mediante autorização explícita do
usuário**.
