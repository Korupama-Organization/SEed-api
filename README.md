# Studuy Backend API

Backend API for Studuy LMS MVP.

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Configure environment
- Copy `.env.example` to `.env`
- Fill required variables used by startup validation.

3. Run in development
```bash
npm run dev
```

4. Build
```bash
npm run build
```

## Docker Deployment

This deployment expects MongoDB to run outside Docker, such as MongoDB Atlas or an existing MongoDB server. Set `MONGODB_URI` in `.env` to that external connection string.

1. Configure production environment
```bash
cp .env.example .env
```

Fill every required startup value in `.env`, including `MONGODB_URI`, JWT secrets, SMTP values, LiveKit values, and `UIT_AUTH_SECRET`.

2. Build the image
```bash
docker build -t studuy-api .
```

3. Start with Docker Compose
```bash
docker compose up -d --build
```

4. Check container status and logs
```bash
docker compose ps
docker compose logs -f api
```

5. Verify the API
```bash
curl http://localhost:${HOST_PORT:-3000}/
curl http://localhost:${HOST_PORT:-3000}/api-docs.json
```

6. Stop the deployment
```bash
docker compose down
```

`docker-compose.yml` exposes `${HOST_PORT:-3000}` on the VPS and forwards it to `${PORT:-3000}` inside the container. The root endpoint `/` is used as the container healthcheck, and Swagger UI is available at `/api-docs`.

## Test Commands

- Full test runner
```bash
npm run test
```

- Security-focused suites
```bash
npm run test:security
```

- Coverage gate
```bash
npm run test:coverage
```

- MVP smoke suite
```bash
npm run test:smoke
```

- Livestream reliability gate
```bash
npm run test:livestream
```

## MVP Smoke Flow

Automated smoke suite: `tests/smoke/mvp.smoke.integration.test.ts`

Coverage includes representative API flow contracts for:
- Auth login contract
- Enrollment creation and progress update contract
- Order payment with credit and balance read contract
- Protected endpoint failure behavior (missing token)

## API Docs

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/api-docs.json`

## Livestream Operations Runbook

- Backend operations/compliance guide: `docs/livestream-operations-runbook.md`

## Operational Troubleshooting

1. Startup fails with missing env variables
- Run with a complete `.env` matching required keys in runtime config.
- Check error log output for missing keys from startup validation.

2. Test failures around auth/rate limits
- Ensure `tests/setup.ts` defaults are loaded by Jest.
- Re-run targeted suites before full run to isolate failures.

3. Build failures
- Run `npm run build` first to surface strict TypeScript errors.
- Fix type mismatches before retrying test/coverage commands.

## MVP Validation Sequence

For release preflight, run in order:
```bash
npm run build
npm run test:smoke
npm run test:coverage
```
