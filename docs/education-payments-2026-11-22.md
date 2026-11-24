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

- Backend: `node --test tests/controller/educationPayments.test.js tests/controller/educationPaymentIntegrity.test.js tests/controller/educationParentPortalPayments.test.js tests/services/educationPaymentsBackfill.test.js tests/cron/educationPaymentReminders.test.js` → 56 tests pass.
- Frontend: `vitest run src/pages/admin/education-payments/__tests__ src/pages/admin/education-reports/__tests__` → 12 tests pass.
- Prisma: `prisma validate --schema=prisma/schema` valid.
- Frontend build: `vite build` succeeds.
- Browser (Playwright, mocked API): ledger, reverse, receipt print, dues collect, top-up approval, CSV download, finance report tab, dashboard finance strip, 390px mobile with zero horizontal scroll; only console noise is the offline socket connection.

## Phase 2 additions

- Legacy paths are now atomic: enrollment creation, installment collection and group-member add write the record, ledger row and treasury deposit in one transaction (`recordEducationRevenueInTx`).
- Backfill: `node scripts/backfill_education_payments.js` (dry-run) / `--apply` creates ledger rows for historical balances without moving treasury money. `services/educationPaymentsBackfill.js` is pure-planner tested.
- Notifications: wallet top-up approval/rejection notifies the parent; a daily 11:00 cron sends installment and group-renewal reminders with 3-day dedupe and schedule opt-out.
- Parent portal: `GET /parent-portal/payments` + `/payments/:id/receipt` with family-scoped access; wallet page shows payment history and printable receipts.
- Reporting: `GET /finance/reports?months=N` and a "Collections & Revenue" tab in education reports (monthly bars, method/source breakdown, top dues).
- Dashboard: education dashboard shows collected-this-month, outstanding, overdue installments and pending top-ups.
- CSV export: `GET /finance/payments/export` honors the ledger filters and downloads an Excel-friendly UTF-8 CSV.
- Refunds: wallet-paid enrollments are credited back to the wallet; cash refunds only hit the treasury.

## Phase 3 additions

- Ledger rows now store `branchId` and `packageId`; the ledger filters by branch and package, and CSV includes both.
- Partial reversals: reverse any amount up to the remaining; status becomes `PARTIALLY_REVERSED` and only flips to `REVERSED` when fully reversed. Reversal references are idempotent per amount.
- Teacher payroll cancellation: `PUT /education/payments/:id/cancel` cancels a pending payroll, or reverses a paid one (treasury deposit + linked expense cancelled) in one transaction.
- Receipt delivery: `POST /education/finance/payments/:id/send-receipt` sends the receipt to the parent WhatsApp; ledger rows have a send button.
- Backfill also carries branch/package metadata from enrollments and groups.

## Phase 4 (part 1) — online wallet top-up via Kashier

- New parent endpoints:
  - `POST /education/parent-portal/wallet/kashier-session` → creates a pending top-up (`EDUTOP-<companyId>-<ts>`) and a Kashier payment session (card/wallet), returns the redirect URL.
  - `POST /education/parent-portal/wallet/kashier-verify` → server-side verification with `getSessionStatus`; credits the customer wallet, writes `wallet_transactions` + treasury `DEPOSIT` in one transaction, and is idempotent.
- Webhook: `POST /api/v1/payment/kashier/webhook` now routes `EDUCATION_TOPUP` payloads to the same service. The handler **always re-verifies with Kashier**; a forged payload cannot credit a wallet.
- Parent wallet UI: "ادفع أونلاين الآن" starts the checkout; returning with `?topupOrder=...` verifies and shows the credited amount.
- Config: platform-level Kashier credentials from Super Admin → Payment Settings (`systemSettings: kashier_gateway_settings`) or per-company credentials in storefront settings; no new contract needed per center.
- Accounting fix: buying a package from the wallet no longer posts a second treasury deposit (the cash entered when the wallet was funded). This removes double-counted revenue.
- Limits: 10–50,000 EGP per online top-up; partial captures below the requested amount are rejected.

