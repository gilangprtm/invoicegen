# 0002-database-schema.md

## Context
We need a database schema that supports the invoice management domain, including clients, invoices, invoice items, and tasks.

## Decision
We used PostgreSQL with Drizzle ORM, with the following table design:
- `users` - managed by Better Auth, stores user authentication data
- `session` - Better Auth session management
- `account` - Better Auth account linking for social providers
- `verification` - Better Auth email verification
- `user_profiles` - business profile information for invoicing
- `clients` - invoice recipients
- `invoices` - invoice headers
- `invoice_items` - line items on invoices
- `tasks` - Kanban task management
- `invoice_sequences` - invoice number sequencing per user

## Consequences

### Positive
- Clean separation between authentication and business data
- Normalized schema with proper foreign key relationships
- Support for both social and email/password auth
- Invoice numbers are unique per user via sequence table

### Negative
- More tables than a simpler design
- Better Auth schema is tightly coupled to the auth library
- Schema changes require migrations

## Status
Accepted

## Date
2024-01-15