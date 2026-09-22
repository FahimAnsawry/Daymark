# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the current Daymark landing page and language: busy people who need to collect open loops, choose what matters today, and leave room for rest, relationships, and ordinary life.

## Product Purpose

Inferred: Daymark is a personal daily-planning tool that turns the small things on a person's mind into a clear, kind plan they can follow. Success means helping someone move through the day with less mental noise and more intention, rather than creating another system to maintain.

## Positioning

Inferred: Daymark's distinctive mechanism is an intentionality-first daily view that balances tasks with the shape of a person's life. It is presented as a gentler alternative to productivity systems centered only on throughput, urgency, or maintaining a large task list.

## Operating Context

The product is a web SPA served by Vite in development and backed by a Laravel HTTP API. The public experience includes a landing page plus login and registration flows. Authentication uses API tokens stored by the frontend and routes users back to the landing page after sign-in or registration.

## Capabilities and Constraints

- React 19 + TypeScript frontend with Vite, TanStack Router, TanStack Query, Tailwind CSS v4, and Lucide icons.
- Laravel 11+ backend API with Sanctum token authentication and PostgreSQL configuration.
- Current API capabilities include health diagnostics, registration, login, logout, authenticated-user lookup, and a demo task CRUD surface.
- Preserve existing route contracts, authentication behavior, mobile navigation behavior, and accessible semantics when changing the UI.
- The current product copy uses the Daymark name, a calm editorial voice, and the terms “daily plan,” “open loops,” “room to live,” and “real life.”
- Product scope beyond the currently implemented demo task/auth flows is undecided; do not invent production workflows, customers, pricing, benchmarks, testimonials, or deployment claims.

## Brand Commitments

- Name: Daymark.
- Existing identity: the Daymark wordmark and `BrandMark` component in `frontend/src/components/BrandMark.tsx`.
- Voice commitment inferred from shipped copy: calm, kind, intentional, human, and concise; avoid guilt-driven productivity language.
- Existing visual identity is an incumbent implementation, not a new visual-world brief. Future work should preserve product truth and behavior unless a redesign is explicitly requested.

## Evidence on Hand

- Public landing page and copy: `frontend/src/routes/index.tsx`.
- Shared visual tokens and responsive styles: `frontend/src/index.css`.
- Authentication UI: `frontend/src/components/AuthPage.tsx`, `frontend/src/routes/login.tsx`, and `frontend/src/routes/register.tsx`.
- Brand mark: `frontend/src/components/BrandMark.tsx`.
- API routes: `backend/routes/api.php` and `backend/app/Http/Controllers/Api/AuthController.php`.
- Repository overview and local run instructions: `README.md`.
- No verified customer research, testimonials, pricing, production metrics, or deployment evidence is present in the repository; future work must not fabricate these.

## Product Principles

These principles are inferred from the current product copy and implementation:

1. Reduce mental noise before adding complexity.
2. Help people choose the next right thing, not optimize every minute.
3. Make room for rest, relationships, and life outside the task list.
4. Keep the product welcoming, clear, and low-pressure.
5. Preserve reliable, accessible interactions across desktop and mobile web.

## Accessibility & Inclusion

Formal standard is an open decision pending user confirmation. The current implementation already signals keyboard and reduced-motion considerations; future UI work should preserve semantic structure, visible focus, keyboard operation, readable contrast, responsive behavior, and the `prefers-reduced-motion` accommodation.
