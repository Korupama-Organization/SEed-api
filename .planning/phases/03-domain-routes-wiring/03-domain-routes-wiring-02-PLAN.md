---
phase: 03-domain-routes-wiring
plan: 02
type: execute
wave: 2
depends_on: [03-domain-routes-wiring-01]
files_modified:
  - src/controllers/enrollment.controller.ts
  - src/controllers/order.controller.ts
  - src/routes/enrollment.routes.ts
  - src/routes/order.routes.ts
  - src/server.ts
  - src/routes/course.routes.ts
  - src/routes/lesson.routes.ts
  - tests/domain/integration/enrollment-order.routes.integration.test.ts
autonomous: true
requirements: [DOMAIN-ROUTE-01, DOMAIN-ROUTE-02, DOMAIN-ROUTE-03]
must_haves:
  truths:
    - "Enrollment and order APIs are reachable under /api/enrollments and /api/orders"
    - "Enrollment/order operations enforce authenticated ownership constraints"
    - "Route contracts are documented in Swagger for all wired domain endpoints"
  artifacts:
    - path: "src/routes/enrollment.routes.ts"
      provides: "Enrollment endpoint contracts and docs"
    - path: "src/routes/order.routes.ts"
      provides: "Order endpoint contracts and docs"
    - path: "tests/domain/integration/enrollment-order.routes.integration.test.ts"
      provides: "Enrollment/order reachability and authz integration checks"
    - path: "src/server.ts"
      provides: "Mounted enrollment/order routes"
  key_links:
    - from: "src/server.ts"
      to: "src/routes/enrollment.routes.ts"
      via: "app.use('/api/enrollments', enrollmentRoutes)"
      pattern: "app.use\\('/api/enrollments'"
    - from: "src/server.ts"
      to: "src/routes/order.routes.ts"
      via: "app.use('/api/orders', orderRoutes)"
      pattern: "app.use\\('/api/orders'"
    - from: "src/routes/enrollment.routes.ts"
      to: "src/routes/order.routes.ts"
      via: "shared auth/ownership guard patterns"
      pattern: "requireAuth|requireOwnership"
---

<objective>
Wire enrollment and order route surfaces, enforce ownership constraints, and align domain route Swagger contracts.

Purpose: Complete DOMAIN-ROUTE-01..03 by finishing domain route registration and documentation parity.
Output: Mounted enrollment/order routes, route-level ownership enforcement, and updated API docs coverage across domain routes.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/03-domain-routes-wiring/03-domain-routes-wiring-01-SUMMARY.md
@src/models/Enrollment.ts
@src/models/Order.ts
@src/routes/auth.routes.ts
@src/utils/swagger.ts

<interfaces>
From src/models/Enrollment.ts:
```typescript
export const Enrollment = model<IEnrollment>('Enrollment', EnrollmentSchema);
```

From src/models/Order.ts:
```typescript
export const Order = model<IOrder>('Order', OrderSchema);
```

From src/routes/auth.routes.ts:
```typescript
router.post(...)
```
Pattern to preserve: route file contains endpoint definitions and Swagger JSDoc.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement and mount enrollment/order routes with authenticated ownership boundaries</name>
  <files>src/controllers/enrollment.controller.ts, src/controllers/order.controller.ts, src/routes/enrollment.routes.ts, src/routes/order.routes.ts, src/server.ts, tests/domain/integration/enrollment-order.routes.integration.test.ts</files>
  <behavior>
    - Test 1: Enrollment/order list/detail endpoints require valid auth
    - Test 2: Users cannot read or mutate another user's enrollment/order resources
    - Test 3: Authorized owner requests return expected status and payload shape
  </behavior>
  <action>Create enrollment and order controllers with route maps for list/detail/create/update actions needed for MVP wiring. Apply `requireAuth` plus ownership middleware so resource access is scoped to the authenticated user unless explicitly allowed by role policy. Mount both route groups in server and add supertest integration coverage for auth and ownership behaviors.</action>
  <verify>
    <automated>npm run test -- tests/domain/integration/enrollment-order.routes.integration.test.ts</automated>
  </verify>
  <done>Enrollment and order endpoints are mounted and enforce ownership/auth rules per DOMAIN-ROUTE-01 and DOMAIN-ROUTE-02.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Document domain route contracts in Swagger and verify build integrity</name>
  <files>src/routes/course.routes.ts, src/routes/lesson.routes.ts, src/routes/enrollment.routes.ts, src/routes/order.routes.ts</files>
  <behavior>
    - Test 1: Each mounted domain route has Swagger path definitions
    - Test 2: Documentation includes auth-required responses for protected endpoints
    - Test 3: Server build succeeds with all route/docs imports resolved
  </behavior>
  <action>Add Swagger JSDoc blocks to all domain route files (course, lesson, enrollment, order) using the same style as existing auth routes. Ensure request/response/error contracts are represented for reachable endpoints and protected route responses (401/403). Keep docs colocated with route declarations for maintainability.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Swagger reflects wired domain route contracts, satisfying DOMAIN-ROUTE-03.</done>
</task>

</tasks>

<verification>
- Enrollment/order integration tests pass.
- Build passes with all domain routes mounted and documented.
</verification>

<success_criteria>
- /api/enrollments and /api/orders are mounted and reachable.
- Ownership boundaries are enforced at route level.
- Swagger includes course/lesson/enrollment/order contracts.
</success_criteria>

<output>
After completion, create `.planning/phases/03-domain-routes-wiring/03-domain-routes-wiring-02-SUMMARY.md`
</output>
