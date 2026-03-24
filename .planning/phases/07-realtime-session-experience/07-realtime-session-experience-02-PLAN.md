---
phase: 07-realtime-session-experience
plan: 02
type: execute
wave: 2
depends_on:
  - 07-realtime-session-experience-01
files_modified:
  - src/controllers/livestream.join.controller.ts
  - src/controllers/livestream.events.controller.ts
  - src/services/livestream/session-lock.service.ts
  - src/models/LivestreamAttendance.ts
  - src/routes/livestream.routes.ts
  - tests/livestream/realtime/livestream.presence.integration.test.ts
autonomous: true
requirements:
  - LIVE-06
user_setup:
  - service: redis
    why: "Reconnect grace and forced-removal rejoin controls rely on lock state behavior"
    env_vars:
      - name: REDIS_HOST
        source: "Redis deployment host"
      - name: REDIS_PORT
        source: "Redis deployment port"
must_haves:
  truths:
    - "Same-device reconnect during transient disconnect succeeds within grace window"
    - "Teacher-removed participants cannot rejoin until explicitly allowed"
    - "Clients can fetch ordered session metadata events for realtime synchronization"
  artifacts:
    - path: "src/controllers/livestream.events.controller.ts"
      provides: "Session event-feed endpoint contract"
      exports: ["listLivestreamEvents"]
    - path: "src/services/livestream/session-lock.service.ts"
      provides: "Reconnect grace semantics for single-device lock continuity"
      exports: ["acquireJoinLock", "refreshJoinLock", "releaseJoinLock"]
    - path: "tests/livestream/realtime/livestream.presence.integration.test.ts"
      provides: "Presence and reconnect integration coverage"
      contains: "rejoin grace/removed block"
  key_links:
    - from: "src/controllers/livestream.join.controller.ts"
      to: "src/services/livestream/session-lock.service.ts"
      via: "grace-window lock acquisition and rejoin checks"
      pattern: "acquireJoinLock|refreshJoinLock"
    - from: "src/controllers/livestream.events.controller.ts"
      to: "src/models/LivestreamAttendance.ts"
      via: "event-feed query"
      pattern: "LivestreamAttendance\\.(find|aggregate)"
---

<objective>
Implement backend presence/reconnect semantics and realtime metadata event feed contracts for active livestream sessions.

Purpose: Satisfy LIVE-06 via deterministic reconnect policy and consumable session event APIs aligned to phase-7 backend scope.
Output: Presence/reconnect logic updates, event-feed controller/routes, and integration tests for reconnect + forced-removal blocks.
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
@.planning/phases/07-realtime-session-experience/07-CONTEXT.md
@.planning/phases/07-realtime-session-experience/07-RESEARCH.md
@.planning/phases/07-realtime-session-experience/07-realtime-session-experience-01-PLAN.md
@src/controllers/livestream.join.controller.ts
@src/services/livestream/session-lock.service.ts
@src/models/LivestreamAttendance.ts
@src/routes/livestream.routes.ts

<interfaces>
From src/services/livestream/session-lock.service.ts:
```typescript
export const acquireJoinLock = async (
  livestreamId: string,
  userId: string,
  deviceId: string,
): Promise<{ allowed: boolean; rejoin: boolean }> => {};
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
  <name>Task 1: Enforce reconnect grace and forced-removal rejoin blocking</name>
  <files>src/services/livestream/session-lock.service.ts, src/controllers/livestream.join.controller.ts, src/models/LivestreamAttendance.ts, tests/livestream/realtime/livestream.presence.integration.test.ts</files>
  <behavior>
    - Test 1: Same-device reconnect within grace window is accepted (per D-11).
    - Test 2: Different-device concurrent reconnect remains blocked by single-device rule.
    - Test 3: User marked removed cannot rejoin until unblock condition is met (per D-12).
  </behavior>
  <action>Extend lock service and join flow to support reconnect grace semantics per D-11 while preserving D-06 single-device guarantees. Add explicit removed-participant checks in join path per D-12 and persist removal markers/events consistently.</action>
  <verify>
    <automated>npm run test -- tests/livestream/realtime/livestream.presence.integration.test.ts --runInBand</automated>
  </verify>
  <done>Reconnect and removal policies are deterministic, test-backed, and aligned with locked decisions.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add session metadata event-feed endpoint for realtime clients</name>
  <files>src/controllers/livestream.events.controller.ts, src/routes/livestream.routes.ts, src/models/LivestreamAttendance.ts, tests/livestream/realtime/livestream.presence.integration.test.ts</files>
  <behavior>
    - Test 1: Event-feed endpoint returns ordered events with since/cursor filter support (per D-09).
    - Test 2: Event payload includes state and participant metadata needed by clients (per D-02, D-08).
    - Test 3: Endpoint does not include deferred rich-chat/reaction payloads (per D-10).
  </behavior>
  <action>Create backend event-feed endpoint contract and route wiring for livestream session metadata updates per D-09. Keep payload focused on lifecycle/control/presence data and exclude deferred interaction features per D-10.</action>
  <verify>
    <automated>npm run test -- tests/livestream/realtime/livestream.presence.integration.test.ts --runInBand</automated>
  </verify>
  <done>Realtime clients can query stable session metadata events without adding deferred interaction scope.</done>
</task>

</tasks>

<verification>
- npm run test -- tests/livestream/realtime/livestream.presence.integration.test.ts --runInBand
- npm run build
</verification>

<success_criteria>
- LIVE-06 complete with reconnect grace and forced-removal policy enforcement.
- Backend event-feed contract exists for session synchronization by clients.
- Integration tests validate reconnect, removal blocking, and event ordering contracts.
</success_criteria>

<output>
After completion, create .planning/phases/07-realtime-session-experience/07-realtime-session-experience-02-SUMMARY.md
</output>