## Phase 4 (part 2) — education cashier shifts

- New table `education_cashier_shifts` (per cashier: opening balance, closed time, collected/reversed cash, expected, actual, difference, status).
- Endpoints:
  - `GET /education/finance/shifts/current` → open shift + live expected.
  - `GET /education/finance/shifts` (+ `/:id`) → history/details with cash payments.
  - `POST /education/finance/shifts/open` → one open shift per cashier.
  - `POST /education/finance/shifts/:id/close` → stores expected, actual counted cash and the difference.
- Expected cash = opening balance + cash payments in the shift window − reversal amounts whose `reversedAt` falls in the window.
- UI: new "شيفت الكاشير" tab in the payments page (open, live drawer totals, close with counted cash and difference, history).
- Closing with a difference writes a MEDIUM audit event with the exact expected/actual/difference.

## Phase 4 (part 3) — archived PDF receipts

- `EducationPayment` now stores `receiptPdfPath` and `receiptPdfGeneratedAt`.
- `GET /education/finance/payments/:id/pdf` (admin) and `GET /education/parent-portal/payments/:id/pdf` (parent-scoped) stream the archived PDF; generated on first request, cached afterwards, `?regenerate=1` forces a rebuild.
- Files live under `uploads/education-receipts/<companyId>/<paymentNumber>.pdf` (`EDUCATION_RECEIPTS_DIR` overrides the root).
- Rendering uses PDFKit + `NotoSansArabic-Regular.ttf` and `shapeArabic` (no headless browser required); includes company header, receipt number/date, student/package, amount, reversed amount, method, status, cashier, notes and signature/stamp lines.
- UI: PDF button on every ledger row (desktop + mobile) and "تحميل PDF" in the parent receipt modal.
- CLI: `node scripts/backfill_education_receipt_pdfs.js` (dry-run) / `--apply` / `--force` / `--company` / `--limit`.

## Phase 4 (part 4) — online installment payments

- New table `education_payment_intents` tracks gateway orders until server-side verification.
- `POST /education/parent-portal/enrollments/:id/installments/:number/kashier-session` → validates ownership + unpaid installment, creates an intent (`EDUINST-<companyId>-<enrollmentId>-<n>-<ts>`) and a Kashier session.
- `POST /education/parent-portal/enrollments/installments/kashier-verify` → verifies via `getSessionStatus`, then in one transaction: marks the installment paid, recomputes `amountPaid`/`paymentStatus`, writes an `education_payments` row (`method=CARD`, `source=ONLINE`) and posts treasury revenue (`EDUCATION_INSTALLMENT_ONLINE`).
- Idempotent by intent status + gateway reference; partial captures below the installment amount are rejected.
- Kashier webhook routes `EDUCATION_INSTALLMENT` payloads through the same verification (a forged payload cannot settle an installment).
- Parent UI: installment schedule with "ادفع الآن" per unpaid installment; return from checkout verifies, shows the result and refreshes.

## Phase 4 (part 5) — daily closing / Z-report

- New table `education_daily_closings` (one row per company/day).
- `GET /education/finance/daily-closing?date=YYYY-MM-DD`:
  - Payments: gross, net after reversals, by method, by source.
  - Wallet top-ups released that day + wallet-funded purchases (informational).
  - Treasury: education deposits, expenses (reversals/refunds/payroll), net.
  - Cashier: per-shift expected/actual/difference + open shifts count.
  - Warnings for open shifts and drawer differences.
- `POST /education/finance/daily-closing/close` snapshots the report, stores totals and locks the day; `POST /daily-closing/:id/reopen` unlocks it with an audited reason.
- Closed days return the stored snapshot (the Z-report does not change after closing).
- The day is enforced: recording a payment, reversing one, collecting an installment, settling an online installment, approving a wallet top-up, creating a paid enrollment or adding a paid group member to a closed day returns 409 with "أعد فتحه".
- UI: new "الإغلاق اليومي" tab with KPI strip, method/source/treasury breakdowns, cashier shifts, warnings, close/reopen actions and closing history.

