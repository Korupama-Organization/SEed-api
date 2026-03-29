# Phase 08 Research - Livestream Reliability & Compliance

## Scope
Phase 08 covers LIVE-07..LIVE-09 only:
- Reliability verification for livestream backend contracts introduced in phases 6-7
- Compliance and operations documentation with executable troubleshooting/verification steps
- CI quality gates for livestream regression prevention

Out of scope:
- New realtime product capabilities (chat/reactions/polls)
- Frontend UX or operational dashboards
- Streaming provider replacement or multi-provider architecture

## Locked Decisions from Context
- Reliability matrix must include lifecycle, controls, join/rejoin, removed-user enforcement, and event-feed ordering/filter behavior (D-01).
- Verification remains integration-first with deterministic dependency mocks and degraded-path coverage (D-02, D-03).
- Compliance artifact requires backend runbook with incident triage, dependency checks, env contract, rollback/escalation guidance (D-04).
- Compliance evidence must be command-reproducible and include attendance-event troubleshooting queries (D-05, D-06).
- CI must fail fast on livestream regressions with ordering build -> targeted livestream suites -> coverage (D-07, D-08, D-09).
- Redis unavailability in join/rejoin is fail-closed, and LiveKit failures must preserve stable 5xx error contracts without unsafe state mutation (D-10, D-11, D-12).

## Existing Code Reuse
- Contract surface:
  - src/routes/livestream.routes.ts
  - src/controllers/livestream.lifecycle.controller.ts
  - src/controllers/livestream.control.controller.ts
  - src/controllers/livestream.join.controller.ts
  - src/controllers/livestream.events.controller.ts
- Provider/lock boundaries:
  - src/services/livekit/livekit-client.ts
  - src/services/livestream/session-lock.service.ts
- Existing integration suites to extend:
  - tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts
  - tests/livestream/realtime/livestream.controls.integration.test.ts
  - tests/livestream/realtime/livestream.presence.integration.test.ts
  - tests/livestream/access/livestream.join.integration.test.ts
- Existing CI baseline:
  - .github/workflows/ci.yml

## Recommended Pattern for Phase 08
1. Add a dedicated reliability regression suite focused on failure invariants and dependency degradation outcomes.
2. Harden join/lifecycle/control error handling paths so dependency failures return deterministic `{ error: string }` contracts and block unsafe progress.
3. Introduce a canonical runbook document under docs/ with command-first checks and known failure signatures.
4. Add targeted livestream test command(s) and wire them in CI before coverage gate.

## Risks and Mitigations
- Risk: CI runtime grows and reduces feedback speed.
  - Mitigation: Keep targeted livestream suite compact and deterministic; run coverage after targeted checks.
- Risk: Dependency-failure test flakiness.
  - Mitigation: Use route-level tests with mocked provider/redis boundaries, no external network dependency.
- Risk: Documentation drift from implementation.
  - Mitigation: Tie runbook steps directly to scripts and test commands in package.json/CI.

## Validation Strategy
- Phase-level automated verification:
  - npm run test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand
  - npm run test -- tests/livestream/realtime/livestream.controls.integration.test.ts --runInBand
  - npm run test -- tests/livestream/realtime/livestream.presence.integration.test.ts --runInBand
  - npm run build
- CI verification:
  - Workflow includes explicit livestream reliability gate prior to coverage

## Manual Setup Required (Human)
- Ensure Redis and LiveKit credentials remain configured in CI secrets/environment so error-path tests and build assertions run consistently.
