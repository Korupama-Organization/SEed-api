# REQUIREMENTS

## Milestone 1

### Phase 1 - Auth Security Hardening
- AUTH-SEC-01: Public registration must not allow admin role assignment.
- AUTH-SEC-02: Auth configuration must fail fast on missing required production secrets and connection vars.
- AUTH-SEC-03: Authentication endpoints must be protected by Redis-backed per-email rate limiting.
- AUTH-SEC-04: Security-critical tests must cover role enforcement, config validation, and rate-limiting behavior.

### Phase 2 - Auth Test Suite & Verification
- AUTH-TEST-01: Auth module has unit and integration tests for primary and failure paths.
- AUTH-TEST-02: Coverage targets and test scripts are enforced in CI workflow.
- AUTH-TEST-03: Verification artifacts document completion against requirements.

### Phase 3 - Domain Routes Wiring
- DOMAIN-ROUTE-01: Course, lesson, enrollment, and order routes are mounted and reachable.
- DOMAIN-ROUTE-02: Route-level auth and ownership constraints are applied.
- DOMAIN-ROUTE-03: API documentation reflects wired route contracts.

### Phase 4 - Domain Logic & Validation
- DOMAIN-LOGIC-01: Enrollment and progress flows persist and validate correctly.
- DOMAIN-LOGIC-02: Credit transaction behavior is consistent and auditable.
- DOMAIN-LOGIC-03: Domain integration tests validate critical multi-step scenarios.

### Phase 5 - MVP Stability & Polish
- MVP-STAB-01: End-to-end smoke tests pass for core workflows.
- MVP-STAB-02: Operational readiness checklist is completed for release.
