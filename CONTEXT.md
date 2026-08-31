# InvoiceGen Domain Model

## Core Concepts

### Invoice
- Represents a bill sent to a client
- Status: draft, sent, paid, overdue
- Contains header information (number, date, due date, total)
- Contains line items with quantities and pricing

### Client
- Represents a customer who receives invoices
- Contact information (name, email, phone, address)
- May have multiple invoices

### ClientProfile
- Business information for invoicing
- Company name, tax ID, payment details
- Logo and branding assets

### Task
- Kanban-style task management
- Status: todo, in_progress, done
- Priority: low, medium, high
- Due dates and positioning for workflow

### User
- System user (administrator, accountant, etc.)
- Authenticated via Better Auth
- Associated with Better Auth sessions

### Authentication
- Better Auth integration for user management
- Session management and token handling
- Social and email/password authentication flows

## Relationships

- One User → Many Sessions
- One User → Many UserProfiles
- One User → Many Clients
- One Client → Many Invoices
- One Invoice → Many InvoiceItems
- One User → Many Tasks

## Current State

- Authentication: Better Auth with PostgreSQL adapter
- Database schema defined in `src/db/schema.ts`
- Domain model terms aligned with database tables
- Domain terminology documented in `CONTEXT.md`

## Glossary

- **Invoice**: A bill sent to a client for products or services
- **Client**: A person or business that receives an invoice
- **User**: System user with authentication credentials
- **Task**: Action item managed in the Kanban interface
- **Status**: Current state of an item (draft, sent, paid, etc.)
- **Priority**: Relative importance (low, medium, high)

## Decisions

- Selected Better Auth for authentication due to its comprehensive session management and social provider support
- Chose PostgreSQL as the database for relational integrity and transaction support
- Used UUIDs for resource identification where appropriate
- Separated client-facing information (Client) from business information (ClientProfile)