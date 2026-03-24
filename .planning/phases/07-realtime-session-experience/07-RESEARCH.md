# Phase 07 Research - Realtime Session Experience

## Scope
Phase 07 covers LIVE-04..LIVE-06 only:
- Backend in-session teacher controls
- Backend participant presence and reconnect behavior
- Backend session-state/event contracts that clients consume

Out of scope:
- Frontend layout/components/visual interactions
- Reliability/compliance hardening and operational governance (phase 08)
- Rich engagement features (chat/reactions/polls)

## Locked Decisions from Context
- Backend-only implementation (D-01, D-02)
- Teacher controls: pause/resume, force-end, participant removal (D-03)
- Teacher-owner authorization on control actions (D-04)
- Structured audit events for control actions (D-05)
- Presence states include joined/rejoined/left/removed (D-06)
- Rejoin only while session active/live (D-07)
- Session states exposed as scheduled/live/paused/ended/cancelled (D-08)
- Backend event contracts for metadata updates (D-09)
- Rich moderation/chat interactions deferred (D-10)
- Reconnect grace for same-device lock continuity (D-11)
- Forced-removal rejoin block until explicit allowance/restart (D-12)
- LiveKit continuity is mandatory (D-13)

## Existing Code Reuse
- Route/middleware integration pattern: src/routes/livestream.routes.ts + requireAuth/requireRole
- Lifecycle and ownership checks: src/controllers/livestream.lifecycle.controller.ts
- Join/rejoin and access guardrails: src/controllers/livestream.join.controller.ts
- Single-device lock primitives: src/services/livestream/session-lock.service.ts + src/utils/redis.ts
- Session and attendance persistence: src/models/LivestreamSession.ts + src/models/LivestreamAttendance.ts

## Recommended Backend Pattern for Phase 07
1. Extend LivestreamSession state model with paused semantics and explicit transition guards.
2. Add dedicated control controller for in-session actions to keep lifecycle and realtime concerns separated.
3. Persist control and participant events in LivestreamAttendance (or a sibling event model) with machine-readable eventType/reason/actionBy metadata.
4. Expose a backend event feed contract (polling-first endpoint) to avoid transport lock-in while still enabling realtime client updates.
5. Add reconnect grace semantics in session-lock service so transient disconnects do not create false second-device conflicts.

## Risks and Mitigations
- Risk: State drift between control actions and join permissions.
  - Mitigation: centralize transition checks and assert state in both control and join flows.
- Risk: Forced-removal bypass through rejoin path.
  - Mitigation: persist removal marker and check before lock acquisition/token minting.
- Risk: Event feed overfetch or unstable payload shape.
  - Mitigation: define stable event DTO with cursor/since filtering.

## Validation Strategy
- Integration tests for teacher control transitions and permissions.
- Integration tests for presence/reconnect and forced-removal rejoin blocking.
- Integration tests for event-feed response shape and ordering.
- Build gate: TypeScript compile must pass.

## Manual Setup Required (Human)
- LiveKit endpoint and credentials must remain configured for token/room operations.
- Redis must be reachable for lock and reconnect-grace behavior.
