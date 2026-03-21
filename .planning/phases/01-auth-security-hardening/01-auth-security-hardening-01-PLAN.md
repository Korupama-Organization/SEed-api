---
phase: 01-auth-security-hardening
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/middlewares/registration-role-policy.middleware.ts
  - src/routes/auth.routes.ts
  - src/constants.ts
  - src/utils/env-validation.ts
  - src/server.ts
autonomous: true
requirements: [AUTH-SEC-01, AUTH-SEC-02]
must_haves:
  truths:
    - "Public signup cannot create admin users"
    - "Teacher signup is allowed through existing register endpoint"
    - "Server refuses to start when required production env vars are missing"
  artifacts:
    - path: "src/middlewares/registration-role-policy.middleware.ts"
      provides: "Registration role policy middleware with admin block"
    - path: "src/utils/env-validation.ts"
      provides: "Centralized startup required-env validation"
    - path: "src/routes/auth.routes.ts"
      provides: "Register route wiring with role middleware"
    - path: "src/server.ts"
      provides: "Fail-fast startup validation before listen"
  key_links:
    - from: "src/routes/auth.routes.ts"
      to: "src/middlewares/registration-role-policy.middleware.ts"
      via: "register route middleware chain"
      pattern: "router\.post\('/register'.*enforceRegistrationRolePolicy"
    - from: "src/server.ts"
      to: "src/utils/env-validation.ts"
      via: "startup preflight call"
      pattern: "validateRequiredEnv\(\)"
---

<objective>
Harden auth registration and configuration safety so public users cannot escalate to admin and the app cannot boot with unsafe/missing production secrets.

Purpose: Close the two highest-risk auth security gaps before broader feature work.
Output: Role-policy middleware + fail-fast env validation wired into startup.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-auth-security-hardening/01-CONTEXT.md
@src/routes/auth.routes.ts
@src/controllers/auth.controller.ts
@src/constants.ts
@src/server.ts

<interfaces>
From src/routes/auth.routes.ts:
```typescript
router.post('/register', registerUser);
```

From src/controllers/auth.controller.ts:
```typescript
const assignRole: IUser['role'] = role || 'student';
```

From src/constants.ts:
```typescript
export const APP_CONFIG = { ... };
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add immutable registration role policy middleware and wire register route</name>
  <files>src/middlewares/registration-role-policy.middleware.ts, src/routes/auth.routes.ts</files>
  <behavior>
    - Test 1: Register payload with role=admin returns 403 and does not reach controller
    - Test 2: Register payload with role=teacher passes middleware
    - Test 3: Register payload with missing role defaults to student-compatible behavior
  </behavior>
  <action>Create `enforceRegistrationRolePolicy` middleware that allows only `student` and `teacher`, explicitly blocks `admin` (per locked decision), and normalizes/guards `req.body.role` before controller execution. Wire middleware only on `/api/auth/register` route before `registerUser` to preserve single-endpoint flow.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Public registration cannot submit admin role; teacher role remains supported via the same endpoint.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add fail-fast startup env validation and remove insecure fallbacks</name>
  <files>src/constants.ts, src/utils/env-validation.ts, src/server.ts</files>
  <behavior>
    - Test 1: Missing required env vars throws before app.listen
    - Test 2: Present required env vars allow startup path to continue
    - Test 3: Security-sensitive values are not replaced by weak fallback literals
  </behavior>
  <action>Introduce centralized `validateRequiredEnv()` in `src/utils/env-validation.ts` for required vars from Phase 1 context (`JWT_*`, `MONGODB_URI`, `SMTP_*`, `REDIS_HOST`, `REDIS_PORT`). Remove weak fallback literals in `src/constants.ts` for security-sensitive settings while keeping immutable one-time config evaluation. Call validation during startup in `src/server.ts` before route serving/listen to enforce fail-fast behavior.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Application startup fails immediately with missing required env vars and no weak default secrets remain in auth-critical config.</done>
</task>

</tasks>

<verification>
- Build succeeds after middleware and config refactor.
- Manual smoke: startup with missing `JWT_SECRET` must fail before server listens.
- Manual smoke: POST `/api/auth/register` with `role=admin` returns 4xx and no user creation.
</verification>

<success_criteria>
- `AUTH-SEC-01` satisfied: admin self-registration is blocked while teacher registration is preserved.
- `AUTH-SEC-02` satisfied: required production env variables are enforced at startup.
- No regression in route compilation or app boot path.
</success_criteria>

<output>
After completion, create `.planning/phases/01-auth-security-hardening/01-auth-security-hardening-01-SUMMARY.md`
</output>
