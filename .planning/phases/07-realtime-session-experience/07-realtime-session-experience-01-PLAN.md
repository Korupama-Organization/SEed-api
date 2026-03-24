---
phase: 07-realtime-session-experience
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/models/LivestreamSession.ts
  - src/controllers/livestream.control.controller.ts
  - src/controllers/livestream.lifecycle.controller.ts
  - src/routes/livestream.routes.ts
  - src/models/LivestreamAttendance.ts
  - tests/livestream/realtime/livestream.controls.integration.test.ts
autonomous: true
requirements:
  - LIVE-04
  - LIVE-05
user_setup:
  - service: livekit
    why: "Teacher in-session controls must continue to map to active LiveKit room lifecycle"
    env_vars:
      - name: LIVEKIT_URL
        source: "LiveKit deployment URL"
      - name: LIVEKIT_API_KEY
        source: "LiveKit server API key"
      - name: LIVEKIT_API_SECRET
        source: "LiveKit server API secret"
must_haves:
  truths:
    - "Teacher can pause and resume an active session"
    - "Teacher can force-end an active session"
    - "Teacher can remove a participant from active session"
    - "Non-owner/non-teacher control actions are rejected"
  artifacts:
    - path: "src/controllers/livestream.control.controller.ts"
      provides: "Teacher realtime control endpoints"
      exports: ["pauseLivestream", "resumeLivestream", "removeParticipant", "forceEndLivestream"]
    - path: "src/models/LivestreamSession.ts"
      provides: "Paused-session and control-safe state transitions"
      contains: "paused"
    - path: "tests/livestream/realtime/livestream.controls.integration.test.ts"
      provides: "Control behavior integration coverage"
      contains: "pause/resume/remove"
  key_links:
    - from: "src/routes/livestream.routes.ts"
      to: "src/controllers/livestream.control.controller.ts"
      via: "teacher control route bindings"
      pattern: "router\\.patch.*(pause|resume|force-end|participants)"
    - from: "src/controllers/livestream.control.controller.ts"
      to: "src/models/LivestreamAttendance.ts"
      via: "control audit event persistence"
      pattern: "LivestreamAttendance\\.create"
---

<objective>
Implement backend realtime teacher-control foundations and paused-state semantics for active livestream sessions.

Purpose: Satisfy LIVE-04 and LIVE-05 using locked context decisions for backend-only in-session controls and session-state exposure.
Output: Control controller/routes, updated session state contracts, control audit events, and integration tests.
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
@.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-01-SUMMARY.md
@.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-02-SUMMARY.md
@src/models/LivestreamSession.ts
@src/controllers/livestream.lifecycle.controller.ts
@src/routes/livestream.routes.ts

<interfaces>
From src/models/LivestreamSession.ts:
```typescript
export type LivestreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export interface ILivestreamSession extends Document {
  teacherId: Types.ObjectId;
  accessMode: LivestreamAccessMode;
  status: LivestreamStatus;
  livekitRoomName: string;
}
```

From src/routes/livestream.routes.ts:
```typescript
router.patch('/:livestreamId/start', requireAuth, requireRole('teacher'), startLivestream);
router.patch('/:livestreamId/end', requireAuth, requireRole('teacher'), endLivestream);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add paused-state contract and teacher control interfaces</name>
  <files>src/models/LivestreamSession.ts, src/controllers/livestream.control.controller.ts, tests/livestream/realtime/livestream.controls.integration.test.ts</files>
  <behavior>
    - Test 1: Teacher can transition live -> paused -> live (per D-03, D-08).
    - Test 2: Non-teacher or non-owner pause/resume attempts return 403 (per D-04).
    - Test 3: force-end from live/paused transitions stream to ended terminal state.
  </behavior>
  <action>Create control controller and update LivestreamSession state contract to support paused semantics per D-08. Keep backend-only implementation per D-01 and use existing ownership guard pattern per D-04. Add integration tests first (RED), then implement until GREEN.</action>
  <verify>
    <automated>npm run test -- tests/livestream/realtime/livestream.controls.integration.test.ts --runInBand</automated>
  </verify>
  <done>Paused/resume/force-end control behavior is implemented and protected by teacher-owner authorization.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add participant removal control with audit persistence</name>
  <files>src/controllers/livestream.control.controller.ts, src/models/LivestreamAttendance.ts, src/routes/livestream.routes.ts, tests/livestream/realtime/livestream.controls.integration.test.ts</files>
  <behavior>
    - Test 1: Teacher removes participant and backend records removed event (per D-03, D-06).
    - Test 2: Removal action is available only during active/live session context (per D-07).
    - Test 3: Control audit rows include action type and actor metadata (per D-05).
  </behavior>
  <action>Wire teacher-only participant removal endpoint in livestream routes and persist structured control events using LivestreamAttendance per D-05 and D-06. Do not add chat/reaction moderation features deferred by D-10.</action>
  <verify>
    <automated>npm run test -- tests/livestream/realtime/livestream.controls.integration.test.ts --runInBand</automated>
  </verify>
  <done>Participant removal is enforced and auditable through persisted control events.</done>
</task>

</tasks>

<verification>
- npm run test -- tests/livestream/realtime/livestream.controls.integration.test.ts --runInBand
- npm run build
</verification>

<success_criteria>
- LIVE-04 complete with teacher control endpoints for pause/resume/force-end/remove.
- LIVE-05 complete with explicit backend session-state contract including paused semantics.
- All control paths are role/ownership protected and integration-tested.
</success_criteria>

<output>
After completion, create .planning/phases/07-realtime-session-experience/07-realtime-session-experience-01-SUMMARY.md
</output>
