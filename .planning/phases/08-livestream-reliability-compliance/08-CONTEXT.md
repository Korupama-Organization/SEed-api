# Phase 8: Livestream Reliability & Compliance - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Mode:** Auto defaults selected (user delegated)

<domain>
## Phase Boundary

Phase 8 verifies livestream correctness, codifies operational runbooks, and hardens CI quality gates for livestream backend behavior shipped in phases 6-7. This phase does not add new user-facing livestream capabilities.
</domain>

<decisions>
## Implementation Decisions

### Reliability verification scope
- **D-01:** LIVE-07 verification matrix must cover all existing livestream backend contracts: lifecycle transitions, teacher controls, join/rejoin rules, removed-user enforcement, and event-feed ordering/filters.
- **D-02:** Reliability tests remain integration-first with deterministic mocks for external dependencies (LiveKit/Redis) and must include degraded-dependency paths, not only happy paths.
- **D-03:** Phase 8 verification adds explicit regression checks ensuring paused/ended/cancelled state gates remain authoritative for join/control flows.

### Compliance and operations artifacts
- **D-04:** LIVE-08 requires a backend-focused livestream operations runbook with: incident triage flow, service dependency checks (Mongo/Redis/LiveKit), env contract checklist, and rollback/escalation guidance.
- **D-05:** Compliance evidence must include reproducible command-level verification steps and expected outcomes for failure scenarios (not narrative-only docs).
- **D-06:** Audit-event handling documentation must define required event types (`join`, `rejoin`, `leave`, `reject`, `removed`, `control`) and troubleshooting queries against persisted attendance data.

### CI gate strictness
- **D-07:** LIVE-09 CI must fail on any livestream regression by running targeted livestream suites plus TypeScript build in pull-request workflow.
- **D-08:** CI ordering for phase 8 is: build -> targeted livestream tests -> coverage gate, so contract regressions fail early while preserving existing coverage policy.
- **D-09:** No flaky/manual verification is allowed as a release gate for phase 8 completion; all required checks must be CLI-automated.

### External dependency failure policy
- **D-10:** Redis lock unavailability in join/rejoin paths is treated as fail-closed (request rejected with explicit error shape) to prevent policy bypass.
- **D-11:** LiveKit adapter failures during start/token/control paths must return explicit 5xx errors with stable `{ error: string }` contract and must not mutate session state beyond confirmed operations.
- **D-12:** Phase 8 must document and test that dependency failures are observable through deterministic responses and do not silently succeed.

### Scope guardrail and deferrals
- **D-13:** No new realtime interaction features (chat/reactions/polls/moderation expansion) are included in phase 8.
- **D-14:** Frontend UX, dashboards, and visual operational consoles remain out of scope; backend documentation and test/CI hardening only.

### the agent's Discretion
- Exact file names/locations for runbook and checklists.
- Exact partitioning of livestream tests into reliability suites if behavior coverage remains complete.
- Exact CI YAML step naming and command composition.
</decisions>

<specifics>
## Specific Ideas

- Prioritize deterministic reliability over broad new scope.
- Keep phase 8 backend-only and compliance-oriented.
- Reuse phase 6/7 integration test patterns and extend them for degraded dependencies.
- Promote operational readiness by making runbook steps directly executable.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` - Phase 8 goal and requirement IDs (LIVE-07..LIVE-09).
- `.planning/STATE.md` - Current milestone/phase execution status.
- `.planning/phases/07-realtime-session-experience/07-CONTEXT.md` - Locked backend-only and event/presence decisions inherited by phase 8.
- `.planning/phases/07-realtime-session-experience/07-realtime-session-experience-01-SUMMARY.md` - Teacher control and paused-state implementation baseline.
- `.planning/phases/07-realtime-session-experience/07-realtime-session-experience-02-SUMMARY.md` - Presence/rejoin/event-feed baseline.

### Livestream implementation surface
- `src/routes/livestream.routes.ts` - Route contracts requiring regression protection.
- `src/controllers/livestream.lifecycle.controller.ts` - Lifecycle and ownership logic.
- `src/controllers/livestream.control.controller.ts` - Teacher realtime controls.
- `src/controllers/livestream.join.controller.ts` - Join/rejoin and lock integration.
- `src/controllers/livestream.events.controller.ts` - Event-feed contract.
- `src/services/livestream/session-lock.service.ts` - Redis lock policy behavior.
- `src/services/livekit/livekit-client.ts` - LiveKit adapter boundary.
- `src/models/LivestreamSession.ts` - Session state contract.
- `src/models/LivestreamAttendance.ts` - Compliance/audit event store.

### Existing CI and operations baseline
- `.github/workflows/ci.yml` - Current PR/main build and test gating.
- `README.md` - Existing operational troubleshooting and verification command style.
- `src/utils/env-validation.ts` - Required env contract used for deployment readiness.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Livestream route-level integration tests already exist and can be extended for reliability/compliance scenarios.
- LiveKit integration is isolated behind `livekit-client` adapter, enabling dependency-failure test injection.
- Redis single-device behavior is isolated in `session-lock.service`, enabling fail-closed policy verification.

### Established Patterns
- API errors return `{ error: string }` with guard-clause controller style.
- Integration tests use mocked model/service boundaries and supertest route verification.
- CI already executes `npm run build` and `npm run test:coverage` in GitHub Actions.

### Integration Points
- Phase 8 should extend livestream integration suites and/or add targeted reliability suites under `tests/livestream/**`.
- CI workflow should include explicit livestream reliability commands before/alongside coverage gate.
- Operational docs should map directly to available commands and known dependency boundaries.
</code_context>

<deferred>
## Deferred Ideas

- New livestream product features (chat, reactions, polling, richer moderation controls).
- Frontend operational dashboards or realtime admin UIs.
- Provider migration or multi-provider abstraction expansion beyond LiveKit.
</deferred>

---

*Phase: 08-livestream-reliability-compliance*
*Context gathered: 2026-03-29 (auto-selected defaults)*
