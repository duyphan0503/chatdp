# ChatDP Monorepo

Structure:
- backend/: Nest.js backend (TypeScript)
- frontend/: Flutter multi-platform app
- packages/: shared assets (api-contracts, configs)

Quick start:
- Backend: pnpm -C backend install; pnpm -C backend dev
- Frontend: cd frontend && flutter create . && flutter run -d chrome

CI/CD:
- .github/workflows/backend.yml — Node 20 + pnpm: lint, build, test
- .github/workflows/frontend.yml — Flutter stable: pub get, test (conditional)

Testing:
- Backend single test: pnpm --filter @chatdp/backend test -- src/path/to/file.spec.ts
- Name pattern: pnpm --filter @chatdp/backend test -- --testNamePattern="pattern"
- Flutter single test: flutter test test/path_to_test.dart
