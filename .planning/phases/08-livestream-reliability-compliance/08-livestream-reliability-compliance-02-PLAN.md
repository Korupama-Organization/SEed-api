---
phase: 08-livestream-reliability-compliance
plan: 02
type: execute
wave: 2
depends_on:
  - 08-livestream-reliability-compliance-01
files_modified:
  - .github/workflows/ci.yml
  - package.json
  - README.md
  - docs/livestream-operations-runbook.md
autonomous: true
requirements:
  - LIVE-08
  - LIVE-09
must_haves:
  truths:
    - "Operators can run a command-driven livestream incident triage flow"
    - "Required livestream verification commands are documented with expected outcomes"
    - "CI fails pull requests when livestream-specific regression checks fail"
    - "CI executes livestream gate before coverage to speed failure feedback"
  artifacts:
    - path: "docs/livestream-operations-runbook.md"
      provides: "Livestream operations/compliance runbook with executable checks"
      contains: "dependency checks, rollback/escalation, audit event troubleshooting"
    - path: ".github/workflows/ci.yml"
      provides: "PR quality gates including livestream reliability checks"
      contains: "build then livestream checks then coverage"
    - path: "package.json"
      provides: "Scripted livestream verification entrypoint used by docs and CI"
      contains: "test:livestream"
  key_links:
    - from: ".github/workflows/ci.yml"
      to: "package.json"
      via: "npm script invocation for livestream quality gate"
      pattern: "test:livestream"
    - from: "docs/livestream-operations-runbook.md"
      to: "tests/livestream/reliability/livestream.reliability.integration.test.ts"
      via: "documented reliability verification command"
      pattern: "livestream.reliability.integration.test"
    - from: "README.md"
      to: "docs/livestream-operations-runbook.md"
      via: "operations documentation index/reference"
      pattern: "livestream operations runbook"
---

<objective>
Deliver compliance-ready livestream operations artifacts and enforce CI quality gates for livestream reliability.

Purpose: Satisfy LIVE-08 and LIVE-09 by making reliability verification operationally reproducible and CI-enforced.
Output: livestream operations runbook, CI workflow gate updates, and command-script wiring.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/08-livestream-reliability-compliance/08-CONTEXT.md
@.planning/phases/08-livestream-reliability-compliance/08-RESEARCH.md
@.planning/phases/08-livestream-reliability-compliance/08-livestream-reliability-compliance-01-PLAN.md
@.github/workflows/ci.yml
@package.json
@README.md

<interfaces>
From package.json:
```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:coverage": "jest --coverage --runInBand"
  }
}
```

From .github/workflows/ci.yml:
```yaml
- name: Build
  run: npm run build

- name: Run coverage tests
  run: npm run test:coverage
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create livestream operations and compliance runbook</name>
  <files>docs/livestream-operations-runbook.md, README.md</files>
  <action>Create backend livestream runbook per D-04..D-06 with incident triage, dependency diagnostics, env contract checks, rollback/escalation path, and attendance-event troubleshooting queries. Add concise README pointer for discoverability; keep guidance command-first and reproducible per D-05.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Operators have a concrete, executable runbook with reliability/compliance checks and reference links.</done>
</task>

<task type="auto">
  <name>Task 2: Enforce livestream regression gates in CI workflow</name>
  <files>package.json, .github/workflows/ci.yml</files>
  <action>Add a dedicated `test:livestream` script that runs phase-8 required livestream suites, then update CI to execute ordering build -> test:livestream -> test:coverage per D-07 and D-08. Ensure workflow remains fully automated and blocking for regressions per D-09.</action>
  <verify>
    <automated>npm run test:livestream</automated>
  </verify>
  <done>CI includes mandatory livestream reliability gate before coverage and fails on livestream regression.</done>
</task>

</tasks>

<verification>
- npm run test:livestream
- npm run build
</verification>

<success_criteria>
- LIVE-08 complete with an executable livestream operations/compliance runbook.
- LIVE-09 complete with CI-enforced livestream reliability gate and deterministic command usage.
- Documentation and CI both point to the same script-based verification path.
</success_criteria>

<output>
After completion, create .planning/phases/08-livestream-reliability-compliance/08-livestream-reliability-compliance-02-SUMMARY.md
</output>
