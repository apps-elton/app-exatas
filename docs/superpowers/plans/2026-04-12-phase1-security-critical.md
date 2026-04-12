# Phase 1: Security Critical - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and high-severity security vulnerabilities so the system is safe for real users.

**Architecture:** All security enforcement moves to database-level RLS policies and PostgreSQL functions. Client-side checks remain for UX but are no longer the security boundary. A helper function `get_my_tenant_id()` already exists and will be used for tenant isolation. A new `is_superadmin()` function already exists and will be used for admin checks.

**Tech Stack:** PostgreSQL (Supabase), SQL migrations, Vercel headers config

**Findings covered:** F1, F2, F3, F5, F6, F8, F17

**Note:** F4 (rate limiting) is a Supabase dashboard configuration, not a code change. F7 (audit log) and F18 (Edge Functions) are deferred to Phase 3 because they require more architectural changes.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260412000001_fix_subscribers_rls.sql` | Fix permissive RLS on subscribers |
| Create | `supabase/migrations/20260412000002_enable_rls_all_tables.sql` | Enable RLS + policies for all unprotected tables |
| Create | `supabase/migrations/20260412000003_protect_role_escalation.sql` | Prevent role field manipulation |
| Create | `supabase/migrations/20260412000004_validate_rpc_inputs.sql` | Add input validation to RPC functions |
| Create | `supabase/migrations/20260412000005_enforce_project_limits.sql` | Enforce subscription project limits via RLS |
| Modify | `vercel.json` | Add security headers |

---

### Task 1: Fix Permissive RLS on Subscribers Table (F1)

**Files:**
- Create: `supabase/migrations/20260412000001_fix_subscribers_rls.sql`

**Context:** The `subscribers` table has `update_subscription` and `insert_subscription` policies that use `USING (true)` / `WITH CHECK (true)`. This means any authenticated user can modify any subscription. The original intent was for Supabase Edge Functions (using service_role key) to manage subscriptions, but the policies are too broad.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Fix F1: Subscribers table has overly permissive UPDATE and INSERT policies.
-- Drop the permissive policies and replace with restrictive ones.

-- Drop existing permissive policies
DROP POLICY IF EXISTS "update_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Users can only update their own subscription (for non-sensitive fields like updated_at).
-- Actual plan changes should go through Edge Functions using service_role key.
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only the user themselves can insert their own subscription row.
-- Edge Functions using service_role key bypass RLS entirely.
CREATE POLICY "insert_own_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy - users should not delete subscription rows
CREATE POLICY "no_delete_subscription" ON public.subscribers
FOR DELETE
USING (false);
```

- [ ] **Step 2: Apply the migration to Supabase**

Run: `npx supabase db push` or apply via Supabase Dashboard > SQL Editor

Expected: Migration applies successfully, no errors.

- [ ] **Step 3: Verify the fix**

Run this SQL in Supabase SQL Editor to confirm policies:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'subscribers';
```

Expected: 3 policies visible:
- `select_own_subscription` (SELECT) - unchanged
- `update_own_subscription` (UPDATE) - `auth.uid() = user_id`
- `insert_own_subscription` (INSERT) - `auth.uid() = user_id`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260412000001_fix_subscribers_rls.sql
git commit -m "fix(security): restrict subscribers RLS policies - F1"
```

---

### Task 2: Enable RLS on All Unprotected Tables (F2, F17)

**Files:**
- Create: `supabase/migrations/20260412000002_enable_rls_all_tables.sql`

**Context:** Tables `profiles`, `tenants`, `projects`, `subscriptions`, `audit_log`, `system_settings`, `tenant_invites`, `support_tickets`, `ticket_messages` may not have RLS enabled. We need RLS + tenant-scoped policies on every table. The `is_superadmin()` and `get_my_tenant_id()` functions already exist in the database.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Fix F2 + F17: Enable RLS on all tables and add tenant-scoped policies.
-- Uses existing functions: is_superadmin(), get_my_tenant_id()

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can read profiles in their tenant
CREATE POLICY "profiles_select_tenant" ON public.profiles
FOR SELECT
USING (tenant_id = get_my_tenant_id());

