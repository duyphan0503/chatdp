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

## Backend capabilities

The backend is a production-grade messaging and calling service built on NestJS and Prisma.
It is structured into clear modules and already implements the main phases from
`docs/PROJECT_CHATDP_PLAN.md`.

Key capabilities:

- **Authentication & security**
  - Email/password signup & login with Argon2 password hashing.
  - JWT access tokens + DB-backed refresh tokens with rotation and revocation.
  - Optional refresh-token binding to User-Agent and IP (configurable via env).
  - Global `ValidationPipe` (whitelist + transform), global exception filter.
  - Rate limiting (HTTP + WebSocket) with in-memory storage by default and Redis support.
  - CORS, Helmet, configurable `TRUST_PROXY` for reverse proxies/CDNs.

- **Conversations & messages (REST)**
  - Private 1-1 and group conversations with participants and admin roles.
  - Messages with text/media metadata, replies, soft delete, reactions, read statuses.
  - Cursor-based pagination for conversation history.
  - PostgreSQL schema with proper indexes and Prisma repositories.

- **Realtime messaging & calls (WebSocket)**
  - JWT-authenticated WebSocket gateway (Socket.IO).
  - Rooms per conversation and per user for fan-out.
  - Realtime events for `message:new`, `message:read`, `typing`, presence basics.
  - Call signaling (WebRTC-style) for 1-1 voice/video calls (initiate/accept/reject/end/ICE).
  - In-memory call state machine with timeouts and simple anti-spam rate limiting.

- **Media handling**
  - Pluggable media storage: `local` (dev) or `s3` (S3/MinIO-compatible).
  - Presigned URL flow for uploads, metadata in Postgres, access tracking.

- **Search & indexing**
  - Message search endpoints backed by PostgreSQL full-text search.
  - Pagination via cursor and filters (conversation, sender, time range).

- **Observability & operations**
  - Structured logging with correlation IDs and module-specific context.
  - Health endpoints:
    - `/api/healthz` (liveness)
    - `/api/ready` (readiness, including DB check)
  - Prometheus metrics at `/api/metrics`:
    - HTTP request count, latency, in-flight requests.
    - Prisma/DB query metrics.
    - WebSocket event counters.

- **Polyglot read model (optional)**
  - MongoDB read model for hot message timelines (outbox pattern, projector worker).
  - Feature-flagged via `USE_MONGO_READ_MODEL` and `MONGO_PROJECTOR_ENABLED` env vars,
    with safe fallback to Postgres-only reads.

For a phase-by-phase technical breakdown and roadmap, see:

- `docs/PROJECT_CHATDP_PLAN.md`

## Backend API surface

The backend REST and WebSocket APIs are described in the OpenAPI contract:

- `packages/api-contracts/openapi/chatdp.yaml`

Highlighted endpoints:

- **Auth**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`
- **Users**: `/api/me`, `/api/users/profile/:id`
- **Conversations**: `/api/conversations` (create/list), `/api/conversations/:id` (get/update)
- **Messages**: `/api/conversations/:conversationId/messages` (create/list)
- **Read receipts**: `/api/messages/:messageId/read`, `/api/messages/:messageId/status`
- **Search**: `/api/search/messages`
- **Media**: `/api/media/presign`, `/api/media/:id/access`
- **Health & metrics**: `/api/healthz`, `/api/ready`, `/api/metrics`

WebSocket events are handled under the realtime gateway namespace and mirror the HTTP
capabilities for messaging and calls (authentication, join/leave rooms, send/read messages,
call signaling).

## WebSocket (Realtime) Events - Phase 5

Implemented gateway events (Calls signaling sẽ ở Phase 8):

Client -> Server:
- authenticate: JWT access token để mở phiên WebSocket.
- conversation:join / conversation:leave: tham gia / rời conversation room.
- typing: trạng thái đang gõ.
- message:new: gửi tin nhắn mới (text/media).
- message:read: đánh dấu tin nhắn đã đọc.

Server -> Client:
- authenticated / unauthorized: kết quả xác thực.
- conversation:joined / conversation:left: phản hồi join/leave.
- typing: một participant đang gõ.
- message:new: tin nhắn mới tạo.
- message:read: trạng thái đọc.
- rate:limit: vượt ngưỡng tốc độ sự kiện (spam mitigation).
- error: lỗi nghiệp vụ (không phải participant, gửi thất bại...).

Rate Limiting (in-memory):
- ENV: WS_RATE_LIMIT_TTL (giây), WS_RATE_LIMIT_LIMIT (số sự kiện / window) cho typing & message:new.
- Hiện tại per-instance (không phân tán). Kế hoạch chuyển sang Redis (Phase 7 Hardening) để đồng bộ giữa nhiều node.

Room Strategy:
- conversation:<id> cho fan-out tin nhắn & typing.
- user:<id> dành cho định tuyến trực tiếp / presence (chuẩn hoá sau).

Future (Phase 8): call:initiate, call:accept, call:reject, call:ice_candidate.

## License
Licensed under the Apache License, Version 2.0. See the LICENSE file for details.
