---
version: alpha
name: InvoiceGen
description: Local-first invoice workspace for individuals and small businesses.
colors:
  primary: "oklch(0.205 0 0)"
  primaryForeground: "oklch(0.985 0 0)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  mutedForeground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  accent: "oklch(0.205 0 0)"
typography:
  heading:
    fontFamily: Geist
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  data:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 0.375rem
  md: 0.5rem
  lg: 0.625rem
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
components:
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primaryForeground}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
  data-surface:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"

---

## Overview

InvoiceGen is a local-first workspace for creating, reviewing, and exporting invoices. The interface serves a person doing invoice work, not a generic admin team. The dashboard's job is to show invoice state and provide the next useful action without inventing activity.

Design Read: operational invoice dashboard for an individual or small business, data-first, ENERGY 1 / RHYTHM 2 / MOTION 1.

The visual language is calm and compact because invoice work benefits from scanning, comparison, and predictable actions. It is deliberately not a marketing landing page and does not use decorative sections that have no invoice data behind them.

## Colors

- **Primary:** near-black semantic primary keeps the main action and key data legible in both themes.
- **Background and foreground:** neutral surfaces keep invoice amounts and status labels as the visual priority.
- **Muted:** secondary surfaces separate supporting information without adding competing colors.
- **Accent:** the primary color is the single deliberate accent for the main action or focal data moment on each screen.
- **Status colors:** red, blue, and green are reserved for real invoice states. They communicate state, not decoration.
- **Palette limit:** the active design uses neutral colors plus one primary accent. Status colors are semantic exceptions tied to actual invoice status.

## Typography

- **Geist:** the default sans family is selected because it is already implemented in the font registry, remains readable at compact data sizes, and fits the calm data-first direction. It is not used as a developer-tool costume.
- **Heading scale:** headings establish page identity without competing with invoice content.
- **Data scale:** amounts, dates, and identifiers use compact but readable text so users can compare rows quickly.

## Layout

- **Dashboard structure:** the page follows the user's work: current totals, status distribution, paid revenue over time, then recent invoices and clients. Each section earns its place from local invoice data.
- **Summary cards:** four equal summary cards are intentional because the four values are peer metrics in the current dashboard specification. No card implies a stronger business claim than another.
- **RHYTHM 2:** the dashboard uses a predictable rhythm with a few breaks: the summary row, a split revenue/status section, and two recent-data lists. This supports scanning without becoming a repeated landing-page grid.
- **Responsive layout:** grids collapse where content width stops supporting comparison. Mobile keeps actions reachable and stacks data rather than squeezing columns.
- **Spacing:** the spacing scale separates page sections at `lg`, groups related controls at `md`, and keeps compact control gaps at `sm`.

## Elevation & Depth

- Surfaces use borders and semantic background tokens as the default separation because invoice data should feel grounded and document-like.
- Shadows are reserved for controls or surfaces that genuinely need elevation. Cards do not receive decorative shadows by default.

## Shapes

- Cards use the larger semantic radius, controls use the medium radius, and compact labels may use the component-defined badge radius. This variation distinguishes surface, control, and state.
- Pills are reserved for real status labels. They are not used as a universal shape for every control.

## Components

- **Primary action:** one clear action uses the primary token. Secondary actions use outline or neutral treatment so the focal action remains visible.
- **Status badge:** a badge appears only because invoice status is real data. Its text remains present so state is not communicated by color alone.
- **Lucide icons:** icons are selected for direct meaning, such as receipt for invoices, people for clients, eye for viewing, and pencil for editing. Lucide is retained because its stroke and sizing are already consistent with the shadcn base-nova component set.
- **Empty state:** explains what is absent and gives the action that creates the missing data.
- **Loading and error state:** indicate the local-store operation being performed or the local-storage failure that needs attention.
- **Search:** searches actual InvoiceGen destinations only: invoices, clients, dashboard, and settings.

## Do's and Don'ts

- Do keep all shipped numbers tied to local invoice data.
- Do keep the shadcn UI files in `src/components/ui` as a deliberate ready-to-use inventory. Unimported files are not bundled by the application.
- Do verify light mode, dark mode, mobile widths, keyboard focus, and local-storage states before delivery.
- Do use the existing semantic theme tokens rather than introducing one-off colors.
- Don't add testimonials, customer counts, uptime claims, or other unsupported facts.
- Don't add a section, icon, animation, badge, or decoration only to fill empty space.
- Don't add a navigation item until its destination exists.
- Don't use persistent motion. MOTION 1 means hover and state transitions only.

## Decision Log

- **Local-first storage:** use Zustand persistence because InvoiceGen has no server or account flow; this keeps the product promise visible in the UI.
- **Neutral semantic palette:** use the existing neutral theme variables because invoices are document-like and amounts must be easy to scan.
- **One deliberate accent:** reserve `primary` for the main action or focal moment because an accent spread across every control stops guiding attention.
- **Peer summary cards:** keep four equal cards because the dashboard specification defines four peer summary values.
- **Split revenue and status section:** place paid revenue beside status counts because users need both trend context and current invoice state.
- **Recent lists:** show recent invoices and clients after summary data because they are the next operational targets.
- **Lucide icon set:** keep relevant Lucide icons because they match the existing shadcn base-nova primitives and reduce visual inconsistency.
- **Landing dot texture:** neutral dots at 22px visible in light and dark, because landing `/` represents invoice paper.
- **Geist default:** keep Geist because it is already the implemented default, readable for dense data, and compatible with the calm direction.
- **Borders over decorative shadows:** use semantic borders because they separate document surfaces without making every card appear elevated.
