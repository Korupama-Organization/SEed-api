---
phase: 06-livestream-foundation-access-control
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/constants.ts
  - src/models/LivestreamSession.ts
  - src/services/livekit/livekit-client.ts
  - src/controllers/livestream.lifecycle.controller.ts
  - src/routes/livestream.routes.ts
  - src/server.ts
  - tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts
autonomous: true
requirements:
  - LIVE-01
  - LIVE-02
user_setup:
  - service: livekit
    why: "Phase 06 lifecycle endpoints must synchronize room/token lifecycle with LiveKit"
    env_vars:
      - name: LIVEKIT_URL
        source: "LiveKit websocket/base URL for your deployment"
      - name: LIVEKIT_API_KEY
        source: "LiveKit project/server API key"
      - name: LIVEKIT_API_SECRET
        source: "LiveKit project/server API secret"
    dashboard_config:
      - task: "Create LiveKit project/server credentials with server-side room management permissions"
        location: "LiveKit Cloud project settings or self-hosted server config"
must_haves:
  truths:
    - "Teacher can create, schedule, start, end, and cancel a livestream session"
    - "Non-teacher roles receive forbidden responses for control actions"
    - "Teacher end action transitions stream to closed state"
  artifacts:
    - path: "src/models/LivestreamSession.ts"
      provides: "Persisted stream lifecycle state and access mode"
      contains: "model LivestreamSession"
    - path: "src/controllers/livestream.lifecycle.controller.ts"
      provides: "Teacher control endpoints and role gating"
      exports: ["createLivestream", "startLivestream", "endLivestream", "cancelLivestream"]
    - path: "src/services/livekit/livekit-client.ts"
      provides: "LiveKit adapter layer"
      exports: ["ensureRoom", "closeRoom", "mintTeacherToken", "mintViewerToken"]
  key_links:
    - from: "src/routes/livestream.routes.ts"
      to: "src/controllers/livestream.lifecycle.controller.ts"
      via: "teacher-only protected route bindings"
      pattern: "router\.(post|patch|delete).*livestream"
    - from: "src/controllers/livestream.lifecycle.controller.ts"
      to: "src/services/livekit/livekit-client.ts"
      via: "provider synchronization call"
      pattern: "livekit.*(ensureRoom|closeRoom|mint)"
---

<objective>
Deliver phase 06 lifecycle foundation by adding teacher-only livestream control endpoints and LiveKit synchronization.

Purpose: Satisfy LIVE-01 and LIVE-02 while establishing provider-safe integration boundaries for phase 07.
Output: Lifecycle model, LiveKit adapter, protected lifecycle routes, and lifecycle integration tests.
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
@src/middlewares/auth.middleware.ts
@src/routes/enrollment.routes.ts
@src/server.ts

<interfaces>
From src/middlewares/auth.middleware.ts:
```typescript
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    payload: JwtPayload;
  };
}
```

From src/server.ts:
```typescript
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/credit-transactions', creditTransactionRoutes);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Define livestream contracts and persistence model</name>
  <files>src/models/LivestreamSession.ts, tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts</files>
  <behavior>
    - Test 1: Teacher-created session persists with accessMode in {public, private} and initial state scheduled.
    - Test 2: Session state transition scheduled -> live -> ended is persisted and ended is terminal.
    - Test 3: Non-teacher creation attempt is rejected with 403.
  </behavior>
  <action>Create LivestreamSession model with lifecycle state, teacher ownership, accessMode (per D-04), and closed/end semantics (per D-02). Add integration test scaffold and RED assertions first, then implement minimal model/controller wiring to satisfy test contracts.</action>
  <verify>
    <automated>npm run test -- tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts --runInBand</automated>
  </verify>
  <done>Model exists, lifecycle state machine is enforced, and RED->GREEN tests prove teacher-only creation and terminal ended state.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement teacher-only lifecycle endpoints with LiveKit adapter</name>
  <files>src/constants.ts, src/services/livekit/livekit-client.ts, src/controllers/livestream.lifecycle.controller.ts, src/routes/livestream.routes.ts, src/server.ts, tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts</files>
  <behavior>
    - Test 1: Teacher can call create/start/end/cancel endpoints and receives success responses.
    - Test 2: Non-teacher control attempts return 403 (per LIVE-02).
    - Test 3: Start/end/cancel handlers invoke LiveKit adapter methods once per transition.
  </behavior>
  <action>Add LIVEKIT_* config bindings in src/constants.ts with fail-fast validation style consistent with existing startup checks. Build livekit-client adapter methods and call them from lifecycle controller transitions. Wire new /api/livestreams routes into src/server.ts with requireAuth + teacher role guard behavior per D-09 and D-10.</action>
  <verify>
    <automated>npm run test -- tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts --runInBand</automated>
  </verify>
  <done>Teacher-only lifecycle API is mounted, role restrictions are enforced, and LiveKit calls are isolated behind adapter functions.</done>
</task>

</tasks>

<verification>
- `npm run test -- tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts --runInBand`
- `npm run build`
</verification>

<success_criteria>
- LIVE-01 complete: teacher lifecycle endpoints operational with persisted transitions.
- LIVE-02 complete: non-teacher control attempts blocked consistently.
- LiveKit integration is encapsulated and environment contract is explicit.
</success_criteria>

<output>
After completion, create `.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-01-SUMMARY.md`
</output>
