# DECISIONS.md

## D1 — Authentication: Username + Password Only

**Decision:** Remove all Google/social provider config from Better Auth. Only `emailAndPassword: { enabled: true }`.  
**Reason:** User requirement; eliminates Google OAuth env vars and social login UI.  
**Tradeoff:** No social login convenience. Can be re-added later without schema changes (Better Auth supports it).

---

## D2 — Tax: Editable Rate + Label

**Decision:** Replace hardcoded preset dropdown (`invoiceTaxOptions`) with user-editable label + rate (%).  
**Reason:** Tax rules differ by country (IDR/PPN 11%, GST 18%, etc.). Fixed presets won't scale.  
**Tradeoff:** Slightly more typing per invoice. Mitigated by keeping presets as quick-fill suggestions.

---

## D3 — PDF: Client-Side Local Generation

**Decision:** Generate PDF in the browser (no server endpoint).  
**Reason:** Simpler; no file-storage needed; works offline. Invoice PDF is not sensitive enough to require server rendering.  
**Tradeoff:** PDF fidelity depends on the client library. `@react-pdf/renderer` chosen for JSX-based layout matching existing `InvoicePaper`.

---

## D4 — Invoice Number Uniqueness: DB-Level Unique Constraint

**Decision:** Add a unique composite index on `invoices(user_id, number)`.  
**Reason:** Two concurrent `createInvoice` calls could produce the same `INV-2026-001`. The existing `invoiceSequences` table is a backup tracker, not a lock.  
**Tradeoff:** Slight extra migration. App retries on unique violation (up to 3 attempts).

---

## D5 — Client Delete: Blocked When Invoices Exist

**Decision:** `deleteClient` returns error if the client has any invoices.  
**Reason:** FK constraint is `restrict`; preventing orphaned references at the API layer gives a clear error message.  
**Tradeoff:** User must delete invoices first before removing a client. Acceptable for a small-business tool.

---

## D6 — No Migration Required for Existing Tables

**Decision:** The existing `src/db/schema.ts` already defines `users`, `clients`, `invoices`, `invoice_items`, `invoice_sequences`, `user_profiles` with all needed columns.  
**Reason:** Columns for invoice number, currency, tax_rate, tax_amount, total, status, dates, items, etc. already exist.  
**Tradeoff:** None — schema is ready.

---

## D7 — `@tanstack/react-query` Added as Explicit Dependency

**Decision:** `package.json` currently lacks `@tanstack/react-query` even though it's imported in multiple files. Add it explicitly.  
**Reason:** npm will resolve it as a transitive dep from `@tanstack/react-start` but it must be explicit for CI and type checking.  
**Tradeoff:** None — correct practice.