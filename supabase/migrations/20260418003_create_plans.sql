-- Plans table: substitui o enum subscription_plan por uma tabela editável.
-- Cada plano é único por (profile_type, tier).

-- Ensure the shared updated_at trigger function exists (projeto usa handle_updated_at;
-- criamos o alias update_updated_at_column para padronizar com migrations novas).
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.plans (
  id               text PRIMARY KEY,
  profile_type     text NOT NULL CHECK (profile_type IN ('school', 'teacher', 'student')),
  tier             text NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
  name             text NOT NULL,
  description      text,
  prices           jsonb NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits           jsonb NOT NULL DEFAULT '{}'::jsonb,
  active           boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_type, tier)
);

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_active_public"
  ON public.plans FOR SELECT
  USING (active = true);

CREATE POLICY "plans_select_superadmin"
  ON public.plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "plans_insert_superadmin"
  ON public.plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "plans_update_superadmin"
  ON public.plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "plans_no_delete"
  ON public.plans FOR DELETE
  USING (false);

COMMENT ON TABLE public.plans IS
  'Planos de assinatura com 9 tiers (3 perfis x free/pro/premium)';
