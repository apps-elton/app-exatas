-- RPC para finalizar signup de aluno B2C após auth.signUp.
-- Requisitos: usuário autenticado. Atualiza role para 'student' e cria subscription student_free.
-- Idempotente.

CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_profile public.profiles;
  v_existing_sub public.subscriptions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Buscar profile criado pelo trigger de signup
  SELECT * INTO v_existing_profile FROM public.profiles WHERE id = v_user_id;

  IF v_existing_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for current user' USING ERRCODE = 'P0002';
  END IF;

  -- Se já é student configurado, retornar OK (idempotente)
  IF v_existing_profile.role = 'student' AND v_existing_profile.tenant_id IS NULL THEN
    SELECT * INTO v_existing_sub FROM public.subscriptions WHERE user_id = v_user_id LIMIT 1;
    IF v_existing_sub.plan_id = 'student_free' THEN
      RETURN jsonb_build_object('ok', true, 'already_configured', true);
    END IF;
  END IF;

  -- Se profile já está vinculado a um tenant, não permitir conversão (evita bypass)
  IF v_existing_profile.tenant_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already linked to a tenant; cannot convert to student'
      USING ERRCODE = '42501';
  END IF;

  -- Atualizar role para student
  UPDATE public.profiles
  SET role = 'student', tenant_id = NULL, updated_at = now()
  WHERE id = v_user_id;

  -- Criar subscription student_free (ou atualizar se já existe)
  INSERT INTO public.subscriptions (user_id, tenant_id, plan, plan_id, status, projects_limit, storage_limit_mb)
  VALUES (v_user_id, NULL, 'free'::subscription_plan, 'student_free', 'active'::subscription_status, 3, 50)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id = 'student_free',
        plan = 'free'::subscription_plan,
        status = 'active'::subscription_status,
        projects_limit = 3,
        storage_limit_mb = 50,
        tenant_id = NULL,
        updated_at = now();

  -- Audit log
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (v_user_id, 'student_account_created', 'profile', v_user_id::text,
          jsonb_build_object('plan_id', 'student_free'));

  RETURN jsonb_build_object('ok', true, 'user_id', v_user_id, 'plan_id', 'student_free');
END;
$$;

REVOKE ALL ON FUNCTION public.create_student_account() FROM public;
GRANT EXECUTE ON FUNCTION public.create_student_account() TO authenticated;

COMMENT ON FUNCTION public.create_student_account() IS
  'Finaliza signup de aluno B2C: muda role para student, cria subscription student_free. Idempotente.';
