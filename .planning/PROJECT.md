# PROJECT.md — Studuy Backend

**Project:** Studuy Interactive Learning Management System (Backend)
**Owner:** Korupama-Organization
**Status:** Active (Brownfield) — Auth implemented, security hardening + MVP wiring in progress
**Last Updated:** 2026-03-21

---

## 📋 VISION & GOALS

**Vision:**
Build a secure, scalable Interactive Learning Management System (LMS) backend that integrates Generative AI for content creation and implements multi-layer DRM/anti-piracy controls. The system enables interactive learning through force-watch mechanisms (blocking quizzes in video), real-time progress tracking, and teacher-friendly content generation tools.

**Primary Goal (Milestone 1):**
Complete and harden the auth system, add comprehensive test coverage, wire remaining domain routes (courses, lessons, enrollment, orders), and ship a stable MVP suitable for pilot user testing.

**Timeline:** 4–8 weeks (normal pace, team of 2–3 developers)

---

## 🔍 CURRENT STATE ASSESSMENT

### Tech Stack (Verified from Codebase Mapping)
- **Language:** TypeScript 5.x (strict mode enabled)
- **Runtime:** Node.js + npm
- **Framework:** Express.js v4.21.1
- **Database:** MongoDB (via Mongoose v8.7.1) + Redis v5.11.0 (OTP/cooldown storage)
- **Auth:** Custom local (email/password + JWT + OTP via Nodemailer)
- **Docs:** Swagger/OpenAPI via swagger-jsdoc
- **Build:** TypeScript compilation, ts-node dev, nodemon auto-restart

### What Works Today
✅ Auth endpoints (register, login, refresh, OTP, password reset, forgot-password)
✅ User model with roles (student/teacher/admin)
✅ JWT + OTP flow (6-digit code, Redis-backed cooldown)
✅ Email integration (Nodemailer transporter)
✅ API documentation (Swagger UI at `/api-docs`)
✅ Database connection with graceful shutdown
✅ Core models defined: User, Course, Lesson, Enrollment, Order, CreditTransaction, AILog

### Critical Gaps & Blockers (from Codebase Mapping)

| Issue | Severity | Impact | Mitigation Phase |
|-------|----------|--------|------------------|
| Privilege escalation in self-registration | **CRITICAL** | User can self-assign admin/teacher roles on signup | Phase 1 |
| Insecure fallback secrets (JWT_SECRET='fallback_secret', SMTP_PASS='password') | **HIGH** | Weak defaults allow service to start in production with known credentials | Phase 1 |
| Missing rate limiting on auth endpoints | **HIGH** | Brute-force and OTP replay attacks feasible | Phase 1 |
| Zero automated test suite | **MEDIUM** | Regressions in auth, OTP, token flows undetected | Phase 2 |
| Incomplete route wiring (TODO comment in server.ts) | **MEDIUM** | Course/lesson/order endpoints not yet mounted | Phase 3 |
| Process-terminating DB error handling | **MEDIUM** | Connection errors kill runtime instead of graceful degradation | Phase 1 (optional) |

### Codebase Health Summary
- **Architecture:** Clean layered pattern (routes → controllers → services → models). Well-separated concerns.
- **Code Quality:** TypeScript strict mode active. Guard-clause style validations. Some `any` casts weaken typing.
- **Conventions:** Consistent file naming (kebab.case for services, PascalCase for models). Centralized config.
- **Testing:** 0% coverage. No Jest/Vitest/Mocha configured. Manual testing only.
- **DevOps:** No CI/CD pipeline detected. No Docker/deployment config.

---

## 🎯 MILESTONE 1 ROADMAP

**Milestone Goal:** Secure auth system with full test coverage + wired domain routes (MVP-ready)

**Estimated Effort:** 10–12 weeks of concurrent work (2–3 developers)
**Target Completion:** 4–8 weeks wall-clock time

### Phase Breakdown

#### Phase 1: Auth Security Hardening (Weeks 1–2)
**Goal:** Fix critical security vulnerabilities and add operational controls.

**Requirements:**
- [x] Enforce server-side role policy: force `student` role on public signup, admin/teacher via protected flow only
- [x] Remove weak fallback secrets: fail fast on missing required env vars (JWT_SECRET, SMTP_PASS, SMTP_HOST, MONGODB_URI)
- [x] Add rate limiting to auth endpoints (register, login, resend-OTP, forgot-password) with per-IP or per-email keying
- [x] (Optional) Harden DB error handling to graceful degradation instead of process exit
- [x] Add startup validation tests for config contract

**Definition of Done:**
- All critical/high severity concerns resolved
- Auth endpoints rate-limited with measurable throttling
- Config startup validation in place

#### Phase 2: Auth Test Suite & Verification (Weeks 2–4)
**Goal:** Comprehensive test coverage for auth flows, token lifecycle, and OTP mechanics.

**Requirements:**
- [x] Set up Jest (or Vitest) with ts-jest
- [x] Unit tests for auth controller (register, login, refresh, OTP, reset flows)
- [x] Unit tests for auth middleware (token validation, role checks, blocked/unverified user checks)
- [x] Unit tests for JWT utility (token creation, verification, expiry rules)
- [x] Integration tests for auth routes (E2E register→verify→login→refresh cycle)
- [x] Config validation tests
- [x] Reach ≥90% coverage on auth module
- [x] Add `npm run test` and `npm run test:watch` scripts

**Definition of Done:**
- 90%+ auth module coverage
- All critical paths tested (happy path + error cases)
- CI-ready test suite

#### Phase 3: Domain Routes Wiring (Weeks 3–5)
**Goal:** Mount and implement course/lesson/enrollment/order endpoints with basic CRUD.

