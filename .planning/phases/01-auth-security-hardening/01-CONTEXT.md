# Phase 1 Context - Auth Security Hardening

Phase Number: 1
Date: 2026-03-22
Status: Ready for planning

## Phase Boundary (Fixed)

This phase is limited to auth security hardening only:
- Fix privilege escalation in registration
- Enforce production-safe config validation
- Add rate limiting to auth endpoints
- Add security-focused tests for Phase 1 changes

Out of scope for this phase:
- New auth capabilities (OAuth, SSO)
- Domain routes (courses/lessons/orders)
- Full test coverage targets planned for later phases

## Prior Context Applied

Source artifacts considered:
- .planning/PROJECT.md
- .planning/codebase/CONCERNS.md
- src/controllers/auth.controller.ts
- src/constants.ts
- src/server.ts
- package.json

Existing concerns carried into this phase:
1. Privilege escalation risk in self-registration
2. Insecure fallback secrets/configuration values
3. Missing abuse controls on authentication endpoints

## Decision Area 1 - Rate Limiting

### Locked Decisions
- Keying strategy: per-email
- State backend: Redis
- Threshold strategy: uniform thresholds across auth endpoints (initial phase)
- Response behavior: silent blocking (return 429; no alerting requirement)

### Implementation Direction
- Introduce auth rate limiting middleware using Redis-backed counters/store.
- Apply to auth routes under /api/auth with per-email key extraction where applicable.
- Keep thresholds centralized in config for easy tuning.

## Decision Area 2 - Configuration Validation

### Locked Decisions (Production-first)
- Required vars (must exist):
  - JWT_SECRET
  - JWT_REFRESH_SECRET
  - JWT_RESET_PASSWORD_SECRET
  - MONGODB_URI
  - SMTP_HOST
  - SMTP_USER
  - SMTP_PASS
  - REDIS_HOST
  - REDIS_PORT
- Validation timing: startup (fail-fast before server starts)
- Config lifecycle: immutable (load once on startup)
- Error strategy:
  - Client-facing: generic configuration failure response
  - Server logs: explicit missing variable names

### Implementation Direction
- Remove insecure fallback defaults from security-sensitive env vars.
- Add startup validation function that checks required env vars and throws before app.listen.
- Ensure no runtime path silently substitutes weak fallback values.

## Decision Area 3 - Role Enforcement

### Locked Decisions
- Enforce role policy through middleware.
- Keep single registration endpoint.
- Teacher role is allowed at registration (no approval workflow).
- Admin role must never be assignable via public registration.
- Role policy is immutable for this phase (no role mutation feature in scope).

### Implementation Direction
- Add request-body role policy middleware for registration flow:
  - allow: student, teacher
  - block: admin
- Ensure controller layer cannot bypass middleware policy.
- Preserve single endpoint behavior while preventing admin privilege escalation.

### Open Point (Deferred)
- No decision on email-domain restrictions for elevated roles.
- Deferred to later phase; do not block Phase 1 work.

## Decision Area 4 - Testing Strategy

### Locked Decisions
- Test approach: hybrid (unit + integration)
- Redis usage in tests: hybrid (mock for unit, real/realistic path for integration)
- Coverage scope for this phase: security-critical paths only
- CI policy for this phase: warn-only on test failures

### Implementation Direction
- Add tests specifically for:
  - admin-role registration rejection
  - config validation fail-fast behavior
  - rate-limiting behavior on auth endpoints
- Keep test scope tight to Phase 1 outcomes; broader coverage remains later milestone work.

## Code Context

### Relevant Files
- src/controllers/auth.controller.ts
- src/server.ts
- src/constants.ts
- src/routes/auth.routes.ts
- src/utils/redis.ts

### Integration Points
- Registration role guard middleware should be attached before register controller execution.
- Rate limiter middleware should wrap sensitive auth endpoints.
- Startup config validation should run before listening on port.

## Constraints and Guardrails

- Do not expand scope beyond Phase 1 security hardening.
- Do not introduce admin self-registration under any condition.
- Keep behavior backward-compatible where security policy does not require breaking changes.
- Prefer reusable middleware and centralized config definitions.
