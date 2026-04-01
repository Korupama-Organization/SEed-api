---
phase: 02-auth-test-suite-verification
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/auth/unit/auth.controller.unit.test.ts
  - tests/auth/unit/auth.middleware.unit.test.ts
  - tests/auth/unit/jwt.unit.test.ts
  - tests/setup.ts
autonomous: true
requirements: [AUTH-TEST-01]
must_haves:
  truths:
    - "Auth logic has automated unit tests for success and failure paths"
    - "Token utility behavior is validated for generate/verify/expiry semantics"
    - "Auth middleware failure responses are covered"
  artifacts:
    - path: "tests/auth/unit/auth.controller.unit.test.ts"
      provides: "Controller behavior matrix tests"
    - path: "tests/auth/unit/auth.middleware.unit.test.ts"
      provides: "Middleware auth guard tests"
    - path: "tests/auth/unit/jwt.unit.test.ts"
      provides: "JWT utility behavior tests"
  key_links:
    - from: "tests/auth/unit/auth.controller.unit.test.ts"
      to: "src/controllers/auth.controller.ts"
      via: "direct handler unit coverage"
      pattern: "registerUser|loginUser|refreshAccessToken"
    - from: "tests/auth/unit/auth.middleware.unit.test.ts"
      to: "src/middlewares/auth.middleware.ts"
      via: "middleware invocation with mocked req/res/next"
      pattern: "requireAuth"
    - from: "tests/auth/unit/jwt.unit.test.ts"
      to: "src/utils/jwt.ts"
      via: "token generate/verify assertions"
      pattern: "generate|verify|getTokenIssuedAt"
---

<objective>
Build an auth unit test foundation that covers primary and failure paths for controller, middleware, and JWT utility behaviors.

Purpose: Satisfy AUTH-TEST-01 with deterministic unit coverage before integration and CI gating.
Output: Unit test suites for auth controller, auth middleware, and JWT utility.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/02-auth-test-suite-verification/02-CONTEXT.md
@.planning/phases/02-auth-test-suite-verification/02-RESEARCH.md
@src/controllers/auth.controller.ts
@src/middlewares/auth.middleware.ts
@src/utils/jwt.ts
@tests/security/registration-role-policy.unit.test.ts

<interfaces>
From src/utils/jwt.ts:
```typescript
generateAccessToken(userId, role)
verifyAccessToken(token)
getTokenIssuedAt(payload)
```

From src/middlewares/auth.middleware.ts:
```typescript
export const requireAuth = async (req, res, next) => { ... }
```

From src/controllers/auth.controller.ts:
```typescript
registerUser(req, res)
loginUser(req, res)
refreshAccessToken(req, res)
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add auth controller and middleware unit behavior matrix</name>
  <files>tests/auth/unit/auth.controller.unit.test.ts, tests/auth/unit/auth.middleware.unit.test.ts, tests/setup.ts</files>
  <behavior>
    - Test 1: Controller rejects invalid/missing input with expected 4xx responses
    - Test 2: Controller success paths return expected status/payload shape
    - Test 3: requireAuth rejects missing/invalid tokens and permits valid token flow
  </behavior>
  <action>Create unit tests with targeted mocking (User model, bcrypt, Redis/JWT utilities) for representative success/failure paths across `registerUser`, `loginUser`, `refreshAccessToken`, and `requireAuth`. Reuse and extend global test env setup where needed without introducing integration dependencies.</action>
  <verify>
    <automated>npm run test -- tests/auth/unit/auth.controller.unit.test.ts tests/auth/unit/auth.middleware.unit.test.ts</automated>
  </verify>
  <done>Controller and middleware unit suites cover core happy/failure paths with deterministic pass/fail behavior.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add JWT utility unit tests for token lifecycle guarantees</name>
  <files>tests/auth/unit/jwt.unit.test.ts</files>
  <behavior>
    - Test 1: Access/refresh/reset token generators create verifiable payloads
    - Test 2: Verification rejects invalid token/signature
    - Test 3: getTokenIssuedAt handles missing/non-number iat safely
  </behavior>
  <action>Implement dedicated tests for `src/utils/jwt.ts` covering token creation, verification, and helper edge-cases using controlled env secrets and explicit expectations for payload type/claims.</action>
  <verify>
    <automated>npm run test -- tests/auth/unit/jwt.unit.test.ts</automated>
  </verify>
  <done>JWT utility behavior is covered for generation, verification, and issued-at extraction semantics.</done>
</task>

</tasks>

<verification>
- Unit auth tests execute successfully and remain isolated from external infrastructure.
- Existing security test suites remain runnable.
</verification>

<success_criteria>
- AUTH-TEST-01 is partially fulfilled with robust unit coverage for auth core logic.
- New tests are maintainable and deterministic.
</success_criteria>

<output>
After completion, create `.planning/phases/02-auth-test-suite-verification/02-auth-test-suite-verification-01-SUMMARY.md`
</output>