-- Superadmins can read all profiles
CREATE POLICY "profiles_select_superadmin" ON public.profiles
FOR SELECT
USING (is_superadmin());

-- Users can update their own profile (name, avatar only - role protected in Task 3)
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Superadmins can update any profile
CREATE POLICY "profiles_update_superadmin" ON public.profiles
FOR UPDATE
USING (is_superadmin());

-- Profiles are created by auth triggers, not directly
CREATE POLICY "profiles_insert_self" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- No direct deletes
CREATE POLICY "profiles_no_delete" ON public.profiles
FOR DELETE
USING (false);

-- ============================================================
-- TENANTS
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Users can see their own tenant
CREATE POLICY "tenants_select_own" ON public.tenants
FOR SELECT
USING (id = get_my_tenant_id());

-- Superadmins can see all tenants
CREATE POLICY "tenants_select_superadmin" ON public.tenants
FOR SELECT
USING (is_superadmin());

-- Only superadmins can modify tenants
CREATE POLICY "tenants_update_superadmin" ON public.tenants
FOR UPDATE
USING (is_superadmin());

-- Tenant creation goes through create_school_and_link_admin RPC (SECURITY DEFINER)
CREATE POLICY "tenants_insert_superadmin" ON public.tenants
FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "tenants_no_delete" ON public.tenants
FOR DELETE
USING (false);

-- ============================================================
-- PROJECTS
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can see their own projects
CREATE POLICY "projects_select_own" ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

-- Users in same tenant can see tenant projects
CREATE POLICY "projects_select_tenant" ON public.projects
FOR SELECT
USING (tenant_id = get_my_tenant_id() AND tenant_id IS NOT NULL);

-- Public projects are visible to all authenticated users
CREATE POLICY "projects_select_public" ON public.projects
FOR SELECT
USING (is_public = true);

-- Superadmins can see all
CREATE POLICY "projects_select_superadmin" ON public.projects
FOR SELECT
USING (is_superadmin());

-- Users can insert their own projects
CREATE POLICY "projects_insert_own" ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "projects_update_own" ON public.projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "projects_delete_own" ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Superadmins can manage all projects
CREATE POLICY "projects_all_superadmin" ON public.projects
FOR ALL
USING (is_superadmin());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can see their own subscription
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Superadmins can see all
CREATE POLICY "subscriptions_select_superadmin" ON public.subscriptions
FOR SELECT
USING (is_superadmin());

-- Only superadmins can modify subscriptions directly.
-- Stripe webhooks use service_role key which bypasses RLS.
CREATE POLICY "subscriptions_update_superadmin" ON public.subscriptions
FOR UPDATE
USING (is_superadmin());

CREATE POLICY "subscriptions_insert_superadmin" ON public.subscriptions
FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "subscriptions_no_delete" ON public.subscriptions
FOR DELETE
USING (false);

-- ============================================================
-- SUPPORT_TICKETS
-- ============================================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets
CREATE POLICY "tickets_select_own" ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Superadmins can see all tickets
CREATE POLICY "tickets_select_superadmin" ON public.support_tickets
FOR SELECT
USING (is_superadmin());

-- Users can create tickets
CREATE POLICY "tickets_insert_own" ON public.support_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (e.g., close)
CREATE POLICY "tickets_update_own" ON public.support_tickets
FOR UPDATE
USING (auth.uid() = user_id);

-- Superadmins can update any ticket
CREATE POLICY "tickets_update_superadmin" ON public.support_tickets
FOR UPDATE
USING (is_superadmin());

