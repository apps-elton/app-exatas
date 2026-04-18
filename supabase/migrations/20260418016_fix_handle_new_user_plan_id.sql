-- Fix: handle_new_user trigger was inserting subscriptions without plan_id,
-- which became NOT NULL in Fase 1 (migration 005). This broke ALL new signups.
-- Default to 'teacher_free' — specific flows (school/student signup) will UPDATE
-- the subscription to the correct plan after signup completes.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_full_name text;
BEGIN
  -- Resolve role from metadata, defaulting to 'teacher'.
  -- Cannot be 'superadmin' via self-signup (anti-escalation).
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'teacher'::public.user_role
  );

  IF v_role = 'superadmin' THEN
    v_role := 'teacher'::public.user_role;
  END IF;

  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, true, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Create default subscription. plan_id defaults to 'teacher_free'; specific
  -- signup flows (school/student) update it to the correct plan afterward.
  INSERT INTO public.subscriptions (user_id, plan, plan_id, status, projects_limit, storage_limit_mb)
  VALUES (NEW.id, 'free'::subscription_plan, 'teacher_free', 'active'::subscription_status, 3, 100)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
