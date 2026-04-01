# 04-domain-logic-validation-01 Summary

## Objective
Implemented enrollment domain logic for published-course enrollment, lessonProgress initialization, and sequential progress validation.

## Changes
- Added [enrollment progress service](src/services/enrollment-progress.service.ts)
  - `createEnrollmentWithLessons` validates course existence/publication and initializes lesson progress.
  - `updateEnrollmentLessonProgress` enforces lesson sequencing, interaction updates, and aggregate progress recalculation.
- Refactored [enrollment controller](src/controllers/enrollment.controller.ts)
  - Delegates creation and progress updates to service layer.
  - Maps domain errors to explicit 4xx status codes.
- Updated [enrollment routes](src/routes/enrollment.routes.ts)
  - Swagger contracts include `403` for unpublished course and `409` for sequencing violations.
- Added integration suite [enrollment progress logic test](tests/domain/integration/enrollment-progress.logic.integration.test.ts)
  - Validates initialization of first lesson status.
  - Validates unpublished course rejection.
  - Validates locked lesson skip rejection.

## Verification
- `npm run test -- tests/domain/integration/enrollment-progress.logic.integration.test.ts` passed.
- `npm run build` passed.

## Requirement Mapping
- DOMAIN-LOGIC-01: complete.