-- ============================================================
-- TICKET_MESSAGES
-- ============================================================
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages on their own tickets
CREATE POLICY "messages_select_own_ticket" ON public.ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Superadmins can see all messages
CREATE POLICY "messages_select_superadmin" ON public.ticket_messages
FOR SELECT
USING (is_superadmin());

-- Users can insert messages on their own tickets
CREATE POLICY "messages_insert_own_ticket" ON public.ticket_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Superadmins can insert messages on any ticket
CREATE POLICY "messages_insert_superadmin" ON public.ticket_messages
FOR INSERT
WITH CHECK (is_superadmin());

-- ============================================================
-- TENANT_INVITES
-- ============================================================
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- Admins can see invites for their tenant
CREATE POLICY "invites_select_tenant_admin" ON public.tenant_invites
FOR SELECT
USING (tenant_id = get_my_tenant_id());

-- Superadmins can see all invites
CREATE POLICY "invites_select_superadmin" ON public.tenant_invites
FOR SELECT
USING (is_superadmin());

-- Admins can create invites for their tenant
CREATE POLICY "invites_insert_tenant_admin" ON public.tenant_invites
FOR INSERT
WITH CHECK (
  tenant_id = get_my_tenant_id()
  AND auth.uid() = created_by
);

-- Superadmins can create any invite
CREATE POLICY "invites_insert_superadmin" ON public.tenant_invites
FOR INSERT
WITH CHECK (is_superadmin());

-- ============================================================
-- AUDIT_LOG
-- ============================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read audit logs
CREATE POLICY "audit_select_superadmin" ON public.audit_log
FOR SELECT
USING (is_superadmin());

-- Inserts happen via triggers/functions (SECURITY DEFINER), not direct client calls
CREATE POLICY "audit_no_direct_insert" ON public.audit_log
FOR INSERT
WITH CHECK (false);

-- No updates or deletes on audit log
CREATE POLICY "audit_no_update" ON public.audit_log
FOR UPDATE
USING (false);

CREATE POLICY "audit_no_delete" ON public.audit_log
FOR DELETE
USING (false);

-- ============================================================
-- SYSTEM_SETTINGS
-- ============================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings (for feature flags, etc.)
CREATE POLICY "settings_select_authenticated" ON public.system_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only superadmins can modify settings
CREATE POLICY "settings_update_superadmin" ON public.system_settings
FOR UPDATE
USING (is_superadmin());

CREATE POLICY "settings_insert_superadmin" ON public.system_settings
FOR INSERT
WITH CHECK (is_superadmin());

CREATE POLICY "settings_no_delete" ON public.system_settings
FOR DELETE
USING (false);
```

- [ ] **Step 2: Apply the migration to Supabase**

Run: `npx supabase db push` or apply via Supabase Dashboard > SQL Editor

Expected: Migration applies successfully. If any table already has RLS enabled, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is idempotent and won't error.

- [ ] **Step 3: Verify RLS is enabled on all tables**

Run in SQL Editor:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: All tables show `rowsecurity = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260412000002_enable_rls_all_tables.sql
git commit -m "fix(security): enable RLS on all tables with tenant-scoped policies - F2 F17"
```

---

### Task 3: Prevent Role Escalation (F3)

**Files:**
- Create: `supabase/migrations/20260412000003_protect_role_escalation.sql`

**Context:** Currently a user can call `supabase.from('profiles').update({role: 'superadmin'}).eq('id', userId)` from the browser console. We need a database trigger that prevents non-superadmins from changing the `role` field.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Fix F3: Prevent role escalation.
-- A trigger that blocks role changes unless the caller is a superadmin.

CREATE OR REPLACE FUNCTION public.protect_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only superadmins can change roles
    IF NOT is_superadmin() THEN
      RAISE EXCEPTION 'Only superadmins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_protect_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_role_change();
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push` or apply via Supabase Dashboard > SQL Editor

Expected: Migration applies successfully.

- [ ] **Step 3: Verify the trigger exists**

