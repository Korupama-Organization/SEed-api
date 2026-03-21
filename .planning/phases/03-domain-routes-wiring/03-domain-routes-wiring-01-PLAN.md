---
phase: 03-domain-routes-wiring
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/middlewares/domain-authorization.middleware.ts
  - src/controllers/course.controller.ts
  - src/controllers/lesson.controller.ts
  - src/routes/course.routes.ts
  - src/routes/lesson.routes.ts
  - src/server.ts
  - tests/domain/integration/course-lesson.routes.integration.test.ts
autonomous: true
requirements: [DOMAIN-ROUTE-01, DOMAIN-ROUTE-02]
must_haves:
  truths:
    - "Course and lesson APIs are reachable under /api/courses and /api/lessons"
    - "Route-level authentication is required for protected create/update/delete flows"
    - "Ownership/role constraints prevent non-teacher users from mutating teacher-managed resources"
  artifacts:
    - path: "src/routes/course.routes.ts"
      provides: "Course endpoint contracts"
    - path: "src/routes/lesson.routes.ts"
      provides: "Lesson endpoint contracts"
    - path: "src/middlewares/domain-authorization.middleware.ts"
      provides: "Role and ownership guard helpers"
    - path: "src/server.ts"
      provides: "Mounted domain routes"
  key_links:
    - from: "src/server.ts"
      to: "src/routes/course.routes.ts"
      via: "app.use('/api/courses', courseRoutes)"
      pattern: "app.use\\('/api/courses'"
    - from: "src/server.ts"
      to: "src/routes/lesson.routes.ts"
      via: "app.use('/api/lessons', lessonRoutes)"
      pattern: "app.use\\('/api/lessons'"
    - from: "src/routes/course.routes.ts"
      to: "src/middlewares/domain-authorization.middleware.ts"
      via: "requireAuth + role/ownership guards"
      pattern: "requireAuth|requireRole|requireResourceOwnership"
---

<objective>
Wire course and lesson route surfaces with authentication and teacher-focused authorization constraints.

Purpose: Implement DOMAIN-ROUTE-01 and DOMAIN-ROUTE-02 for the first two domain surfaces before enrollment/order wiring.
Output: Mounted course/lesson routes, authorization middleware, and integration test coverage for route reachability and constraint behavior.
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
@.planning/phases/03-domain-routes-wiring/03-DISCOVERY.md
@src/server.ts
@src/routes/auth.routes.ts
@src/middlewares/auth.middleware.ts
@src/models/Course.ts
@src/models/Lesson.ts

<interfaces>
From src/middlewares/auth.middleware.ts:
```typescript
export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; role: string; payload: JwtPayload };
}
export const requireAuth = async (req, res, next) => { ... }
```

From src/server.ts:
```typescript
app.use('/api/auth', authRoutes);
```

From src/models/Course.ts and src/models/Lesson.ts:
```typescript
export const Course = model<ICourse>('Course', CourseSchema);
export const Lesson = model<ILesson>('Lesson', LessonSchema);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Define domain authorization contracts for role and ownership enforcement</name>
  <files>src/middlewares/domain-authorization.middleware.ts</files>
  <action>Create reusable middleware helpers that compose with `requireAuth` to enforce domain constraints: `requireRole(...roles)` and `requireOwnership({ getOwnerId })`. Keep handlers framework-native (Express middleware signature) and return consistent 401/403 responses for unauthorized access.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Authorization middleware exports reusable role and ownership guards consumed by domain routes.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement and mount course/lesson routes with guarded mutation endpoints</name>
  <files>src/controllers/course.controller.ts, src/controllers/lesson.controller.ts, src/routes/course.routes.ts, src/routes/lesson.routes.ts, src/server.ts, tests/domain/integration/course-lesson.routes.integration.test.ts</files>
  <behavior>
    - Test 1: GET list/detail endpoints are reachable and return contract-safe responses
    - Test 2: Mutating endpoints reject unauthenticated requests with 401
    - Test 3: Mutating endpoints reject authenticated non-teacher actors with 403
  </behavior>
  <action>Implement controller skeletons and route maps for course and lesson resources. Wire `requireAuth` and the new role/ownership guards on create/update/delete endpoints so only authorized teacher owners can mutate resources. Mount routes in server composition and add integration tests with supertest + mocked model behavior to verify route reachability and guard behavior.</action>
  <verify>
    <automated>npm run test -- tests/domain/integration/course-lesson.routes.integration.test.ts</automated>
  </verify>
  <done>Course and lesson APIs are mounted and protected by route-level auth/authorization checks per DOMAIN-ROUTE-01 and DOMAIN-ROUTE-02.</done>
</task>

</tasks>

<verification>
- Domain route integration suite for course/lesson passes.
- Build remains green after new route/controller wiring.
</verification>

<success_criteria>
- /api/courses and /api/lessons route surfaces are mounted and reachable.
- Unauthorized or wrong-role mutations are denied at middleware level.
</success_criteria>

<output>
After completion, create `.planning/phases/03-domain-routes-wiring/03-domain-routes-wiring-01-SUMMARY.md`
</output>
