# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**Documentation Service:**
- Swagger/OpenAPI - API contract generation and interactive docs
  - SDK/Client: `swagger-jsdoc`, `swagger-ui-express`
  - Auth: Uses bearer scheme definition in OpenAPI components (`src/utils/swagger.ts`)

**Email Service (SMTP):**
- SMTP provider (provider not hardcoded) - OTP delivery for email verification and password reset
  - SDK/Client: `nodemailer`
  - Auth: `SMTP_USER`, `SMTP_PASS` (`src/constants.ts`, `src/utils/email.ts`)

## Data Storage

**Databases:**
- MongoDB
  - Connection: `MONGODB_URI` (`src/db/connect.ts`)
  - Client: `mongoose` (`src/db/connect.ts`, `src/models/*.ts`)

**File Storage:**
- Not detected in executable integration code
- Assumption: `src/models/Lesson.ts` comment references "Raw S3 link", but no AWS SDK/client usage is present

**Caching:**
- Redis for temporary OTP and cooldown keys
  - Connection: `REDIS_HOST`, `REDIS_PORT`, optional `REDIS_USERNAME`, `REDIS_PASSWORD`
  - Client: `redis` (`src/utils/redis.ts`, `src/constants.ts`)

## Authentication & Identity

**Auth Provider:**
- Custom local auth (email/password + JWT + OTP)
  - Implementation: `bcrypt` password hashing, `jsonwebtoken` access/refresh/reset tokens, auth middleware and auth controller flows (`src/controllers/auth.controller.ts`, `src/utils/jwt.ts`, `src/middlewares/auth.middleware.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/New Relic/etc. integration found)

**Logs:**
- Console logging (`console.log`/`console.error`) in server/bootstrap and connection utilities (`src/server.ts`, `src/db/connect.ts`, `src/utils/redis.ts`)

## CI/CD & Deployment

**Hosting:**
- Not specified in repository

**CI Pipeline:**
- None detected (no `.github` workflows, Azure/GitLab pipeline files found)

## Environment Configuration

**Required env vars:**
- `MONGODB_URI` (`src/db/connect.ts`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_RESET_PASSWORD_SECRET` (`src/constants.ts`)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (`src/constants.ts`)
- Also consumed: `PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `OTP_LENGTH`, `OTP_TTL_SECONDS`, `OTP_RESEND_COOLDOWN_SECONDS`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`, `APP_BASE_URL`, token expiry vars (`src/constants.ts`, `src/server.ts`)

**Secrets location:**
- Root `.env` file present (contents not inspected)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- SMTP outbound email sends via `transporter.sendMail(...)` (`src/utils/email.ts`)

## Current State

- Active external dependencies in code paths: MongoDB, Redis, SMTP, and Swagger docs endpoints.
- Auth feature integrates Redis and SMTP for OTP lifecycle in registration/forgot-password flows (`src/controllers/auth.controller.ts`).
- API routes currently exposed are auth-focused (`src/server.ts`, `src/routes/auth.routes.ts`).

## Key Components

- MongoDB connector: `src/db/connect.ts`
- Redis client wrapper and temp key ops: `src/utils/redis.ts`
- Email transport/templates: `src/utils/email.ts`
- JWT creation/verification: `src/utils/jwt.ts`
- Auth flow orchestration: `src/controllers/auth.controller.ts`
- API docs generator: `src/utils/swagger.ts`

## Notable Gaps/Risks

- Secret management risk: fallback secrets/credentials are embedded as defaults in config (`src/constants.ts`).
- Operational risk: no centralized monitoring/error-tracking integration detected.
- Delivery risk: no CI/CD integration files detected.
- Consistency risk: Swagger server URL is set to `http://localhost:3000`, while API default port is `5000` (`src/utils/swagger.ts`, `src/server.ts`).

## Quick Verification Notes

- Database integration: server startup calls `connectDB()` before listening (`src/server.ts`, `src/db/connect.ts`).
- Redis integration: OTP helper functions call Redis `set/get/del/exists` through shared client (`src/utils/redis.ts`, `src/controllers/auth.controller.ts`).
- Email integration: OTP dispatch uses Nodemailer `sendMail` (`src/utils/email.ts`, `src/controllers/auth.controller.ts`).
- Docs integration: open `GET /api-docs` and `GET /api-docs.json` after boot (`src/server.ts`).

---

*Integration audit: 2026-03-21*
