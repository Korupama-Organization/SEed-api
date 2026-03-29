# ROADMAP

## Milestone 1 - Secure Auth MVP Foundation

### Phase 1: Auth Security Hardening
**Goal:** Eliminate privilege escalation and unsafe defaults in auth while adding abuse protection and focused security tests.
**Requirements:** [AUTH-SEC-01, AUTH-SEC-02, AUTH-SEC-03, AUTH-SEC-04]
**Plans:** 2 plans

Plans:
- [x] 01-auth-security-hardening-01-PLAN.md - Role policy middleware + fail-fast env validation hardening
- [x] 01-auth-security-hardening-02-PLAN.md - Redis per-email rate limiting + security-critical hybrid tests

### Phase 2: Auth Test Suite & Verification
**Goal:** Add comprehensive auth test coverage and verification workflows.
**Requirements:** [AUTH-TEST-01, AUTH-TEST-02, AUTH-TEST-03]
**Plans:** 2 plans

Plans:
- [x] 02-auth-test-suite-verification-01-PLAN.md - Auth unit test matrix for controller, middleware, and JWT utility
- [x] 02-auth-test-suite-verification-02-PLAN.md - Auth integration tests + coverage thresholds + CI enforcement

### Phase 3: Domain Routes Wiring
**Goal:** Wire and expose core domain routes for courses, lessons, enrollments, and orders.
**Requirements:** [DOMAIN-ROUTE-01, DOMAIN-ROUTE-02, DOMAIN-ROUTE-03]
**Plans:** 2 plans

Plans:
- [x] 03-domain-routes-wiring-01-PLAN.md - Course/Lesson route wiring with auth and ownership guards
- [x] 03-domain-routes-wiring-02-PLAN.md - Enrollment/Order route wiring plus Swagger contract completion

### Phase 4: Domain Logic & Validation
**Goal:** Implement and validate core enrollment, progress, and credit domain logic.
**Requirements:** [DOMAIN-LOGIC-01, DOMAIN-LOGIC-02, DOMAIN-LOGIC-03]
**Plans:** 2 plans

Plans:
- [x] 04-domain-logic-validation-01-PLAN.md - Enrollment and progress domain rules with sequencing validation
- [x] 04-domain-logic-validation-02-PLAN.md - Credit transaction/order logic integration and multi-step tests

### Phase 5: MVP Stability & Polish
**Goal:** Stabilize end-to-end behavior and finalize MVP operational readiness.
**Requirements:** [MVP-STAB-01, MVP-STAB-02]
**Plans:** 2 plans

Plans:
- [x] 05-mvp-stability-polish-01-PLAN.md - MVP smoke automation and UAT checklist
- [x] 05-mvp-stability-polish-02-PLAN.md - Operational readiness docs, error consistency checks, and verification










## Milestone 1.1 - Teacher Video Livestreaming

### Phase 6: Livestream Foundation & Access Control
**Goal:** Introduce teacher-only livestream creation and strict role-aware access control.
**Requirements:** [LIVE-01, LIVE-02, LIVE-03]
**Plans:** 2 plans

Plans:
- [x] 06-livestream-foundation-access-control-01-PLAN.md - Teacher lifecycle control endpoints + LiveKit adapter foundation
- [x] 06-livestream-foundation-access-control-02-PLAN.md - Join authorization, single-device enforcement, and access integration tests

### Phase 7: Realtime Session Experience
**Goal:** Deliver core in-session controls and student viewing experience for active livestream classes.
**Requirements:** [LIVE-04, LIVE-05, LIVE-06]
**Plans:** 2 plans

Plans:
- [x] 07-realtime-session-experience-01-PLAN.md - Teacher realtime control endpoints + paused-state and removal audit contracts
- [x] 07-realtime-session-experience-02-PLAN.md - Presence reconnect policy + session metadata event-feed contracts

### Phase 8: Livestream Reliability & Compliance
**Goal:** Verify livestream correctness, document operations, and enforce CI quality gates.
**Requirements:** [LIVE-07, LIVE-08, LIVE-09]
**Plans:** 2 plans

Plans:
- [x] 08-livestream-reliability-compliance-01-PLAN.md - Reliability regression matrix + dependency-failure hardening for livestream backend
- [x] 08-livestream-reliability-compliance-02-PLAN.md - Operations runbook + CI livestream quality gates