Run in SQL Editor:
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
```

Expected: `trigger_protect_role_change` visible with `BEFORE UPDATE`.

- [ ] **Step 4: Test the protection**

Run in SQL Editor as a non-superadmin (or simulate):
```sql
-- This should fail for non-superadmin users
UPDATE public.profiles SET role = 'superadmin' WHERE id = auth.uid();
```

Expected: Error `Only superadmins can change user roles`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260412000003_protect_role_escalation.sql
git commit -m "fix(security): add trigger to prevent role escalation - F3"
```

---

### Task 4: Validate RPC Input (F5)

**Files:**
- Create: `supabase/migrations/20260412000004_validate_rpc_inputs.sql`

**Context:** The `create_school_and_link_admin` and `accept_invite` functions accept raw user input without validation. While PostgreSQL parameterized queries prevent SQL injection, we should validate input format to prevent malformed data.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Fix F5: Add input validation to RPC functions.
-- Replace existing functions with validated versions.

-- Validated version of create_school_and_link_admin
CREATE OR REPLACE FUNCTION public.create_school_and_link_admin(
  school_name TEXT,
  school_slug TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  current_user_id UUID;
BEGIN
  -- Validate inputs
  IF school_name IS NULL OR length(trim(school_name)) < 2 THEN
    RAISE EXCEPTION 'School name must be at least 2 characters';
  END IF;

  IF length(school_name) > 100 THEN
    RAISE EXCEPTION 'School name must be at most 100 characters';
  END IF;

  IF school_slug IS NULL OR length(trim(school_slug)) < 2 THEN
    RAISE EXCEPTION 'School slug must be at least 2 characters';
  END IF;

  IF length(school_slug) > 50 THEN
    RAISE EXCEPTION 'School slug must be at most 50 characters';
  END IF;

  -- Slug must be lowercase alphanumeric with hyphens only
  IF school_slug !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' THEN
    RAISE EXCEPTION 'School slug must contain only lowercase letters, numbers, and hyphens';
  END IF;

  -- Check slug uniqueness
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = school_slug) THEN
    RAISE EXCEPTION 'A school with this slug already exists';
  END IF;

  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Create tenant
  INSERT INTO tenants (name, slug)
  VALUES (trim(school_name), lower(trim(school_slug)))
  RETURNING id INTO new_tenant_id;

  -- Link user as admin of the new tenant
  UPDATE profiles
  SET tenant_id = new_tenant_id, role = 'admin'
  WHERE id = current_user_id;

  RETURN new_tenant_id::TEXT;
END;
$$;

-- Validated version of accept_invite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  current_user_id UUID;
BEGIN
  -- Validate input
  IF invite_token IS NULL OR length(trim(invite_token)) = 0 THEN
    RAISE EXCEPTION 'Invite token is required';
  END IF;

  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Find valid invite
  SELECT * INTO invite_record
  FROM tenant_invites
  WHERE token = invite_token
    AND used_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- If invite has a specific email, verify it matches
  IF invite_record.email IS NOT NULL THEN
    IF invite_record.email != (SELECT email FROM profiles WHERE id = current_user_id) THEN
      RAISE EXCEPTION 'This invite is for a different email address';
    END IF;
  END IF;

  -- Link user to tenant with invited role
  UPDATE profiles
  SET tenant_id = invite_record.tenant_id, role = invite_record.role
  WHERE id = current_user_id;

  -- Mark invite as used
  UPDATE tenant_invites
  SET used_at = now()
  WHERE id = invite_record.id;
END;
$$;
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push` or apply via Supabase Dashboard > SQL Editor

Expected: Both functions replaced successfully.

- [ ] **Step 3: Test validation**

Run in SQL Editor:
```sql
-- Should fail: slug too short
SELECT create_school_and_link_admin('Test School', 'a');

-- Should fail: invalid slug characters
SELECT create_school_and_link_admin('Test School', 'My School!');

