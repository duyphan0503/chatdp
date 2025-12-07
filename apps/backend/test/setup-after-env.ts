// Jest E2E after-env setup
// - Ensure NODE_ENV=test for consistent ConfigService behavior
// - Increase default hook timeout for slower module compilation/init

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Jest 29+ exposes jest.setTimeout globally; we can safely call it here
// to bump the default timeout for all tests (hooks + individual tests).
// This prevents beforeAll from timing out when Nest module compilation
// (especially with Prisma) takes a bit longer on CI or cold machines.

const maybeJest = (global as any).jest as typeof jest | undefined;
if (maybeJest && typeof maybeJest.setTimeout === 'function') {
  maybeJest.setTimeout(30000);
}
