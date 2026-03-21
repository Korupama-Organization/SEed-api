# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Layered Express API (entrypoint -> middleware/router -> controller -> utility/model -> infrastructure)

**Current State:**
- Single active HTTP surface: auth endpoints mounted at `/api/auth`.
- Single runtime entrypoint: `src/server.ts`.
- Data persistence through MongoDB models in `src/models/*.ts`; ephemeral OTP/cooldown state in Redis via `src/utils/redis.ts`.
- Evidence: `src/server.ts` mounts only `authRoutes`; `src/controllers/auth.controller.ts` calls `User` model + Redis/JWT/email utilities.

**Key Characteristics:**
- Route registration is centralized in `src/server.ts`.
- Business logic currently concentrates in controller layer (`src/controllers/auth.controller.ts`).
- Shared configuration is centralized in `src/constants.ts` and consumed by infra utilities.

## Layers

**Entry/Composition Layer:**
- Purpose: Bootstraps app process, middleware, docs, route registration, and DB connection.
- Location: `src/server.ts`
- Contains: Express app init, CORS/JSON middleware, Swagger mount, health route, `start()` bootstrap.
- Depends on: `src/db/connect.ts`, `src/routes/auth.routes.ts`, `src/utils/swagger.ts`.
- Used by: npm scripts (`package.json` -> `npm run dev`, `npm run start`).

**Transport Layer (Routing):**
- Purpose: HTTP endpoint mapping and OpenAPI annotations.
- Location: `src/routes/auth.routes.ts`
- Contains: `router.post(...)` mappings for register/login/refresh/OTP/reset flows + Swagger JSDoc.
- Depends on: `src/controllers/auth.controller.ts`.
- Used by: `src/server.ts`.

**Application Layer (Controllers):**
- Purpose: Request validation, business rules, response shaping.
- Location: `src/controllers/auth.controller.ts`
- Contains: register/login/refresh/forgot-password/reset handlers and OTP helper flow.
- Depends on: `src/models/User.ts`, `src/utils/jwt.ts`, `src/utils/redis.ts`, `src/utils/email.ts`, `src/utils/otp.ts`, `src/constants.ts`.
- Used by: `src/routes/auth.routes.ts`.

**Domain/Data Layer (Models):**
- Purpose: Data schema and persistence contracts.
- Location: `src/models/*.ts`
- Contains: `User`, `Course`, `Lesson`, `Enrollment`, `Order`, `CreditTransaction`, `AILog` schemas.
- Depends on: Mongoose.
- Used by: currently `User` is used by auth controller/middleware; other models define domain but are not wired by routes yet.

**Infrastructure Layer (Utilities + DB):**
- Purpose: external system integration and cross-cutting technical concerns.
- Location: `src/db/connect.ts`, `src/utils/*.ts`, `src/constants.ts`
- Contains: Mongo bootstrap, Redis client lifecycle, JWT sign/verify, SMTP email transport, OTP generation, Swagger spec generation, env normalization.
- Depends on: `mongoose`, `redis`, `jsonwebtoken`, `nodemailer`, `swagger-jsdoc`.
- Used by: controllers, middleware, and server bootstrap.

## Data Flow

**Auth Request Flow (register/login/OTP):**

1. HTTP request enters Express app in `src/server.ts`, after CORS + JSON middleware.
2. Route in `src/routes/auth.routes.ts` dispatches to the matching controller function.
3. Controller in `src/controllers/auth.controller.ts` validates input, executes business logic, and calls:
   - Mongo model (`src/models/User.ts`) for durable user state.
   - Redis utility (`src/utils/redis.ts`) for OTP/cooldown keys.
   - JWT utility (`src/utils/jwt.ts`) for token issue/verification.
   - Email utility (`src/utils/email.ts`) for OTP delivery.
4. Controller returns JSON response with status code.

**Bootstrap Flow:**

1. `src/server.ts` imports `dotenv/config` and initializes app.
2. `start()` calls `connectDB()` from `src/db/connect.ts`.
3. On successful DB connection, app starts listening on `PORT`.