## Phase 4 (part 6) — student schedule conflicts & waitlist notification

- Student-level guards (not only teacher/room):
  - Adding/transferring a student to a group checks other active groups and upcoming private sessions; returns `409 STUDENT_SCHEDULE_CONFLICT` with details unless `allowConflicts=true`.
  - Editing a group's schedule checks every active member against their other groups.
  - Creating a private session checks the student's other private sessions and active group schedules.
- UI shows the conflicting group/slot and offers an explicit "enroll/save anyway" confirmation which retries with `allowConflicts`.
- Waiting-list promotion now notifies the parent (WhatsApp/push) with the student and group name: `education_waiting_list_promoted`.

## Phase 4 (part 7) — growth & retention insights

- `GET /education/finance/insights?months=6&inactiveDays=21`:
  - Revenue by branch, package, group and teacher (private + group collections).
  - At-risk students with explicit reasons: low hours, expiring package, overdue installment, no confirmed session for N days.
  - Group members whose renewal is due or unpaid.
  - Cohort retention: first-enrollment month, cohort size, repeat buyers and retention rate.
  - Summary KPIs: revenue, active students, repeat rate, at-risk count, group renewals due.
- UI: "النمو والاحتفاظ" tab in education reports with window selector (3/6/12 months), revenue tables, at-risk list and cohort table.

## Phase 4 (part 8) — exams, grades and certificates

- New tables (auto-applied by `prisma db push`): `education_exams`, `education_exam_results`, `education_certificates`.
- Admin API `/api/v1/education/exams`:
  - Create exam (title, type QUIZ/EXAM/ASSESSMENT, max score, optional group/package/teacher/subject, schedule).
  - Grade sheet: resolves candidates from the group's active members, the package's active enrollments, or all active students.
  - Save grades with automatic letter grade (A ≥ 90%, B ≥ 80%, C ≥ 70%, D ≥ 60%, else F), rejects scores outside `0..maxScore`.
  - Publish → stamps `publishedAt` on graded results and notifies each parent by WhatsApp/push (`education_exam_result`).
  - Close locks the result sheet; delete removes results first.
