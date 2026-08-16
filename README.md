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

## Observação sobre sincronização

As rotinas em `/admin/sincronizacao` percorrem a paginação da API Educ 21 de forma síncrona dentro da própria requisição. Para bases grandes, isso pode exceder o timeout de funções serverless (Vercel etc.) — nesse caso, mover a sincronização para um job em background (fila, cron) é recomendado.
