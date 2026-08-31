# 0001-tech-stack-selection.md

## Context
We need to select a technology stack for building a modern admin dashboard that is maintainable, performant, and provides a good developer experience.

## Decision
We selected the following stack:
- **Framework**: TanStack Start with React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Validation**: Zod
- **Data Fetching**: TanStack Query
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Build Tool**: Vite
- **Code Quality**: Biome

## Consequences

### Positive
- Modern React 19 features and concurrent rendering capabilities
- Excellent developer experience with Vite HMR
- Type-safe end-to-end with TypeScript
- Consistent, accessible UI components from Shadcn
- Utility-first styling with Tailwind CSS
- Robust authentication with Better Auth
- Type-safe database access with Drizzle

### Negative
- Learning curve for developers unfamiliar with TanStack Start
- Newer ecosystem means fewer community resources compared to Next.js
- Build times may be longer than some alternatives due to React 19 features

## Status
Accepted

## Date
2024-01-15