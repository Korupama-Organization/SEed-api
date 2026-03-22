---
phase: 06-livestream-foundation-access-control
plan: 02
type: execute
wave: 2
depends_on:`n  - 06-livestream-foundation-access-control-01
files_modified:
  - src/models/LivestreamAttendance.ts
  - src/services/livestream/session-lock.service.ts
  - src/controllers/livestream.join.controller.ts
  - src/routes/livestream.routes.ts
  - src/utils/redis.ts
  - tests/livestream/access/livestream.join.integration.test.ts
autonomous: true
requirements:
  - LIVE-03
user_setup:
  - service: owncast
    why: "Join URLs/embed targets must map to reachable Owncast stream endpoint"
    env_vars:
      - name: OWNCAST_PUBLIC_PLAYBACK_URL
        source: "Public URL students use to watch stream"
    dashboard_config:
      - task: "Ensure Owncast stream is externally reachable by student clients"
        location: "Owncast deployment network/proxy configuration"
must_haves:
  truths:
    - "Students can join only when teacher has started the session"
    - "Ended sessions reject new join attempts"
    - "Private streams allow only purchased-course students to join"
    - "A user can have only one active device session per livestream"
  artifacts:
    - path: "src/controllers/livestream.join.controller.ts"
      provides: "Join/rejoin authorization endpoint"
      exports: ["joinLivestream", "rejoinLivestream"]
    - path: "src/services/livestream/session-lock.service.ts"
      provides: "Single-device enforcement using redis-backed lock keys"
      exports: ["acquireJoinLock", "releaseJoinLock", "refreshJoinLock"]
    - path: "src/models/LivestreamAttendance.ts"
      provides: "Audit-friendly attendance/session event persistence"
      contains: "model LivestreamAttendance"
  key_links:
    - from: "src/controllers/livestream.join.controller.ts"
      to: "src/models/Enrollment.ts|src/models/Order.ts"
      via: "private-mode purchase/enrollment authorization"
      pattern: "(Enrollment|Order).*find"
    - from: "src/controllers/livestream.join.controller.ts"
      to: "src/services/livestream/session-lock.service.ts"
      via: "single-device lock check"
      pattern: "acquireJoinLock|refreshJoinLock"
---

<objective>
Deliver phase 06 access-control completion by implementing join authorization, rejoin handling, and single-device enforcement.

Purpose: Satisfy LIVE-03 and complete phase-06 truths required for public/private access and closed-session behavior.
Output: Join controller/routes, redis-backed device lock service, attendance/audit model, and integration tests.
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
@.planning/phases/06-livestream-foundation-access-control/06-CONTEXT.md
@.planning/phases/06-livestream-foundation-access-control/06-RESEARCH.md
@.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-01-SUMMARY.md
@src/models/Enrollment.ts
@src/models/Order.ts
@src/utils/redis.ts
@src/routes/enrollment.routes.ts

<interfaces>
From src/models/Enrollment.ts:
```typescript
export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonProgress: ILessonProgress[];
}
export const Enrollment = model<IEnrollment>('Enrollment', EnrollmentSchema);
```

From src/models/Order.ts:
```typescript
export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
}
export const Order = model<IOrder>('Order', OrderSchema);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement join authorization for public/private modes and lifecycle state</name>
  <files>src/controllers/livestream.join.controller.ts, src/routes/livestream.routes.ts, src/models/LivestreamAttendance.ts, tests/livestream/access/livestream.join.integration.test.ts</files>
  <behavior>
    - Test 1: Join before teacher start returns 403/409 and never issues playback session token.
    - Test 2: Join after explicit end is rejected.
    - Test 3: Private-mode join requires paid purchase/enrollment evidence and blocks unauthorized users.
    - Test 4: Rejoin while active succeeds for authorized users.
  </behavior>
  <action>Add join/rejoin endpoints bound to existing livestream routes. Enforce lifecycle checks per D-01/D-02, access mode checks per D-04/D-05, and persist attendance/audit event rows for join/reject/rejoin outcomes.</action>
  <verify>
    <automated>npm run test -- tests/livestream/access/livestream.join.integration.test.ts --runInBand</automated>
  </verify>
  <done>Join and rejoin behavior matches locked phase decisions and integration tests validate lifecycle + access mode paths.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Enforce single-device active participation with redis locks</name>
  <files>src/services/livestream/session-lock.service.ts, src/utils/redis.ts, src/controllers/livestream.join.controller.ts, tests/livestream/access/livestream.join.integration.test.ts</files>
  <behavior>
    - Test 1: First device join acquires lock and succeeds.
    - Test 2: Second concurrent device join for same user+session is rejected.
    - Test 3: Rejoin from same active device/session key path is allowed.
  </behavior>
  <action>Create lock service using redis key strategy `livestream:active:{sessionId}:{userId}` with TTL refresh. Integrate lock acquisition and release semantics into join/rejoin/leave paths while preserving existing redis utility patterns.</action>
  <verify>
    <automated>npm run test -- tests/livestream/access/livestream.join.integration.test.ts --runInBand</automated>
  </verify>
  <done>Single-device policy (D-06) is enforced deterministically and validated by integration tests.</done>
</task>

</tasks>

<verification>
- `npm run test -- tests/livestream/access/livestream.join.integration.test.ts --runInBand`
- `npm run build`
</verification>

<success_criteria>
- LIVE-03 complete with deterministic join authorization across lifecycle states.
- Public/private access mode behavior is consistent with D-04/D-05.
- Single-device enforcement blocks concurrent active sessions while allowing valid rejoin.
</success_criteria>

<output>
After completion, create `.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-02-SUMMARY.md`
</output>

