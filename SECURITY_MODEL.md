# Threat model: deloera007-dream/car-dealership

Facts marked **(user)** come from the repository owner's answers (2026-11-11). Everything else is inferred from the code. No infrastructure repository exists, and none was used.

## Deployment context

- **(user)** This is a demo/portfolio project with **no real users**. No real customer PII, payments or production business data are at stake.
- **(user)** All attacker profiles below are in scope.

## System overview

A Next.js 16 (App Router) car dealership marketplace backed by Supabase (Auth, Postgres with RLS, Storage). Customers browse cars, save favourites and book test drives. Admins manage inventory, bookings, dealership settings, homepage content and user roles. An MCP server exposes the same capabilities to AI clients, and an OAuth 2.1 shim (Supabase OAuth server) lets those clients get tokens. A mobile "prototype" mode (`NEXT_PUBLIC_PROTOTYPE_MODE=true`) serves mock-only sell, value, loan and account pages with no backing services.

Request pipeline (`proxy.ts`):
- MCP, OAuth and `/.well-known/*` routes go through Arcjet Shield (WAF) only. They skip bot detection and Supabase cookie refresh.
- In prototype mode, prototype routes (`lib/prototype-mode.ts` `isPrototypeRoute`) bypass Arcjet and Supabase entirely.
- Everything else goes through Arcjet Shield and detectBot, then the Supabase session proxy. That proxy enforces `PROTECTED_ROUTES` (`config/routes.ts`) by redirecting to sign-in. The proxy only checks that a session exists (`getSession`). Authorization happens in server actions and RLS.

## Trust boundaries

1. Browser or MCP client → Next.js server (public internet).
2. Next.js server → Supabase with the caller's JWT (publishable key + user token): RLS applies.
3. Next.js server → Supabase with the **service-role key** (`createAdminClient`, `lib/supabase/supabase.ts`): RLS is bypassed. Used in `actions/cars/add-car.ts`, `update-car.ts`, `delete-car.ts`, `actions/settings/update-dealership-logo.ts`, `remove-dealership-logo.ts` and `app/api/oauth/register/route.ts`.
4. Next.js server → Supabase Auth OAuth endpoints (token proxy `app/api/oauth/token/route.ts`).
5. MCP AsyncLocalStorage boundary: `runWithMcpSupabase` binds the caller's Supabase client, so server actions reused by MCP tools run as the caller. A guest gets `createPublicClient()`.

## Components

| Component | Code |
| --- | --- |
| Web App | `app/(main)` (non-prototype pages), `app/(admin)`, `app/(auth)` pages, `components/`, `hooks/`, `proxy.ts`, `lib/route/*` (safe redirects) |
| Auth | Supabase Auth (email/password, Google OAuth, passkeys), `app/auth/callback/route.ts`, `actions/auth/*`, `lib/supabase/ensure-admin-user.ts`, `app/(auth)/oauth/consent` |
| Server Actions | `actions/cars`, `actions/test-drive`, `actions/admin`, `actions/settings`, `actions/home`, `actions/storage` |
| MCP & OAuth API | `app/api/mcp/route.ts`, `lib/mcp/*` (public/user/admin tools, `verifyMcpToken`), `app/api/oauth/register`, `app/api/oauth/token`, `app/.well-known/*` |
| Database & RLS | `database/*.sql`, `supabase/migrations/*`, `supabase/config.toml`, `supabase/seed.sql` |
| Storage & Uploads | car images and branding/logo buckets (`database/030_storage.sql`, `040_logo_branding.sql`), `lib/helpers/validate-*`, `parse-data-url.ts`, `extract-raster-dimensions.ts`, storage quota actions |
| Prototype Flows | `lib/prototype-mode.ts`, `lib/valuation.ts`, `lib/prototype-inventory.ts`, `lib/vehicle-catalog.ts`, `app/(main)/sell`, `value`, `loans`, `account`, `app/(main)/cars/_components/prototype-marketplace.tsx`, `components/prototype-*`, `schemas/prototype.schema.ts` |

