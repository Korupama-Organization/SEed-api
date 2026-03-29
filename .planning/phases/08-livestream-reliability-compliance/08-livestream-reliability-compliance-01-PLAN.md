---
phase: 08-livestream-reliability-compliance
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/controllers/livestream.join.controller.ts
  - src/controllers/livestream.lifecycle.controller.ts
  - src/controllers/livestream.control.controller.ts
  - tests/livestream/reliability/livestream.reliability.integration.test.ts
  - tests/livestream/realtime/livestream.presence.integration.test.ts
  - tests/livestream/realtime/livestream.controls.integration.test.ts
autonomous: true
requirements:
  - LIVE-07
must_haves:
  truths:
    - "Dependency failures in join/control/lifecycle paths return explicit error contracts"
    - "Redis lock degradation blocks join/rejoin instead of allowing unsafe participation"
    - "LiveKit adapter failures do not incorrectly mutate terminal/active state"
    - "Livestream regression suite proves lifecycle and control invariants remain intact"
  artifacts:
    - path: "tests/livestream/reliability/livestream.reliability.integration.test.ts"
      provides: "Reliability regression matrix including degraded dependency paths"
      contains: "redis fail-closed and livekit failure behavior"
    - path: "src/controllers/livestream.join.controller.ts"
      provides: "Fail-closed join/rejoin behavior under lock dependency failure"
      exports: ["joinLivestream", "rejoinLivestream"]
    - path: "src/controllers/livestream.lifecycle.controller.ts"
      provides: "Deterministic lifecycle error behavior under provider failure"
      exports: ["startLivestream", "endLivestream", "cancelLivestream"]
  key_links:
    - from: "src/controllers/livestream.join.controller.ts"
      to: "src/services/livestream/session-lock.service.ts"
      via: "acquireJoinLock with explicit failure handling"
      pattern: "acquireJoinLock"
    - from: "src/controllers/livestream.lifecycle.controller.ts"
      to: "src/services/livekit/livekit-client.ts"
      via: "ensureRoom/closeRoom guarded by stable error response path"
      pattern: "ensureRoom|closeRoom"
    - from: "tests/livestream/reliability/livestream.reliability.integration.test.ts"
      to: "src/routes/livestream.routes.ts"
      via: "route-level integration verification"
      pattern: "api/livestreams"
---

<objective>
Harden livestream backend reliability behavior and add deterministic regression coverage for degraded dependency paths.

Purpose: Satisfy LIVE-07 by proving lifecycle/control/join contracts remain safe and predictable under both normal and failing dependency conditions.
Output: reliability integration suite and controller hardening for fail-closed/consistent error behavior.
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
@.planning/phases/07-realtime-session-experience/07-realtime-session-experience-01-SUMMARY.md
@.planning/phases/07-realtime-session-experience/07-realtime-session-experience-02-SUMMARY.md
@src/controllers/livestream.join.controller.ts
@src/controllers/livestream.lifecycle.controller.ts
@src/controllers/livestream.control.controller.ts
@src/services/livestream/session-lock.service.ts
@src/services/livekit/livekit-client.ts

<interfaces>
From src/services/livestream/session-lock.service.ts:
```typescript
export const acquireJoinLock = async (
  livestreamId: string,
  userId: string,
  deviceId: string,
): Promise<{ allowed: boolean; rejoin: boolean }> => {};
```

From src/services/livekit/livekit-client.ts:
```typescript
export const ensureRoom = async (roomName: string): Promise<{ roomName: string }> => {};
export const closeRoom = async (roomName: string): Promise<void> => {};
export const mintTeacherToken = async (userId: string, roomName: string): Promise<LiveKitTokenResult> => {};
```

From src/controllers/livestream.join.controller.ts:
```typescript
export const joinLivestream = async (req: AuthenticatedRequest, res: Response) => {};
export const rejoinLivestream = async (req: AuthenticatedRequest, res: Response) => {};
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build reliability regression matrix for lifecycle, control, and presence paths</name>
  <files>tests/livestream/reliability/livestream.reliability.integration.test.ts, tests/livestream/realtime/livestream.presence.integration.test.ts, tests/livestream/realtime/livestream.controls.integration.test.ts</files>
  <behavior>
    - Test 1: lifecycle/control/join regressions preserve expected status transitions and rejection rules (per D-01, D-03).
    - Test 2: redis lock dependency failure causes join/rejoin fail-closed response with `{ error: string }` (per D-10).
    - Test 3: livekit dependency failure returns deterministic 5xx contract without false success state mutation (per D-11, D-12).
  </behavior>
  <action>Add or extend route-level integration tests to explicitly cover reliability matrix and degraded dependency paths per D-01..D-03 and D-10..D-12. Keep backend-only scope; do not add deferred product interactions (D-13).</action>
  <verify>
    <automated>npm run test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand</automated>
  </verify>
  <done>Reliability matrix exists as automated tests with deterministic failure-path assertions.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Harden controller failure paths for dependency-safe behavior</name>
  <files>src/controllers/livestream.join.controller.ts, src/controllers/livestream.lifecycle.controller.ts, src/controllers/livestream.control.controller.ts, tests/livestream/reliability/livestream.reliability.integration.test.ts</files>
  <behavior>
    - Test 1: join/rejoin rejects when lock service throws/unavailable instead of granting participation (per D-10).
    - Test 2: start/end/force-end surface provider failures with stable error payloads and no incorrect transition commit (per D-11).
    - Test 3: failed dependency call never writes contradictory attendance/control events (per D-12).
  </behavior>
  <action>Implement explicit error handling branches in join/lifecycle/control controllers to enforce fail-closed policy and consistent `{ error: string }` responses while preserving valid state transitions. Reuse existing guard-clause style and avoid new feature scope per D-13/D-14.</action>
  <verify>
    <automated>npm run test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand</automated>
  </verify>
  <done>Dependency failures are handled deterministically and all reliability assertions pass.</done>
</task>

</tasks>

<verification>
- npm run test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand
- npm run test -- tests/livestream/realtime/livestream.controls.integration.test.ts --runInBand
- npm run test -- tests/livestream/realtime/livestream.presence.integration.test.ts --runInBand
- npm run build
</verification>

<success_criteria>
- LIVE-07 is complete with automated reliability coverage for active/degraded dependency behavior.
- Join/control/lifecycle failure paths are deterministic and enforce safe policy outcomes.
- No deferred feature scope is introduced.
</success_criteria>

<output>
After completion, create .planning/phases/08-livestream-reliability-compliance/08-livestream-reliability-compliance-01-SUMMARY.md
</output>
