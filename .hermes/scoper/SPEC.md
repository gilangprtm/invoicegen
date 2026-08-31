# SPEC.md — InvoiceGen Invoice & Client Modules

## Functional Requirements

### F1 — Authentication (username + password only)

**F1.1** Better Auth configured with `emailAndPassword: { enabled: true }` only.  
**F1.2** Remove `socialProviders.google` block from `src/lib/auth.ts`.  
**F1.3** Login screen and register screen must not show Google button.  
**F1.4** All protected routes use `getAuthSession()` guard; unauthenticated → redirect to `/login`.

### F2 — Invoice CRUD

| ID | Requirement |
|----|-------------|
| F2.1 | List invoices with pagination (20/page), status filter, search (future), skeleton loading, empty state with CTA. |
| F2.2 | Create invoice: requires company profile; live preview pane; currency (USD/IDR/EUR/GBP/…); client picker (from DB); at least one line item; tax selection; discount (fixed/percent); issued/due dates; draft/sent status. |
| F2.3 | View invoice: detail page with items table, totals, notes, bill-to sidebar, status badge, actions per status. |
| F2.4 | Edit invoice: prefill from server; save as draft / save & send; preserve line-item order. |
| F2.5 | Delete invoice: only if `status === "draft"`; cascade deletes items. |
| F2.6 | Status workflow enforced server-side: `draft → sent`, `sent → paid | overdue`, `overdue → paid`. Invalid transitions return 400. |
| F2.7 | Invoice numbering: `INV-{YYYY}-{NNN}` per user per year; unique constraint to prevent race conditions. |
| F2.8 | Print invoice: opens browser print dialog via existing `PrintInvoice` portal. |
| F2.9 | Download PDF: client-side PDF generation (no server) triggered from preview "Download PDF" button. |

### F3 — Client Management

| ID | Requirement |
|----|-------------|
| F3.1 | Client list: name, email, phone, address, invoice count, total paid revenue, created date. |
| F3.2 | Create client: name (required), email, phone, address. |
| F3.3 | Edit client: all fields. |
| F3.4 | Delete client: allowed if no invoices reference it; else block with error. |
| F3.5 | Client selector in invoice forms: searchable dropdown with avatar + name/email. |
| F3.6 | "Add New Client" button in selector opens client create modal/screen (wired). |

### F4 — Editable Tax

| ID | Requirement |
|----|-------------|
| F4.1 | Replace hardcoded tax presets with editable tax label + rate (%) per invoice. |
| F4.2 | Presets remain as suggested quick-picks (VAT 12%, GST 18%, Service 10%, None 0%). |
| F4.3 | Custom rate stored in `invoices.tax_rate` and `invoice_items` not affected. |
| F4.4 | Preview and PDF reflect the custom rate. |

### F5 — Company Profile (precondition for invoices)

| ID | Requirement |
|----|-------------|
| F5.1 | Settings screen (existing) to set company name, email, phone, website, address, tax ID, payment details, logo. |
| F5.2 | Profile auto-loaded in new-invoice form; if missing, show CTA to settings. |
| F5.3 | Profile data appears on invoice PDF/print. |

### F6 — Local PDF Download

| ID | Requirement |
|----|-------------|
| F6.1 | Use a client-side PDF library (e.g., `@react-pdf/renderer` or `jspdf` + `html2canvas`). |
| F6.2 | Generate from the same data model as `InvoicePaper` so visual match. |
| F6.3 | File name: `{invoice.number}.pdf`. |
| F6.4 | Works offline (no API call). |

### F7 — Environment & Build Hygiene

| ID | Requirement |
|----|-------------|
| F7.1 | Add `.env.example` with `DATABASE_URL=`, no secrets. |
| F7.2 | `src/db/index.ts`: throw if `DATABASE_URL` not set (no hardcoded fallback). |
| F7.3 | Add missing dependency: `@tanstack/react-query`. |
| F7.4 | Fix `invoice/index.tsx` `as any` cast — use proper validator input type. |
| F7.5 | Fix `invoice-form-page.tsx` wrong `getInvoice({ id })` call → `{ data: { id } }`. |
| F7.6 | Fix duplicate/incorrect imports in `invoice-form-page.tsx`. |
| F7.7 | `npm run lint` passes with 0 errors (warnings acceptable). |
| F7.8 | `npm run check` passes with 0 TypeScript errors. |
| F7.9 | `npm run build` succeeds. |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF1 | All server functions validate ownership (`userId === session.user.id`). |
| NF2 | All server functions validate input via Zod. |
| NF3 | Route guards on every dashboard route. |
| NF4 | SSR-safe: no `window`/`document` outside effects/`ClientOnly`. |
| NF5 | Responsive: mobile, tablet, desktop tested on invoice list, create, detail, edit. |
| NF6 | Light & dark themes work via existing theme system. |
| NF7 | Accessibility: semantic HTML, labels, focus states, ARIA on dialogs/selects. |

---

## Data Model (Drizzle — existing, no migration needed except tax + unique)

```ts
// Existing tables used by invoice module
users              // Better Auth users
clients            // id, userId, name, email, phone, address
invoices           // id, userId, clientId, number, currency, subtotal, tax_rate, tax_amount, total, status, note, issued_date, due_date, paid_at
invoice_items      // id, invoiceId, name, quantity, price, total
invoice_sequences  // userId, last_number
user_profiles      // company details for invoice header
```

**Changes required:**
- Add unique constraint on `invoices(user_id, number)` (or composite index + app-level guard).
- `tax_rate` already numeric; ensure custom rates accepted.

---

## API Surface (Server Functions — already implemented)

| Function | Method | Input | Output |
|----------|--------|-------|--------|
| `getInvoices` | GET | `{ status?, page?, limit? }` | `{ invoices: InvoicesList[], total, page, totalPages }` |
| `getInvoice` | GET | `{ id }` | `InvoiceWithItems \| null` |
| `createInvoice` | POST | `CreateInvoiceInput` | `{ id, number }` |
| `updateInvoice` | POST | `UpdateInvoiceInput` | `void` |
| `deleteInvoice` | POST | `{ id }` | `void` |
| `getClients` | GET | — | `ClientList` |
| `getClient` | GET | `{ id }` | `ClientDetail \| null` |
| `createClients` | POST | `{ name, email?, phone?, address? }` | `{ id }` |
| `updateClient` | POST | `{ id, name?, email?, phone?, address? }` | `void` |
| `deleteClient` | POST | `{ id }` | `void` |
| `getProfile` | GET | — | `UserProfile \| null` |
| `upsertProfile` | POST | `userProfileSchema` | `UserProfile` |

---

## Acceptance Criteria (Definition of Done)

- All `F*` requirements implemented and manually verified in dev (`npm run dev`).
- `npm run lint` → 0 errors.
- `npm run check` → 0 TypeScript errors.
- `npm run build` → success.
- No `console.error` on load; no hydration mismatches.
- Invoice create → preview → PDF download → file opens with correct data.
- Invoice status transitions follow server rules; invalid rejected.
- Client CRUD works; selector populates from DB; revenue counts correct.
- Auth: register/login/logout work; no Google button.
- `.env.example` present; `DATABASE_URL` required at runtime.