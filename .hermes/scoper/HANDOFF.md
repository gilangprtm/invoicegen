# HANDOFF.md — InvoiceGen Invoice & Client Modules

## Summary

Scoper produced a complete specification and 18 phased tickets to make the Invoice module and Client management production-ready. Kanban and Calendar are out of scope.

## Current Phase

**Phase 0 — Foundation** (TASK-001 done; TASK-002 ready)

| Status | Task | Description |
|--------|------|-------------|
| `done` | TASK-001 | Add missing dependency `@tanstack/react-query` |
| `done` | TASK-002 | Create `.env.example` with `DATABASE_URL` |
| `done` | TASK-003 | Remove hardcoded DB fallback connection string |
| `done` | TASK-004 | Remove Google social provider from Better Auth |
| `done` | TASK-005 | Remove Google button from login/register UI |

## Ready Tickets (can start now)

- **TASK-006** — Fix `as any` cast in invoice list query (P2)

## Blocked Tickets (waiting on dependencies)

Phase 0 chain: TASK-003 → TASK-004 → TASK-005  
Phase 1: TASK-006/007/008 → TASK-009  
Phase 2: TASK-010/011 → TASK-012 → TASK-013  
Phase 3: TASK-014 → TASK-015 → TASK-016  
Phase 4: TASK-017 → TASK-018

## Critical Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Invoice number race condition | Unique DB index + retry in `getNextInvoiceNumber` (TASK-010) |
| R2 | PDF fidelity mismatch | Use `@react-pdf/renderer` mirroring `InvoicePaper` (TASK-012) |
| R4 | Pre-existing lint/check noise | Fix all in Phase 1 before feature work (TASK-009) |
| R5 | Missing env setup | `.env.example` + hard error in `src/db/index.ts` (TASK-002/003) |

## Important Notes

- **No code changes by Scoper** — codebase is untouched from discovery state.
- Server functions, DB schema, routes, UI components already exist. Work is wiring, bug fixes, and small additions.
- **Builder contract**: One ticket per session; only update `status`, `started_at`, `completed_at`, `progress_log`. Never modify requirement/description/acceptance/priority/dependencies/phase/scope.
- If a ticket becomes blocked, set status `Blocked`, record reason, stop. Scoper handles replanning.

## Files Delivered

```
.hermes/scoper/
├── PROJECT.md      # Project overview, scope, tech stack
├── SPEC.md         # 7 FR groups (F1–F7), NF, data model, API, acceptance
├── TICKETS.md      # 18 tasks across 5 phases with deps
├── DECISIONS.md    # 7 architectural decisions (D1–D7)
├── RISKS.md        # 5 risks with mitigations
└── HANDOFF.md      # This file
```

## Next Step

Builder picks up TASK-001 or TASK-002 (both `ready`). After completion, dependent tasks auto-promote.