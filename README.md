# ChatDP Monorepo

A full-stack chat/calls application monorepo:
- Backend: Nest.js + Prisma (PostgreSQL) with WebSockets, JWT auth, and security baseline
- Frontend: Flutter (multi-platform)
- CI/CD: GitHub Actions for backend and frontend

Source of truth for scope and phases: docs/PROJECT_CHATDP_PLAN.md

## Monorepo Structure
- apps/
  - backend/ — Nest.js service (REST/WebSocket), Prisma schema/migrations, tests
  - frontend/ — Flutter app (web/desktop/mobile), widget tests
- packages/
  - api-contracts/ — OpenAPI contracts (e.g., openapi/chatdp.yaml)
  - shared-config/ — Shared ESLint/Prettier configs
- .github/workflows/ — CI pipelines for backend/frontend

## Tech Stack
- Node 20+, pnpm, Nest.js, Prisma, PostgreSQL
- Flutter stable channel
- WebSocket (Nest Gateways), JWT + bcrypt
- Prometheus metrics, Winston logging

## Getting Started
Prerequisites:
- Node 20+, pnpm (>=8)
- Flutter (stable channel), Android/iOS tooling as needed
- PostgreSQL (local or remote)

Install:
- Backend deps: `pnpm -C apps/backend install`
- Frontend deps: `cd apps/frontend && flutter pub get`

Environment (backend): copy and adjust env file
- Copy `apps/backend/.env.example` to `apps/backend/.env`
- Ensure `DATABASE_URL` points to your PostgreSQL instance

Database (Prisma):
- Create DB/schema, then: `pnpm -C apps/backend prisma migrate dev`
- Generate client: `pnpm -C apps/backend prisma generate`

Run (backend):
- Dev: `pnpm -C apps/backend start:dev`
- Build: `pnpm -C apps/backend build`
- Lint: `pnpm -C apps/backend lint`
- Test (unit): `pnpm -C apps/backend test`
- Test (e2e): `pnpm -C apps/backend test:e2e`
- Single test example: `pnpm --filter @chatdp/backend test -- src/path/to/file.spec.ts`

Run (frontend):
- Web: `cd apps/frontend && flutter run -d chrome`
- Desktop (Linux/macOS/Windows): `flutter run -d linux|macos|windows`
- Mobile: `flutter run -d ios|android`
- Tests: `flutter test`

## Code Style & Quality
- Imports order: side-effects → external → internal → relative; grouped with blank lines
- Formatting: Prettier { singleQuote: true, trailingComma: all, printWidth: 100-120 }; EditorConfig enforced
- Types/naming: strict TS; PascalCase (classes/enums), camelCase (props/methods), UPPER_SNAKE (env/constants)
- Validation: DTOs via class-validator; throw HttpException with status; central exception filter
- Logging: Winston (no secrets)

## Security & Performance
- JWT auth, bcrypt, rate limiting, CORS allowlist, input sanitization
- WebSocket: JWT on handshake; room per conversation; consistent event names
- DB: indexes, pagination, avoid N+1 via include/select; batch where possible
- Consider Redis caching; monitor with Prometheus

## CI/CD (GitHub Actions)
- Backend workflow: Node 20 + pnpm — install, lint, build, test; path filters for apps/backend and packages as needed
- Frontend workflow: Flutter stable — pub get, test; path filters for apps/frontend

## Branching Plan (Phases)
0) Bootstrap
1) Security baseline (ValidationPipe, filters, CORS/Helmet/logger)
2) Prisma schema + migrations
3) Auth (JWT/bcrypt/refresh)
4) Users (profile/search)
5) Conversations + Messages + WS events
6) Calls signaling (WebRTC)
7) Frontend bootstrap + Auth
8) CI with e2e DB + coverage
9) Docker/compose
10) OpenAPI contracts + codegen
11) Observability

## License
Licensed under the Apache License, Version 2.0. See the LICENSE file for details.
