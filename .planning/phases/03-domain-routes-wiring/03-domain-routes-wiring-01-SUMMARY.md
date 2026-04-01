# 03-domain-routes-wiring-01 Summary

## Objective
Implemented course and lesson route surfaces with role and ownership authorization constraints.

## Changes
- Added [domain authorization middleware](src/middlewares/domain-authorization.middleware.ts)
  - `requireRole(...roles)` for role-level guard.
  - `requireOwnership({ getOwnerId, allowRoles })` for resource ownership enforcement.
- Added [course controller](src/controllers/course.controller.ts) and [lesson controller](src/controllers/lesson.controller.ts)
  - List/detail/create/update/delete handlers with consistent JSON responses.
- Added [course routes](src/routes/course.routes.ts) and [lesson routes](src/routes/lesson.routes.ts)
  - Public GET endpoints.
  - Teacher-only mutation endpoints with ownership checks.
  - Swagger JSDoc contracts for mounted endpoints.
- Updated [server route mounts](src/server.ts)
  - Mounted `/api/courses` and `/api/lessons`.
- Added integration coverage [course-lesson routes test](tests/domain/integration/course-lesson.routes.integration.test.ts)
  - Reachability of GET endpoints.
  - 401 for unauthenticated mutation.
  - 403 for non-teacher mutation.
  - 201 success for teacher mutation flows.

## Verification
- `npm run test -- tests/domain/integration/course-lesson.routes.integration.test.ts` passed.

## Requirement Mapping
- DOMAIN-ROUTE-01: partial complete (course/lesson routes mounted and reachable).
- DOMAIN-ROUTE-02: partial complete (route-level auth/role/ownership constraints applied on course/lesson mutations).
