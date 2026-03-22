---
phase: 06
slug: livestream-foundation-access-control
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 06 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest + ts-jest |
| **Config file** | jest.config.cjs |
| **Quick run command** | `npm run test -- tests/livestream --runInBand` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- tests/livestream --runInBand`
- **After every plan wave:** Run `npm run test:coverage`
- **Before /gsd-verify-work:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | LIVE-01 | integration | `npm run test -- tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts --runInBand` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | LIVE-02 | integration | `npm run test -- tests/livestream/lifecycle/livestream.lifecycle.integration.test.ts --runInBand` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | LIVE-03 | integration | `npm run test -- tests/livestream/access/livestream.join.integration.test.ts --runInBand` | ✅ | ⬜ pending |
| 06-02-02 | 02 | 2 | LIVE-03 | integration | `npm run test -- tests/livestream/access/livestream.join.integration.test.ts --runInBand` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ⌁ red · ⚠ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Owncast host/network reachability and admin credential validity | LIVE-01/LIVE-03 | External self-hosted service cannot be fully validated in isolated test runtime | Verify Owncast deployment is reachable from app runtime and admin credentials authorize provider operations |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