- Admin API `/api/v1/education/certificates`: issue (serial `CERT-YYYYMM-####`), list, delete, and `GET /:id/pdf`.
- Certificates are archived PDFs (landscape A4, Arabic-shaped with NotoSansArabic) stored in `uploads/education-certificates/<companyId>/<serial>.pdf` (`EDUCATION_CERTIFICATES_DIR` override), cached on the row in `pdfPath`.
- UI: "الامتحانات والشهادات" tab in education management — exam list/KPIs, grade entry sheet, publish/close, certificate issue per student and PDF download.
- Parent portal: `GET /children/:studentId/exams` (published only), `GET /children/:studentId/certificates`, `GET /certificates/:id/pdf` (scoped to the guardian's children), plus a "الدرجات والشهادات" tab in the child detail page.
- Permissions: `education.exams.manage` (implied by `education.sessions.manage`), seeded for admin/team leader/moderator.

## Phase 4 (part 9) — teacher performance inside growth insights

- `GET /education/finance/insights` now also returns `teacherPerformance`, per teacher over the selected window:
  - Private sessions delivered + group sessions held (shown separately), cancellations.
  - Hours taught (actual duration, falls back to planned).
  - Group attendance rate (present / present+absent) and absence count.
  - Distinct students served and revenue attributed to the teacher.
- Sources: `education_sessions` for private, `education_group_sessions` + `education_group_attendance` for groups, plus the existing per-teacher payment attribution.
- UI: "أداء المدرّسين" table in the growth tab (sessions, cancelled, hours, attendance %, students, revenue).
- Note: attendance rate is `null` when a teacher has no group attendance yet (no fake 100%).

## Phase 4 (part 10) — discount codes (coupon engine)

- New tables: `education_coupons`, `education_coupon_redemptions`.
- Admin API `/education/finance/coupons`: list, create, update, toggle, delete, and `POST /coupons/validate` (preview).
  - Types: `PERCENT` / `AMOUNT`, with optional `minAmount`, `maxDiscount` cap, `scope` (ALL / PACKAGE / GROUP), `maxUses`, `perStudentLimit`, validity window.
  - Codes are stored uppercase and unique per company; a used coupon cannot be deleted (deactivate instead) so the discount history stays intact.
  - Deleting an unused coupon is allowed.
- Redemption is atomic: `usedCount` is incremented with a `usedCount < maxUses` guard inside the money transaction, and a redemption row records student, customer, enrollment, payment and the discount amount.
- Applied on parent package purchase (`POST /education/parent-portal/purchase-package` with `couponCode`):
  - Coupon is validated **before** any wallet debit; invalid/expired/exhausted returns the mapped error code.
  - Discount applies after the sibling discount; the wallet is debited the final amount only.
  - Payment note, enrollment `discountType=COUPON`/`discountAmount` and audit log all record the code.
- Parent preview: `POST /education/parent-portal/coupons/validate` (scoped to the guardian's own child).
- UI: "أكواد الخصم" tab in `/admin/education/payments` (list, create, enable/disable, delete, usage counters) and a coupon field in the parent buy-package page showing the live discount.

## Phase 4 (part 11) — repeated absence alerts

- `educationAbsenceService` computes each student's **consecutive absence streak** from `education_group_attendance` + group session dates (a present/excused row resets it), within a window (default 45 days, threshold 3).
- `GET /education/finance/absence-alerts?threshold=3&days=45` lists at-risk students with parent phone and group name.
- `POST /education/finance/absence-alerts/run` sends the alerts now and returns `{ detected, sent, skipped, failed }`.
- Cron: daily 12:00 (`runAbsenceAlerts`) sweeps every company that has group attendance.
- Dedupe: no repeat alert to the same parent within 7 days (`education_repeated_absence` in `whatsAppNotificationLog`), so a family is not spammed.
- New template `education_repeated_absence` (student, group, streak count) — approve it in WhatsApp settings if Meta requires templates.
- UI: "غياب متكرر" card in the growth tab with the list and a "إشعار أولياء الأمور" action.

## Phase 4 (part 12) — make-up sessions

- New column `education_sessions.makeupForSessionId` (+ index) links a make-up to the missed lesson.
- `POST /education/sessions/:id/makeup` `{ scheduledAt, plannedDuration?, teacherId?, topic?, notes? }`:
  - Only for a **CONFIRMED** private session linked to an enrollment (cancelled sessions never consumed hours, so no make-up is needed).
  - Credits the consumed hours back to the enrollment (capped at `totalHours`) and creates a `SCHEDULED` session with the same student/teacher/subject/enrollment flagged `makeupForSessionId`.
  - The make-up itself deducts the hour when confirmed → **net one hour for one delivered lesson**.
  - Rejects a second make-up for the same session (`409 MAKEUP_ALREADY_SCHEDULED`) and rolls the whole transaction back on failure.
  - Audits `CREATE_MAKEUP_SESSION` and notifies the parent with the new session time.
- UI: a "حصة تعويض" action on confirmed session rows (asks for the new date/time and refreshes the list).

## Phase 4 (part 13) — discount codes at the reception desk

- `POST /education/finance/payments` now accepts `couponCode` for **package (enrollment) collections**:
  - The code is validated inside the money transaction before anything moves.
  - The ledger stores the amount **actually collected** (`requested − discount`) and the treasury deposit matches it.
  - The enrollment's `finalAmount` is reduced by the discount, `discountAmount` accumulates and `discountType=COUPON`, so the remaining balance and dues stay correct: `remaining = (total − discount) − paid`.
  - The redemption row links the payment and records the discount; a failing usage guard rolls the whole transaction back.
  - Rejected when the discount would cover the full amount (record a waiver instead) and on group-fee payments (`COUPON_NOT_ALLOWED`, fees are settled in full).
- Dues payload now includes `packageId` so package-scoped coupons validate correctly at the desk.
- UI: the record-payment modal shows a "كود الخصم" field for enrollments with live preview (`code: −discount → collected`).

## Phase 4 (part 14) — group member discounts (per-member waiver + codes)

- New columns on `education_group_members`: `discountAmount` (default 0) and `discountReason` (auto-added by `ensureTablesExist`, no downtime).
- `POST /education/finance/group-members/:id/discount` `{ amount, reason? }`: a **standing discount for one member** that does not touch the shared group fee.
  - Clamped to `0 … feeAmount`, rejects non-numeric input, 404 when the member is outside the company.
  - Recomputes `paymentStatus`: `PAID` when `paid + discount >= fee`, `PARTIAL` when something was paid, else `PENDING`.
  - Audited as `MANUAL_DISCOUNT`.
- Group collections now accept `couponCode` too:
  - Effective due = `fee − discountAmount`; overpayment is validated against it.
  - `amountPaid` stores the **cash actually collected**, `discountAmount` accumulates the coupon value, and `paymentStatus` counts `paid + discount` against the fee → the cycle settles correctly and dues stay at zero.
  - Redemption rows are still recorded; a failed usage guard rolls back.
- Dues payload adds `discountAmount` and computes the remaining after the waiver, so the desk and reports agree.
- UI: group rows in the dues tab show the discount and a "خصم" action (prompts for the standing amount), and the record-payment modal offers the coupon field for group fees as well.

## Phase 4 (part 15) — discounts & waivers report

- `GET /education/finance/discounts?months=6` returns:
  - Summary: `couponDiscounts`, `couponUses`, `activeWaivers`, `waiversValue`, `totalImpact`, `manualWaivers`.
  - `byCode`: uses + amount per coupon code.
  - `byMonth`: monthly coupon discount trend.
  - `byStaff`: manual waivers grouped by the staff user (from the `MANUAL_DISCOUNT` audit entries).
  - `items`: latest coupon redemptions and standing waivers (student, group, reason, amount, date).
- Sources are never double counted: coupon value comes only from `education_coupon_redemptions`, waivers only from the members' current `discountAmount`.
- Every source degrades to an empty section instead of failing the report.
- UI: KPI strip + "آخر الخصومات" list inside the "أكواد الخصم" tab.

## Phase 4 (part 16) — collection rate (billed vs collected)

- `GET /education/finance/collections?months=6`:
  - `billed`: enrollment value (`finalAmount`, falling back to the package price) for enrollments created inside the window — a datable charge event.
  - `collected`: COMPLETED payments with `paidAt` inside the window.
  - `gap` (billed − collected), `rate` (collected ÷ billed, may exceed 100% when collecting older dues, `null` when nothing was billed).
  - `openDues` live snapshot: unpaid package balances + unpaid group cycles (after member discounts).
  - `byMonth` and `byBranch` breakdowns, each with its own rate.
- UI: "نسبة التحصيل" tab in `/admin/education/payments` with 3/6/12-month selector, KPI strip, monthly table and per-branch list.
- Caveat: group fees are recurring, so the historical "billed" side uses datable enrollment charges; current group obligations appear in `openDues`.

## Phase 4 (part 17) — collected money by method and treasury

- `GET /education/finance/methods?months=6`:
  - `summary`: `gross` (all non-cancelled payments), `refunded` (reversed amounts, including fully reversed rows), `net`, `payments`.
  - `byMethod`: CASH / TRANSFER / WALLET / CARD / INSTAPAY / … with count and share of net.
  - `byBranch`: net per branch and an explicit "بدون فرع" bucket.
  - `byTreasury`: deposits vs withdrawals per treasury account, restricted to education reference types (`EDUCATION_PAYMENT`, `EDUCATION_GROUP_PAYMENT`, `EDUCATION_REFUND`, `EDUCATION_WALLET_TOPUP`) so the desk cash matches the treasury.
  - `treasuryNet` across accounts.
- Partial reversals are netted per payment; fully reversed and failed payments never inflate the method split.
- UI: the collection-rate tab now also shows "حسب طريقة الدفع" and "حسب الخزينة" panels plus a refunded/gross footnote.



















