# Phase 05 UAT - MVP Stability & Polish

## Scope
Manual validation companion for automated smoke coverage in `tests/smoke/mvp.smoke.integration.test.ts`.

## Preconditions
- Dependencies installed: `npm install`
- Build succeeds: `npm run build`
- Server running: `npm run dev`

## UAT Steps
1. Auth login contract
- Request: `POST /api/auth/login`
- Payload:
```json
{
  "email": "student@example.com",
  "password": "secret123"
}
```
- Expected: `200`, response contains `access_token` and `refresh_token`.

2. Enrollment creation contract
- Request: `POST /api/enrollments`
- Headers: `Authorization: Bearer <access_token>`
- Payload:
```json
{
  "courseId": "<published_course_id>"
}
```
- Expected: `201`, response has `data.lessonProgress` initialized.

3. Enrollment progress contract
- Request: `PATCH /api/enrollments/{enrollmentId}/progress`
- Headers: `Authorization: Bearer <access_token>`
- Payload:
```json
{
  "lessonId": "<lesson_id>",
  "markCompleted": true,
  "lastPosition": 90
}
```
- Expected: `200`, response has updated progress and non-decreasing progress state.

4. Order creation using credits
- Request: `POST /api/orders`
- Headers: `Authorization: Bearer <access_token>`
- Payload:
```json
{
  "items": [{ "courseId": "<course_id>", "price": 200 }],
  "totalAmount": 200
}
```
- Expected: `201`, response `data.status` is `paid` when balance is sufficient.

5. Credit balance contract
- Request: `GET /api/credit-transactions/balance`
- Headers: `Authorization: Bearer <access_token>`
- Expected: `200`, response shape `{ data: { balance: number } }`.

## Failure Checks
1. Missing auth on protected endpoint
- Request: `POST /api/enrollments` without token
- Expected: `401`, response shape includes `{ "error": "..." }`.

2. Insufficient credit order
- Request: `POST /api/orders` with total amount above available balance
- Expected: `400`, response includes `{ "error": "Insufficient credit balance." }`.

## Automated Companion
- `npm run test -- tests/smoke/mvp.smoke.integration.test.ts`
- `npm run test:smoke`
