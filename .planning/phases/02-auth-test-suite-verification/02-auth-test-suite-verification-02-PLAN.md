---
phase: 02-auth-test-suite-verification
plan: 02
type: execute
wave: 2
depends_on: [02-auth-test-suite-verification-01]
files_modified:
  - tests/auth/integration/auth.routes.integration.test.ts
  - jest.config.cjs
  - package.json
  - .github/workflows/ci.yml
  - .planning/phases/02-auth-test-suite-verification/02-VERIFICATION.md
autonomous: true
requirements: [AUTH-TEST-01, AUTH-TEST-02, AUTH-TEST-03]
must_haves:
  truths:
    - "Auth API integration flows are tested with request/response assertions"
    - "Coverage targets are enforced in test tooling and CI"
    - "Phase verification artifact records requirement-level completion evidence"
  artifacts:
    - path: "tests/auth/integration/auth.routes.integration.test.ts"
      provides: "Auth route integration coverage"
    - path: "jest.config.cjs"
      provides: "Coverage thresholds and test config"
    - path: ".github/workflows/ci.yml"
      provides: "CI test and coverage enforcement"
    - path: ".planning/phases/02-auth-test-suite-verification/02-VERIFICATION.md"
      provides: "Requirement verification report"
  key_links:
    - from: ".github/workflows/ci.yml"
      to: "package.json"
      via: "CI executes test scripts"
      pattern: "npm run test|npm run test:coverage"
    - from: "jest.config.cjs"
      to: "tests/auth/**"
      via: "coverage include and threshold rules"
      pattern: "coverageThreshold"
    - from: "tests/auth/integration/auth.routes.integration.test.ts"
      to: "src/routes/auth.routes.ts"
      via: "supertest endpoint assertions"
      pattern: "/api/auth"
---

<objective>
Complete auth integration testing and enforce test/coverage in CI with a formal verification artifact for phase closure.

Purpose: Finish AUTH-TEST requirements by validating API-level behavior and making quality gates reproducible.
Output: Integration tests + CI workflow + coverage threshold enforcement + verification doc.
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
@.planning/phases/02-auth-test-suite-verification/02-auth-test-suite-verification-01-SUMMARY.md
@src/routes/auth.routes.ts
@jest.config.cjs
@package.json

<interfaces>
From src/routes/auth.routes.ts:
```typescript
router.post('/register', ...)
router.post('/login', ...)
router.post('/refresh', ...)
router.post('/forgot-password', ...)
```

From package.json:
```json
"scripts": {
  "test": "jest",
  "test:security": "jest --runInBand tests/security"
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add auth integration test suite for key request/response flows</name>
  <files>tests/auth/integration/auth.routes.integration.test.ts</files>
  <behavior>
    - Test 1: Primary auth route success paths return expected status/payload
    - Test 2: Failure paths return expected 4xx/401/403 responses
    - Test 3: Refresh and OTP-related routes assert contract-safe behavior
  </behavior>
  <action>Create supertest-driven integration tests for `/api/auth` routes with controlled mocks for persistence/side effects (Mongo/Redis/email). Cover representative end-to-end request contracts for register/login/refresh and OTP flows, focusing on deterministic assertions instead of infrastructure coupling.</action>
  <verify>
    <automated>npm run test -- tests/auth/integration/auth.routes.integration.test.ts</automated>
  </verify>
  <done>Auth integration suite validates primary and failure API behaviors across key endpoints.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Enforce coverage and CI test gate; publish phase verification artifact</name>
  <files>jest.config.cjs, package.json, .github/workflows/ci.yml, .planning/phases/02-auth-test-suite-verification/02-VERIFICATION.md</files>
  <behavior>
    - Test 1: Coverage threshold fails when below configured level
    - Test 2: CI workflow runs build + tests on pull requests
    - Test 3: Verification doc maps AUTH-TEST-01..03 to evidence
  </behavior>
  <action>Update Jest config to include auth-relevant coverage collection and thresholds; add `test:coverage` script in package.json; create GitHub Actions workflow that installs deps, runs build, and runs coverage-enabled tests to enforce AUTH-TEST-02. Generate `02-VERIFICATION.md` with requirement-by-requirement pass evidence and executed commands for AUTH-TEST-03.</action>
  <verify>
    <automated>npm run test -- --coverage --runInBand</automated>
  </verify>
  <done>Coverage targets and CI enforcement are active, and phase verification artifact documents completion evidence.</done>
</task>

</tasks>

<verification>
- Integration and unit auth tests run successfully.
- Coverage report is generated and thresholds are enforced.
- CI workflow validates build + tests on repo events.
</verification>

<success_criteria>
- AUTH-TEST-01 complete: auth unit + integration paths are covered.
- AUTH-TEST-02 complete: CI and coverage gates enforce quality.
- AUTH-TEST-03 complete: verification artifact exists with evidence.
</success_criteria>

<output>
After completion, create `.planning/phases/02-auth-test-suite-verification/02-auth-test-suite-verification-02-SUMMARY.md`
</output>
