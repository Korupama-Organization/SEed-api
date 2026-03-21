# Phase 05 Operational Readiness Checklist

## Status
- [x] Build command passes (`npm run build`)
- [x] MVP smoke command passes (`npm run test:smoke`)
- [x] Coverage command passes (`npm run test:coverage`)
- [x] README runbook updated with practical command sequence
- [x] Error-response consistency smoke checks added

## Environment Validation
- [x] `.env` required fields documented and validated on startup
- [x] Test env defaults present in `tests/setup.ts`

## API & Contract Validation
- [x] Swagger docs reachable at `/api-docs`
- [x] Representative auth/domain route contracts covered by smoke suite
- [x] Error response shape `{ error: string }` verified on representative failures

## Release Preflight
Run in order:
1. `npm run build`
2. `npm run test:smoke`
3. `npm run test:coverage`

Expected: all commands pass with no blocking failures.
