# Database & Supabase Configuration

This project manages Supabase declarative configuration and database migrations directly in code using the **Supabase CLI**.

---

## 1. Directory Structure

* **`supabase/config.toml`**: Declarative platform settings (Auth providers, Google OAuth via `.env`, email confirmation, storage limits, API and pooler settings).
* **`supabase/migrations/`**: Version-controlled SQL migrations executed in chronological order:
  * `20260622173923_check_storage_columns.sql` (legacy migration)
  * `20261004000001_schema.sql` (enums, tables, indexes, default makes/colors)
  * `20261004000002_functions.sql` (triggers, updated_at, `is_admin()`, storage tracking)
  * `20261004000003_policies.sql` (privileges, Row Level Security, table policies)
  * `20261004000004_storage.sql` (storage buckets & RLS policies for `car-images` and `branding-assets`)
  * `20261004000005_logo_branding.sql` (branding metadata columns)
  * `20261110000001_security_hardening.sql` (protects profile privileges, booking transitions, and storage RPC access)
* **`supabase/seed.sql`**: Initial development seed data applied during `supabase db reset`.
* **`database/`**: Legacy standalone SQL scripts preserved for manual reference.

Apply the security migration to existing deployments before treating the audit fixes as deployed. For manual installations, run `database/050_security_hardening.sql` after the earlier numbered scripts; do not rerun older permissive policy scripts afterward. Review existing ADMIN accounts: the migration prevents new self-promotion but cannot identify accounts promoted before the fix.

`database/security-regression.sql` runs transactional authorization checks against a disposable local Supabase database (`psql -v ON_ERROR_STOP=1 -f database/security-regression.sql`). It verifies profile privilege/identity protection, owner isolation, booking transitions, storage bucket permissions, and admin RPC access. Fixtures are rolled back. Never run test fixtures against production.

---

## 2. Environment Variables (`.env`)

For Auth and OAuth provider configuration, secrets and credentials are kept in `.env` and referenced dynamically in `supabase/config.toml`:

```env
# Supabase CLI Auth (Google OAuth)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="<your-google-client-id>"
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="<your-google-client-secret>"
```

In `supabase/config.toml`:
```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = false
email_optional = false
```

---

## 3. Common Supabase CLI Commands

Commands can be run via `npm run` or `yarn`:

| Command | Description |
| :--- | :--- |
| `npm run supabase:config:diff` | Compare local `supabase/config.toml` against the linked remote project |
| `npm run supabase:config:push` | Push local `config.toml` declarative settings to the linked project |
| `npm run supabase:migration:list` | List local vs remote migrations status |
| `npm run supabase:db:push` | Push pending local migrations to the remote database |
| `npm run supabase:migration:new <name>` | Create a new timestamped migration file in `supabase/migrations/` |
| `npm run supabase:gen-types` | Regenerate TypeScript types from the database schema |
| `npm run supabase:start` | Start local Supabase Docker / Podman containers |
| `npm run supabase:stop` | Stop local Supabase containers |
