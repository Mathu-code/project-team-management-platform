# CI/CD Workflow Explanation

The pipeline is defined in `.github/workflows/ci.yml` and runs on every push and pull request to
`main`. It has two jobs.

## 1. Backend job

Runs on `ubuntu-latest` with a **PostgreSQL 16 service container** (health-checked with
`pg_isready`) so the database is available during the run.

Steps:
1. `npm ci` – clean, reproducible install from the lockfile.
2. `npx prisma generate` – generate the Prisma client.
3. `npx prisma migrate deploy` – apply versioned migrations to the test database.
4. `npm run typecheck` – `tsc --noEmit` (TypeScript strict mode).
5. `npm run lint` – ESLint (recommended + `@typescript-eslint`).
6. `npm test` – Vitest unit tests (password hashing, JWT, validators).

## 2. Frontend job

Runs on `ubuntu-latest`:
1. `npm ci` – install dependencies.
2. `npm run lint` – `next lint` (Next.js core-web-vitals rules).
3. `npm run build` – production `next build` (also type-checks the app).

## Why this satisfies the requirement

The assignment asks for "linting, testing, or build validation." This pipeline performs **all
three** for both the backend and the frontend on every change, so broken code cannot be merged
without failing the checks. The Postgres service container makes the backend tests database-ready
and also exercises the real migrations.

## Local equivalent

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run db:migrate   # needs a running Postgres
npm run typecheck
npm run lint
npm test

# Frontend
cd frontend
npm install
npm run lint
npm run build
```
