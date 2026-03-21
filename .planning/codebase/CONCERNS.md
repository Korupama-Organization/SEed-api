# Codebase Concerns

**Analysis Date:** 2026-03-21

## Top Concerns by Severity

1. **Critical**: Privilege escalation risk in self-registration
2. **High**: Insecure fallback secrets/configuration values
3. **High**: Missing abuse controls on authentication endpoints
4. **Medium**: No automated test suite or test command
5. **Medium**: Incomplete route wiring with active TODO and commented routes
6. **Medium**: Process-terminating DB module behavior reduces runtime resilience

## Concern Details

### 1) Critical: Privilege escalation risk in self-registration

**Rationale/Evidence:**
- `src/controllers/auth.controller.ts:67` accepts `role` directly from `req.body`.
- `src/controllers/auth.controller.ts:77` sets `assignRole` from user input (`role || 'student'`).
- `src/controllers/auth.controller.ts:102` and `src/controllers/auth.controller.ts:107` persist that role on user creation.
- No allowlist restriction that limits public registration to non-privileged roles is present in this flow.

**Impact:**
- A client can request elevated roles during registration (including `admin`), which can lead to unauthorized privileged access once role-based checks are added or expanded.

**Suggested Mitigation Direction:**
- Enforce server-side role policy in registration (for example: force `student` for public signup).
- Move elevated-role assignment to protected admin-only flows.
- Add tests that assert rejected attempts to self-assign privileged roles.

### 2) High: Insecure fallback secrets/configuration values

**Rationale/Evidence:**
- `src/constants.ts:27` uses `required('JWT_SECRET', 'fallback_secret')`.
- `src/constants.ts:40` uses `required('SMTP_HOST', 'localhost')`.
- `src/constants.ts:44` uses `required('SMTP_PASS', 'password')`.
- `.env.example` documents these as required secrets, but runtime currently permits weak defaults.

**Impact:**
- If environment configuration is incomplete, the service can still start with known weak values, reducing token/signing and email-channel security posture.

**Suggested Mitigation Direction:**
- Remove weak fallback literals for security-sensitive values.
- Fail fast on startup when required secrets are absent.
- Add startup validation tests for config contract.

### 3) High: Missing abuse controls on authentication endpoints

**Rationale/Evidence:**
- `src/server.ts:13` and `src/server.ts:14` show only `cors` and JSON parsing middleware.
- `src/server.ts:36` mounts `/api/auth` without visible rate-limiting middleware.
- `src/routes/auth.routes.ts` exposes login, OTP resend, forgot-password, and reset endpoints (`/login`, `/resend-verify-email-otp`, `/forgot-password`, `/resend-forgot-password-otp`, `/reset-password`).
- `package.json` dependencies do not include common request-throttling libraries.

**Impact:**
- Authentication and OTP endpoints are more susceptible to brute-force and request-flood abuse.

**Suggested Mitigation Direction:**
- Add per-route rate limiting for auth/OTP flows.
- Add request-level protections (IP/user/email keying, cooldown hardening, and monitoring).
- Add tests that verify throttling behavior under repeated attempts.

### 4) Medium: No automated test suite or test command

**Rationale/Evidence:**
- `package.json:5-8` contains `start`, `dev`, and `build` scripts only; no `test` script is defined.
- Repository scan returned `NO_TEST_FILES_FOUND` for `*.test.*` / `*.spec.*` outside ignored/build directories.

**Impact:**
- Regressions in auth, token handling, and OTP flows are less likely to be caught before release.

**Suggested Mitigation Direction:**
- Introduce baseline unit/integration tests for auth controller and middleware.
- Add a `test` script and CI gate for required checks.

### 5) Medium: Incomplete route wiring with active TODO and commented routes

**Rationale/Evidence:**
- `src/server.ts:35` contains `TODO: Register routes`.
- `src/server.ts:37-39` has commented route mounts for courses, lessons, and orders.
- Domain models exist (`src/models/Course.ts`, `src/models/Lesson.ts`, `src/models/Order.ts`, `src/models/CreditTransaction.ts`) while API exposure remains partial.

**Impact:**
- Feature surface and codebase structure are out of sync, increasing drift and maintenance overhead.

**Suggested Mitigation Direction:**
- Either wire implemented domains into routes/controllers or remove/defer inactive code paths.
- Track route readiness explicitly in roadmap/checklist to prevent stale partial integrations.

### 6) Medium: Process-terminating DB module behavior reduces runtime resilience

**Rationale/Evidence:**
- `src/db/connect.ts:16` calls `process.exit(1)` on Mongo connection failure.
- `src/db/connect.ts:25` calls `process.exit(0)` on `SIGINT` inside the DB module.
- This couples DB concerns with full process lifecycle decisions.

**Impact:**
- Abrupt process exits can reduce graceful degradation/recovery options and complicate hosting supervision behavior.

**Suggested Mitigation Direction:**
- Propagate failures to the bootstrap layer and centralize lifecycle management in server startup.
- Keep DB module focused on connect/disconnect responsibilities and expose errors upward.

## Assumptions

- **Assumption:** API documentation endpoints are intended for all environments.
  - Evidence: `src/server.ts:17` and `src/server.ts:22` mount `/api-docs` and `/api-docs.json` unconditionally, and `src/server.ts:19` enables `persistAuthorization`.
  - If docs are intentionally public in production, this is not a defect; otherwise gate by environment/auth policy.

---

*Concerns audit: 2026-03-21*
