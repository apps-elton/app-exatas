CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  p_user_id uuid,
  p_new_role public.user_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role public.user_role;
  v_old_role public.user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Only superadmin can change roles
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS DISTINCT FROM 'superadmin'::public.user_role THEN
    RAISE EXCEPTION 'Only superadmin can change user roles' USING ERRCODE = '42501';
  END IF;

  -- Read current role
  SELECT role INTO v_old_role FROM public.profiles WHERE id = p_user_id;
  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Apply change
  UPDATE public.profiles SET role = p_new_role, updated_at = now() WHERE id = p_user_id;

  -- Audit
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_changed', 'profile', p_user_id::text,
          jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role));

  RETURN jsonb_build_object('ok', true, 'old_role', v_old_role, 'new_role', p_new_role);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_user_role(uuid, public.user_role) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(uuid, public.user_role) TO authenticated;
