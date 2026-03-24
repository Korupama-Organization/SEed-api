# Phase 7: Realtime Session Experience - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto defaults selected (backend-only)

<domain>
## Phase Boundary

Phase 7 delivers backend realtime session capabilities that power teacher in-session controls and student viewing behavior for active livestream classes. This phase defines APIs, permissions, state transitions, and event contracts only. Frontend UI implementation is explicitly out of scope.
</domain>

<decisions>
## Implementation Decisions

### Backend scope guardrail
- **D-01:** Phase 7 is backend-only; no frontend component/layout/design work is included.
- **D-02:** "Student viewing experience" is implemented as backend session-state and event contracts consumed by clients.

### Teacher in-session control surface
- **D-03:** Teacher control APIs in this phase include pause/resume session, force-end session, and participant removal from active session.
- **D-04:** Control actions are authorized for teacher owner only (consistent with phase 6 ownership guard).
- **D-05:** Control actions produce structured audit events for later compliance hardening in phase 8.

### Participant/session state behavior
- **D-06:** Participant presence state is tracked server-side with at least `joined`, `rejoined`, `left`, and `removed` events.
- **D-07:** Rejoin remains allowed only while session state is active/live (inherits phase 6 lifecycle rules).
- **D-08:** Server returns explicit machine-readable session states for clients: `scheduled`, `live`, `paused`, `ended`, `cancelled`.

### Realtime interaction channel contracts
- **D-09:** Phase 7 introduces backend event endpoints/contracts for realtime metadata updates (participant changes, teacher control changes, system status updates).
- **D-10:** Chat, reactions, polls, and rich moderation beyond participant removal are deferred.

### Failure/reconnect behavior
- **D-11:** On transient disconnect, backend preserves single-device lock for a short grace window and allows same-device rejoin without privilege escalation.
- **D-12:** On server-side forced removal by teacher, rejoin is blocked for that user until teacher explicitly allows re-entry (or session restarts).

### Provider and integration continuity
- **D-13:** LiveKit remains the streaming provider for phase 7; no provider substitution is allowed.
- **D-14:** Existing phase 6 route/auth/error conventions remain the default style for new phase 7 endpoints.

### the agent's Discretion
- Exact endpoint naming for control and event feed routes.
- Event payload field-level schema details beyond required core fields.
- Internal storage strategy for paused-state metadata if multiple persistence options are equivalent.
</decisions>

<specifics>
## Specific Ideas

- "Backend only, not frontend" is locked for this phase.
- Keep fastest path by extending existing livestream routes/controllers and auth middleware patterns.
- Reuse phase 6 Redis/session lock behavior and attendance audit concepts where possible.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` - Phase 7 goal and requirement IDs (LIVE-04..LIVE-06).
- `.planning/REQUIREMENTS.md` - Project requirement catalog baseline.
- `.planning/STATE.md` - Active milestone and completed phase state.

### Prior livestream decisions and outputs
- `.planning/phases/06-livestream-foundation-access-control/06-CONTEXT.md` - Locked lifecycle/access decisions inherited by phase 7.
- `.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-01-SUMMARY.md` - Lifecycle and LiveKit adapter implementation summary.
- `.planning/phases/06-livestream-foundation-access-control/06-livestream-foundation-access-control-02-SUMMARY.md` - Join/single-device enforcement summary.

### Existing backend integration points
- `src/routes/livestream.routes.ts` - Existing livestream route surface to extend.
- `src/controllers/livestream.lifecycle.controller.ts` - Lifecycle transition behavior and ownership checks.
- `src/controllers/livestream.join.controller.ts` - Join/rejoin and lock integration behavior.
- `src/services/livekit/livekit-client.ts` - LiveKit adapter boundary.
- `src/services/livestream/session-lock.service.ts` - Single-device lock logic.
- `src/models/LivestreamSession.ts` - Livestream state model.
- `src/models/LivestreamAttendance.ts` - Participation/audit event model.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `requireAuth` and `requireRole` middleware are already wired for livestream routes.
- `livekit-client` adapter already encapsulates token and room lifecycle primitives.
- `session-lock.service` provides redis-backed single-device lock acquisition/release semantics.

### Established Patterns
- Controller-first guard clauses with `{ error: string }` response contracts.
- Teacher ownership and role checks before state mutation.
- Integration tests built as route-level tests with mocked model/service boundaries.

### Integration Points
- Extend `src/routes/livestream.routes.ts` with phase 7 control/event endpoints.
- Extend session model/state transitions to include paused state semantics.
- Emit and persist additional attendance/session events for control actions and participant updates.
</code_context>

<deferred>
## Deferred Ideas

- Frontend session UI/UX implementation details (component design, layout, interactions).
- Rich in-session chat/reactions/polls/question queue.
- Deep observability/compliance analytics and operations hardening (phase 8).
</deferred>

---

*Phase: 07-realtime-session-experience*
*Context gathered: 2026-03-24 (auto mode)*
