# Phase 06 Research - Livestream Foundation & Access Control

## Scope
Phase 06 covers LIVE-01..LIVE-03 only:
- Teacher lifecycle controls (create/schedule/start/end/cancel)
- Role-based control restrictions
- Join authorization gates and rejoin policy

Out of scope:
- Rich realtime session controls and UX (phase 07)
- Reliability/compliance hardening (phase 08)

## Locked Decisions from Context
- Provider locked: Owncast (self-hosted) (D-09, D-10)
- Students join only after teacher starts stream (D-01)
- Explicit teacher end closes stream to future joins (D-02)
- Authorized rejoin allowed while active (D-03)
- Access modes: public students vs purchased-course private (D-04, D-05)
- Single-device policy per user per livestream (D-06)

## Existing Code Reuse
- Auth context and role extraction: src/middlewares/auth.middleware.ts
- Enrollment and ownership access patterns: src/routes/enrollment.routes.ts and related controllers
- Route wiring and API mount conventions: src/server.ts
- Existing Redis utilities suitable for ephemeral session lock keys: src/utils/redis.ts
- Existing error contract: { error: string }

## Owncast Integration Findings
- Owncast is self-hosted and configured primarily from /admin.
- Default web and RTMP ports are exposed and configurable.
- Stream key and admin credentials are distinct and must be rotated from defaults.
- Owncast supports extensibility and third-party API usage, but endpoint usage must be verified against current Owncast API docs for the deployed version.

## Recommended Integration Pattern for Phase 06
1. Treat Owncast as infrastructure backend managed through a dedicated adapter service in this codebase.
2. Keep provider calls isolated behind service methods so phase 07/08 can evolve without controller rewrites.
3. Persist canonical session state in app DB; do not infer app authorization solely from Owncast state.
4. Use Redis lock keys for single-device active join enforcement and fast rejoin checks.
5. Keep chat-specific behavior deferred to phase 07 unless required for access control.

## Risks and Mitigations
- Risk: Owncast API drift by version.
  - Mitigation: isolate calls in one service, add integration contract tests with mocked provider responses.
- Risk: mismatch between app session state and provider state.
  - Mitigation: explicit lifecycle transitions and audit event writes in same app transaction boundary.
- Risk: default Owncast credentials in non-dev environments.
  - Mitigation: require explicit env vars and runbook checklist in phase 08.

## Validation Architecture
- Unit tests:
  - lifecycle authorization rules
  - access mode checks (public/private)
  - single-device join lock behavior
- Integration tests:
  - create->start->join->end flow
  - non-teacher control denial
  - private mode purchase gate
  - rejoin allowed while active and blocked after end

## Manual Setup Required (Human)
- Deploy and run Owncast instance (self-hosted)
- Set and rotate Owncast admin password and stream key
- Provide app env vars for Owncast base URL and admin/API auth material
- Configure network/proxy/TLS for Owncast endpoints
