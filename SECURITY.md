# Security audit — 2026-11-10

## Scope and result

Reviewed the current tracked working tree: dependencies and both lockfiles; 54 files under `actions/`; all three `app/api/` handlers; OAuth/OIDC discovery routes; MCP authentication and public/user/admin tools; uploads and injection sinks; `.example.env`, scripts and Supabase configuration; all application SQL schemas, functions, RLS and storage policies. Git history was explicitly excluded.

Critical/high findings below are remediated **in this branch**, not in a deployed database. Apply `supabase/migrations/20261110000001_security_hardening.sql` before declaring the database fixed. No production project was modified. Medium/low findings marked **Open** remain recommendations, not accepted risks on the owner's behalf.

Severity describes potential impact and prerequisites. Dependency advisory severity is the registry's rating, not proof that every affected feature is reachable here. This is a source/configuration audit with local regression tests, not a live penetration test or a guarantee that no other vulnerabilities exist.

## Critical

### C1 — Profile RLS permitted self-promotion to ADMIN — Fixed; migration required

- **Evidence:** `database/020_policies.sql:35-45` checked the profile owner but did not constrain `role`; matching original migration: `supabase/migrations/20261004000003_policies.sql:35-45`. `public.is_admin()` trusts this field (`database/010_functions.sql:65-77`). A signed-in customer could directly insert/update their profile to ADMIN through the database API, bypassing all application admin guards and gaining inventory, customer and storage privileges.
- **Verification:** reproduced an ordinary account obtaining `role = 'ADMIN'` on a disposable PostgreSQL database using the original policies. Post-fix checks deny privileged inserts, role changes, primary-key changes and auth-identity reassignment, while permitting normal profile edits and authorized admin role changes.
- **Fix:** `database/050_security_hardening.sql:3-36` adds a privilege/identity trigger and constrains self-inserts to USER. The identical timestamped migration is the deployable fix. Non-user service/database maintenance remains trusted.
- **Rollout:** inspect existing ADMIN accounts and auth/audit logs; this migration cannot identify accounts already promoted by an attacker. Demote unexpected accounts and revoke affected sessions using normal incident-response procedures if evidence warrants it.

### C2 — Critically vulnerable Next.js dependency — Fixed

- **Evidence:** `package.json:46` previously pinned `next@16.3.5`. `npm audit` reported critical advisories, including [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) (`use cache` typed-array RCE), as well as image-processing, caching and development-server advisories.
- **Fix:** upgraded Next.js to **16.4.6** and regenerated both `package-lock.json` and `yarn.lock`. Current `npm audit --json` reports zero vulnerabilities. No application-level RCE exploitation was attempted or demonstrated.

## High

### H1 — Other vulnerable runtime/build/test dependencies — Fixed

