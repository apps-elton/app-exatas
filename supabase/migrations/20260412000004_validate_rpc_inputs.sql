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
