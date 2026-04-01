# 01-auth-security-hardening-01 Summary

## Objective
Hardened public registration role safety and startup env validation for production-safe auth configuration.

## Completed
- Added registration role policy middleware in src/middlewares/registration-role-policy.middleware.ts
  - Blocks `admin` self-registration
  - Allows `student` and `teacher`
  - Defaults missing role to `student`
- Wired role middleware before register handler in src/routes/auth.routes.ts
- Added centralized required-env validator in src/utils/env-validation.ts
- Updated startup flow in src/server.ts to call `validateRequiredEnv()` before DB connect/listen
- Removed insecure auth/config fallback literals from src/constants.ts

## Verification
- Command: `npm run build`
- Result: pass

## Requirement Mapping
- AUTH-SEC-01: satisfied (admin registration blocked, teacher allowed)
- AUTH-SEC-02: satisfied (required env vars enforced fail-fast at startup)

## Notes
- Validation throws generic runtime error for clients and logs missing var names for operators.