**State Management:**
- Persistent state: MongoDB via Mongoose models.
- Ephemeral/auth flow state: Redis (OTP values + cooldown flags).
- Stateless session token model: JWT access/refresh/reset tokens.

## Key Abstractions

**Environment Configuration (`APP_CONFIG`):**
- Purpose: Single typed source for runtime config and defaults.
- Examples: `src/constants.ts`.
- Pattern: eager read/normalize from `process.env` with helper coercion + `required(...)` guards.

**Authentication Token Utilities:**
- Purpose: Encapsulate token generation/verification and token type semantics.
- Examples: `src/utils/jwt.ts`.
- Pattern: wrapper helpers around `jsonwebtoken` with typed token payloads.

**Redis Temp Store API:**
- Purpose: abstract ephemeral key/value operations (`set/get/delete/exists`) with lazy client connect.
- Examples: `src/utils/redis.ts`.
- Pattern: module-level singleton client + async helper functions.

## Entry Points

**HTTP Server Entry Point:**
- Location: `src/server.ts`
- Triggers: `npm run dev` (`ts-node src/server.ts`) and `npm run start` (`node dist/server.js`) in `package.json`.
- Responsibilities: app composition, middleware wiring, docs exposure, route mount, startup.

**Database Connection Entry Point:**
- Location: `src/db/connect.ts`
- Triggers: called from `start()` in `src/server.ts`.
- Responsibilities: connect Mongoose and register shutdown cleanup (`SIGINT`).

## Error Handling

**Strategy:** Local try/catch per controller/middleware with direct HTTP responses.

**Patterns:**
- Validation and state checks produce explicit 4xx responses in `src/controllers/auth.controller.ts`.
- Infra/unknown failures fall back to 500 JSON error responses.
- Cooldown path carries custom status through thrown error object (`statusCode`) in OTP helper.

## Cross-Cutting Concerns

**Logging:**
- Console logging only (`console.log`/`console.error`) in bootstrap and Redis error events.

**Validation:**
- Manual validation in controller functions; no shared schema validator layer detected.

**Authentication:**
- JWT verification in `src/middlewares/auth.middleware.ts`.
- Token invalidation based on `passwordUpdatedAt` timestamp in both middleware and refresh flow.

## Module Boundaries/Flow

- Boundary 1: Transport vs business logic
  - `src/routes/auth.routes.ts` should remain thin (mapping + docs); business logic lives in `src/controllers/auth.controller.ts`.
- Boundary 2: Business logic vs infrastructure
  - Controller accesses infrastructure through utility modules (`src/utils/*.ts`) instead of raw SDK calls.
- Boundary 3: Domain schema vs application logic
  - Schema and indexes remain in `src/models/*.ts`; request logic stays outside models (except static methods in `CreditTransaction`).

## Coupling/Hotspots

- Hotspot: `src/controllers/auth.controller.ts` (418 lines) combines validation, orchestration, error mapping, and response shaping.
- Hotspot: `src/routes/auth.routes.ts` (333 lines) carries endpoint definitions and heavy inline Swagger annotations.
- Coupling: auth controller imports many concerns at once (`User`, Redis, JWT, email, OTP, constants), creating a high fan-in orchestration node.
- Structural drift: both root-level directories (`controllers`, `routes`, `models`, etc.) and `src/*` directories exist; TypeScript compile scope (`tsconfig.json`) includes only `src/**/*`.

## Quick Verification Notes

- Verified entrypoint and route mount in `src/server.ts`.
- Verified active endpoint set in `src/routes/auth.routes.ts`.
- Verified dependency direction via imports in `src/controllers/auth.controller.ts`, `src/middlewares/auth.middleware.ts`, and `src/utils/*.ts`.
- Verified compile boundaries in `tsconfig.json` (`rootDir: ./src`, `outDir: ./dist`, include `src/**/*`).
- Verified complexity hotspots by line count (`auth.controller.ts`, `auth.routes.ts`).

---

*Architecture analysis: 2026-03-21*
