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
