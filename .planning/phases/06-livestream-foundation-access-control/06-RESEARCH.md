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
- Provider locked: LiveKit (D-09, D-10)
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

## LiveKit Integration Findings
- LiveKit is room/token based and supports server-generated access grants.
- Backend typically mints join tokens using API key + secret.
- Room lifecycle can be managed via server SDK or REST, while media transport happens directly between client and LiveKit.
- Provider credentials should remain server-side only.

## Recommended Integration Pattern for Phase 06
1. Treat LiveKit as infrastructure backend managed through a dedicated adapter service in this codebase.
2. Keep provider calls isolated behind service methods so phase 07/08 can evolve without controller rewrites.
3. Persist canonical session state in app DB; do not infer app authorization solely from provider room state.
4. Use Redis lock keys for single-device active join enforcement and fast rejoin checks.
5. Keep advanced media/chat controls deferred to phase 07 unless required for access control.

## Risks and Mitigations
- Risk: LiveKit credential leakage.
  - Mitigation: keep API secret only in server env and never expose to clients.
- Risk: mismatch between app session state and provider room state.
  - Mitigation: explicit lifecycle transitions and audit event writes in same app transaction boundary.
- Risk: token expiry vs rejoin UX mismatch.
  - Mitigation: define phase 06 token TTL policy and reissue path on authorized rejoin.

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
- Deploy or provision LiveKit server/cloud project
- Generate and store LiveKit API key and secret
- Provide app env vars for LiveKit host URL and credentials
- Configure network/proxy/TLS for LiveKit endpoints
