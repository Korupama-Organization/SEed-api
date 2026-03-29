# Livestream Operations Runbook

## Purpose

Command-first operations guide for livestream backend incident handling, reliability checks, and compliance evidence.

## Scope

Covers backend livestream contracts from phases 6-8:
- Lifecycle: create/start/end/cancel
- Teacher controls: pause/resume/force-end/remove participant
- Presence: join/rejoin/leave and removed-user blocking
- Event feed: ordered metadata events with filters

## Dependency Health Checks

1. Validate required env contract:
```bash
npm run build
```
Expected:
- Build succeeds.
- Missing env values fail startup validation paths with explicit errors.

2. Confirm Redis connectivity assumptions (lock policy path):
```bash
npm test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand
```
Expected:
- `fails join closed when redis lock dependency is unavailable` passes.
- Join path returns deterministic error contract during dependency failure.

3. Confirm LiveKit provider failure handling:
```bash
npm test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand
```
Expected:
- Provider failure tests pass for start and force-end.
- Session state is not mutated after provider failure.

## Incident Triage Flow

1. Run targeted livestream gate:
```bash
npm run test:livestream
```
2. If failures are isolated to reliability suite:
```bash
npm test -- tests/livestream/reliability/livestream.reliability.integration.test.ts --runInBand
```
3. If failures are isolated to controls:
```bash
npm test -- tests/livestream/realtime/livestream.controls.integration.test.ts --runInBand
```
4. If failures are isolated to presence/rejoin:
```bash
npm test -- tests/livestream/realtime/livestream.presence.integration.test.ts --runInBand
npm test -- tests/livestream/access/livestream.join.integration.test.ts --runInBand
```
5. Reconfirm compile integrity:
```bash
npm run build
```

## Rollback and Escalation Guidance

1. If provider failures produce unexpected state mutation:
- Roll back latest livestream controller changes.
- Re-run reliability suite before redeploy.

2. If Redis lock policy appears bypassed:
- Treat as security incident (single-device policy at risk).
- Block release until `test:livestream` is green.

3. Escalate when:
- Reliability suite fails in CI on main.
- Any livestream dependency failure path returns non-deterministic status/error shapes.

## Compliance Evidence Checklist

Run and capture command outputs:
```bash
npm run build
npm run test:livestream
npm run test:coverage
```
Evidence must show:
- Build success
- Livestream gate success
- Coverage gate success

## Attendance Event Troubleshooting Queries

Required event types:
- `join`
- `rejoin`
- `leave`
- `reject`
- `removed`
- `control`

Mongo shell examples:
```javascript
// Latest event mix for a livestream
 db.livestreamattendances.aggregate([
   { $match: { livestreamId: ObjectId("<livestreamId>") } },
   { $group: { _id: "$eventType", count: { $sum: 1 } } }
 ])

// Recent rejects and reasons
 db.livestreamattendances.find(
   { livestreamId: ObjectId("<livestreamId>"), eventType: "reject" },
   { userId: 1, reason: 1, createdAt: 1 }
 ).sort({ createdAt: -1 }).limit(50)

// Teacher removal actions
 db.livestreamattendances.find(
   { livestreamId: ObjectId("<livestreamId>"), eventType: "removed", reason: "removed-by-teacher" },
   { userId: 1, actorUserId: 1, createdAt: 1 }
 ).sort({ createdAt: -1 })
```

## CI Quality Gate Contract

CI ordering for livestream compliance:
1. `npm run build`
2. `npm run test:livestream`
3. `npm run test:coverage`

Any failure blocks merge.
