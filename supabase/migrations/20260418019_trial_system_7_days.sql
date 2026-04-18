-- 7-day Pro trial for all new signups. No card required.
-- After trial, cron job auto-downgrades to Free tier of same profile.

-- 1. trial_ends_at column
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS subscriptions_trial_ends_at_idx
  ON public.subscriptions(trial_ends_at)
  WHERE status = 'trialing';

COMMENT ON COLUMN public.subscriptions.trial_ends_at IS
  'When set with status=trialing, user has Pro features until this timestamp. Cron job downgrades after.';

-- 2. handle_new_user: start 7-day Pro trial by default based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_full_name text;
  v_plan_id text;
  v_trial_end timestamptz;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'teacher'::public.user_role
  );

  IF v_role = 'superadmin' THEN
    v_role := 'teacher'::public.user_role;
  END IF;

  v_full_name := NEW.raw_user_meta_data->>'full_name';

  v_plan_id := CASE v_role
    WHEN 'admin' THEN 'school_pro'
    WHEN 'student' THEN 'student_pro'
    ELSE 'teacher_pro'
  END;

  v_trial_end := now() + interval '7 days';

  INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, true, now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (
    user_id, plan, plan_id, status, projects_limit, storage_limit_mb,
    trial_ends_at, current_period_start, current_period_end
  )
  VALUES (
    NEW.id,
    'free'::subscription_plan,
    v_plan_id,
    'trialing'::subscription_status,
    100, 1000,
    v_trial_end,
    now(),
    v_trial_end
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. create_student_account: preserve trial when converting to student
CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_profile public.profiles;
  v_trial_end timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing_profile FROM public.profiles WHERE id = v_user_id;
  IF v_existing_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for current user' USING ERRCODE = 'P0002';
  END IF;

  IF v_existing_profile.tenant_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already linked to a tenant; cannot convert to student'
      USING ERRCODE = '42501';
  END IF;

  IF v_existing_profile.role = 'student' AND v_existing_profile.tenant_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = v_user_id AND plan_id IN ('student_free', 'student_pro')) THEN
      RETURN jsonb_build_object('ok', true, 'already_configured', true);
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = 'student', tenant_id = NULL, updated_at = now()
  WHERE id = v_user_id;

  v_trial_end := (SELECT trial_ends_at FROM public.subscriptions WHERE user_id = v_user_id);
  IF v_trial_end IS NULL OR v_trial_end < now() THEN
    v_trial_end := now() + interval '7 days';
  END IF;

  INSERT INTO public.subscriptions (user_id, tenant_id, plan, plan_id, status, projects_limit, storage_limit_mb, trial_ends_at, current_period_start, current_period_end)
  VALUES (v_user_id, NULL, 'free'::subscription_plan, 'student_pro', 'trialing'::subscription_status, 100, 1000, v_trial_end, now(), v_trial_end)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id = 'student_pro',
        plan = 'free'::subscription_plan,
        status = 'trialing'::subscription_status,
        projects_limit = 100,
        storage_limit_mb = 1000,
        tenant_id = NULL,
        trial_ends_at = EXCLUDED.trial_ends_at,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = now();

  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (v_user_id, 'student_account_created', 'profile', v_user_id::text,
          jsonb_build_object('plan_id', 'student_pro', 'trial_ends_at', v_trial_end));

  RETURN jsonb_build_object('ok', true, 'user_id', v_user_id, 'plan_id', 'student_pro', 'trial_ends_at', v_trial_end);
END;
$$;

-- 4. Cron job to downgrade expired trials to Free
CREATE OR REPLACE FUNCTION public.process_expired_trials()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH downgraded AS (
    UPDATE public.subscriptions
    SET plan_id = replace(plan_id, '_pro', '_free'),
        status = 'active'::subscription_status,
        projects_limit = 3,
        storage_limit_mb = 100,
        updated_at = now()
    WHERE status = 'trialing'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < now()
    RETURNING user_id, plan_id
  ),
  logged AS (
    INSERT INTO public.audit_log (action, target_type, target_id, metadata)
    SELECT 'trial_expired_downgraded', 'subscription', user_id::text,
           jsonb_build_object('new_plan_id', plan_id)
    FROM downgraded
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM logged;

  RETURN jsonb_build_object('downgraded', v_count, 'ran_at', now());
END;
$$;

-- Schedule every 15 minutes
SELECT cron.unschedule('process-expired-trials') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-expired-trials'
);
SELECT cron.schedule(
  'process-expired-trials',
  '*/15 * * * *',
  $cron$SELECT public.process_expired_trials();$cron$
);
