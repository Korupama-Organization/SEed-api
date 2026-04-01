# Coding Conventions

**Analysis Date:** 2026-03-21

## Observed Standards

- Language and typing standard: TypeScript with `strict: true` is enabled in `tsconfig.json`.
- Runtime module style: CommonJS (`"module": "commonjs"`) and Node-focused output to `dist` in `tsconfig.json`.
- API style: Express route-controller pattern is used (`src/routes/auth.routes.ts`, `src/controllers/auth.controller.ts`, `src/server.ts`).
- Data modeling: Mongoose schemas and model statics are used for domain behavior (`src/models/User.ts`, `src/models/CreditTransaction.ts`).
- API documentation standard: OpenAPI via Swagger JSDoc annotations in routes (`src/routes/auth.routes.ts`) with schema assembly in `src/utils/swagger.ts`.
- Naming patterns:
  - Files: mostly `kebab.case` for service/util layers (`src/controllers/auth.controller.ts`, `src/middlewares/auth.middleware.ts`) and PascalCase for model files (`src/models/User.ts`).
  - Functions: `camelCase` (`registerUser`, `refreshAccessToken`, `ensureConnected`).
  - Constants: `UPPER_SNAKE_CASE` exports for grouped config (`APP_CONFIG`, `REDIS_KEYS` in `src/constants.ts`).
- Import pattern: external dependencies are placed before local imports in sampled files (`src/server.ts`, `src/controllers/auth.controller.ts`, `src/utils/jwt.ts`).
- Error response shape: handlers generally return JSON with `{ error: string }` for failures (`src/controllers/auth.controller.ts`, `src/middlewares/auth.middleware.ts`).

## Quality Controls

- Static type checking: `npm run build` compiles with `tsc` (`package.json` scripts and `tsconfig.json`).
- Strict compiler options active:
  - `strict: true`
  - `forceConsistentCasingInFileNames: true`
  - `esModuleInterop: true`
  - `declaration` and `sourceMap` generation
- Process-level controls detected in runtime code:
  - Mongo startup fails fast via `process.exit(1)` on connection error (`src/db/connect.ts`).
  - Graceful shutdown path disconnects Redis and Mongo on `SIGINT` (`src/db/connect.ts`).
- Not detected:
  - ESLint configuration (`.eslintrc*`, `eslint.config.*`)
  - Prettier configuration (`.prettierrc*`)
  - Commit hooks/lint-staged/Husky config

## Code Style and Design Patterns

- Controller pattern: each route delegates to exported async handler functions (`src/routes/auth.routes.ts`, `src/controllers/auth.controller.ts`).
- Guard-clause validation style: handlers validate required inputs early and return `400`/`401`/`403`/`404` quickly (`src/controllers/auth.controller.ts`, `src/middlewares/auth.middleware.ts`).
- Token lifecycle checks are centralized in utility/auth middleware paths (`src/utils/jwt.ts`, `src/middlewares/auth.middleware.ts`).
- Reuse/DRY examples:
  - Password reset OTP resend delegates to existing handler (`resendForgotPasswordOtp` delegates to `requestForgotPassword` in `src/controllers/auth.controller.ts`).
  - Shared Redis helper functions in `src/utils/redis.ts`.

## Comments and Documentation

- Swagger docs are comprehensive for auth endpoints in route JSDoc blocks (`src/routes/auth.routes.ts`).
- Inline comments are used to explain security-sensitive behavior (for example, user-enumeration mitigation and token invalidation checks in `src/controllers/auth.controller.ts`).
- Mixed language comments/messages (Vietnamese + English) are present across server and auth modules (`src/server.ts`, `src/controllers/auth.controller.ts`).

## Quality Risks

- `any` usage weakens strict typing guarantees:
  - `sanitizeUser` casts with `as any` (`src/controllers/auth.controller.ts`).
  - Error handlers often use `(error: any)` (`src/controllers/auth.controller.ts`, `src/middlewares/auth.middleware.ts`).
- Formatting consistency risk:
  - Mixed indentation style (tabs in `src/constants.ts`, spaces in many other files).
- Incomplete route wiring is explicitly marked:
  - TODO comment for pending route registrations in `src/server.ts`.
- Security baseline risk in defaults:
  - `APP_CONFIG` provides fallback secrets/credentials (`src/constants.ts`) which is convenient for local dev but unsafe if reused in production-like environments.

## Quick Verification Notes

```bash
npm run build
```

- Expected result: TypeScript compilation to `dist` without lint/test execution (no lint/test scripts defined in `package.json`).
- Manual spot-check files for conventions:
  - `src/controllers/auth.controller.ts`
  - `src/routes/auth.routes.ts`
  - `src/middlewares/auth.middleware.ts`
  - `src/models/CreditTransaction.ts`
  - `src/constants.ts`

---

*Convention analysis: 2026-03-21*