- **Evidence:** the initial npm audit reported **1 critical, 5 high and 4 moderate vulnerable package entries** in total. High entries besides Next.js were `sharp`, `source-map-js`, `undici`, `vite` and `zod`; moderate entries included Vitest/mocker, its coverage adapter and baseline-browser-mapping. Representative advisories: [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [undici](https://github.com/advisories/GHSA-2m5v-pch6-74hx), [Vite](https://github.com/advisories/GHSA-rq7h-c2jc-7f22), [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [Vitest](https://github.com/advisories/GHSA-qxg6-89mg-rqv8).
- **Fix:** `package.json:60,74,80-82` now uses Zod **4.6.7**, Vite **8.3.7**, Vitest and coverage-v8 **5.1.0**. Lockfile refresh also resolves sharp **0.35.5**, source-map-js **1.2.2**, undici **8.12.4** and baseline-browser-mapping **2.11.35**. Both npm and Yarn audits report zero vulnerabilities. Development-server advisories require the corresponding tooling/features to be exposed; they are not automatically production exploits.

### H2 — Public OAuth registration could bypass upstream controls via admin fallback — Fixed

- **Evidence:** `app/api/oauth/register/route.ts:179-241` previously fell through to the service-role admin API on upstream errors, including rejection/rate-limit responses and network failures. Dynamic registration is intentionally unauthenticated, but this fallback could turn public registration restrictions into privileged client creation and resource abuse. It was not an admin-user login bypass.
- **Fix:** Arcjet protection now runs **before either registration path**, returning 429 on denial and 503 on limiter failure (`app/api/oauth/register/route.ts:49-64`). The LIVE token bucket allows an initial 10 requests and refills 10/hour (`lib/arcjet.ts`). Only explicit upstream **404/405** responses enable the compatibility fallback (`app/api/oauth/register/route.ts:209-241`); other failures do not. Only validated/allowlisted metadata is forwarded.
- **Regression:** tests cover denied/erroring/thrown limiter decisions, upstream 400/401/403/429/500 rejection, network failure, and a valid 404 compatibility fallback. Live Arcjet/Supabase registration was not exercised. Per-IP throttling does not replace monitoring or controls against distributed abuse.

### H3 — MCP cookie authentication lacked a cross-origin boundary — Fixed

- **Evidence:** `lib/mcp/auth.ts:113-145` previously promoted any attached valid cookie session without checking Origin/Fetch Metadata. `app/api/mcp/route.ts:52-88` also normalized explicit `text/plain` requests into JSON. If a browser attached session cookies (for example, a same-site sibling origin), a cross-origin request could attempt authenticated MCP mutations. Browser cookie policy is a prerequisite; wildcard CORS alone does not make cookies readable or prove exploitability.
- **Fix:** cookie fallback requires a matching configured origin when Origin is supplied and rejects cross-site/same-site Fetch Metadata. Cross-origin clients must present an explicitly verified bearer token. Explicit non-JSON POST media types receive **415**. Missing Content-Type remains supported for native MCP probes; origin checks are independent of that compatibility behavior.
- **Regression:** cross-origin/same-site cookie rejection, same-origin cookie success, explicit invalid bearer rejection and cross-origin valid bearer success are covered in `__tests__/mcp/auth.test.ts`; media-type rejection is covered in `__tests__/app/api/mcp/route.test.ts`. Requests without browser origin headers remain supported for non-browser clients; they still need valid credentials.

## Medium

### M1 — Booking RLS allowed customer-controlled workflow and data changes — Fixed; migration required

- **Evidence:** `database/020_policies.sql:196-217` checked ownership without restricting inserted status or updated fields. Direct database callers could forge a completed/confirmed booking or change their own booking's vehicle/time instead of using the limited cancellation action.
- **Fix:** `database/050_security_hardening.sql:39-74` requires PENDING on owner inserts and permits ordinary owners only to cancel PENDING/CONFIRMED bookings without changing other business fields. Admin updates remain available. SQL regressions deny forged statuses, time changes, reopening cancelled bookings and cross-owner access.
- **Residual:** the database still does not enforce every booking business rule (available inventory, future date, opening hours and per-user quotas) on direct inserts. Those checks exist in `actions/test-drive/book-test-drive.ts`, but an authenticated database client can bypass application-only validation. Add database constraints/transactional RPCs for business invariants if direct API abuse is a concern.

### M2 — SECURITY DEFINER storage-usage RPC was publicly callable — Fixed; migration required

- **Evidence:** `database/010_functions.sql:81-87` aggregated storage usage while bypassing table RLS and lacked an authorization check; functions are executable by PUBLIC by default.
- **Fix:** `database/050_security_hardening.sql:77-95` adds an explicit `is_admin()` check, a fixed empty search path, and revokes PUBLIC/anon execution. Authenticated non-admin calls fail; admin calls succeed in local SQL tests. CREATE privileges on `public` are also revoked from application roles to prevent future object-shadowing opportunities. Trigger-only helpers cannot be invoked as public RPCs.

### M3 — Production could skip environment validation — Fixed

- **Evidence/fix:** `config/env.ts:93-107` now rejects `SKIP_ENV_VALIDATION=true` when either process or supplied runtime environment is production. Production prototype mode no longer supplies placeholder credentials. `.github/workflows/ci.yml:89-119` no longer uses the bypass for builds and checks required server secrets as well as public Supabase settings. Test-mode skipping is retained.
- **Regression:** production/process/runtime bypass and prototype-placeholder rejection are covered by `__tests__/config/env.test.ts`. Missing real build configuration now causes a hard error rather than a falsely successful placeholder build.

### M4 — OAuth redirect URIs and registration metadata were weakly validated — Fixed

- **Evidence/fix:** `app/api/oauth/register/route.ts:15-32,100-169` now parses absolute URIs, accepts HTTPS or domain-based private-use schemes (RFC 8252), and rejects HTTP, script/data/file/opaque schemes, credentials, fragments, whitespace, backslashes and malformed URLs. Limits: 10 redirect URIs and 2,048 characters per URI. Registration also validates client metadata, grants, response types and public-client authentication method.
- **Behavior:** native clients should use a scheme such as `com.example.desktop:/callback`. Plain HTTP loopback callbacks and non-domain custom schemes are intentionally rejected under this policy. HTTPS and private-scheme URIs are not fetched by this route; validation is not an SSRF filter for arbitrary future fetch callers. Unsafe URI and malformed-body regression cases are included.

### M5 — OAuth diagnostics could disclose transient credentials — Fixed

- **Evidence/fix:** `scripts/verify-supabase-jwks.mjs:112-184` no longer logs authorization redirects/IDs, authorization codes, decoded ID-token claims or full token error responses. `app/api/oauth/token/route.ts:74-79` logs upstream status, not the response body. JWKS public keys and success/status metadata are not secrets.
- **Residual:** do not run the manual OAuth simulation with production accounts in shared logs. Third-party error objects may still include operational/PII details; review logging configuration and retention before production diagnostics.

### M6 — Unescaped PostgREST logical-filter interpolation — Open

- **Evidence:** `actions/cars/get-public-cars.ts:107-127` and `actions/cars/get-cars.ts:38-57` interpolate search text into `.or()` filter grammar. Commas/parentheses/operators can change query parsing or cause errors instead of remaining literal search text.
- **Impact:** filter manipulation/unreliable searches, **not demonstrated SQL execution**. Independent RLS still applies; public inventory read policies already expose all car rows. No raw SQL execution path was found.
- **Recommendation:** bound search length and quote/escape values according to PostgREST's grammar, or move search to a parameterized database function/full-text search. Cover commas, parentheses, quotes, percent signs and Unicode in regressions.

### M7 — Car-image uploads trust declared content type and derived extension — Open

- **Evidence:** `actions/cars/add-car.ts:25-35,99-134` and `actions/cars/update-car.ts` enforce admin access and byte limits but derive an object extension from client-controlled `File.type`, without a server-side MIME allowlist, magic-byte checks or decoding/re-encoding. Whole client filenames are not used for car paths: the parent folder is a generated UUID. A crafted MIME subtype can still affect the suffix/path.
- **Impact:** an authorized/compromised admin can host unexpected or active content in a public storage origin, or create malformed assets. This is **not** an unauthenticated upload or a confirmed application-origin stored-XSS exploit. Direct admin storage writes also need bucket-level validation.
- **Recommendation:** decode/re-encode allowed raster images; generate extensions from the decoded format; bound image count and total payload bytes; enforce storage MIME/size limits. Keep assets on a separate origin. Logo handling is stronger: schema, MIME/extension consistency, decoded byte limits, raster signatures/dimensions and SVG checks exist in `lib/helpers/validate-and-prepare-logo-upload.ts:213-269`, and storage paths are generated in `lib/helpers/build-versioned-logo-path.ts:13`.

### M8 — Storage quota checks fail open and are non-atomic — Open

- **Evidence:** `actions/storage/get-storage-usage.ts:18-32` returns zero on RPC failure; `actions/storage/check-storage-quota.ts:18-24` then may allow uploads. The aggregate counts database metadata rather than actual bucket usage, and checking before uploading is not a reservation transaction.
- **Impact:** admins can exceed intended quotas during an RPC outage, concurrent uploads, failed metadata writes or direct storage writes. This is a capacity/billing control weakness, not a non-admin write authorization bypass.
- **Recommendation:** fail closed for upload admission, separate display fallbacks from admission checks, and reconcile/atomically reserve actual usage. Note: non-admin storage-meter calls now receive no sensitive aggregate because M2 is fixed; their existing zero fallback should not be interpreted as real usage.

### M9 — Weak configured minimum password policy — Open

- **Evidence:** `supabase/config.toml:183-186` permits six-character passwords without additional password requirements. Email confirmation and refresh-token rotation are enabled (`supabase/config.toml:172-175,227`), and auth rate limits are configured (`supabase/config.toml:198-218`), but these do not strengthen a weak password.
- **Recommendation:** choose a longer password/passphrase minimum, enable supported breached-password protection, and require stronger authentication for administrator accounts. Validate the hosted Supabase project's effective settings separately: the local TOML is not proof of live configuration.

## Low

### L1 — Mixed public/server environment module lacks a strict import boundary — Open

- **Evidence:** client components import `config/env` at `components/admin/storage-meter.tsx:18` and `components/car/car-image-uploader.tsx:10`; browser Supabase setup also imports it (`lib/supabase/supabase-client.ts:3`). That module exports both schemas and is typed as the server Env even when client validation strips private fields (`config/env.ts:30-47,93`).
- **Result:** no client reference to `serverEnvSchema`, `env.SUPABASE_SECRET_KEY` or `env.ARCJET_KEY` was found. Actual secret dereferences are in server consumers: `lib/supabase/supabase.ts:112-118`, `lib/supabase/supabase-env-server.ts:18`, `lib/arcjet.ts:12`, plus the Node-only verification script. Non-`NEXT_PUBLIC_` variables are not automatically inlined into browser code, and the client Zod schema omits them. **No actual secret leak was established**, but shared imports make future misuse easier; the server helper's name/comment is not a `server-only` enforcement marker.
- **Recommendation:** split public limits/client environment from a module guarded with `import 'server-only'`; give client validation a client-only type. A production browser-bundle secret scan was not possible because the build lacked configured credentials.

### L2 — Public inventory reads and broad default grants — Open

- **Evidence:** `database/020_policies.sql:4-9,68-71` grants broad table privileges before RLS and permits SELECT on **every** Car row/column, including SOLD/UNAVAILABLE inventory, number plates, storage accounting and timestamps. The public UI applies additional filters, but a direct API caller does not have to use them.
- **Recommendation:** confirm those fields/statuses are intentionally public; otherwise expose a restricted public view and tighten policies. Existing tables all have RLS, but default grants automatically apply to future tables: require RLS before exposing any new table or replace broad default grants with explicit grants.

### L3 — CSS HTML sink is safe only for trusted configuration — Reviewed / hardening recommendation

- **Evidence:** `components/ui/chart.tsx:72-101` uses `dangerouslySetInnerHTML` to build a style block from chart ID/config keys/colors. No current call site taking customer/database-controlled chart config was found; no reachable arbitrary HTML injection was established.
- **Recommendation:** keep these inputs code-controlled. Before accepting external chart configuration, validate IDs/CSS identifiers and color values or eliminate string HTML construction; a `</style>` payload would be unsafe if it reached server-rendered raw HTML. No `eval`, `new Function`, or application raw-SQL execution sink was found in the reviewed source. The SQL fixture runner intentionally uses dynamic EXECUTE for constant test statements only.

### L4 — Implicit session checks and unnecessary action exposure — Fixed / defense in depth

- **Fixes:** `actions/auth/list-user-passkeys.ts:18-23` and `actions/auth/delete-user-passkey.ts:20-25` now verify the current user explicitly before the auth-provider operation. The provider already supplied an authentication boundary; no cross-user passkey deletion was demonstrated. `proxy.ts:126-129` now uses verified `getUser()` rather than trusting `getSession()` for routing decisions. The internal client-taking helper `actions/cars/get-or-create-db-user.ts:1` no longer has `use server`, so it is not independently registered as a remotely callable Server Action; its callers pass a verified user and RLS-bound client.

## Authorization coverage

All 54 action modules were reviewed. No unguarded admin mutation was found at the application layer; C1 was the database bypass underneath those guards. Public read-only helpers deliberately do not require a login. Mutating entry points and their authorization boundaries:

| Operation | Guard evidence |
| --- | --- |
| Add/update car | `actions/cars/add-car.ts:64-77`; `actions/cars/update-car.ts:42-55`: verified user + ADMIN |
| Delete car / change inventory status | `actions/cars/delete-car.ts:24`; `actions/cars/update-car-status.ts:26`: `ensureAdminUser()` |
| Add/update/delete/reorder FAQ | `actions/home/add-faq.ts:31-40`; `actions/home/update-faq.ts:33-42`; `actions/home/delete-faq.ts:25-34`; `actions/home/reorder-faqs.ts:28-37`: verified user + ADMIN |
| Update homepage copy | `actions/home/update-home-page-content.ts:31-40`: verified user + ADMIN |
| Dealership info / hours / logo upload / logo removal | `actions/settings/update-dealership-info.ts:34`; `actions/settings/save-working-hours.ts:32`; `actions/settings/update-dealership-logo.ts:32`; `actions/settings/remove-dealership-logo.ts:24`: `ensureAdminUser()` |
| Change user roles | `actions/settings/update-user-role.ts:26`: admin helper + rejects own-role change |
| Admin booking status | `actions/admin/update-test-drive-status.ts:33-46`: verified user + ADMIN |
| Create/cancel test drive | `actions/test-drive/book-test-drive.ts:40`; `actions/test-drive/cancel-test-drive.ts:32,82`: verified user; own booking or admin for cancellation; SQL limits owner transitions |
| Toggle wishlist | `actions/cars/toggle-saved-car.ts:31`: verified user, derived owner ID and owner RLS |
| Create own profile | `actions/auth/ensure-profile.ts:26`: verified user; internal get-or-create helper is not a public Server Action; C1 adds DB privilege protection |
| Password update / passkey deletion | `actions/auth/update-password.ts:26`; `actions/auth/delete-user-passkey.ts:23`: verified current user + auth-provider ownership |
| Password-reset request | `actions/auth/request-password-reset.ts:22`: deliberately public recovery operation; delegates to Supabase email/rate-limit controls, not a session-authorized password change |
| Sign out | `actions/auth/sign-out.ts:20`: signs out only the caller's cookie-bound session; deliberately idempotent without a separate login requirement |

Admin reads (`actions/admin/get-admin.ts:20-30`, `actions/admin/get-dashboard-data.ts:31-43`, `actions/admin/get-admin-test-drives.ts:36-49`, `actions/settings/get-users.ts:21`) are admin-guarded. Own-user, own-booking and own-wishlist reads authenticate and/or rely on owner RLS. `getStorageUsage` now has database-side admin authorization (M2), even though its display-oriented action still returns zero on denial (M8).

Every admin MCP tool calls `requireAdmin` (`lib/mcp/tools/admin.ts:32-500`); each private user tool calls `requireUser` (`lib/mcp/tools/user.ts:41-160`). `whoami` deliberately returns GUEST without authentication. Public tools expose public inventory/site data. Guards check a role read from the database, not untrusted user metadata (`lib/mcp/auth.ts:184-204`); bearer identity is verified with Supabase `getUser(token)` before that role is loaded (`lib/mcp/auth.ts:85-109`).

## API and CORS decision

- **`/api/oauth/register`:** intentionally public dynamic registration; route-level fail-closed Arcjet rate limiting covers the upstream path and the service-role compatibility path. URI/metadata validation and fallback restrictions are described above.
- **`/api/oauth/token`:** intentionally public proxy of code/refresh exchanges; it forwards explicit client credentials to a fixed configured Supabase URL, not to a caller-supplied host. Upstream GoTrue validates grant, code/PKCE, client and refresh tokens. Token responses use `Cache-Control: no-store` and `Pragma: no-cache` (`app/api/oauth/token/route.ts:81-85`). Local GoTrue auth rate limits exist; live deployment settings and load behavior were not tested.
- **`/api/mcp`:** GET/POST/DELETE delegate to authenticated MCP transport; OPTIONS/HEAD are public protocol/health responses (`app/api/mcp/route.ts`). Cookie and bearer trust boundaries are covered under H3. All privileged tool handlers still enforce their role checks.
- **Discovery/JWKS:** `app/.well-known/jwks.json/route.ts`, `app/.well-known/oauth-authorization-server/[[...resource]]/route.ts`, `app/.well-known/oauth-protected-resource/[[...resource]]/route.ts`, and `app/.well-known/openid-configuration/[[...resource]]/route.ts` expose public metadata/public signing keys. Issuer and resource URLs derive from configured site/Supabase URLs, not client redirect URIs.
- **Wildcard CORS is retained deliberately** for public discovery, dynamic registration/token exchange and interoperability with third-party bearer-token MCP clients. These responses do **not** opt into `Access-Control-Allow-Credentials: true`. Browser code cannot read authenticated cookie responses via wildcard CORS, but CORS is not authentication, authorization or CSRF prevention: same-origin cookie verification and tool guards are separate controls. Keep `NEXT_PUBLIC_SITE_URL` set to the canonical production origin. If only first-party browser integrations are wanted, replace the wildcard with an explicit origin allowlist and `Vary: Origin`; do not reflect arbitrary origins with credential support.
- **Further hardening:** registration and token handlers read bodies without application-specific byte caps/timeouts. Set gateway/request-size limits and upstream timeouts to bound memory/worker consumption. Arcjet registration throttling and hosted platform limits reduce but do not eliminate this concern. No live load test was performed.

## Supabase RLS and storage coverage

All **10 application tables** enable RLS in `database/020_policies.sql:12-21` and the matching original migration. This repository calls its wishlist `UserSavedCar` and bookings `TestDriveBooking`; there are no separate `Wishlist`/`TestDrive` tables in the schema.

| Table | Read policy | Write policy after security migration |
| --- | --- | --- |
| `User` | Own profile / admin | Own profile insert/edit with role/identity guard; admin management |
| `Car` | Public, all rows (L2) | Admin only |
| `CarMake`, `CarColor` | Public | Admin only |
| `UserSavedCar` | Owner only | Owner insert/delete; no UPDATE policy |
| `TestDriveBooking` | Owner / admin | Owner PENDING insert, limited cancellation; admin update/delete |
| `DealershipInfo`, `WorkingHour` | Public | Admin only |
| `HomePageContent`, `FAQ` | Public | Admin only |

`database/030_storage.sql:6-14,27-82` creates public-read **car-images** and **branding-assets** buckets and requires `public.is_admin()` for object insert/update/delete; `database/040_logo_branding.sql:24-50` recreates equivalent branding policies. Public image/logo reads are intentional and **must not contain private documents**. Storage RLS/roles are Supabase infrastructure assumptions, not created by these application migrations. Service-role clients bypass RLS and are used only after server-side admin validation for uploads/deletion. Local tests check anonymous/customer upload denial, public image reads, admin writes and denial of bucket reassignment outside the allowed buckets. Actual hosted Storage API/CDN behavior was not exercised.

The local SQL verification used PostgreSQL 17 with minimal Supabase-compatible `auth.uid()`, roles and storage tables plus the actual application SQL; it was not a full hosted Supabase stack. `database/security-regression.sql` runs transactionally with rolled-back fixtures against a disposable database. Run it with `psql -v ON_ERROR_STOP=1 -f database/security-regression.sql` after applying the schema and all numbered migrations. Never run fixtures in production. See `database/README.md` for migration/manual-install ordering.

## Secrets review

- Pattern-scanned **430 tracked text files** at the start of the audit for private keys, Supabase secret keys/JWTs, Arcjet keys, GitHub tokens and AWS access keys; no real committed credential was found. Manual review included `.example.env`, `supabase/config.toml` and `scripts/`. Examples contain placeholders; TOML provider/S3/OpenAI credentials use `env(...)` references. A public project URL/ID or publishable key is not a service-role secret. Pattern scans cannot prove that arbitrary unknown secrets are absent.
- Real `SUPABASE_SECRET_KEY` and `ARCJET_KEY` usages were found only in server-side consumers/Node scripts; shared-module import concerns and the untested production browser bundle are disclosed under L1. Neither private key is configured with a `NEXT_PUBLIC_` name.
- Git history, ignored/untracked environment files, deployed secrets and external log retention were outside the requested scan. Rotate any real credentials if they have ever been committed previously; no history was inspected to determine that here.

## Verification

Executed locally after remediation:

| Command / check | Result |
| --- | --- |
| `npm audit --json` | **0 vulnerabilities** (initially 1 critical / 5 high / 4 moderate) |
| `yarn audit --json` | **0 vulnerabilities**; confirms the CI-preferred Yarn dependency tree |
| `npm exec -- vitest run` | **75 files, 727 tests passed** |
| `npm exec -- biome check .` | **Passed**, 408 checked files at execution time |
| `npm exec -- tsc --noEmit` | **Passed** |
| SQL hardening + `database/security-regression.sql` | **Passed**, including denied self-promotion and preserved admin access |
| `git diff --check` | **Passed** |
| `npm exec -- next build` | **Blocked by missing configuration**: Supabase URL/public key/server key and ARCJET_KEY are not set on this VM. Validation correctly fails; a complete production build/browser-bundle check was **not** verified. |

`npm exec` uses the locally installed repository tools, equivalent to `yarn vitest run` / `yarn biome check .`. Both lockfiles were retained because the repository supplies both and CI selects Yarn. Live OAuth providers, Arcjet service decisions, deployed Supabase RLS/storage state, browser flows and production builds require separately configured environments; local mocks/SQL checks are not substitutes for that validation.
