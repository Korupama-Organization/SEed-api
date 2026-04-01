---
phase: 04-domain-logic-validation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/controllers/enrollment.controller.ts
  - src/routes/enrollment.routes.ts
  - src/services/enrollment-progress.service.ts
  - tests/domain/integration/enrollment-progress.logic.integration.test.ts
autonomous: true
requirements: [DOMAIN-LOGIC-01]
must_haves:
  truths:
    - "Enrollment creation initializes lesson progress for course lessons"
    - "Enrollment rejects unpublished courses"
    - "Progress update enforces sequential lesson access and interaction tracking"
  artifacts:
    - path: "src/services/enrollment-progress.service.ts"
      provides: "Enrollment and progress domain rules"
    - path: "src/controllers/enrollment.controller.ts"
      provides: "Enrollment endpoints using domain logic"
    - path: "tests/domain/integration/enrollment-progress.logic.integration.test.ts"
      provides: "Enrollment/progress rule verification"
  key_links:
    - from: "src/controllers/enrollment.controller.ts"
      to: "src/services/enrollment-progress.service.ts"
      via: "createEnrollment and updateEnrollmentProgress calls"
      pattern: "createEnrollmentWithLessons|updateEnrollmentProgress"
    - from: "src/services/enrollment-progress.service.ts"
      to: "src/models/Course.ts"
      via: "published-course validation"
      pattern: "Course\\.findById"
    - from: "src/services/enrollment-progress.service.ts"
      to: "src/models/Lesson.ts"
      via: "lesson ordering and progress sync"
      pattern: "Lesson\\.find"
---

<objective>
Implement enrollment and progress business rules so enrollment state is initialized and progression is validated correctly.

Purpose: Fulfill DOMAIN-LOGIC-01 with deterministic domain behavior before credit/order financial logic.
Output: Enrollment progress service, controller wiring, and integration tests for enroll/progress constraints.
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
@.planning/phases/04-domain-logic-validation/04-DISCOVERY.md
@src/models/Enrollment.ts
@src/models/Lesson.ts
@src/models/Course.ts
@src/controllers/enrollment.controller.ts
@src/routes/enrollment.routes.ts

<interfaces>
From src/models/Enrollment.ts:
```typescript
export interface ILessonProgress {
  lessonId: Types.ObjectId;
  status: 'locked' | 'in-progress' | 'completed';
  lastPosition: number;
  completedInteractions: ICompletedInteraction[];
}
```

From src/routes/enrollment.routes.ts:
```typescript
router.post('/', requireAuth, createEnrollment);
router.patch('/:enrollmentId/progress', requireAuth, ..., updateEnrollmentProgress);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add enrollment-progress domain service with initialization and sequencing rules</name>
  <files>src/services/enrollment-progress.service.ts, tests/domain/integration/enrollment-progress.logic.integration.test.ts</files>
  <behavior>
    - Test 1: Enrolling in published course creates lessonProgress entries with first lesson unlocked
    - Test 2: Enrolling in unpublished course fails with 403/validation error
    - Test 3: Progress updates reject skipping locked lessons and update completed interactions for allowed lesson
  </behavior>
  <action>Create service functions for enrollment creation and progress updates that: validate course publication status, load course lessons in deterministic order, initialize lessonProgress array, and enforce sequential access (cannot complete lesson N+1 before lesson N). Add integration tests with mocked model calls to verify business rule outcomes and response codes.</action>
  <verify>
    <automated>npm run test -- tests/domain/integration/enrollment-progress.logic.integration.test.ts</automated>
  </verify>
  <done>Enrollment/progress domain rules are implemented and exercised by integration tests.</done>
</task>

<task type="auto">
  <name>Task 2: Wire enrollment service into controller and align route contracts</name>
  <files>src/controllers/enrollment.controller.ts, src/routes/enrollment.routes.ts</files>
  <action>Refactor enrollment controller to delegate domain logic to the new service, preserving route contracts while returning explicit 4xx for rule violations and 2xx for valid flows. Keep Swagger route responses aligned with possible 403/409 outcomes introduced by publication/sequencing checks.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Enrollment endpoints enforce business rules through service-based logic and compile cleanly.</done>
</task>

</tasks>

<verification>
- Enrollment logic integration test passes.
- Build passes with service/controller wiring.
</verification>

<success_criteria>
- Enrollment auto-initializes lesson progress consistently.
- Progress updates cannot skip lesson sequence.
</success_criteria>

<output>
After completion, create `.planning/phases/04-domain-logic-validation/04-domain-logic-validation-01-SUMMARY.md`
</output>
