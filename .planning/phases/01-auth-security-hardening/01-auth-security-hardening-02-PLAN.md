---
phase: 01-auth-security-hardening
plan: 02
type: execute
wave: 2
depends_on: [01-auth-security-hardening-01]
files_modified:
  - package.json
  - src/middlewares/auth-rate-limit.middleware.ts
  - src/routes/auth.routes.ts
  - src/utils/redis.ts
  - tests/security/auth-rate-limit.integration.test.ts
  - tests/security/registration-role-policy.unit.test.ts
  - tests/security/config-validation.unit.test.ts
  - tests/setup.ts
  - jest.config.cjs
autonomous: true
requirements: [AUTH-SEC-03, AUTH-SEC-04]
must_haves:
  truths:
    - "Auth endpoints enforce Redis-backed per-email throttling"
    - "Repeated auth requests receive 429 with silent blocking behavior"
    - "Security-critical behavior has automated tests"
  artifacts:
    - path: "src/middlewares/auth-rate-limit.middleware.ts"
      provides: "Redis-backed auth limiter middleware with per-email keying"
    - path: "tests/security/auth-rate-limit.integration.test.ts"
      provides: "Integration verification for 429 throttling"
    - path: "tests/security/registration-role-policy.unit.test.ts"
      provides: "Role-policy enforcement tests"
    - path: "tests/security/config-validation.unit.test.ts"
      provides: "Fail-fast env validation tests"
  key_links:
    - from: "src/routes/auth.routes.ts"
      to: "src/middlewares/auth-rate-limit.middleware.ts"
      via: "auth route middleware chain"
      pattern: "router\.post\(.*authRateLimiter"
    - from: "src/middlewares/auth-rate-limit.middleware.ts"
      to: "src/utils/redis.ts"
      via: "Redis-backed rate-limit store/client"
      pattern: "redis|Redis"
    - from: "tests/security/auth-rate-limit.integration.test.ts"
      to: "src/routes/auth.routes.ts"
      via: "HTTP assertions on throttled endpoints"
      pattern: "429"
---

<objective>
Add Redis-backed per-email auth abuse protection and ship security-critical automated tests for phase 1 hardening decisions.

Purpose: Close brute-force/request-flood risk while proving core security behavior automatically.
Output: Rate-limit middleware on auth routes + runnable security-focused test suite.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-auth-security-hardening/01-CONTEXT.md
@.planning/phases/01-auth-security-hardening/01-auth-security-hardening-01-SUMMARY.md
@src/routes/auth.routes.ts
@src/utils/redis.ts
@package.json

<interfaces>
From src/utils/redis.ts:
```typescript
export const setTempValue = async (...)
export const getTempValue = async (...)
```

From src/routes/auth.routes.ts:
```typescript
router.post('/register', ...)
router.post('/login', ...)
router.post('/forgot-password', ...)
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement Redis-backed per-email auth limiter middleware and wire endpoints</name>
  <files>src/middlewares/auth-rate-limit.middleware.ts, src/routes/auth.routes.ts, src/utils/redis.ts</files>
  <behavior>
    - Test 1: Repeated requests with same email exceed threshold and return 429
    - Test 2: Requests without email use safe fallback keying path
    - Test 3: Limiter applies to sensitive auth endpoints consistently
  </behavior>
  <action>Add `express-rate-limit` + `rate-limit-redis` integration in new auth limiter middleware with per-email `keyGenerator` and Redis-backed state. Preserve silent blocking response semantics. Wire limiter into sensitive auth routes (`/register`, `/login`, `/resend-verify-email-otp`, `/forgot-password`, `/resend-forgot-password-otp`, `/reset-password`) without changing endpoint contracts.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Configured auth endpoints throttle abusive repeated requests using shared Redis counters and return 429 when limit is exceeded.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Establish security-critical hybrid tests and test scripts (warn-only policy compatible)</name>
  <files>package.json, jest.config.cjs, tests/setup.ts, tests/security/auth-rate-limit.integration.test.ts, tests/security/registration-role-policy.unit.test.ts, tests/security/config-validation.unit.test.ts</files>
  <behavior>
    - Test 1: role policy rejects admin role registration path
    - Test 2: config validator throws when required env vars are missing
    - Test 3: rate limiter emits 429 after threshold in integration scenario
  </behavior>
  <action>Set up minimal Jest + TypeScript test harness for hybrid strategy (unit + integration) focused only on phase security-critical checks. Add npm scripts (`test`, optional scoped security script) and implement the three targeted tests for role policy, config fail-fast, and limiter behavior. Keep CI expectation warn-only by avoiding blocking workflow requirements in this phase plan.</action>
  <verify>
    <automated>npm run test -- --runInBand tests/security</automated>
  </verify>
  <done>Security-critical automated tests run locally and validate the three phase-1 hardening behaviors.</done>
</task>

</tasks>

<verification>
- Build passes with new limiter dependencies.
- Security test suite executes and covers role policy, config fail-fast, and limiter 429 behavior.
- No auth route contract regressions in Swagger/handler mappings.
</verification>

<success_criteria>
- `AUTH-SEC-03` satisfied: per-email Redis-backed limiter is active on sensitive auth endpoints.
- `AUTH-SEC-04` satisfied: security-critical tests exist and run through npm command.
- Phase 1 security hardening is implementation-ready with measurable verification commands.
</success_criteria>

<output>
After completion, create `.planning/phases/01-auth-security-hardening/01-auth-security-hardening-02-SUMMARY.md`
</output>
