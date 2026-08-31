# TICKETS.md — InvoiceGen Implementation Plan

All tickets use the lifecycle: `Todo → Ready → In Progress → Code Review → Done` (or `Blocked`).

## Phase 0

### TASK-001
- **Title:** Add missing dependency @tanstack/react-query
- **Description:** Add `@tanstack/react-query` to package.json dependencies (imported by multiple files but not declared). Run `npm i @tanstack/react-query` to update lockfile.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** None
- **Status:** Done
- **Started At:** 2026-08-06
- **Completed At:** 2026-08-06
- **Progress Log:** Dependency already present — `^5.101.4` in package.json, lockfile refs, node_modules install verified (exports `useQuery`). No code change required.

### TASK-002
- **Title:** Create .env.example
- **Description:** Add `.env.example` at repo root documenting required env vars. Include `DATABASE_URL=` (PostgreSQL connection string) and any other vars referenced by the app. No secrets committed.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** None
- **Status:** Done
- **Started At:** 2026-08-06
- **Completed At:** 2026-08-06
- **Progress Log:** File already existed but contained stale vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_BETTER_AUTH_URL, SENTRY_DSN). Code only uses `DATABASE_URL` (src/db/index.ts:6-10), and Better Auth auto-reads `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`. Cleaned .env.example to only required vars.

### TASK-003
- **Title:** Remove hardcoded DB fallback connection string
- **Description:** In `src/db/index.ts`, replace the hardcoded fallback `postgresql://postgres:***@localhost:5432/invoicegen` with a check that throws a clear error when `process.env.DATABASE_URL` is missing.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** TASK-001, TASK-002
- **Status:** Done
- **Started At:** 2026-08-06
- **Completed At:** 2026-08-06
- **Progress Log:** Already implemented. `src/db/index.ts:6-8` throws `"DATABASE_URL environment variable is not set"` when missing. No hardcoded fallback present.

### TASK-004
- **Title:** Remove Google social provider from Better Auth
- **Description:** In `src/lib/auth.ts`, remove the `socialProviders.google` block entirely. Keep `emailAndPassword: { enabled: true }` and the `tanstackStartCookies` plugin. This makes auth username/password only and removes GOOGLE_CLIENT_ID/SECRET env requirements.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** TASK-001, TASK-003
- **Status:** Done
- **Started At:** 2026-08-06
- **Completed At:** 2026-08-06
- **Progress Log:** Already implemented. `src/lib/auth.ts` has no `socialProviders.google` block — only `emailAndPassword: { enabled: true }` + `tanstackStartCookies()` plugin. No Google refs anywhere in src/lib or src/server.

### TASK-005
- **Title:** Remove Google button from login/register UI
- **Description:** Remove or stub the Google social login button from the auth screens: `src/routes/(main)/auth/-components/social-auth/google-button.tsx` and its usage in login/register forms. Login and register must show only email + password form.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** TASK-004
- **Status:** Done
- **Started At:** 2026-08-06
- **Completed At:** 2026-08-06
- **Progress Log:** No Google button exists. `src/routes/(main)/auth/-components/` contains only `login-form.tsx` and `register-form.tsx` — both email+password only. No `social-auth/` directory, no Google refs anywhere in auth routes. Already clean.

## Phase 1

### TASK-006
- **Title:** Fix `as any` cast in invoice list query
- **Description:** In `src/routes/(main)/dashboard/invoice/index.tsx` the `useInvoicesQuery` calls `getInvoices({ data: { page, limit, status } as any })`. Remove the `as any` and pass a properly typed validator input matching the server fn's Zod schema.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-001

### TASK-007
- **Title:** Fix getInvoice call shape in invoice-form-page
- **Description:** In `src/routes/(main)/dashboard/invoice/-components/invoice-form-page.tsx` line ~66, `getInvoice({ id: invoiceId })` is wrong; server fn expects `getInvoice({ data: { id } })`. Fix the call and its typing.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-001

### TASK-008
- **Title:** Fix duplicate and incorrect imports in invoice-form-page
- **Description:** In `src/routes/(main)/dashboard/invoice/-components/invoice-form-page.tsx`, the import from `@/server/invoices` includes `getInvoices, createInvoice, updateInvoice, getInvoice, getClients` — `getClients` and `getInvoices` are not exported there (they live in `@/server/clients`). Clean imports: only what is actually used; `getClients` comes from `@/server/clients`.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-001

