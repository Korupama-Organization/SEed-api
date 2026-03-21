---
phase: 04-domain-logic-validation
plan: 02
type: execute
wave: 2
depends_on: [04-domain-logic-validation-01]
files_modified:
  - src/controllers/order.controller.ts
  - src/controllers/credit-transaction.controller.ts
  - src/routes/order.routes.ts
  - src/routes/credit-transaction.routes.ts
  - src/server.ts
  - tests/domain/integration/credit-domain.logic.integration.test.ts
  - .planning/phases/04-domain-logic-validation/04-VERIFICATION.md
autonomous: true
requirements: [DOMAIN-LOGIC-02, DOMAIN-LOGIC-03]
must_haves:
  truths:
    - "Order purchase flow creates debit credit-transactions and enforces sufficient balance"
    - "Credit balance endpoint returns aggregate balance from transaction history"
    - "Multi-step integration flow validates enroll -> progress -> order/credit behavior"
  artifacts:
    - path: "src/controllers/credit-transaction.controller.ts"
      provides: "Balance and transaction endpoints"
    - path: "src/routes/credit-transaction.routes.ts"
      provides: "Credit domain route contracts"
    - path: "src/controllers/order.controller.ts"
      provides: "Order flow integrated with CreditTransaction model"
    - path: "tests/domain/integration/credit-domain.logic.integration.test.ts"
      provides: "Multi-step domain integration validation"
  key_links:
    - from: "src/controllers/order.controller.ts"
      to: "src/models/CreditTransaction.ts"
      via: "createDebit and balance checks"
      pattern: "CreditTransaction\\.createDebit"
    - from: "src/controllers/credit-transaction.controller.ts"
      to: "src/models/CreditTransaction.ts"
      via: "balance aggregation"
      pattern: "CreditTransaction\\.getAvailableBalance"
    - from: "src/server.ts"
      to: "src/routes/credit-transaction.routes.ts"
      via: "route mount"
      pattern: "app.use\\('/api/credit-transactions'"
---

<objective>
Integrate credit transaction logic into order flows and validate domain behavior with multi-step integration tests.

Purpose: Fulfill DOMAIN-LOGIC-02 and DOMAIN-LOGIC-03 by making credit logic auditable and proving core scenarios end-to-end.
Output: Credit transaction routes/controllers, order-credit integration, and verification artifact.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/04-domain-logic-validation/04-domain-logic-validation-01-SUMMARY.md
@src/models/CreditTransaction.ts
@src/models/Order.ts
@src/controllers/order.controller.ts
@src/server.ts

<interfaces>
From src/models/CreditTransaction.ts:
```typescript
CreditTransaction.getAvailableBalance(userId)
CreditTransaction.createTopup({ userId, amount, ... })
CreditTransaction.createDebit({ userId, amount, orderId, ... })
```

From src/routes/order.routes.ts:
```typescript
router.post('/', requireAuth, createOrder);
router.patch('/:orderId/status', requireAuth, ..., updateOrderStatus);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add credit transaction API and integrate order purchase debit flow</name>
  <files>src/controllers/order.controller.ts, src/controllers/credit-transaction.controller.ts, src/routes/order.routes.ts, src/routes/credit-transaction.routes.ts, src/server.ts</files>
  <behavior>
    - Test 1: Creating order with insufficient balance returns 400 and no debit transaction
    - Test 2: Successful paid order creates debit transaction linked to order
    - Test 3: Credit balance endpoint returns aggregated available balance
  </behavior>
  <action>Update order controller purchase flow to use `CreditTransaction.createDebit` and reflect payment status transitions (`pending`/`paid`/`failed`) based on balance and debit result. Add credit transaction controller with endpoints for balance and history/topup actions needed for MVP flow, wire routes, and mount `/api/credit-transactions` in server.</action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Order-credit logic is wired and credit APIs are available with enforced balance behavior.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add multi-step integration tests and phase verification artifact</name>
  <files>tests/domain/integration/credit-domain.logic.integration.test.ts, .planning/phases/04-domain-logic-validation/04-VERIFICATION.md</files>
  <behavior>
    - Test 1: Enroll -> progress update -> order purchase success path passes with expected state transitions
    - Test 2: Purchase with insufficient credits fails deterministically
    - Test 3: Balance query reflects transaction side-effects after topup/debit
  </behavior>
  <action>Create integration tests that chain key domain operations in sequence (enrollment/progress/order/credit) using deterministic mocks and explicit assertions. Generate phase verification document mapping DOMAIN-LOGIC-01..03 to test/build evidence and executed commands.</action>
  <verify>
    <automated>npm run test -- tests/domain/integration/credit-domain.logic.integration.test.ts</automated>
  </verify>
  <done>Core multi-step domain flow is validated by automated tests and verification artifact is complete.</done>
</task>

</tasks>

<verification>
- Credit domain integration test passes.
- Build and route wiring are valid.
- Verification artifact maps all requirements to evidence.
</verification>

<success_criteria>
- Credit balance/debit logic is auditable and enforced.
- Multi-step domain scenario tests catch regressions.
</success_criteria>

<output>
After completion, create `.planning/phases/04-domain-logic-validation/04-domain-logic-validation-02-SUMMARY.md`
</output>
