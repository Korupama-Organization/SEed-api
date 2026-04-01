---
phase: 05-mvp-stability-polish
plan: 02
type: execute
wave: 2
depends_on: [05-mvp-stability-polish-01]
files_modified:
  - README.md
  - tests/smoke/error-shape.consistency.test.ts
  - .planning/phases/05-mvp-stability-polish/05-VERIFICATION.md
  - .planning/phases/05-mvp-stability-polish/05-OPS-CHECKLIST.md
autonomous: true
requirements: [MVP-STAB-01, MVP-STAB-02]
must_haves:
  truths:
    - "Operational readiness steps are documented for release handoff"
    - "Error-response shape consistency is verified on representative endpoints"
    - "Verification artifact maps MVP-STAB requirements to executable evidence"
  artifacts:
    - path: "README.md"
      provides: "MVP operational usage and validation instructions"
    - path: "tests/smoke/error-shape.consistency.test.ts"
      provides: "Error shape regression checks"
    - path: ".planning/phases/05-mvp-stability-polish/05-OPS-CHECKLIST.md"
      provides: "Operational readiness checklist"
    - path: ".planning/phases/05-mvp-stability-polish/05-VERIFICATION.md"
      provides: "Requirement verification report"
  key_links:
    - from: "tests/smoke/error-shape.consistency.test.ts"
      to: "src/controllers/**/*.ts"
      via: "error response assertions"
      pattern: "error"
    - from: "README.md"
      to: "package.json"
      via: "documented run/test commands"
      pattern: "npm run"
    - from: ".planning/phases/05-mvp-stability-polish/05-VERIFICATION.md"
      to: ".planning/REQUIREMENTS.md"
      via: "MVP-STAB evidence mapping"
      pattern: "MVP-STAB-01|MVP-STAB-02"
---

<objective>
Finalize MVP readiness with operational checklisting, documentation polish, and verification evidence.

Purpose: Fulfill MVP-STAB-02 and close remaining MVP-STAB-01 quality gates with explicit proof artifacts.
Output: Ops checklist, README polish, error-shape stability tests, and phase verification file.
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
@.planning/phases/05-mvp-stability-polish/05-mvp-stability-polish-01-SUMMARY.md
@README.md
@src/controllers/auth.controller.ts
@src/controllers/enrollment.controller.ts
@src/controllers/order.controller.ts

<interfaces>
Existing failure contract pattern:
```typescript
return res.status(...).json({ error: '...' });
```

Planning artifacts to produce:
```text
05-OPS-CHECKLIST.md
05-VERIFICATION.md
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add error-shape consistency smoke tests and README operational updates</name>
  <files>tests/smoke/error-shape.consistency.test.ts, README.md</files>
  <behavior>
    - Test 1: Representative auth/domain failure cases return `{ error: string }`
    - Test 2: Validation failures preserve expected 4xx status codes
    - Test 3: README includes stable run/build/test/smoke commands and MVP quick-check sequence
  </behavior>
  <action>Create a focused smoke test suite that asserts consistent API error shape and status contracts across core endpoints. Update README with concise MVP runbook: setup, smoke command, coverage command, and troubleshooting notes for common env/config failures.</action>
  <verify>
    <automated>npm run test -- tests/smoke/error-shape.consistency.test.ts</automated>
  </verify>
  <done>Error contract consistency is guarded and README reflects practical MVP operation steps.</done>
</task>

<task type="auto">
  <name>Task 2: Generate operational readiness and requirement verification artifacts</name>
  <files>.planning/phases/05-mvp-stability-polish/05-OPS-CHECKLIST.md, .planning/phases/05-mvp-stability-polish/05-VERIFICATION.md</files>
  <action>Create an operational checklist covering environment validation, smoke/coverage command outcomes, docs sanity, and release preflight checks. Produce 05-VERIFICATION.md that maps MVP-STAB-01 and MVP-STAB-02 to concrete evidence, command outputs, and resulting status.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Operational-readiness and requirement-verification artifacts are complete and actionable.</done>
</task>

</tasks>

<verification>
- Error-shape smoke test passes.
- Build passes.
- Ops checklist and verification docs exist with complete evidence mapping.
</verification>

<success_criteria>
- MVP-STAB-01 and MVP-STAB-02 are fully evidenced for milestone closure.
</success_criteria>

<output>
After completion, create `.planning/phases/05-mvp-stability-polish/05-mvp-stability-polish-02-SUMMARY.md`
</output>
