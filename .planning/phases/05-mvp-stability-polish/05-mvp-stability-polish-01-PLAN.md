---
phase: 05-mvp-stability-polish
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/smoke/mvp.smoke.integration.test.ts
  - package.json
  - .planning/phases/05-mvp-stability-polish/05-UAT.md
autonomous: true
requirements: [MVP-STAB-01]
must_haves:
  truths:
    - "Core MVP API workflows run in one automated smoke suite"
    - "Smoke checks are runnable with one explicit npm script"
    - "UAT instructions mirror the automated smoke flow for manual confirmation"
  artifacts:
    - path: "tests/smoke/mvp.smoke.integration.test.ts"
      provides: "Cross-flow MVP smoke assertions"
    - path: "package.json"
      provides: "Smoke test command"
    - path: ".planning/phases/05-mvp-stability-polish/05-UAT.md"
      provides: "Manual verification steps for MVP smoke"
  key_links:
    - from: "package.json"
      to: "tests/smoke/mvp.smoke.integration.test.ts"
      via: "test:smoke script"
      pattern: "test:smoke"
    - from: "tests/smoke/mvp.smoke.integration.test.ts"
      to: "src/routes/auth.routes.ts"
      via: "auth flow requests"
      pattern: "/api/auth"
    - from: "tests/smoke/mvp.smoke.integration.test.ts"
      to: "src/routes/enrollment.routes.ts"
      via: "domain flow requests"
      pattern: "/api/enrollments"
---

<objective>
Build a single smoke-test path that validates the core MVP behavior and makes regression checks fast and repeatable.

Purpose: Satisfy MVP-STAB-01 with automated and manual smoke coverage for auth and core domain flows.
Output: Smoke integration suite, npm test:smoke command, and UAT checklist.
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
@.planning/phases/04-domain-logic-validation/04-VERIFICATION.md
@package.json
@src/routes/auth.routes.ts
@src/routes/enrollment.routes.ts
@src/routes/order.routes.ts

<interfaces>
From package.json:
```json
"scripts": {
  "test": "jest",
  "test:coverage": "jest --coverage --runInBand"
}
```

From route layer:
```typescript
POST /api/auth/register|login
POST /api/enrollments
PATCH /api/enrollments/:id/progress
POST /api/orders
GET /api/credit-transactions/balance
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add MVP smoke integration suite and command</name>
  <files>tests/smoke/mvp.smoke.integration.test.ts, package.json</files>
  <behavior>
    - Test 1: Core auth handshake path (register/login token path) returns expected status contracts
    - Test 2: Enrollment/progress route path returns expected success/failure contracts
    - Test 3: Order/credit balance path returns expected status and response shape
  </behavior>
  <action>Create an integration smoke test that exercises representative request flow across auth + enrollment + order + credit endpoints using deterministic mocks (no external SMTP/Redis/Mongo dependency). Add `test:smoke` script in package.json and keep runtime under 60 seconds.</action>
  <verify>
    <automated>npm run test -- tests/smoke/mvp.smoke.integration.test.ts</automated>
  </verify>
  <done>Core MVP flow is covered by a single repeatable smoke test and runnable command.</done>
</task>

<task type="auto">
  <name>Task 2: Publish UAT checklist aligned to smoke behavior</name>
  <files>.planning/phases/05-mvp-stability-polish/05-UAT.md</files>
  <action>Write manual UAT steps that mirror smoke test behavior, including expected status codes and response fields for auth, enroll/progress, order payment, and credit balance checks. Include exact commands or request payload examples for reproducibility.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>UAT artifact exists and mirrors the automated smoke flow for human verification.</done>
</task>

</tasks>

<verification>
- Smoke suite command executes and passes.
- Build remains green after test/script/UAT additions.
</verification>

<success_criteria>
- MVP-STAB-01 has automated smoke evidence and a manual UAT companion.
</success_criteria>

<output>
After completion, create `.planning/phases/05-mvp-stability-polish/05-mvp-stability-polish-01-SUMMARY.md`
</output>
