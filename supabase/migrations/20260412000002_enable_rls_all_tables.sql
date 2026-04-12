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
