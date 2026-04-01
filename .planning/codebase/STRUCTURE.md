# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```text
[project-root]/
├── src/                    # Active TypeScript source root (compiled by tsconfig)
│   ├── controllers/        # Request handlers and business rules
│   ├── db/                 # Database bootstrap and lifecycle handling
│   ├── middlewares/        # Express middleware (auth)
│   ├── models/             # Mongoose schemas/models
│   ├── routes/             # Route definitions + Swagger JSDoc
│   ├── utils/              # Infra and helper modules (jwt, redis, email, otp, swagger)
│   ├── constants.ts        # Environment/config normalization
│   └── server.ts           # App composition and runtime bootstrap
├── dist/                   # TypeScript build output (runtime JS + maps + declarations)
├── .planning/codebase/     # Codebase mapping artifacts
├── package.json            # Scripts/dependencies
├── tsconfig.json           # Compiler boundaries
├── README.md               # Setup notes
├── .env                    # Environment file present (not inspected)
└── .env.example            # Environment template file present (not inspected)
```

## Current State

- Active code path is under `src/`; `tsconfig.json` includes only `src/**/*`.
- Runtime starts from `dist/server.js` after build, or `src/server.ts` during development (`package.json` scripts).
- Only auth routes are mounted in `src/server.ts`; placeholders exist for future course/lesson/order route mounts.
- Root-level folders (`controllers`, `routes`, `models`, `middlewares`, `db`, `utils`) exist but contain no active source files.

## Directory Purposes

**src/controllers:**
- Purpose: Business orchestration and HTTP response handling.
- Contains: `auth.controller.ts`.
- Key files: `src/controllers/auth.controller.ts`.

**src/routes:**
- Purpose: Route registration and endpoint documentation.
- Contains: `auth.routes.ts`.
- Key files: `src/routes/auth.routes.ts`.

**src/models:**
- Purpose: Persistence schemas and model contracts.
- Contains: `User`, `Course`, `Lesson`, `Enrollment`, `Order`, `CreditTransaction`, `AILog`, and barrel `index.ts`.
- Key files: `src/models/User.ts`, `src/models/CreditTransaction.ts`, `src/models/index.ts`.

**src/utils:**
- Purpose: Cross-cutting technical helpers and integrations.
- Contains: `jwt.ts`, `redis.ts`, `email.ts`, `otp.ts`, `swagger.ts`.
- Key files: `src/utils/jwt.ts`, `src/utils/redis.ts`, `src/utils/email.ts`, `src/utils/swagger.ts`.

**src/db:**
- Purpose: Database connection bootstrap and shutdown handling.
- Contains: `connect.ts`.
- Key files: `src/db/connect.ts`.

**src/middlewares:**
- Purpose: Request pre-processing and authorization gate.
- Contains: `auth.middleware.ts`.
- Key files: `src/middlewares/auth.middleware.ts`.

## Key File Locations

**Entry Points:**
- `src/server.ts`: Express app assembly, middleware/route registration, startup.
- `dist/server.js`: Production runtime target declared in `package.json`.

**Configuration:**
- `tsconfig.json`: compile scope and output mapping.
- `package.json`: run/build commands and dependency graph.
- `src/constants.ts`: normalized runtime settings from environment.

**Core Logic:**
- `src/controllers/auth.controller.ts`: auth and OTP/password-reset workflows.
- `src/models/*.ts`: data model definitions and indexes.

**Testing:**
- Not detected (`*.test.*`/`*.spec.*` files and test runner config not present).

## Naming Conventions

**Files:**
- Lowercase domain + suffix: `auth.controller.ts`, `auth.routes.ts`, `auth.middleware.ts`.
- PascalCase for model files: `User.ts`, `Course.ts`, `CreditTransaction.ts`.
- Utility modules in lowercase: `jwt.ts`, `redis.ts`, `email.ts`.

**Directories:**
- Lowercase plural domain directories under `src` (e.g., `controllers`, `models`, `routes`).

## Module Boundaries/Flow

- Inbound HTTP boundary: `src/server.ts` -> `src/routes/auth.routes.ts` -> `src/controllers/auth.controller.ts`.
- Persistence boundary: controller/middleware access Mongo through model modules (`src/models/User.ts`).
- External service boundary: utilities isolate Redis/JWT/SMTP/Swagger concerns (`src/utils/*.ts`).
- Composition boundary: only `src/server.ts` wires route mounts and startup sequence.

## Coupling/Hotspots

- High coupling node: `src/controllers/auth.controller.ts` imports model + constants + 4 utility modules.
- Size hotspot: `src/controllers/auth.controller.ts` (~418 LOC).
- Documentation hotspot: `src/routes/auth.routes.ts` (~333 LOC) due to dense Swagger annotations.
- Ambiguity hotspot: duplicate empty top-level folders mirror `src/*`, which can confuse placement unless `src/*` is consistently used.

## Where to Add New Code

**New Feature:**
- Primary code: `src/controllers` (handler), `src/routes` (endpoint map), `src/models` (schema if needed), `src/utils` (shared infra helper).
- Tests: No established test directory; establish `src/**/*.test.ts` or `tests/` before adding broad coverage.

**New Component/Module:**
- Implementation: keep runtime modules under `src/` only (not root-level mirrored folders).

**Utilities:**
- Shared helpers: `src/utils/`.
- Runtime constants/env mapping: `src/constants.ts` (or split by domain when file grows).

## Special Directories

**dist:**
- Purpose: built artifacts from TypeScript compiler.
- Generated: Yes.
- Committed: Present in repository.

**.planning/codebase:**
- Purpose: architecture/structure mapping outputs for GSD workflow.
- Generated: Yes (by mapper agents).
- Committed: Intended for planning context.

## Quick Verification Notes

- Confirmed compile root/output in `tsconfig.json` (`rootDir` = `./src`, `outDir` = `./dist`).
- Confirmed route mount scope in `src/server.ts` (`/api/auth` only active).
- Confirmed file inventory under `src` includes one controller, one route module, one middleware, one db connector, multiple models/utils.
- Confirmed no active source files in root-level mirrored folders (`controllers`, `routes`, `models`, `middlewares`, `db`, `utils`).

---

*Structure analysis: 2026-03-21*
