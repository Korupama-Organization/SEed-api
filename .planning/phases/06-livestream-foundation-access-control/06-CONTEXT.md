# Phase 6: Livestream Foundation & Access Control - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers teacher-only livestream session creation and access control gates for joining. It does not deliver full realtime media UX controls (that belongs to phase 7) or reliability/compliance hardening (phase 8).
</domain>

<decisions>
## Implementation Decisions

### Session access lifecycle
- **D-01:** Students can join only after the teacher explicitly starts the livestream event.
- **D-02:** If the teacher ends the stream (explicit end action, not temporary disconnect), the event is closed and no further joins are allowed.
- **D-03:** Rejoin is allowed for authorized users while the event is active.

### Access scope modes
- **D-04:** Teacher must choose one of two access modes when configuring the livestream:
  - Public mode: available to all student users.
  - Private mode: only students who purchased the related coursework can join.
- **D-05:** Access mode is part of session configuration and enforced at join-time authorization.

### Device/session policy
- **D-06:** Single-device policy is required: one active device session per user per livestream.

### Fast-path defaults (agent selected)
- **D-07:** Use default API/error semantics aligned with existing backend conventions for fastest path.
- **D-08:** Use minimum viable audit event capture in phase 6; deeper analytics and observability remain for later phases.

### Streaming platform
- **D-09:** Livestream provider is locked to LiveKit for phase 6 and milestone 1.1 scope.
- **D-10:** Phase 6 planning and implementation must integrate with LiveKit room/token lifecycle rather than introducing an alternative provider.

### the agent's Discretion
- Exact endpoint naming and request/response payload design (must stay consistent with existing API style).
- Exact conflict handling for duplicate join attempts under single-device policy.
- Exact audit event schema fields beyond minimum required lifecycle and access events.
</decisions>

<specifics>
## Specific Ideas

- "When teacher starts the livestreaming event, student can join the meeting."
- "If teacher end the streaming (not disconnect), the event is closed and the student can't join anymore."
- "Teacher can choose two options: public the streaming for all user (student), or privately stream it for students who purchased for the coursework."
- "Of course, anyone can rejoin."
- "Single device only."
- "Fastest path" selected for unresolved defaults.
- "Use LiveKit instead of Owncast."
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` - Milestone 1.1 phase goals and boundaries for phases 6-8.
- `.planning/REQUIREMENTS.md` - LIVE-01..LIVE-03 requirement definitions for phase 6.
- `.planning/STATE.md` - Active milestone and locked role scope marker.

### Existing auth/access patterns
- `src/middlewares/auth.middleware.ts` - Authenticated request and role extraction pattern.
- `src/routes/enrollment.routes.ts` - Ownership and enrollment access style used in protected routes.
- `src/server.ts` - Route wiring conventions and API mount structure.

### Architecture and integration context
- `.planning/codebase/ARCHITECTURE.md` - Existing layer boundaries and integration conventions.
- `.planning/codebase/INTEGRATIONS.md` - Current external integrations and gaps.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `requireAuth` middleware in `src/middlewares/auth.middleware.ts` already injects `req.auth.userId` and `req.auth.role`.
- Enrollment route authorization patterns in `src/routes/enrollment.routes.ts` can guide private-mode join checks.
- Existing `{ error: string }` error response pattern is already established in controllers and middleware.

### Established Patterns
- Route registration is centralized in `src/server.ts` with per-domain routers under `/api/*`.
- Role and ownership checks are middleware-first and fail early.
- Security-sensitive behavior is generally centralized and tested with integration-first checks.

### Integration Points
- New livestream routes should be mounted in `src/server.ts` alongside existing domain routes.
- Join authorization should connect role checks from auth middleware with purchase/enrollment checks from domain models.
- Session lifecycle state will need persistence and must coordinate with auth context for single-device enforcement.
</code_context>

<deferred>
## Deferred Ideas

- Full in-session realtime controls and rich participant UX are deferred to phase 7.
- Livestream reliability hardening, operations runbooks, and CI depth are deferred to phase 8.
</deferred>

---

*Phase: 06-livestream-foundation-access-control*
*Context gathered: 2026-03-22*
