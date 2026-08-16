# Portal Educacional Integrado — SME Baraúna (RN)

Portal institucional público + sistema de gestão educacional integrado ao SIGEduc (API Educ 21) para a Secretaria Municipal de Educação de Baraúna - RN.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · Zod · JWT (`jose`) em cookies HTTP-Only.

## Primeiros passos

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, JWT_SECRET e credenciais SIGEduc
npx prisma migrate dev --name init
npm run db:seed        # cria o usuário ADMIN inicial (SEED_ADMIN_CPF / SEED_ADMIN_PASSWORD)
npm run dev
```

Acesse `http://localhost:3000`. A área restrita fica em `/login`; o CPF/senha do administrador semeado por `db:seed` dá acesso a `/admin`.

## Estrutura

- `app/` — rotas (App Router): site público, `/login`, `/admin` (CMS + gestão), `/portal/{direcao,professor,servidor,aluno}`.
- `lib/sigeduc.ts` — cliente da API Educ 21 (escolas, cargos, servidores, estudantes, notas, frequência, declaração de matrícula).
- `lib/sync/sigeduc-sync.ts` — rotinas de sincronização SIGEduc → banco local, disparadas em `/admin/sincronizacao`.
- `lib/auth.ts` / `lib/session.ts` — autenticação por CPF + data de nascimento, sessão JWT, detecção automática de papel (RBAC).
- `middleware.ts` — proteção de rotas `/admin` e `/portal/*` por papel.
- `prisma/schema.prisma` — modelo de dados completo (usuários, escolas, servidores, estudantes, notas, frequência, CMS, avaliações municipais).

## Login

Login unificado por **CPF** + **data de nascimento** (senha inicial). No primeiro acesso, o sistema busca o CPF nas tabelas `User` → `Servidor` → `Estudante`, classifica o papel (Direção / Professor / Servidor Geral / Aluno) e provisiona a conta automaticamente. Administradores podem criar acessos manuais com senha personalizada em `/admin/usuarios`.

## Sincronização

`/admin/sincronizacao` permite disparar cada módulo manualmente. Servidores, Estudantes, Notas e Frequência são grandes demais para uma única requisição, então rodam em lotes (por escola ou por página) — o botão no painel chama a Server Action repetidamente até terminar, mostrando o progresso.

### Automática (Vercel Cron)

`vercel.json` registra 5 cron jobs diários (`/api/cron/sync-*`, entre 2h e 2h50 no horário de Brasília) que rodam o mesmo código dos botões do painel, cada um fazendo seu próprio loop de lotes internamente até concluir. Frequência sincroniza só uma janela incremental dos últimos 3 dias (não o ano inteiro — o volume diário já é grande).

Para habilitar, defina `CRON_SECRET` nas variáveis de ambiente do projeto na Vercel (qualquer string aleatória forte) — a Vercel usa esse valor automaticamente para autenticar as chamadas agendadas. Sem essa variável, as rotas de cron recusam qualquer requisição.

Os `maxDuration` de cada rota (`app/api/cron/*/route.ts`) assumem Fluid Compute (padrão em projetos novos da Vercel, até 300s no plano Hobby / 800s no Pro). Se o plano do projeto tiver um limite menor, um cron pode ser interrompido no meio — isso é seguro: o trabalho já commitado fica salvo (upserts são idempotentes), e o próximo disparo do dia seguinte recomeça do zero e completa o restante.