## Entry points and who can reach them

- **Anonymous internet:** public pages (`/`, `/cars`, `/cars/[id]`), sign-in, sign-up and password-reset flows, `/auth/callback?code&redirect`, public server actions (car listing, filters, home content, branding), `/api/mcp` as guest (public tools: `search_cars` etc.), `/api/oauth/register` (dynamic client registration via the service-role fallback), `/api/oauth/token` (proxy to Supabase), `/.well-known/*`. MCP and OAuth return CORS `*`.
- **Signed-in customer (role USER):** saved cars, test-drive booking and cancelling, reservations, passkey management, MCP user tools (Bearer JWT or cookie session).
- **Admin (role ADMIN):** `/admin/*` pages, admin server actions (gated by `ensureAdminUser`), MCP admin tools (gated by `requireAdmin`), user role changes (`actions/settings/update-user-role.ts`, `admin_update_user_role`).
- Server actions are callable directly by any client that holds the action ID, regardless of page route protection.

## Assets and data sensitivity

- **(user)** No real users, so customer PII, bookings and accounts are demo data only. Disclosing them has low real-world impact.
- Auth material: Supabase sessions and refresh tokens, OAuth tokens, passkeys (demo accounts only).
- The ADMIN role, which grants full control of inventory, bookings, site content and other users' roles.
- The Supabase service-role key (`SUPABASE_SECRET_KEY`) and Arcjet key (server env, `config/env.ts`). Leaking these would give control of the Supabase project and billing, which still matters for a demo.
- Integrity of public site content (car listings, homepage, FAQ, logo) and stored XSS against visitors.
- Storage quota (default 50 GB) and bucket contents (cost or abuse).
- Prototype valuations and loans are mock data with no persistence.

## Attacker profiles

**(user)** All in scope:
1. Anonymous internet attacker: hits public pages, server actions, MCP guest tools and OAuth endpoints.
2. Signed-in customer: tries to escalate to ADMIN, or to read or alter other customers' data.
3. Malicious MCP/OAuth client, or a site abusing CORS `*` / cookie-session fallback.
4. Malicious content or upload: crafted images or SVG logos, data URLs.

## Existing controls

- Arcjet Shield WAF on all routes, detectBot on browser routes, token-bucket rate limit (`lib/arcjet.ts`, 10/hour per IP) on specific actions.
- RLS on every app table (`database/020_policies.sql`). Admin checks use `public.is_admin()` (SECURITY DEFINER, `search_path = public`). `user_self_update` / `user_self_insert` let a user write their own `User` row with no column restriction, so the `role` column is **not** protected from self-update (known gap: the 2026-11-11 security scan reported it as critical self-escalation to ADMIN).
- Server-side admin gate `ensureAdminUser()`, MCP `requireUser`/`requireAdmin`, self-role-change guard in `updateUserRole`.
- Safe redirect helper `getSafeRedirectPath` on the auth callback and sign-in redirects.
- Upload validation: magic bytes, raster dimensions, SVG safeguards, file sizes, storage quota.
- Invalid Bearer tokens on MCP raise `InvalidToken` rather than silently downgrading to guest.
- Zod validation on forms and MCP tool inputs.

## Out of scope / accepted risk

- **(user)** Prototype mode (sell, value, loans and account mock flows, the **Prototype Flows** component) is demo-only. Lower findings that only affect it.
- **(user)** The MCP/OAuth endpoints (the **MCP & OAuth API** component) are experimental. Lower findings that only affect them.
- **(user)** Demo/portfolio with no real users. Findings whose only impact is disclosure or tampering of customer data are lower impact. Findings that lead to service-role key or Supabase project compromise, admin takeover, or code execution are not lowered for this reason.

## Open questions

- Where is it hosted, and is `NEXT_PUBLIC_PROTOTYPE_MODE` ever enabled in a deployed environment?
- Hosted Supabase project settings: are email confirmation and OAuth dynamic registration enabled?
