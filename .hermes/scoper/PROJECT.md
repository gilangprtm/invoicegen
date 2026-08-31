# PROJECT.md — InvoiceGen (Studio Admin)

## Overview

InvoiceGen is a responsive admin dashboard built with TanStack Start, React 19, TypeScript,
Tailwind CSS v4, shadcn/ui (base-nova style), Drizzle ORM + PostgreSQL, and Better Auth.

It is a fork of the Studio Admin template with an added invoice-generation feature set.

## Objective

Make the **Invoice** module and its dependent **Client management** module production-ready:

- Username/password-only authentication (remove Google social login).
- Fully functional invoice CRUD (list, create, view, edit, delete, status workflow).
- Fully functional client CRUD (list, create, edit, delete) that the invoice flow depends on.
- Local PDF download for invoices (no email sending).
- Editable per-invoice tax (rate and label), since tax differs by country.
- Clean build / lint / check pipeline (fix existing diagnostics).
- Safe environment handling (`DATABASE_URL`, no secrets in the repo).

## Scope

| | |
|---|---|
| **In scope** | Invoice module (list/create/view/edit/delete/status/print/PDF), Client management (CRUD + revenue summary), auth (username+password only), editable tax, local PDF, env setup, build/lint/check cleanup |
| **Out of scope** | Kanban, Calendar, Email sending, Google/other social auth, multi-tenant/RBAC, chat/mail screens, legacy screens, performance/security hardening beyond baseline |

## Tech Stack

- TanStack Start (SSR), TanStack Router (file-based), React 19, TypeScript strict
- Tailwind CSS v4, shadcn/ui
- Better Auth (email+password), Drizzle ORM, PostgreSQL (`postgres` driver)
- TanStack Query, React Hook Form, Zod, sonner, lucide-react, date-fns
- Vite, Nitro, Biome, Husky

## Repository Layout (relevant parts)

```
src/
  routes/(main)/dashboard/invoice/        # Invoice screens (list, new, $id, $id/edit)
  routes/(main)/dashboard/invoice/-components/  # Invoice UI components + data helpers
  routes/(main)/dashboard/clients/        # Client screens
  server/invoices.ts                      # Invoice server functions (CRUD)
  server/clients.ts                       # Client server functions (CRUD)
  server/profile.ts                       # Company profile server functions
  lib/auth.ts                             # Better Auth config (social providers to remove)
  lib/auth-client.ts
  lib/middleware.ts                       # getAuthSession / getCurrentUser
  db/schema.ts                            # Drizzle schema (users, clients, invoices, items...)
  db/index.ts                             # DB connection (DATABASE_URL)
```

## Key Files

- `package.json` — scripts and dependencies (missing `@tanstack/react-query`; add)
- `.env.example` — create; document `DATABASE_URL`
- `src/db/index.ts` — hardcoded fallback connection string; must not ship

## Decisions Summary

See `DECISIONS.md`.

## Status

- [x] Discovery complete
- [ ] Documentation complete (SPEC.md, TICKETS.md, DECISIONS.md, RISKS.md, HANDOFF.md)
- [ ] Implementation (Builder profile)
