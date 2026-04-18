-- Add plan_id FK to subscriptions, backfill from legacy enum, keep enum as legacy.

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id text REFERENCES public.plans(id);

-- Backfill plan_id based on existing enum value and tenant.is_solo
UPDATE public.subscriptions s
SET plan_id = CASE
  WHEN s.tenant_id IS NULL AND s.plan = 'free' THEN 'student_free'
  WHEN EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = s.tenant_id AND t.is_solo = true)
    THEN CASE s.plan
      WHEN 'free'::subscription_plan THEN 'teacher_free'
      WHEN 'professor'::subscription_plan THEN 'teacher_pro'
      WHEN 'institution'::subscription_plan THEN 'school_pro'
    END
  ELSE CASE s.plan
    WHEN 'free'::subscription_plan THEN 'school_free'
    WHEN 'professor'::subscription_plan THEN 'teacher_pro'
    WHEN 'institution'::subscription_plan THEN 'school_pro'
  END
END
WHERE s.plan_id IS NULL;

-- Safety net: any remaining NULL defaults to school_free
UPDATE public.subscriptions SET plan_id = 'school_free' WHERE plan_id IS NULL;

-- Now make NOT NULL
ALTER TABLE public.subscriptions ALTER COLUMN plan_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON public.subscriptions(plan_id);

COMMENT ON COLUMN public.subscriptions.plan_id IS
  'FK para plans.id. Substitui o enum legacy subscription_plan.';
COMMENT ON COLUMN public.subscriptions.plan IS
  'LEGACY: use plan_id. Manter por compatibilidade até Fase 2.';