### TASK-009
- **Title:** Run lint and check, fix remaining diagnostics
- **Description:** After TASK-006..008 and TASK-001, run `npm run lint` (target: 0 errors) and `npm run check` (target: 0 TypeScript errors). Fix any remaining errors related to the invoice/client/auth scope. Do NOT fix unrelated formatter noise in legacy screens. If out-of-scope errors remain, note them in a comment and stop.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-006, TASK-007, TASK-008

## Phase 2

### TASK-010
- **Title:** Add unique constraint on invoice number
- **Description:** Add Drizzle migration creating a unique index on `invoices(user_id, number)`. Update `getNextInvoiceNumber` in `src/server/invoices.ts` to retry on unique violation (up to 3 attempts) so concurrent creates cannot collide.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-003, TASK-009

### TASK-011
- **Title:** Make tax editable per invoice
- **Description:** Replace the hardcoded `invoiceTaxOptions` preset-only dropdown with an editable tax rate: in `src/routes/(main)/dashboard/invoice/-components/data.ts` and `invoice-adjustments.tsx`, allow the user to enter a custom tax label + rate (%). Keep existing presets (GST 18%, VAT 12%, Service 10%, No Tax 0%) as quick-pick suggestions. Ensure the chosen rate flows into `getInvoiceTax`/`getInvoiceTotal`, the preview, the PDF, and `tax_rate` on the stored invoice.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-009

### TASK-012
- **Title:** Wire Download PDF button (local, client-side)
- **Description:** Add a client-side PDF generation capability. Recommended: `@react-pdf/renderer` (add to package.json). Create a utility that renders the invoice (mirroring `InvoicePaper`) to a PDF blob, then trigger download named `{invoice.number}.pdf`. Hook it to the `Download PDF` button in `src/routes/(main)/dashboard/invoice/-components/invoice-preview.tsx`. Must work offline — no server call.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-011

### TASK-013
- **Title:** Verify print still works after PDF changes
- **Description:** Confirm the existing print path (`PrintInvoice` portal + `InvoicePaper` + print CSS) still renders correctly after PDF work. No regressions to the on-screen preview.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-012

## Phase 3

### TASK-014
- **Title:** Wire Add New Client button in invoice selector
- **Description:** The `Add New Client` button in `src/routes/(main)/dashboard/invoice/-components/client-selector.tsx` currently has no onClick. Wire it to create a client (modal or navigation to the clients create screen), then refresh the clients query (`clients-list`) and auto-select the new client in the invoice form.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-009

### TASK-015
- **Title:** Client delete guard when invoices exist
- **Description:** In `src/server/clients.ts`, `deleteClient` must reject deletion when the client has invoices (FK is restrict). Return a clear error message. Update client list UI to surface the toast error. Verify no orphaned references.
- **Assignee:** builder
- **Priority:** 2
- **Depends On:** TASK-014

### TASK-016
- **Title:** Verify client revenue uses paid invoices only
- **Description:** Confirm `getClients` in `src/server/clients.ts` filters revenue by `invoices.status = 'paid'` (already implemented with FILTER clause). Verify in dev with mixed-status data. No code change expected unless bug found.
- **Assignee:** builder
- **Priority:** 3
- **Depends On:** TASK-015

## Phase 4

### TASK-017
- **Title:** Full integration smoke test
- **Description:** Manual end-to-end run: register → login → set company profile → create client → create invoice (draft) → edit → mark sent → mark paid → delete a draft → download PDF → print. Verify route guards, status workflow, ownership isolation, and no console errors.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** TASK-012, TASK-013, TASK-016

### TASK-018
- **Title:** Final lint, check, and build gate
- **Description:** Run `npm run lint` (0 errors), `npm run check` (0 TypeScript errors), `npm run build` (success). Record results in the ticket. If all pass, implementation is done.
- **Assignee:** builder
- **Priority:** 1
- **Depends On:** TASK-017

## References

- SPEC.md — full functional/non-functional requirements and acceptance criteria
- DECISIONS.md — architectural decisions (auth, tax, PDF, uniqueness, client delete)
- RISKS.md — known risks and mitigations
- PROJECT.md — project overview and scope

## Handoff Notes

- Server functions and DB schema already exist; work is wiring, bug fixes, and small additions.
- No new routes needed — routes already registered in `sidebar-items.ts` and `routeTree.gen.ts`.
- PDF generation is the only new dependency; prefer `@react-pdf/renderer` to match `InvoicePaper` visually.
- Builder must never modify requirement/description/priority/dependencies/phase/scope fields.
