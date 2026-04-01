# Phase 1 Research - Auth Security Hardening

## Scope
- Redis-backed per-email rate limiting for auth routes in Express + TypeScript
- Middleware-based registration role policy (block admin)
- Startup fail-fast config validation without weak fallbacks

## Candidate Approach
- Use `express-rate-limit` with `rate-limit-redis` store
- Use custom `keyGenerator` for per-email on relevant routes, fallback to IP when email absent
- Keep thresholds centralized in constants/config
- Keep response body consistent: `{ error: "Too many requests" }`

## Why this stack
- Battle-tested middleware for Express
- Works cleanly with TypeScript
- Redis store enables shared counters across instances
- Minimal code and low maintenance versus custom limiter

## Risks / Notes
- Per-email keying requires robust extraction for JSON/form payloads
- Some endpoints may not include email; fallback strategy required
- Route ordering matters (limiter before controller)

## Decision
Use `express-rate-limit` + `rate-limit-redis` for Phase 1.
