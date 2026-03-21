# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- TypeScript 5.x - backend source under `src/**/*.ts` (`tsconfig.json`, `package.json`)

**Secondary:**
- JavaScript (Node runtime output) - compiled output target `dist/` (`package.json` main=`dist/server.js`)

## Runtime

**Environment:**
- Node.js runtime (version not pinned in repo; no `.nvmrc`/`.node-version` detected)

**Package Manager:**
- npm (lockfile present: `package-lock.json`)
- Lockfile: present

## Frameworks

**Core:**
- Express `^4.21.1` - HTTP API server (`src/server.ts`)
- Mongoose `^8.7.1` - MongoDB ODM (`src/db/connect.ts`, `src/models/*.ts`)

**Testing:**
- Not detected (no Jest/Vitest config, no `*.test.*` files found)

**Build/Dev:**
- TypeScript `^5.7.3` - compile TS to JS (`tsconfig.json`, `npm run build`)
- ts-node `^10.9.2` - run TS in dev (`npm run dev`)
- nodemon `^3.1.7` - auto-restart dev server (`npm run dev`)

## Key Dependencies

**Critical:**
- `express` `^4.21.1` - web server and routing (`src/server.ts`, `src/routes/auth.routes.ts`)
- `mongoose` `^8.7.1` - persistence layer (`src/db/connect.ts`, `src/models/*.ts`)
- `jsonwebtoken` `^9.0.3` - token generation/verification (`src/utils/jwt.ts`, `src/middlewares/auth.middleware.ts`)
- `bcrypt` `^6.0.0` - password hashing (`src/controllers/auth.controller.ts`)

**Infrastructure:**
- `redis` `^5.11.0` - OTP/cooldown temporary storage (`src/utils/redis.ts`, `src/controllers/auth.controller.ts`)
- `nodemailer` `^8.0.2` - transactional OTP email (`src/utils/email.ts`)
- `swagger-jsdoc` `^6.2.8` + `swagger-ui-express` `^5.0.1` - API documentation (`src/utils/swagger.ts`, `src/server.ts`)
- `dotenv` `^16.4.5` - environment loading (`src/server.ts`)
- `cors` `^2.8.5` - CORS middleware (`src/server.ts`)

## Configuration

**Environment:**
- Env variables are consumed via `process.env` and centralized in `APP_CONFIG` (`src/constants.ts`)
- `.env` and `.env.example` files are present at repository root (contents not inspected)

**Build:**
- TS compile config in `tsconfig.json`
- Scripts in `package.json`: `build`, `dev`, `start`

## Platform Requirements

**Development:**
- Node.js + npm
- MongoDB reachable via `MONGODB_URI` (`src/db/connect.ts`)
- Redis reachable via `REDIS_HOST`/`REDIS_PORT` (`src/constants.ts`, `src/utils/redis.ts`)
- SMTP credentials for email transport (`src/constants.ts`, `src/utils/email.ts`)

**Production:**
- Node process serving Express app (`npm start` -> `node dist/server.js`)
- No deployment platform or container config detected (`Dockerfile`/`.github` not found)

## Current State

- Backend API currently mounts only auth routes at `/api/auth` (`src/server.ts`).
- Build pipeline is local npm script based (`package.json`) with TS compile output in `dist/` (`tsconfig.json`).
- OpenAPI docs are available at `/api-docs` and `/api-docs.json` (`src/server.ts`, `src/utils/swagger.ts`).

## Key Components

- Server bootstrap: `src/server.ts`
- App configuration constants: `src/constants.ts`
- Database connection: `src/db/connect.ts`
- Cache/temporary store client: `src/utils/redis.ts`
- Email transport/templates: `src/utils/email.ts`
- Token utility: `src/utils/jwt.ts`

## Notable Gaps/Risks

- Security risk: default fallbacks for secret-like config values are hardcoded (`src/constants.ts` uses fallback strings for JWT/SMTP fields).
- Delivery risk: no CI/CD config detected (`.github` and common pipeline files not present).
- Quality risk: no automated test framework/config detected (no Jest/Vitest config and no test files found).
- Scope gap: non-auth route registrations are commented out in server bootstrap (`src/server.ts`).

## Quick Verification Notes

- `npm run build` should compile TypeScript to `dist/` (defined in `package.json`).
- `npm run dev` should boot API with ts-node/nodemon (`package.json`, `src/server.ts`).
- `GET /` should return `{ status: 'ok', message: 'STUDUY BACKEND API' }` (`src/server.ts`).
- `GET /api-docs` and `GET /api-docs.json` should expose Swagger UI/spec (`src/server.ts`, `src/utils/swagger.ts`).

---

*Stack analysis: 2026-03-21*
