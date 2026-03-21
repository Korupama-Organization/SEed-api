# Phase 2 Research - Auth Test Suite & Verification

## Scope
- Expand auth-focused tests using existing Jest/ts-jest setup
- Define practical coverage threshold and CI enforcement path
- Keep implementation aligned with existing Express + TypeScript architecture

## Findings

1. Test stack is already available:
   - jest, ts-jest, supertest, @types/jest, @types/supertest
   - Existing config: jest.config.cjs
2. Current tests only cover security-hardening subset:
   - role policy middleware
   - env validation
   - rate limiter integration
3. Missing for phase goal:
   - auth controller behavior matrix (happy + error paths)
   - auth middleware behavior matrix
   - jwt utility behavior matrix
   - integration flow coverage for register/login/refresh + OTP/reset paths
   - CI workflow file and coverage gating

## Selected Approach

- Reuse Jest stack (no new framework)
- Add focused auth test groups:
  - unit: controller/middleware/jwt
  - integration: auth routes with supertest and mocked infrastructure boundaries
- Add coverage threshold gate in Jest config and CI workflow (GitHub Actions)
- Add dedicated scripts (`test:auth`, `test:coverage`) for reproducible verification

## Risks

- Integration tests may require careful mocking of Redis/Mongo/email side effects
- Coverage thresholds should start realistic and strict enough to prevent regressions

## Decision

Proceed with two execution plans:
- Plan 01: unit suite expansion
- Plan 02: integration tests + CI enforcement + verification artifacts
