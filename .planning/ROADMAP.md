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
- [ ] 03-domain-routes-wiring-01-PLAN.md - Course/Lesson route wiring with auth and ownership guards
- [ ] 03-domain-routes-wiring-02-PLAN.md - Enrollment/Order route wiring plus Swagger contract completion

### Phase 4: Domain Logic & Validation
**Goal:** Implement and validate core enrollment, progress, and credit domain logic.
**Requirements:** [DOMAIN-LOGIC-01, DOMAIN-LOGIC-02, DOMAIN-LOGIC-03]
**Plans:** 0 plans

Plans:
- [ ] 04-domain-logic-validation-01-PLAN.md - [To be planned]

### Phase 5: MVP Stability & Polish
**Goal:** Stabilize end-to-end behavior and finalize MVP operational readiness.
**Requirements:** [MVP-STAB-01, MVP-STAB-02]
**Plans:** 0 plans

Plans:
- [ ] 05-mvp-stability-polish-01-PLAN.md - [To be planned]




