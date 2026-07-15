# Project & Team Task Management Platform

A full-stack web application for managing **projects**, **teams**, and **tasks** with secure
authentication and role-based access control (RBAC).

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Auth:** JWT (HS256) + bcrypt, with role- and object-level authorization
- **CI/CD:** GitHub Actions (lint + type-check + test + build)

## Roles

| Role | Capabilities |
| --- | --- |
| **Administrator** | Manage users & roles, oversee/delete any project, system access. |
| **Project Manager** | Create/manage own projects, assign team members, create/assign/delete tasks. |
| **Team Member** | View assigned projects/tasks, update own task progress, comment on tasks. |

## Repository structure

```
.
├── backend/                 # Node.js + Express REST API
│   ├── prisma/              # schema, migrations, seed
│   ├── src/
│   │   ├── config/          # env loading
│   │   ├── db/              # prisma client
│   │   ├── middleware/      # auth, RBAC, error handling
│   │   ├── modules/         # auth, users, projects, tasks, dashboard
│   │   ├── utils/           # password, jwt, http errors, express helpers
│   │   ├── validators/      # Zod schemas
│   │   └── routes/          # route aggregation
│   └── tests/               # Vitest unit tests
├── frontend/                # Next.js app
│   ├── app/(app)/           # authenticated pages (dashboard, projects, users, my-tasks)
│   ├── app/login/           # login page
│   ├── components/          # AppShell, badges
│   └── lib/                 # api client, auth store, types
├── docs/                    # ERD, Use-Case, Architecture, API, Postman, reports
├── docker-compose.yml       # Postgres + backend + frontend
└── .github/workflows/ci.yml # CI pipeline
```

## Prerequisites

- Node.js 18+ (tested on 20/22)
- PostgreSQL 14+ (or Docker)
- npm

## Quick start (Docker — recommended)

```bash
# 1. Start Postgres + backend + frontend
docker compose up --build

# 2. In a separate terminal, run migrations + seed (backend container)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed

# App:      http://localhost:3000
# API:      http://localhost:4000/api
```

## Manual setup (local)

### 1. Database

Create a PostgreSQL database and note its connection string, e.g.:
`postgresql://postgres:postgres@localhost:5432/ptmp?schema=public`

### 2. Backend

```bash
cd backend
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma generate
npx prisma migrate deploy     # or: npm run db:migrate
npm run db:seed               # demo users/projects/tasks
npm run dev                   # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_BASE=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:3000
```

## Demo accounts (after seeding)

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | admin@cyphlab.com | Password123! |
| PROJECT_MANAGER | pm@cyphlab.com | Password123! |
| TEAM_MEMBER | alice@cyphlab.com | Password123! |
| TEAM_MEMBER | bob@cyphlab.com | Password123! |

## Testing & quality gates

```bash
# Backend
cd backend && npm run typecheck && npm run lint && npm test

# Frontend
cd frontend && npm run lint && npm run build
```

CI runs all of the above automatically on every push/PR (see `.github/workflows/ci.yml`).

## Documentation

- [ERD](docs/ERD.md)
- [Use-Case Diagram](docs/use-case.md)
- [System Architecture](docs/architecture.md)
- [API Documentation](docs/API.md)
- [Postman Collection](docs/postman/PTMP.postman_collection.json)
- [Feature Completion Report](docs/FEATURE_REPORT.md)
- [CI/CD Explanation](docs/CI_CD.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## AI assistance disclosure

This project was developed with the assistance of **Kilo** (an AI coding agent powered by a
large language model). AI was used to:

- Scaffold the project structure and boilerplate (Express app, Next.js config, Prisma schema).
- Draft the Prisma data model, Zod validators, and RBAC middleware.
- Generate the documentation, diagrams (Mermaid), Postman collection, and CI workflow.
- Suggest React/Next.js UI components and Tailwind styling.

All generated code was reviewed, type-checked, linted, and tested by the candidate. The
authentication logic, role-based authorization rules, and database relationship design were
implemented and verified by the candidate.