-- Should fail: empty token
SELECT accept_invite('');
```

Expected: Each call raises the appropriate exception.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260412000004_validate_rpc_inputs.sql
git commit -m "fix(security): add input validation to RPC functions - F5"
```

---

### Task 5: Enforce Project Limits via RLS (F8)

**Files:**
- Create: `supabase/migrations/20260412000005_enforce_project_limits.sql`

**Context:** The `subscriptions` table has `projects_limit` but it's never checked. We create a function that checks the limit and use it in an INSERT policy on `projects`.

- [ ] **Step 1: Write the migration SQL**

```sql
-- Fix F8: Enforce subscription project limits at the database level.

-- Function to check if user can create more projects
CREATE OR REPLACE FUNCTION public.check_project_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_limit INTEGER;
  current_count INTEGER;
  user_id_val UUID;
BEGIN
  user_id_val := auth.uid();

  -- Superadmins have no limits
  IF is_superadmin() THEN
    RETURN true;
  END IF;

  -- Get project limit from subscription
  SELECT COALESCE(s.projects_limit, 1) INTO current_limit
  FROM subscriptions s
  WHERE s.user_id = user_id_val
    AND s.status = 'active'
  LIMIT 1;

  -- If no active subscription, fall back to subscribers table limit
  IF current_limit IS NULL THEN
    SELECT COALESCE(sub.projects_limit, 1) INTO current_limit
    FROM subscribers sub
    WHERE sub.user_id = user_id_val
    LIMIT 1;
  END IF;

  -- Default limit if no subscription found
  IF current_limit IS NULL THEN
    current_limit := 1;
  END IF;

  -- Count existing projects
  SELECT COUNT(*) INTO current_count
  FROM projects p
  WHERE p.user_id = user_id_val;

  RETURN current_count < current_limit;
END;
$$;

-- Drop the existing insert policy so we can replace it with a limit-checked version
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;

-- New insert policy that checks project limits
CREATE POLICY "projects_insert_own" ON public.projects
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND check_project_limit()
);
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push` or apply via Supabase Dashboard > SQL Editor

Expected: Function created and policy replaced successfully.

- [ ] **Step 3: Verify**

Run in SQL Editor:
```sql
-- Check function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'check_project_limit';
```

Expected: Function visible with the correct body.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260412000005_enforce_project_limits.sql
git commit -m "fix(security): enforce project limits via RLS check function - F8"
```

---

### Task 6: Add Security Headers to Vercel (F6)

**Files:**
- Modify: `vercel.json`

**Context:** The current `vercel.json` only has SPA rewrites. We need to add security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

- [ ] **Step 1: Update vercel.json**

Replace the contents of `vercel.json` with:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Validate JSON syntax**

Run: `npx --yes json5 vercel.json` or use `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('Valid JSON')"`

Expected: No parse errors.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "fix(security): add security headers to Vercel config - F6"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run build to confirm no regressions**

Run: `npm run build`

Expected: Build succeeds with no errors. The migrations are SQL-only and don't affect the frontend build.

- [ ] **Step 2: Verify all migrations are committed**

Run: `git log --oneline -6`

Expected: 6 commits for Phase 1 (Tasks 1-6).

- [ ] **Step 3: Document what to do in Supabase Dashboard**

The following must be done manually in the Supabase Dashboard:

1. **Apply migrations:** Go to SQL Editor and run each migration file in order, OR use `npx supabase db push` if Supabase CLI is configured.
2. **Rate limiting (F4):** Go to Auth > Settings > Rate Limits and set:
   - Sign-up: 3 per hour per IP
   - Sign-in: 10 per hour per IP
   - Password reset: 3 per hour per IP
3. **Password policy (F33):** Go to Auth > Settings > Password and set minimum password length to 8 characters.

- [ ] **Step 4: Final commit with documentation**

```bash
git add -A
git commit -m "docs: Phase 1 security critical implementation complete"
```
