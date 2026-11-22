# Education Payments Ledger — 2026-11-22

## What shipped

- New admin page: `/admin/education/payments` (`apps/frontend/src/pages/admin/education-payments/`)
  - KPI bar: collected today / month / range, outstanding, overdue installments, pending wallet top-ups.
  - Tab 1 — Payments ledger: date/method/status/search filters, pagination, receipt print, reverse with reason.
  - Tab 2 — Outstanding dues: package balances, overdue installments, group renewals; one-click collect.
  - Tab 3 — Wallet top-ups: approve (credits wallet + treasury deposit) or reject with reason.
- New API base: `/api/v1/education/finance`
  - `GET /payments`, `GET /payments/summary`, `GET /dues`, `GET /payments/:id/receipt`
  - `POST /payments` (collect), `POST /payments/:id/reverse`
  - `GET /topups?status=PENDING_RELEASE|RELEASED|CANCELLED|ALL`
  - `POST /topups/:id/release`, `POST /topups/:id/reject`
- New Prisma model: `EducationPayment` → table `education_payments` (numbers `EDU-PAY-YYYYMM-0001`, receipts `RCP-YYYYMM-0001`).
- New permission: `education.financials.collect` (admins/team leaders/moderators) for collections; reversal + top-up decisions stay on `education.financials.manage`.

## Financial integrity rules enforced

- Every collection writes the ledger row and the treasury `DEPOSIT` inside one DB transaction.
- Reversal writes a treasury `EXPENSE` and restores enrollment/group balances; double reversal is blocked.
- Overpayment is rejected with the remaining balance.
- Editing `amountPaid` from the enrollment form is blocked; manual status changes must match the paid amount.
- Installments: already-paid installment is rejected (409); each collection writes a ledger row.
- Group members: paid cycle cannot be collected twice; monthly groups get `nextRenewalDate`; paid renewal shows as a full new cycle due.
- Parent wallet: top-ups stay `PENDING_RELEASE` until approved; approval credits the wallet and posts a treasury deposit. Rejection moves no money.
- Parent wallet purchase now posts treasury revenue with a correct `sourceType/sourceId` and writes a ledger row.
- Enrollment refunds paid from the wallet are credited back to the wallet; cash refunds only hit the treasury.

## Verification

- Backend: `node --test tests/controller/educationPayments.test.js tests/controller/educationPaymentIntegrity.test.js` → 34 tests pass.
- Frontend: `vitest run src/pages/admin/education-payments/__tests__` → 8 tests pass.
- Prisma: `prisma validate --schema=prisma/schema` valid.
- Frontend build: `vite build` succeeds.
- Browser (Playwright, mocked API): ledger, reverse, receipt print, dues collect, top-up approval, 390px mobile with zero horizontal scroll; only console noise is the offline socket connection.