**Requirements:**
- [x] Wire `/api/courses` routes (GET all, GET by ID, POST create, PUT update, DELETE)
- [x] Wire `/api/lessons` routes (GET by course, POST create, PUT update)
- [x] Wire `/api/enrollments` routes (POST enroll, GET my-enrollments, GET enrollment-progress)
- [x] Wire `/api/orders` routes (POST create-order, GET my-orders)
- [x] Wire `/api/credit-transactions` routes (POST debit, GET balance)
- [x] Implement course ownership validation (only instructor can edit)
- [x] Implement enrollment access control (students can only see/progress enrolled courses)
- [x] Update Swagger docs for all new routes

**Definition of Done:**
- All routes mounted and callable
- Basic ownership/access control enforced
- Swagger docs up-to-date

#### Phase 4: Domain Logic & Validation (Weeks 4–6)
**Goal:** Implement business logic for enrollment, progress tracking, and credit transactions.

**Requirements:**
- [x] Enrollment cascade: POST /enroll creates Enrollment record, auto-initializes lessonProgress array
- [x] Progress sync: PUT /enrollments/:id/progress updates currentTime + completedInteractions array
- [x] Balance aggregation: GET /credit-balance calls CreditTransaction.balance() static
- [x] Course availability checks: enforce isPublished before enrollment
- [x] Lesson ordering: enforc sequential lesson access (cannot skip ahead without completing prerequisites)
- [x] Add integration tests for multi-step flows (enroll → progress → complete → get certificate stub)

**Definition of Done:**
- Core business flows functional and tested
- Progress sync verified with manual test
- Credit transaction logic validated

#### Phase 5: MVP Stability & Polish (Weeks 6–8)
**Goal:** End-to-end testing, documentation, and minor feature completions.

**Requirements:**
- [x] Manual smoke tests across all routes (auth + domain)
- [x] Environment validation (dev vs. prod-like configs)
- [x] README updates with API overview, setup instructions, example requests
- [x] Docker setup (optional, for deployment readiness)
- [x] Error handling audit: ensure consistent error response shapes
- [x] Performance spot-check (query optimization if slow enrollments detected)
- [x] Rollout checklist (secrets rotation, logs sanitation, backup validation)

**Definition of Done:**
- All major routes tested and working
- Documentation complete
- Deployment-ready

---

## ✅ SUCCESS CRITERIA

**For Milestone 1 completion:**
- [ ] All critical/high security issues resolved (3 items: privilege escalation, secrets, rate limiting)
- [ ] Auth module ≥90% test coverage
- [ ] All domain routes (courses, lessons, enrollments, orders, credit) mounted and callable
- [ ] Ownership/access control enforced
- [ ] Manual end-to-end test passes: register → enroll → progress → complete
- [ ] Swagger docs reflect all endpoints
- [ ] README has API overview and setup guide
- [ ] Zero blocking bugs in auth/domain flows

**For MVP Readiness:**
- [ ] Can onboard 10+ pilot users without crashes
- [ ] Token refresh works reliably under load simulation
- [ ] OTP delivery confirmed (manual email check)
- [ ] Database scaling plan documented (Mongo indexes, connection pooling)

---

## 📊 ASSUMPTIONS

1. **Team Capacity:** 2–3 full-time developers, each able to own 1–2 phases concurrently
2. **Testing:** Target jest/vitest; existing developers familiar with Unit + Integration patterns
3. **Database:** MongoDB Atlas or local instance available for dev/test
4. **Scope Freeze:** No new domain models added during Milestone 1 (Order, Course, etc. structures frozen)
5. **Auth Finality:** OAuth/SSO integrations deferred to Milestone 2
6. **DRM/AI Features:** Deferred to Backlog (Phase 999.x) — not blocking MVP

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Rate limiting partial/ineffective under distributed load | Medium | Auth endpoint abuse still possible | Add monitoring; run load test Phase 1 week 2 |
| Test suite slows dev cycle (over-mocking) | Medium | Velocity drop | Keep tests integration-focused; mock only external services |
| Course/lesson ownership checks collision with shared teaching | Low | Endpoint access denied incorrectly | Co-teach permission model deferred to Phase 2 |
| Redis connection loss crashes progress sync | Low | Cascading failures | Add graceful degradation; extend DB error handling Phase 1 |
| Timezone issues in OTP TTL or token expiry | Low | Silent failures in production | Use UTC epoch everywhere; add timezone tests |

---

## 📁 PLANNING DIRECTORY STRUCTURE

```
.planning/
├── PROJECT.md                 ← You are here
├── STATE.md                   ← Session state / current phase tracker (auto-maintained)
├── codebase/                  ← Codebase mapping (7 structured docs)
│   ├── STACK.md
│   ├── INTEGRATIONS.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   └── CONCERNS.md
├── phases/                    ← (Created as phases planned)
│   ├── 1_auth_hardening/
│   │   ├── PLAN.md
│   │   ├── RESEARCH.md
│   │   └── VERIFICATION.md
│   ├── 2_auth_tests/
│   └── ...
└── research/                  ← Deep-dive research artifacts (if needed)
```

---

## 🚀 NEXT STEPS

1. **Commit this PROJECT.md** and `.planning/codebase/` to main branch
2. **Run Phase 1 planning:** `/gsd-plan-phase 1` (or `/gsd-discuss-phase 1` first if questions remain)
3. **Execute Phase 1:** Start security hardening in parallel with test infrastructure setup
4. **Verify & iterate:** After Phase 1, validate fixes; adjust Phases 2+ scope if needed

---

**GSD Workflow:** This project uses the Get Shit Done methodology for structured planning and execution. See `.planning/` for phase details as work progresses.

---

*Project charter created 2026-03-21*
