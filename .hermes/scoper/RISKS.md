# RISKS.md

## R1 — Invoice Number Race Condition (Medium)

**Risk:** Two concurrent `createInvoice` calls can generate the same `INV-YYYY-NNN` for the same user.  
**Mitigation:** Unique composite index on `invoices(user_id, number)`. App-level retry (up to 3 attempts) on unique constraint violation.  
**Owner:** Builder (Phase 2, TASK-010).

---

## R2 — PDF Generation Fidelity (Low)

**Risk:** `@react-pdf/renderer` may not perfectly match `InvoicePaper` visual output (fonts, spacing, Tailwind classes).  
**Mitigation:** Test with real invoice data; adjust PDF component to mirror `InvoicePaper`.  
**Owner:** Builder (Phase 2, TASK-012).

---

## R3 — Client Delete Breaks Existing Invoices (Low)

**Risk:** If a user tries to delete a client that has invoices, the server returns an error. UI must communicate this clearly.  
**Mitigation:** Toast notification with explanation; disable delete button in client list if invoices exist (optional enhancement).  
**Owner:** Builder (Phase 3, TASK-015).

---

## R4 — Build/Lint/Check Diagnostics (Low)

**Risk:** Existing diagnostics (30 lint errors, 290 check errors) may hide new issues after changes.  
**Mitigation:** Fix all existing diagnostics in Phase 1 before starting Phase 2. Run `npm run lint` and `npm run check` after every ticket.  
**Owner:** Builder (Phases 0-1).

---

## R5 — No `.env` File in Repo (Medium)

**Risk:** New contributors won't know what env vars are required.  
**Mitigation:** `.env.example` created (TASK-002). `src/db/index.ts` throws clear error if `DATABASE_URL` missing (TASK-003).  
**Owner:** Builder (Phase 0).